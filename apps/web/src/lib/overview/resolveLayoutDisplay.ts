export type LayoutDisplayParameters = {
  type?: string;
  minimumValue?: number;
  maximumValue?: number;
  rows?: number;
  columns?: number;
  positionCount?: number;
  valueMapping?: number[];
};

export type LayoutDisplayCell = {
  value: number;
  index: number;
  row?: number;
  column?: number;
  /** Normalized 0..1 for ring placement */
  x?: number;
  y?: number;
  angle?: number;
};

export type LayoutDisplayModel = {
  form: "grid" | "circle" | "unsupported";
  rows: number;
  columns: number;
  cells: LayoutDisplayCell[];
  minimumValue: number;
  maximumValue: number;
};

function sequentialValues(minimumValue: number, maximumValue: number): number[] {
  const size = maximumValue - minimumValue + 1;
  return Array.from({ length: size }, (_, index) => minimumValue + index);
}

export function resolveLayoutDisplay(
  parameters: LayoutDisplayParameters,
  layoutType?: string | null,
): LayoutDisplayModel {
  const type = (parameters.type ?? layoutType ?? "grid").toLowerCase();
  const minimumValue = parameters.minimumValue ?? 1;
  const maximumValue =
    parameters.maximumValue
    ?? minimumValue + (parameters.positionCount ?? 1) - 1;
  const values =
    Array.isArray(parameters.valueMapping)
    && parameters.valueMapping.length > 0
      ? parameters.valueMapping
      : sequentialValues(minimumValue, maximumValue);
  const size = values.length;

  if (type === "circle") {
    const cells: LayoutDisplayCell[] = values.map((value, index) => {
      const angle = (index / size) * Math.PI * 2 - Math.PI / 2;
      return {
        value,
        index,
        angle,
        x: 0.5 + Math.cos(angle) * 0.42,
        y: 0.5 + Math.sin(angle) * 0.42,
      };
    });

    return {
      form: "circle",
      rows: 1,
      columns: size,
      cells,
      minimumValue,
      maximumValue,
    };
  }

  if (type === "grid" || type === "raster") {
    const columns =
      parameters.columns
      && parameters.columns > 0
        ? parameters.columns
        : Math.ceil(Math.sqrt(size));
    const rows =
      parameters.rows
      && parameters.rows > 0
        ? parameters.rows
        : Math.ceil(size / columns);

    const cells: LayoutDisplayCell[] = values.map((value, index) => ({
      value,
      index,
      row: Math.floor(index / columns),
      column: index % columns,
    }));

    return {
      form: "grid",
      rows,
      columns,
      cells,
      minimumValue,
      maximumValue,
    };
  }

  return {
    form: "unsupported",
    rows: 0,
    columns: 0,
    cells: [],
    minimumValue,
    maximumValue,
  };
}
