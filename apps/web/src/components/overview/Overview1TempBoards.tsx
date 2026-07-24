"use client";

import { CalendarClock, LayoutGrid, Plus, StickyNote, Trash2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { fetchOverview1Moves } from "@/app/app/overview-1/actions";
import { AnordnungFlow } from "@/components/overview/AnordnungFlow";
import { ShapeGridOverlay } from "@/components/overview/shape-visualization/ShapeGridOverlay";
import { useShapeVisualization } from "@/components/overview/shape-visualization/useShapeVisualization";
import type { ShapeStreakLabel } from "@/components/overview/shape-visualization/shapeStreakLabels";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAnalysisContext } from "@/context/AnalysisContext";
import { useLocale } from "@/context/LocaleContext";
import { useOverview1Ui } from "@/context/Overview1UiContext";
import type { NumberSpace } from "@/lib/analysis/catalog";
import type { Overview1Move } from "@/lib/overview/overview1Moves";
import {
  belegungGridShape,
  defaultRasterFormForSize,
  flattenBelegung,
  layoutPositions,
  localizedFormLabel,
  type AppliedRasterForm,
} from "@/lib/overview/rasterForm";
import {
  readStoredOverview1Rows,
  writeStoredOverview1Rows,
} from "@/lib/overview/overview1RowsStorage";
import { parseTrustedUuid } from "@/lib/security/trustedIds";
import { localeToBcp47, type Locale } from "@/lib/i18n/locale";
import type { VisibleShapeOccurrence } from "@spatial/engine";

const CARD_COUNT = 10;
const FALLBACK_GRID = 7;
const GRID_CELL_REM = 1.4;
const CIRCLE_MAP_REM = 18.16;

/** Sequential fill: left→right per row, top→bottom across rows. */
function buildSharedGrid(
  rows: number,
  columns: number,
  minimumValue: number,
): number[][] {
  const grid: number[][] = [];
  let value = minimumValue;
  for (let row = 0; row < rows; row += 1) {
    const cells: number[] = [];
    for (let column = 0; column < columns; column += 1) {
      cells.push(value);
      value += 1;
    }
    grid.push(cells);
  }
  return grid;
}

function formatDrawDate(isoDate: string, locale: Locale): string {
  return new Date(isoDate).toLocaleDateString(localeToBcp47(locale));
}

