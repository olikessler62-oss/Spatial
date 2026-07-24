"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

import { useLocale } from "@/context/LocaleContext";
import type { NumberSpace } from "@/lib/analysis/catalog";
import {
  ANORDNUNG_CUSTOM_ID,
  buildBelegungForFill,
  emptyRaster,
  findAnordnungEntry,
  guessAnordnungEntryId,
  anordnungEntriesForLottery,
  rectanglePartitionOptionsForSize,
  type AnordnungEntry,
  type BelegungFillId,
  type RasterCell,
} from "@/lib/overview/anordnungOptions";
import {
  listSavedAnordnungen,
  saveAnordnung,
  updateAnordnung,
  type SavedAnordnung,
} from "@/lib/overview/anordnungStorage";
import {
  belegungGridShape,
  customGridForm,
  formLabel,
  layoutPositions,
  poolHomeCoords,
  poolShapeForLottery,
  type AppliedRasterForm,
} from "@/lib/overview/rasterForm";

const ANORDNUNG_CIRCLE_REM = 24;
type AnordnungEditorProps = {
  readonly numberSpace: NumberSpace;
  readonly lotteryId: string;
  readonly initialForm: AppliedRasterForm | null;
  readonly initialGrid: number[][] | null;
  readonly initialSelectionId?: string;
  /** Prefill for Speichern when coming from Format wählen. */
  readonly initialDraftName?: string;
  readonly onCancel: () => void;
  readonly onApply: (form: AppliedRasterForm, grid: number[][]) => void;
  readonly onCloseGateChange?: (canClose: boolean) => void;
  /** Fired once when belegung + pool grids are fully initialized (workshop). */
  readonly onReady?: () => void;
  /** Workshop: no fixed presets — circle or free raster only. */
  readonly variant?: "full" | "workshop";
  readonly workshopMode?: "circle" | "custom";
};

function cloneRaster(raster: readonly (readonly RasterCell[])[]): RasterCell[][] {
  return raster.map((row) => [...row]);
}

function isZehnerFill(fillId: BelegungFillId): boolean {
  return fillId === "zehner-columns" || fillId === "zehner-rows";
}

function isLockedBelegungCell(
  fillId: BelegungFillId,
  x: number,
  y: number,
): boolean {
  return isZehnerFill(fillId) && x === 0 && y === 0;
}

function buildPoolFromBelegung(
  belegung: readonly (readonly RasterCell[])[],
  pool: { readonly rows: number; readonly columns: number; readonly zehner: boolean },
  minimumValue: number,
  size: number,
): RasterCell[][] {
  const nextPool = emptyRaster(pool.rows, pool.columns);
  const used = new Set<number>();
  for (const row of belegung) {
    for (const cell of row) {
      if (cell !== null) {
        used.add(cell);
      }
    }
  }

  if (pool.zehner) {
    nextPool[0]![0] = 0;
    for (let value = 1; value <= 49; value += 1) {
      if (used.has(value)) {
        continue;
      }
      const home = poolHomeCoords(value, pool, minimumValue);
      nextPool[home.y]![home.x] = value;
    }
    return nextPool;
  }

  for (let i = 0; i < size; i += 1) {
    const value = minimumValue + i;
    if (used.has(value)) {
      continue;
    }
    const home = poolHomeCoords(value, pool, minimumValue);
    nextPool[home.y]![home.x] = value;
  }
  return nextPool;
}

function shuffleValues(
  count: number,
  minimumValue: number,
  random: () => number = Math.random,
): number[] {
  const values = Array.from({ length: count }, (_, i) => minimumValue + i);
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = values[i]!;
    values[i] = values[j]!;
    values[j] = tmp;
  }
  return values;
}

function randomBelegung(
  rows: number,
  columns: number,
  minimumValue: number,
  fillId: BelegungFillId,
): RasterCell[][] {
  if (isZehnerFill(fillId)) {
    const values = shuffleValues(49, 1);
    let index = 0;
    return Array.from({ length: rows }, (_, y) =>
      Array.from({ length: columns }, (_, x) => {
        if (isLockedBelegungCell(fillId, x, y)) {
          return 0;
        }
        const value = values[index] ?? null;
        index += 1;
        return value;
      }),
    );
  }
  const values = shuffleValues(rows * columns, minimumValue);
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: columns }, (_, x) => values[y * columns + x] ?? null),
  );
}

function gridFromCells(raster: readonly (readonly RasterCell[])[]): number[][] | null {
  const grid: number[][] = [];
  for (const row of raster) {
    const nextRow: number[] = [];
    for (const cell of row) {
      if (cell === null) {
        return null;
      }
      nextRow.push(cell);
    }
    grid.push(nextRow);
  }
  return grid;
}

function formsEqual(
  a: AppliedRasterForm | null,
  b: AppliedRasterForm | null,
): boolean {
  if (!a || !b || a.kind !== b.kind || a.size !== b.size) {
    return false;
  }
  if (a.kind === "ring" && b.kind === "ring") {
    return true;
  }
  return (
    a.kind === "grid"
    && b.kind === "grid"
    && a.rows === b.rows
    && a.columns === b.columns
  );
}

