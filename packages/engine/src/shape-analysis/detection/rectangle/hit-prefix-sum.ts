import type { HitMatrix } from "../../hit-matrix.js";
import type { RectangleGeometry } from "../../domain/geometry.js";

/**
 * 1-indexed prefix sums: prefix[r+1][c+1] = hit count in [0..r] × [0..c].
 */
export type HitPrefixSum = readonly (readonly number[])[];

export function buildHitPrefixSum(hitMatrix: HitMatrix): HitPrefixSum {
  const rowCount = hitMatrix.length;
  const columnCount = hitMatrix[0]?.length ?? 0;

  const prefix: number[][] = Array.from(
    { length: rowCount + 1 },
    () => Array.from({ length: columnCount + 1 }, () => 0),
  );

  for (let row = 0; row < rowCount; row += 1) {
    const hitRow = hitMatrix[row];
    const prefixRow = prefix[row + 1];
    const previousPrefixRow = prefix[row];

    if (
      hitRow === undefined ||
      prefixRow === undefined ||
      previousPrefixRow === undefined
    ) {
      continue;
    }

    for (let column = 0; column < columnCount; column += 1) {
      const hit = hitRow[column] === true ? 1 : 0;
      const left = prefixRow[column] ?? 0;
      const above = previousPrefixRow[column + 1] ?? 0;
      const diagonal = previousPrefixRow[column] ?? 0;
      prefixRow[column + 1] = hit + left + above - diagonal;
    }
  }

  return prefix;
}

export function countHitsInRectangle(
  prefixSum: HitPrefixSum,
  geometry: RectangleGeometry,
): number {
  const top = geometry.originRow;
  const left = geometry.originColumn;
  const bottom = geometry.originRow + geometry.height - 1;
  const right = geometry.originColumn + geometry.width - 1;

  const bottomRight = prefixSum[bottom + 1]?.[right + 1] ?? 0;
  const topRight = prefixSum[top]?.[right + 1] ?? 0;
  const bottomLeft = prefixSum[bottom + 1]?.[left] ?? 0;
  const topLeft = prefixSum[top]?.[left] ?? 0;

  return bottomRight - topRight - bottomLeft + topLeft;
}

export function isEmptyRectangle(
  prefixSum: HitPrefixSum,
  geometry: RectangleGeometry,
): boolean {
  return countHitsInRectangle(prefixSum, geometry) === 0;
}
