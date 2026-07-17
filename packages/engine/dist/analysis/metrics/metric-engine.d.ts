import type { ExperimentExecutionResult } from "../../domain/experiment.js";
import type { Metric, MetricResult } from "./metric.js";
export declare class MetricEngine {
    private readonly metrics;
    constructor(metrics: readonly Metric[]);
    calculate(experiment: ExperimentExecutionResult): readonly MetricResult[];
}
//# sourceMappingURL=metric-engine.d.ts.map