function gridsEqual(
  a: readonly (readonly RasterCell[])[],
  b: readonly (readonly RasterCell[])[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let y = 0; y < a.length; y += 1) {
    const rowA = a[y]!;
    const rowB = b[y]!;
    if (rowA.length !== rowB.length) {
      return false;
    }
    for (let x = 0; x < rowA.length; x += 1) {
      if (rowA[x] !== rowB[x]) {
        return false;
      }
    }
  }
  return true;
}

function findMatchingFixedAnordnung(args: {
  readonly form: AppliedRasterForm;
  readonly belegung: readonly (readonly RasterCell[])[];
  readonly entries: readonly AnordnungEntry[];
  readonly size: number;
  readonly minimumValue: number;
}): { readonly label: string } | null {
  const { form, belegung, entries, size, minimumValue } = args;
  const shape = belegungGridShape(form);

  for (const entry of entries) {
    if (entry.editable) {
      continue;
    }
    const entryForm = entry.resolveForm(size);
    if (!formsEqual(entryForm, form)) {
      continue;
    }
    const entryShape = belegungGridShape(entryForm);
    const expected = buildBelegungForFill(
      entry.fillId,
      entryShape.rows,
      entryShape.columns,
      minimumValue,
    );
    if (gridsEqual(expected, belegung)) {
      return { label: entry.label };
    }
  }

  const sequential = buildBelegungForFill(
    "sequential",
    shape.rows,
    shape.columns,
    minimumValue,
  );
  if (gridsEqual(sequential, belegung)) {
    return { label: formLabel(form) };
  }

  return null;
}

function matchesKnownAnordnung(args: {
  readonly form: AppliedRasterForm;
  readonly belegung: readonly (readonly RasterCell[])[];
  readonly entries: readonly AnordnungEntry[];
  readonly savedEntries: readonly SavedAnordnung[];
  readonly size: number;
  readonly minimumValue: number;
}): boolean {
  const { form, belegung, entries, savedEntries, size, minimumValue } = args;

  for (const saved of savedEntries) {
    if (formsEqual(saved.form, form) && gridsEqual(saved.grid, belegung)) {
      return true;
    }
  }

  return findMatchingFixedAnordnung({
    form,
    belegung,
    entries,
    size,
    minimumValue,
  }) !== null;
}

type DragPayload =
  | { readonly from: "pool"; readonly value: number; readonly x: number; readonly y: number }
  | { readonly from: "cell"; readonly value: number; readonly x: number; readonly y: number };

function encodePayload(payload: DragPayload): string {
  return JSON.stringify(payload);
}

