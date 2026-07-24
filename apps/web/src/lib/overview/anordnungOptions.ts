import { gridPartitions } from "@/lib/analysis/catalog";
import type { NumberSpace } from "@/lib/analysis/catalog";
import {
  type AppliedRasterForm,
  belegungGridShape,
  rasterFormOptionsForSize,
} from "@/lib/overview/rasterForm";

export type BelegungFillId =
  | "sequential"
  | "zehner-columns"
  | "zehner-rows";

export type AnordnungEntry = {
  readonly id: string;
  readonly label: string;
  /**
   * Bound equipment: form is fixed in the picker — not opened in the workshop.
   */
  readonly locksForm: boolean;
  /** If false, entry is select-only (no Ändern / workshop). */
  readonly editable: boolean;
  readonly fillId: BelegungFillId;
  readonly resolveForm: (size: number) => AppliedRasterForm;
  readonly matchesLottery: (space: Pick<NumberSpace, "size" | "minimumValue">) => boolean;
};

export const ANORDNUNG_CUSTOM_ID = "custom";

/** Rectangle partitions only — excludes 1×N and N×1. */
export function rectanglePartitionsForSize(
  size: number,
): readonly { readonly rows: number; readonly columns: number }[] {
  return gridPartitions(size).filter(
    (partition) => partition.rows > 1 && partition.columns > 1,
  );
}

function rectanglePartitionLabel(rows: number, columns: number): string {
  if (rows === columns) {
    return `Quadrat ${rows}×${columns}`;
  }
  return `Rechteck ${rows}×${columns}`;
}

export function rectanglePartitionOptionsForSize(
  size: number,
): readonly { readonly id: string; readonly label: string; readonly rows: number; readonly columns: number }[] {
  return rectanglePartitionsForSize(size).map((partition) => ({
    id: `rect-${partition.rows}x${partition.columns}`,
    label: rectanglePartitionLabel(partition.rows, partition.columns),
    rows: partition.rows,
    columns: partition.columns,
  }));
}

type RasterCell = number | null;

function emptyRaster(rows: number, columns: number): RasterCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => null),
  );
}

/** Standard row-major 1…N (or minimumValue…). */
export function fillSequential(
  rows: number,
  columns: number,
  minimumValue: number,
): RasterCell[][] {
  return Array.from({ length: rows }, (_, y) =>
    Array.from(
      { length: columns },
      (_, x) => minimumValue + y * columns + x,
    ),
  );
}

/**
 * Zehner (10×5): columns are tens groups.
 * col0 = 0–9, col1 = 10–19, … col4 = 40–49.
 */
export function fillZehnerColumns(): RasterCell[][] {
  return Array.from({ length: 10 }, (_, y) =>
    Array.from({ length: 5 }, (_, x) => x * 10 + y),
  );
}

/**
 * Zehner-Reihe (5×10): rows are tens groups.
 * row0 = 0–9, row1 = 10–19, … row4 = 40–49.
 */
export function fillZehnerRows(): RasterCell[][] {
  return Array.from({ length: 5 }, (_, y) =>
    Array.from({ length: 10 }, (_, x) => y * 10 + x),
  );
}

/** Registry — add new bound fills here without touching the editor shell. */
export const BELEGUNG_FILLS: Record<
  BelegungFillId,
  (args: {
    readonly rows: number;
    readonly columns: number;
    readonly minimumValue: number;
  }) => RasterCell[][]
> = {
  sequential: ({ rows, columns, minimumValue }) =>
    fillSequential(rows, columns, minimumValue),
  "zehner-columns": () => fillZehnerColumns(),
  "zehner-rows": () => fillZehnerRows(),
};

const RASTER_7X7_SEQUENTIAL: AnordnungEntry = {
  id: "equip-raster-7x7",
  label: "Raster 7×7, 1–49",
  locksForm: true,
  editable: false,
  fillId: "sequential",
  resolveForm: (size) => ({
    kind: "grid",
    rows: 7,
    columns: 7,
    size,
  }),
  matchesLottery: (space) => space.size === 49 && space.minimumValue === 1,
};

