import type { Metric, MetricResult } from "./metrics/metric.js";
export interface MetricRankingAdapter {
    readonly metric: Metric;
    extractRankingValue(result: MetricResult): number;
}
export declare function createMetricRankingAdapter<TResult extends MetricResult>(metric: Metric<TResult>, extractRankingValue: (result: TResult) => number): MetricRankingAdapter;
//# sourceMappingURL=metric-ranking-adapter.d.ts.map