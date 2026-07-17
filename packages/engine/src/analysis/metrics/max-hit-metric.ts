import type {
  ExperimentExecutionResult,
} from "../../domain/experiment.js";
import type {
  Metric,
  MetricResult,
} from "./metric.js";

export interface MaxHitMetricResult
  extends MetricResult {
  readonly maximumHits: number;
}

export class MaxHitMetric
  implements Metric<MaxHitMetricResult>
{
  public readonly name = "maximum-hits";

  public calculate(
    experiment: ExperimentExecutionResult,
  ): MaxHitMetricResult {
    return {
      name: this.name,
      maximumHits:
        experiment.results.reduce(
          (max, result) =>
            Math.max(max, result.hitCount),
          0,
        ),
    };
  }
}