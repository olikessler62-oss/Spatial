import { ExperimentRunner } from "../experiment/experiment-runner.js";
export class ExperimentBenchmark {
    runner;
    constructor(runner = new ExperimentRunner()) {
        this.runner = runner;
    }
    run(input) {
        const warmupRuns = input.warmupRuns ?? 2;
        const measuredRuns = input.measuredRuns ?? 5;
        for (let index = 0; index < warmupRuns; index += 1) {
            this.execute(input);
        }
        const durations = [];
        for (let index = 0; index < measuredRuns; index += 1) {
            const startedAt = performance.now();
            this.execute(input);
            durations.push(performance.now() - startedAt);
        }
        const comparisons = input.draws.length * input.placements.length;
        const averageDurationMs = durations.reduce((sum, duration) => sum + duration, 0)
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
            comparisonsPerSecond: averageDurationMs === 0
                ? 0
                : comparisons / (averageDurationMs / 1000),
        };
    }
    execute(input) {
        return this.runner.run({
            experimentId: `benchmark-${input.name}`,
            placements: input.placements,
            draws: input.draws,
        });
    }
}
//# sourceMappingURL=experiment-benchmark.js.map