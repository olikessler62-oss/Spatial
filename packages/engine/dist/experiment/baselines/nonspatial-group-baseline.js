import { hashSeed } from "../../layout/value-mapping.js";
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
function pickUniqueNumbers(pool, count, random) {
    const indices = pool.map((_, index) => index);
    for (let index = indices.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        const current = indices[index];
        indices[index] = indices[swapIndex];
        indices[swapIndex] = current;
    }
    return indices.slice(0, count).map((index) => pool[index]);
}
/**
 * Non-spatial control: random number groups of the same sizes as pattern
 * selections, without using layout geometry.
 */
export function runNonSpatialGroupBaseline(options) {
    const { draws, testStartIndex, topK, groupSize, numberPool, seeds, } = options;
    const testEndIndex = options.testEndIndex ?? draws.length;
    const minHits = options.minHits ?? 1;
    if (groupSize < 1 || groupSize > numberPool.length) {
        throw new Error("groupSize must be between 1 and the number pool size.");
    }
    if (topK < 1) {
        throw new Error("topK must be at least 1.");
    }
    if (minHits < 1) {
        throw new Error("minHits must be at least 1.");
    }
    const hitRates = [];
    for (const seed of seeds) {
        const random = createRandom(seed);
        let hits = 0;
        let tests = 0;
        for (let drawIndex = testStartIndex; drawIndex < testEndIndex && drawIndex < draws.length; drawIndex += 1) {
            const drawn = new Set(draws[drawIndex].mainNumbers);
            let anyHit = false;
            for (let group = 0; group < topK; group += 1) {
                const values = pickUniqueNumbers(numberPool, groupSize, random);
                const overlap = values.reduce((count, value) => count + (drawn.has(value) ? 1 : 0), 0);
                if (overlap >= minHits) {
                    anyHit = true;
                    break;
                }
            }
            if (anyHit) {
                hits += 1;
            }
            tests += 1;
        }
        hitRates.push(tests === 0 ? 0 : hits / tests);
    }
    return summarizeRates(hitRates);
}
//# sourceMappingURL=nonspatial-group-baseline.js.map