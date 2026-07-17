import type { ExperimentExecutionResult } from "../../domain/experiment.js";
import type { Metric, MetricResult } from "./metric.js";
export interface AverageHitMetricResult extends MetricResult {
    readonly averageHits: number;
}
export declare class AverageHitMetric implements Metric<AverageHitMetricResult> {
    readonly name = "average-hits";
    calculate(experiment: ExperimentExecutionResult): AverageHitMetricResult;
}
//# sourceMappingURL=average-hit-metric.d.ts.map