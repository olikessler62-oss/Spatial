import { gridPartitions } from "@/lib/analysis/catalog";

function gridFormLabel(rows: number, columns: number): string {
  if (rows === 1 && columns > 1) {
    return `Horizontale Reihe ${rows}×${columns}`;
  }
  if (columns === 1 && rows > 1) {
    return `Vertikale Reihe ${rows}×${columns}`;
  }
  return `Rechteck ${rows}×${columns}`;
}

export type RasterFormKind = "grid" | "ring";

export type AppliedRasterForm =
  | {
      readonly kind: "grid";
      readonly rows: number;
      readonly columns: number;
      readonly size: number;
    }
  | {
      readonly kind: "ring";
      readonly size: number;
    };

export type RasterFormOption =
  | {
      readonly id: string;
      readonly kind: "grid";
      readonly label: string;
      readonly rows: number;
      readonly columns: number;
    }
  | {
      readonly id: string;
      readonly kind: "ring";
      readonly label: string;
    };

export function rasterFormOptionsForSize(size: number): readonly RasterFormOption[] {
  if (!Number.isInteger(size) || size <= 0) {
    return [];
  }

  const options: RasterFormOption[] = [];

  for (const partition of gridPartitions(size)) {
    options.push({
      id: `grid-${partition.rows}x${partition.columns}`,
      kind: "grid",
      label: gridFormLabel(partition.rows, partition.columns),
      rows: partition.rows,
      columns: partition.columns,
    });
  }

  options.push({
    id: "ring",
    kind: "ring",
    label: "Kreis",
  });

  return options;
}

export function defaultRasterFormForSize(size: number): AppliedRasterForm | null {
  if (!Number.isInteger(size) || size <= 0) {
    return null;
  }

  const partitions = gridPartitions(size);
  const square = partitions.find(
    (partition) => partition.rows === partition.columns,
  );
  const preferred =
    square
    ?? partitions.find((partition) => partition.rows <= partition.columns)
    ?? partitions[0];

  if (preferred) {
    return {
      kind: "grid",
      rows: preferred.rows,
      columns: preferred.columns,
      size,
    };
  }

  return { kind: "ring", size };
}

/** Rectangular layout used by Zahlenbelegung / cards for any form. */
export function belegungGridShape(
  form: AppliedRasterForm,
): { rows: number; columns: number } {
  if (form.kind === "grid") {
    return { rows: form.rows, columns: form.columns };
  }

  const partitions = gridPartitions(form.size);
  const square = partitions.find(
    (partition) => partition.rows === partition.columns,
  );
  const preferred =
    square
    ?? partitions.find((partition) => partition.rows <= partition.columns)
    ?? partitions[0];

  if (preferred) {
    return { rows: preferred.rows, columns: preferred.columns };
  }

  return { rows: 1, columns: form.size };
}

export function formLabel(form: AppliedRasterForm): string {
  if (form.kind === "grid") {
    return gridFormLabel(form.rows, form.columns);
  }
  return "Kreis";
}

export function localizedFormLabel(
  form: AppliedRasterForm,
  t: (
    key:
      | "pattern.form.circle"
      | "pattern.form.rect"
      | "pattern.form.rowH"
      | "pattern.form.rowV",
    vars?: Readonly<Record<string, string>>,
  ) => string,
): string {
  if (form.kind === "ring") {
    return t("pattern.form.circle");
  }
  const rows = String(form.rows);
  const columns = String(form.columns);
  if (form.rows === 1 && form.columns > 1) {
    return t("pattern.form.rowH", { rows, columns });
  }
  if (form.columns === 1 && form.rows > 1) {
    return t("pattern.form.rowV", { rows, columns });
  }
  return t("pattern.form.rect", { rows, columns });
}

