import type { RectangleGeometry } from "../domain/geometry.js";
import type { CurrentShapePersistenceRequest, ShapePersistenceDependencies } from "./current-shape-persistence-request.js";
import type { CurrentShapePersistenceResult } from "./current-shape-persistence-result.js";
/** Minimum consecutive free cards (from newest) for a rectangle to be reported. */
export declare const BASIS_CARD_COUNT = 3;
/**
 * Rectangle persistence by backward free-streak length.
 *
 * 1. For each lookback L = {@link BASIS_CARD_COUNT} … window length, take the
 *    free-cell intersection of the newest L cards and collect maximal empty
 *    rectangles (≥ minimum cell count). Overlapping maximals are kept.
 * 2. For each unique geometry, measure how far left from newest it stays free.
 * 3. Keep only streaks of length ≥ {@link BASIS_CARD_COUNT} (or the full window
 *    when fewer than three cards are available).
 *
 * Nested blocks are independent: a 4-cell block inside a 6-cell block can have
 * a longer streak than its parent without any split/child logic.
 */
export declare class CurrentShapePersistenceEngine {
    private readonly dependencies;
    private readonly maximalFinder;
    constructor(dependencies: ShapePersistenceDependencies);
    analyze(request: CurrentShapePersistenceRequest): CurrentShapePersistenceResult;
    private measureStreak;
    private isGeometryEmpty;
    private throwIfAborted;
}
/** All axis-aligned sub-rectangles of `outer` with at least `minimumCellCount` cells. */
export declare function enumerateSubRectangles(outer: RectangleGeometry, minimumCellCount: number): RectangleGeometry[];
//# sourceMappingURL=current-shape-persistence-engine.d.ts.map