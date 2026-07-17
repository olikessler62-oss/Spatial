export class MaxHitMetric {
    name = "maximum-hits";
    calculate(experiment) {
        return {
            name: this.name,
            maximumHits: experiment.results.reduce((max, result) => Math.max(max, result.hitCount), 0),
        };
    }
}
//# sourceMappingURL=max-hit-metric.js.map