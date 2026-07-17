import type { ExperimentExecutionResult } from "../../domain/experiment.js";
export interface MetricResult {
    readonly name: string;
}
export interface Metric<TResult extends MetricResult = MetricResult> {
    readonly name: string;
    calculate(experiment: ExperimentExecutionResult): TResult;
}
//# sourceMappingURL=metric.d.ts.map