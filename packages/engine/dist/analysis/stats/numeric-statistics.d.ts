/**
 * Shared numeric statistics on plain number arrays.
 * Prefer these over ShapeRun-specific wrappers when analyzing miss streaks.
 */
import { nearestRankPercentile } from "../../shape-analysis/statistics/run-statistics.js";
export declare function sortAscending(values: readonly number[]): number[];
export declare function computeArithmeticMean(values: readonly number[]): number | null;
export declare function computeMedian(values: readonly number[]): number | null;
/**
 * All modes (most frequent values). Empty when input is empty.
 * Multimodal: every value tied for highest frequency, ascending.
 */
export declare function computeMode(values: readonly number[]): readonly number[];
/**
 * Trim `trimFraction` (e.g. 0.1) from each tail, then mean of the remainder.
 * When too few samples remain, returns null.
 */
export declare function computeTrimmedMean(values: readonly number[], trimFraction: number): number | null;
export declare function computePercentile(values: readonly number[], percentile: number): number | null;
export declare function computeMinimum(values: readonly number[]): number | null;
export declare function computeMaximum(values: readonly number[]): number | null;
export { nearestRankPercentile, };
//# sourceMappingURL=numeric-statistics.d.ts.map