function decodePayload(raw: string): DragPayload | null {
  try {
    const parsed = JSON.parse(raw) as DragPayload;
    if (
      parsed
      && typeof parsed === "object"
      && typeof parsed.value === "number"
      && typeof parsed.x === "number"
      && typeof parsed.y === "number"
      && (parsed.from === "pool" || parsed.from === "cell")
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function AnordnungEditor({
  numberSpace,
  lotteryId,
  initialForm,
  initialGrid,
  initialSelectionId,
  initialDraftName,
  onCancel,
  onApply,
  onCloseGateChange,
  onReady,
  variant = "full",
  workshopMode = "custom",
}: AnordnungEditorProps) {
  const { t } = useLocale();
  const isWorkshop = variant === "workshop";
  const size = numberSpace.size;
  const minimumValue = numberSpace.minimumValue;
  const entries = useMemo(
    () => anordnungEntriesForLottery(numberSpace),
    [numberSpace],
  );
  const [savedEntries, setSavedEntries] = useState<SavedAnordnung[]>(() =>
    listSavedAnordnungen(lotteryId),
  );

  useEffect(() => {
    setSavedEntries(listSavedAnordnungen(lotteryId));
  }, [lotteryId]);

  const rectOptions = useMemo(
    () => rectanglePartitionOptionsForSize(size),
    [size],
  );

  const [selectionId, setSelectionId] = useState(() => {
    if (initialSelectionId) {
      return initialSelectionId;
    }
    if (isWorkshop) {
      if (workshopMode === "circle") {
        return (
          entries.find((entry) => entry.resolveForm(size).kind === "ring")?.id
          ?? ANORDNUNG_CUSTOM_ID
        );
      }
      return ANORDNUNG_CUSTOM_ID;
    }
    return guessAnordnungEntryId(initialForm, entries);
  });

  const initialRect = useMemo(() => {
    if (initialForm?.kind === "grid") {
      const match = rectOptions.find(
        (option) =>
          option.rows === initialForm.rows
          && option.columns === initialForm.columns,
      );
      if (match) {
        return match;
      }
    }
    return rectOptions[0] ?? null;
  }, [initialForm, rectOptions]);

  const [customRows, setCustomRows] = useState(
    () => initialRect?.rows ?? 7,
  );
  const [customColumns, setCustomColumns] = useState(
    () => initialRect?.columns ?? 7,
  );
  const [rectMenuOpen, setRectMenuOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveIntent, setSaveIntent] = useState<"catalog" | "apply">("catalog");
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fixedConfirmOpen, setFixedConfirmOpen] = useState(false);

  useEffect(() => {
    if (selectionId !== ANORDNUNG_CUSTOM_ID) {
      setRectMenuOpen(false);
    }
  }, [selectionId]);

  const selectedEntry: AnordnungEntry | undefined = findAnordnungEntry(
    entries,
    selectionId,
  );
  const locksForm =
    !isWorkshop
    && selectionId !== ANORDNUNG_CUSTOM_ID
    && Boolean(selectedEntry?.locksForm);

  const activeFillId: BelegungFillId =
    isWorkshop ? "sequential" : (selectedEntry?.fillId ?? "sequential");

  const customPartitionId =
    `rect-${customRows}x${customColumns}`;

  const selectedSaved = savedEntries.find((entry) => entry.id === selectionId);

  const draftForm = useMemo((): AppliedRasterForm | null => {
    if (isWorkshop && workshopMode === "circle") {
      return { kind: "ring", size };
    }
    if (isWorkshop && workshopMode === "custom") {
      return customGridForm(customRows, customColumns, size);
    }
    if (selectionId === ANORDNUNG_CUSTOM_ID) {
      return customGridForm(customRows, customColumns, size);
    }
    if (selectedSaved) {
      return selectedSaved.form;
    }
    return selectedEntry?.resolveForm(size) ?? null;
  }, [
    customColumns,
    customRows,
    isWorkshop,
    selectedEntry,
    selectedSaved,
    selectionId,
    size,
    workshopMode,
  ]);

  const shape = draftForm
    ? belegungGridShape(draftForm)
    : { rows: 1, columns: size };

  /** Grid workshop: pool matches belegung size. Circle: keep lottery pool. */
  const pool = useMemo(() => {
    if (isWorkshop && workshopMode === "custom") {
      return {
        rows: customRows,
        columns: customColumns,
        zehner: false as const,
      };
    }
    return poolShapeForLottery(size, minimumValue);
  }, [
    customColumns,
    customRows,
    isWorkshop,
    minimumValue,
    size,
    workshopMode,
  ]);

  const isLineCluster =
    draftForm?.kind === "grid"
    && (draftForm.rows === 1 || draftForm.columns === 1);
  const isSingleColCluster =
    draftForm?.kind === "grid" && draftForm.columns === 1;
  const isCircleCluster = draftForm?.kind === "ring";

  const [belegung, setBelegung] = useState<RasterCell[][]>(() => {
    if (
      initialGrid
      && initialForm
      && draftForm
      && initialForm.kind === draftForm.kind
      && (
        draftForm.kind === "ring"
        || (
          initialForm.kind === "grid"
          && draftForm.kind === "grid"
          && initialForm.rows === draftForm.rows
          && initialForm.columns === draftForm.columns
        )
      )
    ) {
      const expected = belegungGridShape(initialForm);
      if (
        initialGrid.length === expected.rows
        && initialGrid.every((row) => row.length === expected.columns)
      ) {
        return initialGrid.map((row) => [...row]);
      }
    }
    if (isWorkshop) {
      return emptyRaster(shape.rows, shape.columns);
    }
    return buildBelegungForFill(
      activeFillId,
      shape.rows,
      shape.columns,
      minimumValue,
    );
  });

  const [poolCells, setPoolCells] = useState<RasterCell[][]>(() =>
    buildPoolFromBelegung(belegung, pool, minimumValue, size),
  );

  const readyNotified = useRef(false);
  useLayoutEffect(() => {
    if (!onReady || readyNotified.current) {
      return;
    }
    const belegungOk =
      belegung.length === shape.rows
      && belegung.every((row) => row.length === shape.columns);
    const poolOk =
      poolCells.length === pool.rows
      && poolCells.every((row) => row.length === pool.columns);
    if (!belegungOk || !poolOk) {
      return;
    }
    readyNotified.current = true;
    onReady();
  }, [belegung, onReady, pool.columns, pool.rows, poolCells, shape.columns, shape.rows]);

  const flatBelegung = useMemo(() => {
    const cells: {
      readonly x: number;
      readonly y: number;
      readonly value: RasterCell;
    }[] = [];
    for (let y = 0; y < belegung.length; y += 1) {
      const row = belegung[y]!;
      for (let x = 0; x < row.length; x += 1) {
        cells.push({ x, y, value: row[x]! });
      }
    }
    return cells;
  }, [belegung]);

  const circlePos = useMemo(
    () => (isCircleCluster && draftForm ? layoutPositions(draftForm) : []),
    [draftForm, isCircleCluster],
  );

  const syncPool = useCallback(
    (nextBelegung: RasterCell[][]) => {
      setPoolCells(buildPoolFromBelegung(nextBelegung, pool, minimumValue, size));
    },
    [minimumValue, pool, size],
  );

  const selectionKey = `${selectionId}:${
    draftForm
      ? draftForm.kind === "grid"
        ? `grid-${draftForm.rows}x${draftForm.columns}`
        : `ring-${draftForm.size}`
      : "invalid"
  }:${activeFillId}`;

  const isFirstSelectionEffect = useRef(true);
  useEffect(() => {
    if (!draftForm) {
      return;
    }
    if (isFirstSelectionEffect.current) {
      isFirstSelectionEffect.current = false;
      setPoolCells(buildPoolFromBelegung(belegung, pool, minimumValue, size));
      return;
    }
    if (isWorkshop || selectionId.startsWith("saved-")) {
      return;
    }
    const next = buildBelegungForFill(
      activeFillId,
      shape.rows,
      shape.columns,
      minimumValue,
    );
    setBelegung(next);
    setPoolCells(buildPoolFromBelegung(next, pool, minimumValue, size));
  }, [selectionKey]);

  const placedCount = useMemo(
    () =>
      belegung.reduce(
        (sum, row, y) =>
          sum
          + row.filter((cell, x) => {
            if (isLockedBelegungCell(activeFillId, x, y)) {
              return cell !== null;
            }
            return cell !== null;
          }).length,
        0,
      ),
    [activeFillId, belegung],
  );

  const numberCount = shape.rows * shape.columns;
  const movablePlaced = useMemo(
    () =>
      belegung.reduce(
        (sum, row, y) =>
          sum
          + row.filter((cell, x) => {
            if (isLockedBelegungCell(activeFillId, x, y)) {
              return false;
            }
            return cell !== null;
          }).length,
        0,
      ),
    [activeFillId, belegung],
  );
  const movableTotal = isZehnerFill(activeFillId) ? 49 : numberCount;
  const isEmpty = movablePlaced === 0;
  const isComplete = placedCount === numberCount;
  const canCloseWithX = isEmpty || isComplete;
  const customValid =
    selectionId !== ANORDNUNG_CUSTOM_ID || draftForm !== null;

  useEffect(() => {
    onCloseGateChange?.(canCloseWithX);
  }, [canCloseWithX, onCloseGateChange]);

  const selectEntry = (entryId: string) => {
    setSelectionId(entryId);
  };

  const selectCustom = () => {
    const preferred =
      draftForm?.kind === "grid"
        ? rectOptions.find(
            (option) =>
              option.rows === draftForm.rows
              && option.columns === draftForm.columns,
          )
        : null;
    const next = preferred ?? rectOptions[0];
    if (next) {
      setCustomRows(next.rows);
      setCustomColumns(next.columns);
    }
    setSelectionId(ANORDNUNG_CUSTOM_ID);
  };

  const clearBoard = useCallback(() => {
    const next = emptyRaster(shape.rows, shape.columns);
    if (isZehnerFill(activeFillId)) {
      next[0]![0] = 0;
    }
    setBelegung(next);
    syncPool(next);
  }, [activeFillId, shape.columns, shape.rows, syncPool]);

  const resetPresetFill = useCallback(() => {
    const next = buildBelegungForFill(
      activeFillId,
      shape.rows,
      shape.columns,
      minimumValue,
    );
    setBelegung(next);
    syncPool(next);
  }, [activeFillId, minimumValue, shape.columns, shape.rows, syncPool]);

  const fillRandom = useCallback(() => {
    const next = randomBelegung(
      shape.rows,
      shape.columns,
      minimumValue,
      activeFillId,
    );
    setBelegung(next);
    syncPool(next);
  }, [activeFillId, minimumValue, shape.columns, shape.rows, syncPool]);

  const handleApply = useCallback(() => {
    if (!draftForm || !isComplete || !customValid) {
      return;
    }
    const grid = gridFromCells(belegung);
    if (!grid) {
      return;
    }
    onApply(draftForm, grid);
  }, [belegung, customValid, draftForm, isComplete, onApply]);

  const matchesKnown = useMemo(() => {
    if (!draftForm || !isComplete) {
      return false;
    }
    return matchesKnownAnordnung({
      form: draftForm,
      belegung,
      entries,
      savedEntries,
      size,
      minimumValue,
    });
  }, [
    belegung,
    draftForm,
    entries,
    isComplete,
    minimumValue,
    savedEntries,
    size,
  ]);

  const matchingFixed = useMemo(() => {
    if (!draftForm || !isComplete) {
      return null;
    }
    return findMatchingFixedAnordnung({
      form: draftForm,
      belegung,
      entries,
      size,
      minimumValue,
    });
  }, [belegung, draftForm, entries, isComplete, minimumValue, size]);

  const [savedBaseline, setSavedBaseline] = useState<{
    readonly form: AppliedRasterForm;
    readonly grid: number[][];
  } | null>(() => {
    if (
      initialForm
      && initialGrid
      && initialSelectionId?.startsWith("saved-")
    ) {
      return {
        form: initialForm,
        grid: initialGrid.map((row) => [...row]),
      };
    }
    return null;
  });

  const isDirty = useMemo(() => {
    if (!draftForm) {
      return false;
    }
    if (!savedBaseline) {
      return !isEmpty;
    }
    return !(
      formsEqual(savedBaseline.form, draftForm)
      && gridsEqual(savedBaseline.grid, belegung)
    );
  }, [belegung, draftForm, isEmpty, savedBaseline]);

  const canSave =
    Boolean(draftForm)
    && customValid
    && isComplete
    && isDirty
    && !matchesKnown;

  const knownSaveName =
    selectedSaved?.name.trim()
    || initialDraftName?.trim()
    || "";

  const persistSave = useCallback((
    intent: "catalog" | "apply",
    name: string,
  ) => {
    if (!draftForm || !isComplete || !isDirty) {
      return;
    }
    if (matchesKnown) {
      return;
    }
    const grid = gridFromCells(belegung);
    if (!grid) {
      return;
    }
    const reservedNames = [
      ...entries.map((entry) => entry.label),
      "Anpassen",
    ];
    const result = selectedSaved
      ? updateAnordnung({
          lotteryId,
          id: selectedSaved.id,
          name,
          form: draftForm,
          grid,
          reservedNames,
        })
      : saveAnordnung({
          lotteryId,
          name,
          form: draftForm,
          grid,
          reservedNames,
        });
    if ("error" in result) {
      setSaveError(
        result.error === "Bitte einen Namen vergeben."
          ? t("pattern.nameRequired")
          : result.error === "Dieser Name ist bereits vergeben."
            ? t("pattern.nameTaken")
            : result.error,
      );
      setSaveModalOpen(true);
      setSaveIntent(intent);
      setSaveName(name);
      return;
    }
    setSavedEntries(listSavedAnordnungen(lotteryId));
    setSelectionId(result.id);
    setSavedBaseline({
      form: draftForm,
      grid: grid.map((row) => [...row]),
    });
    setSaveModalOpen(false);
    setSaveName("");
    setSaveError(null);
    if (intent === "apply") {
      onApply(draftForm, grid);
    }
  }, [
    belegung,
    draftForm,
    entries,
    isComplete,
    isDirty,
    lotteryId,
    matchesKnown,
    onApply,
    selectedSaved,
    t,
  ]);

  const openSaveModal = (intent: "catalog" | "apply") => {
    if (!canSave || !draftForm) {
      return;
    }
    setSaveIntent(intent);
    setSaveName(knownSaveName);
    setSaveError(null);
    setSaveModalOpen(true);
  };

  const requestSave = (intent: "catalog" | "apply") => {
    if (!canSave || !draftForm) {
      return;
    }
    if (knownSaveName) {
      persistSave(intent, knownSaveName);
      return;
    }
    openSaveModal(intent);
  };

  const closeSaveModal = () => {
    setSaveModalOpen(false);
    setSaveName("");
    setSaveError(null);
    setSaveIntent("catalog");
  };

  const handleSave = useCallback(() => {
    persistSave(saveIntent, saveName);
  }, [persistSave, saveIntent, saveName]);

  const requestApply = useCallback(() => {
    if (!draftForm || !isComplete || !customValid) {
      return;
    }
    if (matchingFixed) {
      setFixedConfirmOpen(true);
      return;
    }
    handleApply();
  }, [customValid, draftForm, handleApply, isComplete, matchingFixed]);

  const selectSaved = (saved: SavedAnordnung) => {
    setSelectionId(saved.id);
    setBelegung(saved.grid.map((row) => [...row]));
    setPoolCells(
      buildPoolFromBelegung(saved.grid, pool, minimumValue, size),
    );
    setSavedBaseline({
      form: saved.form,
      grid: saved.grid.map((row) => [...row]),
    });
    if (saved.form.kind === "grid") {
      setCustomRows(saved.form.rows);
      setCustomColumns(saved.form.columns);
    }
  };

  const onDragStartPool = (
    event: DragEvent,
    value: number,
    x: number,
    y: number,
  ) => {
    if (value === 0) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(
      "application/x-overview1-anordnung",
      encodePayload({ from: "pool", value, x, y }),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragStartCell = (
    event: DragEvent,
    value: number,
    x: number,
    y: number,
  ) => {
    if (value === 0 || isLockedBelegungCell(activeFillId, x, y)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(
      "application/x-overview1-anordnung",
      encodePayload({ from: "cell", value, x, y }),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const allowDrop = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const dropOnCell = (event: DragEvent, x: number, y: number) => {
    event.preventDefault();
    if (isLockedBelegungCell(activeFillId, x, y)) {
      return;
    }
    const payload = decodePayload(
      event.dataTransfer.getData("application/x-overview1-anordnung"),
    );
    if (!payload || payload.value === 0) {
      return;
    }

    setBelegung((current) => {
      const target = current[y]![x] ?? null;

      if (payload.from === "pool") {
        if (target !== null) {
          return current;
        }
        const next = cloneRaster(current);
        next[y]![x] = payload.value;
        setPoolCells((prev) => {
          const nextPool = cloneRaster(prev);
          if (nextPool[payload.y]![payload.x] === payload.value) {
            nextPool[payload.y]![payload.x] = null;
          }
          return nextPool;
        });
        return next;
      }

      if (payload.x === x && payload.y === y) {
        return current;
      }
      if (isLockedBelegungCell(activeFillId, payload.x, payload.y)) {
        return current;
      }

      const next = cloneRaster(current);
      next[y]![x] = payload.value;
      next[payload.y]![payload.x] = target;
      return next;
    });
  };

  const dropOnPoolCell = (event: DragEvent) => {
    event.preventDefault();
    const payload = decodePayload(
      event.dataTransfer.getData("application/x-overview1-anordnung"),
    );
    if (
      !payload
      || payload.from !== "cell"
      || payload.value === 0
      || isLockedBelegungCell(activeFillId, payload.x, payload.y)
    ) {
      return;
    }

    const home = poolHomeCoords(payload.value, pool, minimumValue);

    setBelegung((current) => {
      const next = cloneRaster(current);
      if (next[payload.y]![payload.x] !== payload.value) {
        return current;
      }
      next[payload.y]![payload.x] = null;
      return next;
    });
    setPoolCells((prev) => {
      const nextPool = cloneRaster(prev);
      nextPool[home.y]![home.x] = payload.value;
      return nextPool;
    });
  };

  const belegungStyle = {
    gridTemplateColumns: `repeat(${shape.columns}, ${isLineCluster ? "1.35rem" : "1.6rem"})`,
  } as const;

  const poolStyle = {
    gridTemplateColumns: `repeat(${pool.columns}, 1.6rem)`,
  } as const;

  const selectionLabel = useMemo(() => {
    const draftName = initialDraftName?.trim();
    if (draftName) {
      return draftName;
    }
    if (selectedSaved) {
      return selectedSaved.name;
    }
    if (selectionId === ANORDNUNG_CUSTOM_ID) {
      return draftForm ? formLabel(draftForm) : "—";
    }
    return selectedEntry?.label ?? (draftForm ? formLabel(draftForm) : "—");
  }, [
    draftForm,
    initialDraftName,
    selectedEntry,
    selectedSaved,
    selectionId,
  ]);

  return (
    <section
      className={
        isCircleCluster
          ? "overview1-anordnung-editor overview1-anordnung-editor--circle"
          : "overview1-anordnung-editor"
      }
    >
      <header className="overview1-anordnung-editor__topline">
        <span className="overview1-anordnung-editor__title">
          {isWorkshop
            ? initialDraftName
              ? t("pattern.createTitle")
              : t("pattern.editTitle")
            : t("pattern.title")}
        </span>
        <span className="overview1-anordnung-editor__selection">
          {selectionLabel}
          {" · "}
          {movablePlaced}/{movableTotal}
        </span>
      </header>

      <div className="overview1-anordnung-editor__body">
        {isWorkshop ? (
          <aside
            className="overview1-anordnung-editor__presets overview1-anordnung-editor__panel overview1-anordnung-editor__panel--dim"
            aria-hidden="true"
          />
        ) : (
        <aside className="overview1-anordnung-editor__presets overview1-anordnung-editor__panel overview1-anordnung-editor__panel--dim">
          <span className="overview1-anordnung-editor__label">Einträge</span>
          <div
            className="overview1-anordnung-editor__preset-list"
            role="listbox"
            aria-label="Anordnung"
          >
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="option"
                aria-selected={selectionId === entry.id}
                className={
                  selectionId === entry.id
                    ? "overview1-anordnung-editor__preset overview1-anordnung-editor__preset--active"
                    : "overview1-anordnung-editor__preset"
                }
                onClick={() => selectEntry(entry.id)}
              >
                {entry.label}
              </button>
            ))}
            {savedEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="option"
                aria-selected={selectionId === entry.id}
                className={
                  selectionId === entry.id
                    ? "overview1-anordnung-editor__preset overview1-anordnung-editor__preset--active"
                    : "overview1-anordnung-editor__preset"
                }
                onClick={() => selectSaved(entry)}
              >
                {entry.name}
              </button>
            ))}
          </div>

          <div className="overview1-anordnung-editor__adjust">
            <button
              type="button"
              className={
                selectionId === ANORDNUNG_CUSTOM_ID
                  ? "overview1-anordnung-editor__preset overview1-anordnung-editor__preset--active"
                  : "overview1-anordnung-editor__preset"
              }
              aria-pressed={selectionId === ANORDNUNG_CUSTOM_ID}
              onClick={selectCustom}
            >
              Anpassen
            </button>

            {selectionId === ANORDNUNG_CUSTOM_ID ? (
              <div className="overview1-anordnung-editor__custom overview1-anordnung-editor__panel overview1-anordnung-editor__panel--lit">
                <span className="overview1-anordnung-editor__label" id="anordnung-custom-rect-label">
                  {t("pattern.rectangle")}
                </span>
                <div className="overview1-anordnung-editor__rect-menu">
                  <button
                    type="button"
                    id="anordnung-custom-rect"
                    className="overview1-anordnung-editor__rect-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={rectMenuOpen}
                    aria-labelledby="anordnung-custom-rect-label anordnung-custom-rect"
                    onClick={() => setRectMenuOpen((open) => !open)}
                  >
                    {rectOptions.find((option) => option.id === customPartitionId)?.label
                      ?? "Rechteck wählen"}
                    <span aria-hidden="true">▾</span>
                  </button>
                  {rectMenuOpen ? (
                    <ul
                      className="overview1-anordnung-editor__rect-list"
                      role="listbox"
                      aria-labelledby="anordnung-custom-rect-label"
                    >
                      {rectOptions.map((option) => (
                        <li key={option.id} role="presentation">
                          <button
                            type="button"
                            role="option"
                            aria-selected={option.id === customPartitionId}
                            className={
                              option.id === customPartitionId
                                ? "overview1-anordnung-editor__rect-option overview1-anordnung-editor__rect-option--active"
                                : "overview1-anordnung-editor__rect-option"
                            }
                            onClick={() => {
                              setCustomRows(option.rows);
                              setCustomColumns(option.columns);
                              setRectMenuOpen(false);
                            }}
                          >
                            {option.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                {rectOptions.length === 0 ? (
                  <p className="overview1-anordnung-editor__error">
                    {t("pattern.noRectFormats")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>
        )}

        <div
          className={[
            "overview1-anordnung-editor__board",
            "overview1-anordnung-editor__panel",
            "overview1-anordnung-editor__panel--stage",
            isLineCluster ? "overview1-anordnung-editor__board--scroll" : "",
            isSingleColCluster ? "overview1-anordnung-editor__board--col" : "",
            isCircleCluster ? "overview1-anordnung-editor__board--circle" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="overview1-anordnung-editor__board-header">
            <span className="overview1-anordnung-editor__label">{t("pattern.placement")}</span>
            <button
              type="button"
              className="overview1-anordnung-editor__btn overview1-anordnung-editor__btn--save"
              onClick={() => requestSave("catalog")}
              disabled={!canSave}
              title={
                canSave
                  ? t("pattern.saveAsOwn")
                  : t("pattern.saveDisabledHint")
              }
            >
              {t("common.save")}
            </button>
          </div>
          <div className="overview1-anordnung-editor__board-scroll">
            {isCircleCluster ? (
              <div
                className="overview1-anordnung-editor__circle-map"
                style={{
                  width: `${ANORDNUNG_CIRCLE_REM}rem`,
                  height: `${ANORDNUNG_CIRCLE_REM}rem`,
                }}
              >
                {flatBelegung.map((cell, index) => {
                  const pos = circlePos[index];
                  if (!pos) {
                    return null;
                  }
                  const locked = isLockedBelegungCell(
                    activeFillId,
                    cell.x,
                    cell.y,
                  );
                  return (
                    <div
                      key={`circle-${cell.x}-${cell.y}`}
                      className={[
                        "overview1-anordnung-editor__circle-slot",
                        cell.value !== null
                          ? "overview1-anordnung-editor__circle-slot--filled"
                          : "",
                        locked
                          ? "overview1-anordnung-editor__circle-slot--disabled"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        left: `${pos.x * 100}%`,
                        top: `${pos.y * 100}%`,
                      }}
                      onDragOver={locked ? undefined : allowDrop}
                      onDrop={
                        locked
                          ? undefined
                          : (event) => dropOnCell(event, cell.x, cell.y)
                      }
                    >
                      {cell.value !== null ? (
                        <span
                          draggable={!locked && cell.value !== 0}
                          className={[
                            "overview1-anordnung-editor__token",
                            locked
                              ? "overview1-anordnung-editor__token--disabled"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onDragStart={
                            locked
                              ? undefined
                              : (event) =>
                                  onDragStartCell(
                                    event,
                                    cell.value!,
                                    cell.x,
                                    cell.y,
                                  )
                          }
                        >
                          {cell.value}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="overview1-anordnung-editor__grid"
                style={belegungStyle}
              >
                {belegung.map((row, y) =>
                  row.map((value, x) => {
                    const locked = isLockedBelegungCell(activeFillId, x, y);
                    return (
                      <div
                        key={`cell-${x}-${y}`}
                        className={[
                          "overview1-anordnung-editor__cell",
                          value !== null
                            ? "overview1-anordnung-editor__cell--filled"
                            : "",
                          locked
                            ? "overview1-anordnung-editor__cell--disabled"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onDragOver={locked ? undefined : allowDrop}
                        onDrop={
                          locked
                            ? undefined
                            : (event) => dropOnCell(event, x, y)
                        }
                      >
                        {value !== null ? (
                          <span
                            draggable={!locked && value !== 0}
                            className={[
                              "overview1-anordnung-editor__token",
                              locked
                                ? "overview1-anordnung-editor__token--disabled"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onDragStart={
                              locked
                                ? undefined
                                : (event) =>
                                    onDragStartCell(event, value, x, y)
                            }
                          >
                            {value}
                          </span>
                        ) : null}
                      </div>
                    );
                  }),
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overview1-anordnung-editor__pool overview1-anordnung-editor__panel overview1-anordnung-editor__panel--dim">
          <div className="overview1-anordnung-editor__board-header">
            <span className="overview1-anordnung-editor__label">
              {t("pattern.pool")}
            </span>
          </div>
          <div
            className="overview1-anordnung-editor__grid overview1-anordnung-editor__grid--pool"
            style={poolStyle}
          >
            {poolCells.map((row, y) =>
              row.map((value, x) => {
                const disabled = pool.zehner && x === 0 && y === 0;
                return (
                  <div
                    key={`pool-${x}-${y}`}
                    className={[
                      "overview1-anordnung-editor__cell",
                      value !== null
                        ? "overview1-anordnung-editor__cell--pool"
                        : "",
                      disabled
                        ? "overview1-anordnung-editor__cell--disabled"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onDragOver={disabled ? undefined : allowDrop}
                    onDrop={disabled ? undefined : dropOnPoolCell}
                  >
                    {value !== null ? (
                      <span
                        draggable={!disabled && value !== 0}
                        className={[
                          "overview1-anordnung-editor__token",
                          "overview1-anordnung-editor__token--pool",
                          disabled
                            ? "overview1-anordnung-editor__token--disabled"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onDragStart={
                          disabled
                            ? undefined
                            : (event) => onDragStartPool(event, value, x, y)
                        }
                      >
                        {value}
                      </span>
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>

      <footer className="overview1-anordnung-editor__footer">
        <div className="overview1-anordnung-editor__footer-panel overview1-anordnung-editor__footer-panel--tools">
          <button
            type="button"
            className="overview1-anordnung-editor__btn"
            onClick={clearBoard}
            disabled={isEmpty}
          >
            {t("pattern.clearPlacement")}
          </button>
          <button
            type="button"
            className="overview1-anordnung-editor__btn"
            onClick={resetPresetFill}
          >
            {locksForm ? t("pattern.resetLayout") : `1…${size}`}
          </button>
          <button
            type="button"
            className="overview1-anordnung-editor__btn"
            onClick={fillRandom}
          >
            {t("pattern.random")}
          </button>
        </div>
        <div className="overview1-anordnung-editor__footer-panel overview1-anordnung-editor__footer-panel--hint">
          <p className="overview1-anordnung-editor__footer-hint">
            {t("pattern.dragHint")}
          </p>
        </div>
        <div className="overview1-anordnung-editor__footer-panel overview1-anordnung-editor__footer-panel--actions">
          <button
            type="button"
            className="overview1-anordnung-editor__btn"
            onClick={onCancel}
          >
            {isWorkshop ? t("common.back") : t("common.cancel")}
          </button>
          <button
            type="button"
            className="overview1-anordnung-editor__btn overview1-anordnung-editor__btn--primary"
            onClick={() => {
              if (isWorkshop && canSave) {
                requestSave("apply");
                return;
              }
              requestApply();
            }}
            disabled={!isComplete || !customValid}
          >
            {isWorkshop && canSave ? t("pattern.saveAndApply") : t("common.apply")}
          </button>
        </div>
      </footer>

      {fixedConfirmOpen && matchingFixed ? (
        <div className="overview1-anordnung-confirm-layer" role="presentation">
          <button
            type="button"
            className="overview1-anordnung-confirm-layer__backdrop"
            aria-label={t("common.cancel")}
            onClick={() => setFixedConfirmOpen(false)}
          />
          <div
            className="overview1-anordnung-confirm-layer__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="anordnung-fixed-title"
          >
            <h3 id="anordnung-fixed-title" className="overview1-anordnung-confirm__title">
              {t("pattern.fixedMatchTitle")}
            </h3>
            <p className="overview1-anordnung-confirm__text">
              {t("pattern.fixedMatchBody", { label: matchingFixed.label })}
            </p>
            <div className="overview1-anordnung-confirm__actions">
              <button
                type="button"
                className="overview1-anordnung-editor__btn"
                onClick={() => setFixedConfirmOpen(false)}
              >
                {t("common.no")}
              </button>
              <button
                type="button"
                className="overview1-anordnung-editor__btn overview1-anordnung-editor__btn--primary"
                onClick={() => {
                  setFixedConfirmOpen(false);
                  handleApply();
                }}
              >
                {t("common.yes")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {saveModalOpen ? (
        <div
          className="overview1-anordnung-editor__save-overlay"
          role="presentation"
          onClick={closeSaveModal}
        >
          <div
            className="overview1-anordnung-editor__save-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="anordnung-save-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="anordnung-save-title" className="overview1-anordnung-editor__save-title">
              {saveIntent === "apply"
                ? t("pattern.saveAndApply")
                : t("pattern.saveTitle")}
            </h3>
            <p className="overview1-anordnung-editor__save-hint">
              {saveIntent === "apply"
                ? t("pattern.saveHintApply")
                : t("pattern.saveHint")}
            </p>
            <label className="overview1-anordnung-editor__label" htmlFor="anordnung-save-name">
              {t("common.name")}
            </label>
            <input
              id="anordnung-save-name"
              type="text"
              className="overview1-anordnung-editor__input"
              autoFocus
              value={saveName}
              onChange={(event) => {
                setSaveName(event.target.value);
                if (saveError) {
                  setSaveError(null);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSave();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  closeSaveModal();
                }
              }}
            />
            {saveError ? (
              <p className="overview1-anordnung-editor__error">{saveError}</p>
            ) : null}
            <div className="overview1-anordnung-editor__save-actions">
              <button
                type="button"
                className="overview1-anordnung-editor__btn"
                onClick={closeSaveModal}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="overview1-anordnung-editor__btn overview1-anordnung-editor__btn--primary"
                onClick={handleSave}
                disabled={!saveName.trim()}
              >
                {saveIntent === "apply" ? t("pattern.saveAndApply") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
