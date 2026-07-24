/**
 * Simple linear regression slope of `values` against 0..n-1 indices.
 * Uses the last `maxCount` samples when longer.
 */
export function computeMetricTrend(values, maxCount, stableSlopeThreshold) {
    const finite = values
        .filter((value) => typeof value === "number" && Number.isFinite(value))
        .slice(-Math.max(1, maxCount));
    if (finite.length < 2) {
        return {
            direction: "stable",
            slope: 0,
            comparedWindowCount: finite.length,
        };
    }
    const n = finite.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let index = 0; index < n; index += 1) {
        const x = index;
        const y = finite[index];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }
    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
    let direction = "stable";
    if (Math.abs(slope) >= stableSlopeThreshold) {
        direction = slope > 0 ? "increasing" : "decreasing";
    }
    return {
        direction,
        slope,
        comparedWindowCount: n,
    };
}
//# sourceMappingURL=window-trend-analyzer.js.map