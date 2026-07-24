import type { ExperimentExecutionResult } from "../domain/experiment.js";
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

export class ExperimentBenchmark {
  public constructor(
    private readonly runner = new ExperimentRunner(),
  ) {}

  public run(
    input: ExperimentBenchmarkInput,
  ): ExperimentBenchmarkResult {
    const warmupRuns = input.warmupRuns ?? 2;
    const measuredRuns = input.measuredRuns ?? 5;

    for (let index = 0; index < warmupRuns; index += 1) {
      this.execute(input);
    }

    const durations: number[] = [];

    for (let index = 0; index < measuredRuns; index += 1) {
      const startedAt = performance.now();
      this.execute(input);
      durations.push(performance.now() - startedAt);
    }

    const comparisons =
      input.draws.length * input.placements.length;

    const averageDurationMs =
      durations.reduce((sum, duration) => sum + duration, 0)
      / durations.length;

    return {
      name: input.name,
      drawCount: input.draws.length,
      placementCount: input.placements.length,
      comparisons,
      measuredRuns,
      minimumDurationMs: Math.min(...durations),
      maximumDurationMs: Math.max(...durations),
      averageDurationMs,
      comparisonsPerSecond:
        averageDurationMs === 0
          ? 0
          : comparisons / (averageDurationMs / 1000),
    };
  }

  private execute(
    input: ExperimentBenchmarkInput,
  ): ExperimentExecutionResult {
    return this.runner.run({
      experimentId: `benchmark-${input.name}`,
      placements: input.placements,
      draws: input.draws,
    });
  }
}