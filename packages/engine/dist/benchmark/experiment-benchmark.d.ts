import { ExperimentRunner } from "../experiment/experiment-runner.js";
import type { IndexedDraw } from "../indexing/draw-indexer.js";
import type { IndexedPlacement } from "../indexing/placement-indexer.js";
export interface ExperimentBenchmarkInput {
    readonly name: string;
    readonly placements: readonly IndexedPlacement[];
    readonly draws: readonly IndexedDraw[];
    readonly warmupRuns?: number;
    readonly measuredRuns?: number;
}
export interface ExperimentBenchmarkResult {
    readonly name: string;
    readonly drawCount: number;
    readonly placementCount: number;
    readonly comparisons: number;
    readonly measuredRuns: number;
    readonly minimumDurationMs: number;
    readonly maximumDurationMs: number;
    readonly averageDurationMs: number;
    readonly comparisonsPerSecond: number;
}
export declare class ExperimentBenchmark {
    private readonly runner;
    constructor(runner?: ExperimentRunner);
    run(input: ExperimentBenchmarkInput): ExperimentBenchmarkResult;
    private execute;
}
//# sourceMappingURL=experiment-benchmark.d.ts.map