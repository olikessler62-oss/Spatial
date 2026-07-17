import type {
  ExperimentExecutionResult,
} from "../../domain/experiment.js";
import type {
  Metric,
  MetricResult,
} from "./metric.js";

export class MetricEngine {
  public constructor(
    private readonly metrics:
      readonly Metric[],
  ) {}

  public calculate(
    experiment: ExperimentExecutionResult,
  ): readonly MetricResult[] {
    return this.metrics.map(
      (metric) =>
        metric.calculate(experiment),
    );
  }
}