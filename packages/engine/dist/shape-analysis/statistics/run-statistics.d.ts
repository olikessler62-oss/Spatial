import type { HistoricalPercentileBreakdown, HistoricalRunDataQuality, RunLengthFrequencyEntry, RunLengthMode, RunLengthQuantiles, RunLengthSurvivalEntry, ShapeRun } from "./shape-run.js";
export declare function buildFrequencyDistribution(completedRuns: readonly ShapeRun[]): readonly RunLengthFrequencyEntry[];
export declare function buildSurvivalDistribution(completedRuns: readonly ShapeRun[]): readonly RunLengthSurvivalEntry[];
export declare function computeRunLengthMode(completedRuns: readonly ShapeRun[]): RunLengthMode | null;
export declare function computeAverageRunLength(completedRuns: readonly ShapeRun[]): number | null;
export declare function computeMedianRunLength(completedRuns: readonly ShapeRun[]): number | null;
/**
 * Nearest-rank percentile on sorted ascending values.
 * rank = ceil(p/100 * n), 1-based.
 */
export declare function nearestRankPercentile(sortedAscending: readonly number[], percentile: number): number | null;
export declare function computeRunLengthQuantiles(completedRuns: readonly ShapeRun[]): RunLengthQuantiles;
export declare function evaluateHistoricalDataQuality(options: {
    readonly completedRunCount: number;
    readonly minimumRequiredRunCount: number;
    readonly hasLeftCensoredRun: boolean;
    readonly hasRightCensoredRun: boolean;
}): HistoricalRunDataQuality;
/**
 * percentageShorterThan: share of completed runs with length < current
 * percentageAtMost: share of completed runs with length <= current
 */
export declare function calculateHistoricalRunPercentile(currentRunLength: number, completedRuns: readonly ShapeRun[]): HistoricalPercentileBreakdown | null;
//# sourceMappingURL=run-statistics.d.ts.map