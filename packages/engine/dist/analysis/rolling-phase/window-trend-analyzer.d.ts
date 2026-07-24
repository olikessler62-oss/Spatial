import type { WindowMetricTrend } from "./types.js";
/**
 * Simple linear regression slope of `values` against 0..n-1 indices.
 * Uses the last `maxCount` samples when longer.
 */
export declare function computeMetricTrend(values: readonly (number | null | undefined)[], maxCount: number, stableSlopeThreshold: number): WindowMetricTrend;
//# sourceMappingURL=window-trend-analyzer.d.ts.map