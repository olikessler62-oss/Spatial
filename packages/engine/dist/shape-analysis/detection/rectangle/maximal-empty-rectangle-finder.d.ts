import type { RectangleGeometry } from "../../domain/geometry.js";
import type { HitPrefixSum } from "./hit-prefix-sum.js";
import { rectangleCellCount } from "./rectangle-geometry.js";
/**
 * True when the rectangle cannot expand in any direction within searchArea
 * without including a hit or leaving the search area.
 */
export declare function isMaximalEmptyRectangle(geometry: RectangleGeometry, searchArea: RectangleGeometry, prefixSum: HitPrefixSum): boolean;
export declare class MaximalEmptyRectangleFinder {
    find(prefixSum: HitPrefixSum, searchArea: RectangleGeometry, minimumCellCount: number): readonly RectangleGeometry[];
}
export declare function fullGridSearchArea(rowCount: number, columnCount: number): RectangleGeometry;
export { rectangleCellCount };
//# sourceMappingURL=maximal-empty-rectangle-finder.d.ts.map