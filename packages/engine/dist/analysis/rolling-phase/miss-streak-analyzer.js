/**
 * Analyzes miss streaks for a boolean hit series over [windowStart, windowEnd].
 *
 * Central statistics use fensterinterne (View A) lengths.
 * Boundary streaks carry optional fullHistoricalLength (View B metadata).
 */
export function analyzeWindowMissStreaks(hits, windowStartIndex, windowEndIndex, includeBoundaryCensoredStreaksInStatistics) {
    if (hits.length === 0
        || windowStartIndex < 0
        || windowEndIndex < windowStartIndex
        || windowEndIndex >= hits.length) {
        return {
            completedMissStreaks: [],
            boundaryStreaks: [],
            trailingMissStreak: 0,
            statisticsSample: [],
            hitGaps: [],
        };
    }
    const completedMissStreaks = [];
    const boundaryStreaks = [];
    const hitGaps = [];
    let index = windowStartIndex;
    let pendingMisses = 0;
    let pendingStartedAt = windowStartIndex;
    let lastHitIndexInside = null;
    const flushCompleted = (length) => {
        if (length > 0) {
            completedMissStreaks.push(length);
        }
    };
    const fullHistoricalLengthAround = (observedStart, observedEnd) => {
        let left = observedStart;
        while (left > 0 && hits[left - 1] === false) {
            left -= 1;
        }
        let right = observedEnd;
        while (right < hits.length - 1 && hits[right + 1] === false) {
            right += 1;
        }
        return right - left + 1;
    };
    while (index <= windowEndIndex) {
        if (hits[index] === true) {
            if (pendingMisses > 0) {
                const startedBeforeWindow = pendingStartedAt === windowStartIndex
                    && windowStartIndex > 0
                    && hits[windowStartIndex - 1] === false;
                if (startedBeforeWindow) {
                    const observedEnd = index - 1;
                    boundaryStreaks.push({
                        observedLengthInsideWindow: pendingMisses,
                        fullHistoricalLength: fullHistoricalLengthAround(pendingStartedAt, observedEnd),
                        startedBeforeWindow: true,
                        continuesAfterWindow: false,
                    });
                }
                else {
                    flushCompleted(pendingMisses);
                }
                if (lastHitIndexInside !== null) {
                    hitGaps.push(pendingMisses);
                }
            }
            lastHitIndexInside = index;
            pendingMisses = 0;
            index += 1;
            continue;
        }
        if (pendingMisses === 0) {
            pendingStartedAt = index;
        }
        pendingMisses += 1;
        index += 1;
    }
    let trailingMissStreak = 0;
    if (pendingMisses > 0) {
        trailingMissStreak = pendingMisses;
        const startedBeforeWindow = pendingStartedAt === windowStartIndex
            && windowStartIndex > 0
            && hits[windowStartIndex - 1] === false;
        const continuesAfterWindow = windowEndIndex < hits.length - 1
            && hits[windowEndIndex + 1] === false;
        boundaryStreaks.push({
            observedLengthInsideWindow: pendingMisses,
            fullHistoricalLength: fullHistoricalLengthAround(pendingStartedAt, windowEndIndex),
            startedBeforeWindow,
            continuesAfterWindow,
        });
    }
    const censoredLengths = boundaryStreaks.map((streak) => streak.observedLengthInsideWindow);
    const statisticsSample = includeBoundaryCensoredStreaksInStatistics
        ? [...completedMissStreaks, ...censoredLengths]
        : [...completedMissStreaks];
    return {
        completedMissStreaks,
        boundaryStreaks,
        trailingMissStreak,
        statisticsSample,
        hitGaps,
    };
}
/** Global completed miss streaks + trailing open streak over the full series. */
export function analyzeGlobalMissStreaks(hits) {
    const completedMissStreaks = [];
    let pending = 0;
    let seenHit = false;
    for (let index = 0; index < hits.length; index += 1) {
        if (hits[index] === true) {
            if (seenHit && pending > 0) {
                completedMissStreaks.push(pending);
            }
            // Leading misses before first hit are left-censored globally — omitted from completed.
            pending = 0;
            seenHit = true;
            continue;
        }
        pending += 1;
    }
    return {
        completedMissStreaks,
        trailingMissStreak: pending,
    };
}
//# sourceMappingURL=miss-streak-analyzer.js.map