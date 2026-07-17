export class MetricEngine {
    metrics;
    constructor(metrics) {
        this.metrics = metrics;
    }
    calculate(experiment) {
        return this.metrics.map((metric) => metric.calculate(experiment));
    }
}
//# sourceMappingURL=metric-engine.js.map