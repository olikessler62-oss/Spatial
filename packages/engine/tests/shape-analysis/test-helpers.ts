import type {
  ShapeAnalysisCard,
  ShapeAnalysisCell,
} from "../../src/shape-analysis/domain/analysis-card.js";

export interface CreateCardOptions {
  readonly id: string;
  readonly chronologicalIndex: number;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly hitPositions?: readonly {
    readonly row: number;
    readonly column: number;
  }[];
  readonly drawDate?: Date;
  /**
   * Optional value layout. When omitted, values are 1..N in row-major order.
   */
  readonly values?: readonly number[];
}

export function createFilledCard(
  options: CreateCardOptions,
): ShapeAnalysisCard {
  const hitSet = new Set(
    (options.hitPositions ?? []).map(
      (position) => `${position.row}:${position.column}`,
    ),
  );

  const cellCount = options.rowCount * options.columnCount;
  const values =
    options.values ??
    Array.from({ length: cellCount }, (_, index) => index + 1);

  const cells: ShapeAnalysisCell[] = [];

  for (let row = 0; row < options.rowCount; row += 1) {
    for (let column = 0; column < options.columnCount; column += 1) {
      const index = row * options.columnCount + column;
      const value = values[index];
      const isHit = hitSet.has(`${row}:${column}`);

      if (value === undefined) {
        cells.push({ row, column, isHit });
      } else {
        cells.push({ row, column, isHit, value });
      }
    }
  }

  return {
    id: options.id,
    drawDate: options.drawDate ?? new Date("2024-01-01T00:00:00.000Z"),
    chronologicalIndex: options.chronologicalIndex,
    rowCount: options.rowCount,
    columnCount: options.columnCount,
    cells,
  };
}

export function shuffleValues(values: readonly number[]): number[] {
  const copy = [...values];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = (i * 7 + 3) % (i + 1);
    const current = copy[i];
    const swap = copy[j];

    if (current === undefined || swap === undefined) {
      continue;
    }

    copy[i] = swap;
    copy[j] = current;
  }

  return copy;
}

/**
 * Build hit positions from a row-major boolean grid (true = hit).
 */
export function hitPositionsFromGrid(
  grid: readonly (readonly boolean[])[],
): { row: number; column: number }[] {
  const hits: { row: number; column: number }[] = [];

  for (let row = 0; row < grid.length; row += 1) {
    const gridRow = grid[row];

    if (gridRow === undefined) {
      continue;
    }

    for (let column = 0; column < gridRow.length; column += 1) {
      if (gridRow[column] === true) {
        hits.push({ row, column });
      }
    }
  }

  return hits;
}

export function createDetectionContext(
  card: ShapeAnalysisCard,
  minimumShapeCellCount = 4,
) {
  return {
    rowCount: card.rowCount,
    columnCount: card.columnCount,
    minimumShapeCellCount,
  };
}
