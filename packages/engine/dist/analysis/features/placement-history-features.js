function countHits(sequence, window) {
    if (sequence.length === 0 || window <= 0) {
        return 0;
    }
    const start = Math.max(0, sequence.length - window);
    let hits = 0;
    for (let index = start; index < sequence.length; index += 1) {
        if (sequence[index]) {
            hits += 1;
        }
    }
    return hits;
}
function finiteOrZero(value) {
    return Number.isFinite(value) ? value : 0;
}
/**
 * Features from a chronological hit sequence for draws strictly before the test draw.
 * `true` means the placement had at least one number hit in that draw.
 */
export function computePlacementHistoryFeatures(hitSequence) {
    const historyLength = hitSequence.length;
    if (historyLength === 0) {
        return {
            drawsSinceLastHit: 0,
            averageHistoricalGap: 0,
            maximumHistoricalGap: 0,
            hitFrequency: 0,
            hitsLast10: 0,
            hitsLast25: 0,
            hitsLast50: 0,
            currentGapRatio: 0,
            recentInactivity: 1,
        };
    }
    const hitIndices = [];
    for (let index = 0; index < historyLength; index += 1) {
        if (hitSequence[index]) {
            hitIndices.push(index);
        }
    }
    const hitCount = hitIndices.length;
    const hitFrequency = hitCount / historyLength;
    let drawsSinceLastHit;
    let averageHistoricalGap;
    let maximumHistoricalGap;
    let currentGapRatio;
    if (hitCount === 0) {
        drawsSinceLastHit = historyLength;
        averageHistoricalGap = historyLength;
        maximumHistoricalGap = historyLength;
        currentGapRatio = 1;
    }
    else {
        const lastHitIndex = hitIndices[hitCount - 1];
        drawsSinceLastHit = historyLength - 1 - lastHitIndex;
        const gaps = [];
        gaps.push(hitIndices[0] + 1);
        for (let index = 1; index < hitIndices.length; index += 1) {
            gaps.push(hitIndices[index] - hitIndices[index - 1]);
        }
        gaps.push(drawsSinceLastHit);
        const gapSum = gaps.reduce((sum, gap) => sum + gap, 0);
        averageHistoricalGap = gapSum / gaps.length;
        maximumHistoricalGap = Math.max(...gaps);
        currentGapRatio =
            averageHistoricalGap > 0
                ? drawsSinceLastHit / averageHistoricalGap
                : 0;
    }
    const hitsLast10 = countHits(hitSequence, 10);
    const hitsLast25 = countHits(hitSequence, 25);
    const hitsLast50 = countHits(hitSequence, 50);
    const recentWindow = Math.min(50, historyLength);
    const recentHitRate = recentWindow === 0 ? 0 : countHits(hitSequence, recentWindow) / recentWindow;
    return {
        drawsSinceLastHit,
        averageHistoricalGap: finiteOrZero(averageHistoricalGap),
        maximumHistoricalGap: finiteOrZero(maximumHistoricalGap),
        hitFrequency: finiteOrZero(hitFrequency),
        hitsLast10,
        hitsLast25,
        hitsLast50,
        currentGapRatio: finiteOrZero(currentGapRatio),
        recentInactivity: finiteOrZero(1 - recentHitRate),
    };
}
export function featuresToMetricValues(features) {
    return {
        "gap-ratio": features.currentGapRatio,
        "recent-inactivity": features.recentInactivity,
        "historical-frequency": features.hitFrequency,
    };
}
/** Experiment1 default ranking weights. */
export const EXPERIMENT1_RANKING_CRITERIA = [
    { metricId: "gap-ratio", weight: 0.5, direction: "descending" },
    { metricId: "recent-inactivity", weight: 0.3, direction: "descending" },
    { metricId: "historical-frequency", weight: 0.2, direction: "descending" },
];
//# sourceMappingURL=placement-history-features.js.map