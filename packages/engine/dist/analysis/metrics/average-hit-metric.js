export class AverageHitMetric {
    name = "average-hits";
    calculate(experiment) {
        const total = experiment.results.reduce((sum, result) => sum + result.hitCount, 0);
        return {
            name: this.name,
            averageHits: experiment.results.length === 0
                ? 0
                : total / experiment.results.length,
        };
    }
}
//# sourceMappingURL=average-hit-metric.js.map