function DrawGridCard({
  grid,
  form,
  minimumValue,
  move,
  cardKey,
  isLatest,
  selected,
  onSelect,
  shapeOccurrences,
  streakLabelsByShapeId,
  showStreakLabels,
  dateLocale,
  latestLabel,
  onDateLabel,
}: {
  grid: number[][];
  form: AppliedRasterForm | null;
  minimumValue: number;
  move: Overview1Move | null;
  cardKey: string;
  isLatest?: boolean;
  selected: boolean;
  onSelect: () => void;
  shapeOccurrences: VisibleShapeOccurrence[];
  streakLabelsByShapeId?: ReadonlyMap<string, ShapeStreakLabel>;
  showStreakLabels?: boolean;
  dateLocale: Locale;
  latestLabel: (date: string) => string;
  onDateLabel: (date: string) => string;
}) {
  const moveValues = useMemo(
    () => new Set(move?.values ?? []),
    [move],
  );

  const isCircle = form?.kind === "ring";
  const isSingleRowGrid =
    form?.kind === "grid" && form.rows === 1 && form.columns > 1;
  const isSingleColGrid =
    form?.kind === "grid" && form.columns === 1;

  const circleValues = useMemo(() => {
    if (!form || form.kind !== "ring") {
      return [];
    }
    const flat = flattenBelegung(grid);
    if (flat.length === form.size) {
      return flat;
    }
    return Array.from(
      { length: form.size },
      (_, index) => minimumValue + index,
    );
  }, [form, grid, minimumValue]);

  const positions = useMemo(
    () => (form && isCircle ? layoutPositions(form) : []),
    [form, isCircle],
  );

  const cardClassName = [
    "overview1-temp-card",
    "overview1-temp-card--selectable",
    isCircle ? "overview1-temp-card--circle" : "",
    isSingleRowGrid ? "overview1-temp-card--single-row" : "",
    isSingleColGrid ? "overview1-temp-card--single-col" : "",
    isLatest ? "overview1-temp-card--latest" : "",
    selected ? "overview1-temp-card--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const slotClassName = [
    "overview1-temp-card-slot",
    isCircle ? "overview1-temp-card-slot--circle" : "",
    isSingleColGrid ? "overview1-temp-card-slot--single-col" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const dateText = move ? formatDrawDate(move.drawDate, dateLocale) : "—";
  const drawLabel = isLatest
    ? latestLabel(dateText)
    : onDateLabel(dateText);

  return (
    <div className={slotClassName}>
      <article
        className={cardClassName}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
      >
        <span className="overview1-temp-card__draw-label">{drawLabel}</span>
        <div className="overview1-temp-card__body">
          {isCircle && form ? (
            <div
              className="overview1-temp-card__circle-map"
              style={{
                width: `${CIRCLE_MAP_REM}rem`,
                height: `${CIRCLE_MAP_REM}rem`,
              }}
            >
              {circleValues.map((value, index) => {
                const pos = positions[index];
                if (!pos) {
                  return null;
                }
                const inMove = moveValues.has(value);
                return (
                  <span
                    key={`${cardKey}-c-${value}`}
                    className={
                      inMove
                        ? "overview1-temp-card__free-num overview1-temp-card__free-num--hit"
                        : "overview1-temp-card__free-num"
                    }
                    style={{
                      left: `${pos.x * 100}%`,
                      top: `${pos.y * 100}%`,
                    }}
                  >
                    <span className="overview1-temp-card__free-num-label">{value}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            <div
              className="overview1-temp-card__grid"
              style={{
                gridTemplateColumns: `repeat(${grid[0]?.length ?? FALLBACK_GRID}, ${GRID_CELL_REM}rem)`,
              }}
            >
              {grid.map((row, y) =>
                row.map((value, x) => {
                  const inMove = moveValues.has(value);
                  const cellClass = [
                    "overview1-temp-card__cell",
                    inMove ? "overview1-temp-card__cell--move" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={`${cardKey}-${x}-${y}`}
                      className={cellClass}
                    >
                      <span className="overview1-temp-card__cell-label">{value}</span>
                    </div>
                  );
                }),
              )}
              {move && shapeOccurrences.length > 0 ? (
                <ShapeGridOverlay
                  cardId={move.id}
                  rowCount={grid.length}
                  columnCount={grid[0]?.length ?? 0}
                  occurrences={shapeOccurrences}
                  streakLabelsByShapeId={streakLabelsByShapeId}
                  showStreakLabels={Boolean(isLatest && showStreakLabels)}
                />
              ) : null}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

type Overview1PanelDescriptor = {
  readonly id: string;
  readonly initialForm: AppliedRasterForm | null;
  readonly initialGrid: number[][] | null;
};

type Overview1PanelProps = {
  readonly panelId: string;
  readonly numberSpace: NumberSpace | null;
  readonly contextReady: boolean;
  readonly subjectId: string | undefined;
  readonly minimumValue: number;
  readonly chronologicalMoves: readonly (Overview1Move | null)[];
  readonly latestMoveIndex: number;
  readonly latestCardKey: string | null;
  readonly canRemove: boolean;
  readonly onRemove: () => void;
  /** Seed pattern/grid chosen before the row was added (null → default). */
  readonly initialForm?: AppliedRasterForm | null;
  readonly initialGrid?: number[][] | null;
  /** Report pattern/grid changes so the row can be persisted. */
  readonly onPatternChange?: (form: AppliedRasterForm, grid: number[][]) => void;
};

/**
 * A single independent map row (panel): its own pattern/arrangement, grid,
 * notes and shape visualization. Draw data is shared and passed in via props.
 */
function Overview1Panel({
  panelId,
  numberSpace,
  contextReady,
  subjectId,
  minimumValue,
  chronologicalMoves,
  latestMoveIndex,
  latestCardKey,
  canRemove,
  onRemove,
  initialForm = null,
  initialGrid = null,
  onPatternChange,
}: Overview1PanelProps) {
  const { t, locale } = useLocale();
  const { closeContextEditor } = useOverview1Ui();

  const [appliedRasterForm, setAppliedRasterForm] =
    useState<AppliedRasterForm | null>(initialForm);
  const [anordnungOpen, setAnordnungOpen] = useState(false);
  const [anordnungCloseAllowed, setAnordnungCloseAllowed] = useState(true);

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [panelNotes, setPanelNotes] = useState("");
  const [selectedCardKey, setSelectedCardKey] = useState<string | null>(null);

  const openNotes = useCallback(() => {
    setNotesDraft(panelNotes);
    setNotesOpen(true);
  }, [panelNotes]);

  const closeNotes = useCallback(() => {
    setNotesOpen(false);
  }, []);

  const saveNotes = useCallback(() => {
    setPanelNotes(notesDraft);
    setNotesOpen(false);
  }, [notesDraft]);

  const clearNotesDraft = useCallback(() => {
    setNotesDraft("");
  }, []);

  const handleAnordnungOpenChange = useCallback(
    (open: boolean) => {
      setAnordnungOpen(open);
      if (open) {
        // Keep mutual exclusivity with the sidebar context editor.
        closeContextEditor();
      }
    },
    [closeContextEditor],
  );

  const handleAnordnungCloseGate = useCallback((canClose: boolean) => {
    setAnordnungCloseAllowed(canClose);
  }, []);

  useEffect(() => {
    if (!contextReady || !numberSpace) {
      setAppliedRasterForm(null);
      setAnordnungOpen(false);
      return;
    }

    setAppliedRasterForm((current) => {
      if (current && current.size === numberSpace.size) {
        return current;
      }
      return defaultRasterFormForSize(numberSpace.size);
    });
  }, [contextReady, numberSpace, subjectId]);

  const shape = appliedRasterForm
    ? belegungGridShape(appliedRasterForm)
    : { rows: FALLBACK_GRID, columns: FALLBACK_GRID };

  const [grid, setGrid] = useState<number[][]>(
    () => initialGrid ?? buildSharedGrid(FALLBACK_GRID, FALLBACK_GRID, 1),
  );

  useEffect(() => {
    setGrid((current) => {
      if (
        current.length === shape.rows
        && current.every((row) => row.length === shape.columns)
      ) {
        return current;
      }
      return buildSharedGrid(shape.rows, shape.columns, minimumValue);
    });
  }, [shape.rows, shape.columns, minimumValue]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollLatestCardIntoView = useCallback(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }
    node.scrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
  }, []);

  useLayoutEffect(() => {
    scrollLatestCardIntoView();

    const node = scrollRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      scrollLatestCardIntoView();
    });
    observer.observe(node);
    for (const child of node.children) {
      observer.observe(child);
    }

    const settleTimer = window.setTimeout(() => {
      observer.disconnect();
    }, 400);

    return () => {
      window.clearTimeout(settleTimer);
      observer.disconnect();
    };
  }, [
    chronologicalMoves,
    appliedRasterForm,
    shape.rows,
    shape.columns,
    scrollLatestCardIntoView,
  ]);

  useEffect(() => {
    if (!latestCardKey) {
      return;
    }
    setSelectedCardKey(latestCardKey);
  }, [latestCardKey]);

  const visualizationContextKey = [
    panelId,
    subjectId ?? "",
    latestCardKey ?? "",
    appliedRasterForm?.kind ?? "",
    shape.rows,
    shape.columns,
    chronologicalMoves.map((move) => move?.id ?? "").join("|"),
    grid.flat().join(","),
  ].join("::");

  const shapeVisualization = useShapeVisualization({
    selectedCardKey: latestCardKey,
    chronologicalMoves,
    grid,
    isGridLayout: appliedRasterForm?.kind !== "ring",
    contextKey: visualizationContextKey,
  });

  const notesTitle = appliedRasterForm
    ? t("notes.titleWithPattern", {
        pattern: localizedFormLabel(appliedRasterForm, t),
      })
    : t("notes.title");

  return (
    <>
      <AnordnungFlow
        open={anordnungOpen}
        numberSpace={numberSpace}
        lotteryId={subjectId ?? ""}
        initialForm={appliedRasterForm}
        initialGrid={grid}
        closeAllowed={anordnungCloseAllowed}
        onOpenChange={handleAnordnungOpenChange}
        onCloseGateChange={handleAnordnungCloseGate}
        onApply={(form, nextGrid) => {
          setAppliedRasterForm(form);
          setGrid(nextGrid);
          onPatternChange?.(form, nextGrid);
        }}
      />

      <section className="overview1-card-line">
        <header className="overview1-card-line__header">
          <button
            type="button"
            className={
              shapeVisualization.status === "playing"
              || shapeVisualization.status === "analyzing"
                ? "overview1-card-line__icon-btn overview1-card-line__icon-btn--raster overview1-card-line__icon-btn--active"
                : "overview1-card-line__icon-btn overview1-card-line__icon-btn--raster"
            }
            aria-label={t("card.rasterOverdue")}
            title={t("card.rasterOverdue")}
            disabled={!contextReady}
            aria-pressed={
              shapeVisualization.status === "playing"
              || shapeVisualization.status === "analyzing"
              || shapeVisualization.status === "completed"
            }
            onClick={() => {
              if (latestCardKey) {
                setSelectedCardKey(latestCardKey);
              }
              void shapeVisualization.startOrToggle();
            }}
          >
            <CalendarClock aria-hidden size={14} strokeWidth={1.75} />
          </button>
          <div className="overview1-card-line__actions">
            <button
              type="button"
              className={
                notesOpen || panelNotes.trim()
                  ? "overview1-card-line__icon-btn overview1-card-line__icon-btn--active"
                  : "overview1-card-line__icon-btn"
              }
              aria-label={t("notes.open")}
              aria-expanded={notesOpen}
              title={t("notes.open")}
              onClick={openNotes}
            >
              <StickyNote aria-hidden size={14} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className={
                anordnungOpen
                  ? "overview1-card-line__icon-btn overview1-card-line__icon-btn--active"
                  : "overview1-card-line__icon-btn"
              }
              aria-label={anordnungOpen ? t("pattern.close") : t("pattern.open")}
              aria-expanded={anordnungOpen}
              disabled={!contextReady}
              title={
                contextReady
                  ? t("pattern.open")
                  : t("pattern.needContext")
              }
              onClick={() => {
                if (contextReady) {
                  handleAnordnungOpenChange(!anordnungOpen);
                }
              }}
            >
              <LayoutGrid aria-hidden size={14} strokeWidth={1.75} />
            </button>
          </div>
          {canRemove ? (
            <button
              type="button"
              className="overview1-card-line__icon-btn overview1-card-line__icon-btn--danger"
              aria-label={t("overview1.removeRow")}
              title={t("overview1.removeRow")}
              onClick={onRemove}
            >
              <Trash2 aria-hidden size={14} strokeWidth={1.75} />
            </button>
          ) : null}
        </header>

        <div
          ref={scrollRef}
          className="overview1-temp-boards"
          aria-label={t("draws.chronological")}
        >
          {chronologicalMoves.map((move, index) => {
            const cardKey = `draw-${index}`;
            return (
              <DrawGridCard
                key={move?.id ?? `empty-${index}`}
                cardKey={cardKey}
                grid={grid}
                form={appliedRasterForm}
                minimumValue={minimumValue}
                move={move}
                isLatest={index === latestMoveIndex}
                selected={cardKey === selectedCardKey}
                onSelect={() => {
                  if (latestCardKey) {
                    setSelectedCardKey(latestCardKey);
                  }
                }}
                shapeOccurrences={shapeVisualization.occurrencesForCardKey(
                  cardKey,
                )}
                streakLabelsByShapeId={shapeVisualization.streakLabelsByShapeId}
                showStreakLabels={shapeVisualization.streakLabelsEnabled}
                dateLocale={locale}
                latestLabel={(date) => t("draws.latest", { date })}
                onDateLabel={(date) => t("draws.onDate", { date })}
              />
            );
          })}
        </div>
      </section>

      <Dialog
        open={notesOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeNotes();
            return;
          }
          openNotes();
        }}
      >
        <DialogContent
          className="overview1-glass-modal overview1-glass-modal--notes"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="overview1-notes-modal__title text-sm font-medium">
              {notesTitle}
            </DialogTitle>
          </DialogHeader>
          <textarea
            className="overview1-notes-modal__textarea"
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            placeholder={t("notes.placeholder")}
            rows={14}
            autoFocus
          />
          <div className="overview1-notes-modal__actions">
            <button
              type="button"
              className="overview1-anordnung-editor__btn"
              onClick={clearNotesDraft}
            >
              {t("notes.clear")}
            </button>
            <div className="overview1-notes-modal__actions-end">
              <button
                type="button"
                className="overview1-anordnung-editor__btn"
                onClick={closeNotes}
              >
                {t("notes.cancel")}
              </button>
              <button
                type="button"
                className="overview1-anordnung-editor__btn overview1-anordnung-editor__btn--primary"
                onClick={saveNotes}
              >
                {t("notes.save")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Overview1TempBoards() {
  const { domain, scope, subject } = useAnalysisContext();
  const { t } = useLocale();

  const numberSpace = subject?.numberSpace ?? null;
  const contextReady =
    domain?.id === "lottery" && Boolean(scope) && Boolean(subject);
  const minimumValue = numberSpace?.minimumValue ?? 1;

  const [moves, setMoves] = useState<readonly Overview1Move[]>([]);

  // Mount gate: server + first client render output an identical, stable
  // skeleton so hydration never mismatches. Persisted state (localStorage
  // rows/notes) and fetched draw dates are only applied after this flips.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const lotteryId =
      domain?.id === "lottery" && subject?.id
        ? parseTrustedUuid(subject.id)
        : null;

    if (!lotteryId) {
      setMoves([]);
      return;
    }

    let cancelled = false;

    void fetchOverview1Moves(lotteryId).then((next) => {
      if (!cancelled) {
        setMoves(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [domain?.id, subject?.id]);

  const chronologicalMoves = useMemo(() => {
    const oldestFirst = [...moves].sort((left, right) => {
      if (left.drawDate < right.drawDate) {
        return -1;
      }
      if (left.drawDate > right.drawDate) {
        return 1;
      }
      return 0;
    });
    const recent = oldestFirst.slice(-CARD_COUNT);
    const leadingEmpty = Math.max(0, CARD_COUNT - recent.length);
    return [
      ...Array.from({ length: leadingEmpty }, () => null),
      ...recent,
    ];
  }, [moves]);

  const latestMoveIndex = useMemo(() => {
    for (let index = chronologicalMoves.length - 1; index >= 0; index -= 1) {
      if (chronologicalMoves[index]) {
        return index;
      }
    }
    return -1;
  }, [chronologicalMoves]);

  const latestCardKey =
    latestMoveIndex >= 0 ? `draw-${latestMoveIndex}` : null;

  // Independent map rows. Each panel can hold a different pattern.
  const nextPanelId = useRef(1);
  const [panels, setPanels] = useState<readonly Overview1PanelDescriptor[]>([
    { id: "panel-0", initialForm: null, initialGrid: null },
  ]);

  const lotteryId = subject?.id ?? null;

  // Keep the latest panels available to event handlers without re-creating them.
  const panelsRef = useRef(panels);
  useEffect(() => {
    panelsRef.current = panels;
  }, [panels]);

  // Restore saved rows for the selected lottery on start / lottery change.
  useEffect(() => {
    if (!lotteryId) {
      setPanels([{ id: "panel-0", initialForm: null, initialGrid: null }]);
      nextPanelId.current = 1;
      return;
    }

    const stored = readStoredOverview1Rows(lotteryId);
    if (stored.length > 0) {
      setPanels(
        stored.map((row) => ({
          id: row.id,
          initialForm: row.form,
          initialGrid: row.grid,
        })),
      );
      const maxSuffix = stored.reduce((max, row) => {
        const suffix = Number.parseInt(row.id.replace(/[^0-9]/g, ""), 10);
        return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
      }, 0);
      nextPanelId.current = maxSuffix + 1;
    } else {
      setPanels([{ id: "panel-0", initialForm: null, initialGrid: null }]);
      nextPanelId.current = 1;
    }
  }, [lotteryId]);

  const persistPanels = useCallback(
    (next: readonly Overview1PanelDescriptor[]) => {
      if (!lotteryId) {
        return;
      }
      writeStoredOverview1Rows(
        lotteryId,
        next.map((panel) => ({
          id: panel.id,
          form: panel.initialForm,
          grid: panel.initialGrid,
        })),
      );
    },
    [lotteryId],
  );

  // Pattern picker shown *before* a new row is created.
  const [addFlowOpen, setAddFlowOpen] = useState(false);
  const [addFlowCloseAllowed, setAddFlowCloseAllowed] = useState(true);

  const openAddFlow = useCallback(() => {
    if (contextReady) {
      setAddFlowOpen(true);
    }
  }, [contextReady]);

  const addPanelWithPattern = useCallback(
    (form: AppliedRasterForm, grid: number[][]) => {
      const next = [
        ...panelsRef.current,
        {
          id: `panel-${nextPanelId.current++}`,
          initialForm: form,
          initialGrid: grid,
        },
      ];
      setPanels(next);
      persistPanels(next);
    },
    [persistPanels],
  );

  const removePanel = useCallback(
    (panelId: string) => {
      if (panelsRef.current.length <= 1) {
        return;
      }
      const next = panelsRef.current.filter((panel) => panel.id !== panelId);
      setPanels(next);
      persistPanels(next);
    },
    [persistPanels],
  );

  const updatePanelPattern = useCallback(
    (panelId: string, form: AppliedRasterForm, grid: number[][]) => {
      const next = panelsRef.current.map((panel) =>
        panel.id === panelId
          ? { ...panel, initialForm: form, initialGrid: grid }
          : panel,
      );
      setPanels(next);
      persistPanels(next);
    },
    [persistPanels],
  );

  // Seed the picker with the default arrangement for the current number space.
  const defaultNewForm = useMemo(
    () => (numberSpace ? defaultRasterFormForSize(numberSpace.size) : null),
    [numberSpace],
  );
  const defaultNewGrid = useMemo(() => {
    const nextShape = defaultNewForm
      ? belegungGridShape(defaultNewForm)
      : { rows: FALLBACK_GRID, columns: FALLBACK_GRID };
    return buildSharedGrid(nextShape.rows, nextShape.columns, minimumValue);
  }, [defaultNewForm, minimumValue]);

  // Until mounted, render a stable skeleton identical on server & client.
  if (!mounted) {
    return (
      <div className="overview1-surface">
        <div className="overview1-cards-viewport" />
      </div>
    );
  }

  return (
    <div className="overview1-surface">
      <AnordnungFlow
        open={addFlowOpen}
        numberSpace={numberSpace}
        lotteryId={subject?.id ?? ""}
        initialForm={defaultNewForm}
        initialGrid={defaultNewGrid}
        closeAllowed={addFlowCloseAllowed}
        onOpenChange={setAddFlowOpen}
        onCloseGateChange={setAddFlowCloseAllowed}
        onApply={(form, grid) => {
          addPanelWithPattern(form, grid);
        }}
      />

      <div className="overview1-cards-viewport">
        {panels.map((panel) => (
          <Overview1Panel
            key={`${lotteryId ?? "none"}:${panel.id}`}
            panelId={panel.id}
            numberSpace={numberSpace}
            contextReady={contextReady}
            subjectId={subject?.id}
            minimumValue={minimumValue}
            chronologicalMoves={chronologicalMoves}
            latestMoveIndex={latestMoveIndex}
            latestCardKey={latestCardKey}
            canRemove={panels.length > 1}
            onRemove={() => removePanel(panel.id)}
            initialForm={panel.initialForm}
            initialGrid={panel.initialGrid}
            onPatternChange={(form, grid) =>
              updatePanelPattern(panel.id, form, grid)
            }
          />
        ))}

        <div className="overview1-add-row">
          <button
            type="button"
            className="overview1-add-row__btn"
            onClick={openAddFlow}
            disabled={!contextReady}
            title={
              contextReady ? t("overview1.addRow") : t("pattern.needContext")
            }
          >
            <Plus aria-hidden size={16} strokeWidth={2} />
            <span>{t("overview1.addRow")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
