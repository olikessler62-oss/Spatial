import type {
  Metric,
  MetricResult,
} from "./metrics/metric.js";

export interface MetricRankingAdapter {
  readonly metric: Metric;

  extractRankingValue(
    result: MetricResult,
  ): number;
}

export function createMetricRankingAdapter<
  TResult extends MetricResult,
>(
  metric: Metric<TResult>,
  extractRankingValue: (
    result: TResult,
  ) => number,
): MetricRankingAdapter {
  return {
    metric,

    extractRankingValue(
      result: MetricResult,
    ): number {
      return extractRankingValue(
        result as TResult,
      );
    },
  };
}