export function optionToApplied(
  option: RasterFormOption,
  size: number,
): AppliedRasterForm {
  if (option.kind === "grid") {
    return {
      kind: "grid",
      rows: option.rows,
      columns: option.columns,
      size,
    };
  }
  return { kind: "ring", size };
}

export function customGridForm(
  rows: number,
  columns: number,
  size: number,
): AppliedRasterForm | null {
  if (
    !Number.isInteger(rows)
    || !Number.isInteger(columns)
    || rows < 1
    || columns < 1
    || rows * columns !== size
  ) {
    return null;
  }
  return { kind: "grid", rows, columns, size };
}

export function customRingForm(size: number): AppliedRasterForm | null {
  if (!Number.isInteger(size) || size <= 0) {
    return null;
  }
  return { kind: "ring", size };
}

/** Fixed Zehner pool for 6aus49; otherwise nearest partition. */
export function poolShapeForLottery(
  size: number,
  minimumValue: number,
): { readonly rows: number; readonly columns: number; readonly zehner: boolean } {
  if (size === 49 && minimumValue === 1) {
    return { rows: 10, columns: 5, zehner: true };
  }
  const partitions = gridPartitions(size);
  const preferred =
    partitions.find((p) => p.rows === p.columns)
    ?? partitions.find((p) => p.rows <= p.columns)
    ?? partitions[0];
  if (preferred) {
    return {
      rows: preferred.rows,
      columns: preferred.columns,
      zehner: false,
    };
  }
  return { rows: 1, columns: size, zehner: false };
}

export function poolHomeCoords(
  value: number,
  pool: { readonly rows: number; readonly columns: number; readonly zehner: boolean },
  minimumValue: number,
): { x: number; y: number } {
  if (pool.zehner) {
    return {
      x: Math.floor(value / 10),
      y: value % 10,
    };
  }
  const index = value - minimumValue;
  return {
    x: index % pool.columns,
    y: Math.floor(index / pool.columns),
  };
}

export function flattenBelegung(
  grid: readonly (readonly number[])[],
): number[] {
  const values: number[] = [];
  for (const row of grid) {
    for (const value of row) {
      values.push(value);
    }
  }
  return values;
}

export type LayoutPosition = {
  readonly x: number;
  readonly y: number;
};

/**
 * Normalized positions in [0, 1]².
 * Ring (circle): all values evenly on the circumference.
 */
export function layoutPositions(form: AppliedRasterForm): LayoutPosition[] {
  if (form.kind === "grid") {
    const positions: LayoutPosition[] = [];
    for (let y = 0; y < form.rows; y += 1) {
      for (let x = 0; x < form.columns; x += 1) {
        positions.push({
          x: form.columns <= 1 ? 0.5 : (x + 0.5) / form.columns,
          y: form.rows <= 1 ? 0.5 : (y + 0.5) / form.rows,
        });
      }
    }
    return positions;
  }

  return circlePositions(form.size);
}

/** Radius of the circle rim in normalized coords.
 * Keeps absolute ring size when CIRCLE_MAP_REM is 80% of 22.7 (0.352/0.8). */
export const SHAPE_RADIUS = 0.44;

/**
 * Circle: all values evenly on the circumference (including 1).
 * Number 1 starts at the top; then clockwise (screen coords).
 */
export function circlePositions(count: number): LayoutPosition[] {
  if (count <= 0) {
    return [];
  }

  // Screen y grows downward → -π/2 is top.
  const startAngle = -Math.PI / 2;
  const positions: LayoutPosition[] = [];

  for (let i = 0; i < count; i += 1) {
    const angle = startAngle + (i / count) * Math.PI * 2;
    positions.push({
      x: 0.5 + SHAPE_RADIUS * Math.cos(angle),
      y: 0.5 + SHAPE_RADIUS * Math.sin(angle),
    });
  }

  return positions;
}

/** SVG circle guide radius in a 0…100 viewBox. */
export function circleSvgRadius(): number {
  return SHAPE_RADIUS * 100;
}
