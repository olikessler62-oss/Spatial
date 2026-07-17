import type { ExperimentExecutionResult } from "../../domain/experiment.js";
import type { Metric, MetricResult } from "./metric.js";
export interface MaxHitMetricResult extends MetricResult {
    readonly maximumHits: number;
}
export declare class MaxHitMetric implements Metric<MaxHitMetricResult> {
    readonly name = "maximum-hits";
    calculate(experiment: ExperimentExecutionResult): MaxHitMetricResult;
}
//# sourceMappingURL=max-hit-metric.d.ts.map