const BOUND_EQUIPMENT: readonly AnordnungEntry[] = [
  {
    id: "equip-zehner",
    label: "Zehner Spalten",
    locksForm: true,
    editable: false,
    fillId: "zehner-columns",
    resolveForm: (size) => ({
      kind: "grid",
      rows: 10,
      columns: 5,
      size,
    }),
    matchesLottery: (space) => space.size === 49 && space.minimumValue === 1,
  },
  {
    id: "equip-zehner-reihe",
    label: "Zehner-Reihen",
    locksForm: true,
    editable: false,
    fillId: "zehner-rows",
    resolveForm: (size) => ({
      kind: "grid",
      rows: 5,
      columns: 10,
      size,
    }),
    matchesLottery: (space) => space.size === 49 && space.minimumValue === 1,
  },
];

/**
 * Catalog = feste Einträge only. Gespeicherte eigene liegen außerhalb (Picker-Panel).
 */
export function anordnungEntriesForLottery(
  space: Pick<NumberSpace, "size" | "minimumValue">,
): readonly AnordnungEntry[] {
  const leading = RASTER_7X7_SEQUENTIAL.matchesLottery(space)
    ? [RASTER_7X7_SEQUENTIAL]
    : [];

  const maxValue = space.minimumValue + space.size - 1;
  const circleLabel =
    space.minimumValue === 1 && space.size === 49
      ? "Kreis, 1–49"
      : `Kreis, ${space.minimumValue}–${maxValue}`;

  const circleEntries: AnordnungEntry[] = rasterFormOptionsForSize(space.size)
    .filter((option) => option.kind === "ring")
    .map((option) => ({
      id: option.id,
      label: circleLabel,
      locksForm: true,
      editable: false,
      fillId: "sequential" as const,
      resolveForm: (size: number) => ({ kind: "ring" as const, size }),
      matchesLottery: () => true,
    }));

  const equipment = BOUND_EQUIPMENT.filter((entry) =>
    entry.matchesLottery(space),
  );

  return [...leading, ...circleEntries, ...equipment];
}

const MAX_CUSTOM_AXIS = 12;

/**
 * Custom / workshop rectangle sizes:
 * - no 1×N / N×1
 * - rows ≤ 12 and columns ≤ 12
 * - rows × columns = lottery size (even partitions)
 *
 * Fixed catalog entries (e.g. „Raster 7×7, 1–49“) stay select-only in the picker.
 * The same dimensions may still be chosen here for a different number order.
 */
export function workshopRectangleOptionsForSize(
  space: Pick<NumberSpace, "size" | "minimumValue">,
): readonly { readonly id: string; readonly label: string; readonly rows: number; readonly columns: number }[] {
  return rectanglePartitionOptionsForSize(space.size).filter((option) => {
    if (option.rows > MAX_CUSTOM_AXIS || option.columns > MAX_CUSTOM_AXIS) {
      return false;
    }
    return option.rows * option.columns === space.size;
  });
}

export function buildEntryBelegung(
  entry: AnordnungEntry,
  size: number,
  minimumValue: number,
): RasterCell[][] {
  const form = entry.resolveForm(size);
  const shape = belegungGridShape(form);
  return buildBelegungForFill(
    entry.fillId,
    shape.rows,
    shape.columns,
    minimumValue,
  );
}

export function findAnordnungEntry(
  entries: readonly AnordnungEntry[],
  id: string,
): AnordnungEntry | undefined {
  return entries.find((entry) => entry.id === id);
}

export function guessAnordnungEntryId(
  form: AppliedRasterForm | null,
  entries: readonly AnordnungEntry[],
): string {
  if (!form) {
    return entries[0]?.id ?? ANORDNUNG_CUSTOM_ID;
  }

  if (form.kind === "grid") {
    const bound = entries.find(
      (entry) =>
        entry.locksForm
        && entry.resolveForm(form.size).kind === "grid"
        && (() => {
          const resolved = entry.resolveForm(form.size);
          return (
            resolved.kind === "grid"
            && resolved.rows === form.rows
            && resolved.columns === form.columns
          );
        })(),
    );
    if (bound) {
      return bound.id;
    }
    // Free rectangles live under Anpassen
    return ANORDNUNG_CUSTOM_ID;
  }

  const circle = entries.find((entry) => {
    const resolved = entry.resolveForm(form.size);
    return resolved.kind === "ring";
  });

  return circle?.id ?? ANORDNUNG_CUSTOM_ID;
}

export function buildBelegungForFill(
  fillId: BelegungFillId,
  rows: number,
  columns: number,
  minimumValue: number,
): RasterCell[][] {
  return BELEGUNG_FILLS[fillId]({ rows, columns, minimumValue });
}

export { emptyRaster };
export type { RasterCell };
