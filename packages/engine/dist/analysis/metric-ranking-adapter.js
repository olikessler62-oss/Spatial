export function createMetricRankingAdapter(metric, extractRankingValue) {
    return {
        metric,
        extractRankingValue(result) {
            return extractRankingValue(result);
        },
    };
}
//# sourceMappingURL=metric-ranking-adapter.js.map