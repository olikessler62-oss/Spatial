import type { ShapeAnalysisCard } from "./domain/analysis-card.js";
import { validateShapeAnalysisCard } from "./validation/validate-shape-analysis-cards.js";
import { ShapeAnalysisError } from "./shape-analysis-error.js";

export type HitMatrix = readonly (readonly boolean[])[];

/**
 * Converts a validated card into a row-major hit matrix.
 * cell.value is intentionally ignored.
 */
export function buildHitMatrix(card: ShapeAnalysisCard): HitMatrix {
  validateShapeAnalysisCard(card);

  const matrix: boolean[][] = Array.from(
    { length: card.rowCount },
    () => Array.from({ length: card.columnCount }, () => false),
  );

  for (const cell of card.cells) {
    const row = matrix[cell.row];

    if (row === undefined) {
      continue;
    }

    row[cell.column] = cell.isHit;
  }

  return matrix;
}

/**
 * Cell is a hit if it was hit on **any** card — free only if free on every card.
 */
export function buildIntersectionHitMatrix(
  cards: readonly ShapeAnalysisCard[],
): HitMatrix {
  if (cards.length === 0) {
    throw new ShapeAnalysisError(
      "EMPTY_CARD_SET",
      "Intersection hit matrix requires at least one card.",
    );
  }

  const matrices = cards.map((card) => buildHitMatrix(card));
  const rowCount = matrices[0]!.length;
  const columnCount = matrices[0]![0]?.length ?? 0;

  for (const matrix of matrices) {
    if (
      matrix.length !== rowCount
      || (matrix[0]?.length ?? 0) !== columnCount
    ) {
      throw new ShapeAnalysisError(
        "INCONSISTENT_GRID_LAYOUT",
        "Intersection requires identical grid dimensions on every card.",
      );
    }
  }

  return Array.from({ length: rowCount }, (_, row) =>
    Array.from({ length: columnCount }, (_, column) =>
      matrices.some((matrix) => matrix[row]?.[column] === true),
    ),
  );
}

/**
 * Geometrically equivalent cards share the same hit matrix
 * regardless of lottery number placement.
 */
export function hitMatricesEqual(
  a: HitMatrix,
  b: HitMatrix,
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let row = 0; row < a.length; row += 1) {
    const rowA = a[row];
    const rowB = b[row];

    if (rowA === undefined || rowB === undefined) {
      return false;
    }

    if (rowA.length !== rowB.length) {
      return false;
    }

    for (let column = 0; column < rowA.length; column += 1) {
      if (rowA[column] !== rowB[column]) {
        return false;
      }
    }
  }

  return true;
}
