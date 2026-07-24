import type { RunLengthSurvivalEntry } from "../statistics/shape-run.js";
import type { AverageComparison, MaximumComparison, MedianComparison, ModeComparison } from "./shape-overdue-types.js";
export declare function findProbabilityAtLeast(runLength: number, survivalDistribution: readonly RunLengthSurvivalEntry[]): number | null;
export declare function compareAgainstModes(currentRunLength: number, modeRunLengths: readonly number[], modeFrequency: number): ModeComparison;
export declare function compareAgainstMedian(currentRunLength: number, medianRunLength: number): MedianComparison;
export declare function compareAgainstAverage(currentRunLength: number, averageRunLength: number): AverageComparison;
export declare function compareAgainstMaximum(currentRunLength: number, maximumRunLength: number): MaximumComparison;
//# sourceMappingURL=shape-run-comparison.d.ts.map