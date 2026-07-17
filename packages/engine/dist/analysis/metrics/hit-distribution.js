export class HitDistributionMetric {
    name = "hit-distribution";
    calculate(experiment) {
        const distribution = new Map();
        for (const result of experiment.results) {
            distribution.set(result.hitCount, (distribution.get(result.hitCount) ?? 0) + 1);
        }
        return {
            name: this.name,
            distribution,
        };
    }
}
//# sourceMappingURL=hit-distribution.js.map