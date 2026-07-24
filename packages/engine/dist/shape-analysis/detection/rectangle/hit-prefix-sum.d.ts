import type { HitMatrix } from "../../hit-matrix.js";
import type { RectangleGeometry } from "../../domain/geometry.js";
/**
 * 1-indexed prefix sums: prefix[r+1][c+1] = hit count in [0..r] × [0..c].
 */
export type HitPrefixSum = readonly (readonly number[])[];
export declare function buildHitPrefixSum(hitMatrix: HitMatrix): HitPrefixSum;
export declare function countHitsInRectangle(prefixSum: HitPrefixSum, geometry: RectangleGeometry): number;
export declare function isEmptyRectangle(prefixSum: HitPrefixSum, geometry: RectangleGeometry): boolean;
//# sourceMappingURL=hit-prefix-sum.d.ts.map