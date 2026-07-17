import type {
  ExperimentExecutionResult,
} from "../../domain/experiment.js";
import type {
  Metric,
  MetricResult,
} from "./metric.js";

export interface AverageHitMetricResult
  extends MetricResult {
  readonly averageHits: number;
}

export class AverageHitMetric
  implements Metric<AverageHitMetricResult>
{
  public readonly name = "average-hits";

  public calculate(
    experiment: ExperimentExecutionResult,
  ): AverageHitMetricResult {
    const total =
      experiment.results.reduce(
        (sum, result) => sum + result.hitCount,
        0,
      );

    return {
      name: this.name,
      averageHits:
        experiment.results.length === 0
          ? 0
          : total / experiment.results.length,
    };
  }
}