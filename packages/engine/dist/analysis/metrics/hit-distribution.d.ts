import type { ExperimentExecutionResult } from "../../domain/experiment.js";
import type { Metric, MetricResult } from "./metric.js";
export interface HitDistributionResult extends MetricResult {
    readonly distribution: ReadonlyMap<number, number>;
}
export declare class HitDistributionMetric implements Metric<HitDistributionResult> {
    readonly name = "hit-distribution";
    calculate(experiment: ExperimentExecutionResult): HitDistributionResult;
}
//# sourceMappingURL=hit-distribution.d.ts.map