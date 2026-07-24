import { hashSeed } from "../../layout/value-mapping.js";
import { HitEvaluator } from "../hit-evaluator.js";
function createRandom(seed) {
    let state = hashSeed(seed);
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}
function percentile(sorted, p) {
    if (sorted.length === 0) {
        return 0;
    }
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[index];
}
function summarizeRates(hitRates) {
    const sorted = [...hitRates].sort((left, right) => left - right);
    const mean = hitRates.reduce((sum, rate) => sum + rate, 0) / Math.max(hitRates.length, 1);
    const variance = hitRates.reduce((sum, rate) => sum + (rate - mean) ** 2, 0)
        / Math.max(hitRates.length, 1);
    return {
        repetitions: hitRates.length,
        meanHitRate: mean,
        stdDevHitRate: Math.sqrt(variance),
        minHitRate: sorted[0] ?? 0,
        maxHitRate: sorted[sorted.length - 1] ?? 0,
        percentile5: percentile(sorted, 5),
        percentile50: percentile(sorted, 50),
        percentile95: percentile(sorted, 95),
        hitRates: sorted,
    };
}
/**
 * For each test draw, pick `topK` random placements (same pool as pattern method)
 * and measure hit rate (default: at least one hit). Repeats with many seeds.
 */
export function runRandomPlacementBaseline(options) {
    const { placements, draws, testStartIndex, topK, seeds, } = options;
    const testEndIndex = options.testEndIndex ?? draws.length;
    const minHits = options.minHits ?? 1;
    if (placements.length === 0) {
        throw new Error("Baseline requires at least one placement.");
    }
    if (topK < 1 || topK > placements.length) {
        throw new Error("topK must be between 1 and the placement count.");
    }
    if (minHits < 1) {
        throw new Error("minHits must be at least 1.");
    }
    const evaluator = new HitEvaluator();
    const hitRates = [];
    for (const seed of seeds) {
        const random = createRandom(seed);
        let hits = 0;
        let tests = 0;
        for (let drawIndex = testStartIndex; drawIndex < testEndIndex && drawIndex < draws.length; drawIndex += 1) {
            const draw = draws[drawIndex];
            const chosen = pickRandomPlacements(placements, topK, random);
            const anyHit = chosen.some((placement) => evaluator.evaluate(placement, draw).hitCount >= minHits);
            if (anyHit) {
                hits += 1;
            }
            tests += 1;
        }
        hitRates.push(tests === 0 ? 0 : hits / tests);
    }
    return summarizeRates(hitRates);
}
function pickRandomPlacements(placements, topK, random) {
    const indices = placements.map((_, index) => index);
    for (let index = indices.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        const current = indices[index];
        indices[index] = indices[swapIndex];
        indices[swapIndex] = current;
    }
    return indices.slice(0, topK).map((index) => placements[index]);
}
/**
 * Empirical p-value: share of baseline rates >= observed rate (one-sided).
 */
export function empiricalPValue(observedHitRate, baseline) {
    if (baseline.hitRates.length === 0) {
        return 1;
    }
    const asExtreme = baseline.hitRates.filter((rate) => rate >= observedHitRate).length;
    return (asExtreme + 1) / (baseline.hitRates.length + 1);
}
//# sourceMappingURL=random-placement-baseline.js.map