import type {
  ExperimentExecutionResult,
} from "../../domain/experiment.js";
import type {
  Metric,
  MetricResult,
} from "./metric.js";

export interface HitDistributionResult
  extends MetricResult {
  readonly distribution: ReadonlyMap<
    number,
    number
  >;
}

export class HitDistributionMetric
  implements Metric<HitDistributionResult>
{
  public readonly name = "hit-distribution";

  public calculate(
    experiment: ExperimentExecutionResult,
  ): HitDistributionResult {
    const distribution =
      new Map<number, number>();

    for (const result of experiment.results) {
      distribution.set(
        result.hitCount,
        (distribution.get(result.hitCount) ?? 0) + 1,
      );
    }

    return {
      name: this.name,
      distribution,
    };
  }
}