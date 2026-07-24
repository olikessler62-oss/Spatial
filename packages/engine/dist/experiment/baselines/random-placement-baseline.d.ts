import type { IndexedDraw } from "../../indexing/draw-indexer.js";
import type { IndexedPlacement } from "../../indexing/placement-indexer.js";
export interface BaselineDistributionSummary {
    readonly repetitions: number;
    readonly meanHitRate: number;
    readonly stdDevHitRate: number;
    readonly minHitRate: number;
    readonly maxHitRate: number;
    readonly percentile5: number;
    readonly percentile50: number;
    readonly percentile95: number;
    readonly hitRates: readonly number[];
}
/**
 * For each test draw, pick `topK` random placements (same pool as pattern method)
 * and measure hit rate (default: at least one hit). Repeats with many seeds.
 */
export declare function runRandomPlacementBaseline(options: {
    readonly placements: readonly IndexedPlacement[];
    readonly draws: readonly IndexedDraw[];
    readonly testStartIndex: number;
    readonly testEndIndex?: number;
    readonly topK: number;
    /** Minimum hitCount to count as success (1 = any hit, 2 = at least two). */
    readonly minHits?: number;
    readonly seeds: readonly (string | number)[];
}): BaselineDistributionSummary;
/**
 * Empirical p-value: share of baseline rates >= observed rate (one-sided).
 */
export declare function empiricalPValue(observedHitRate: number, baseline: BaselineDistributionSummary): number;
//# sourceMappingURL=random-placement-baseline.d.ts.map