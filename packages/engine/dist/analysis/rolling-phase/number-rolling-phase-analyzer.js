import { analyzeGlobalMissStreaks, analyzeWindowMissStreaks, } from "./miss-streak-analyzer.js";
import { buildRollingWindows } from "./rolling-window-builder.js";
import { compareWindowToGlobal } from "./window-global-comparison.js";
import { buildMissStreakStatistics } from "./window-statistics.js";
import { computeMetricTrend } from "./window-trend-analyzer.js";
import { classifyNumberPhase } from "./number-phase-classifier.js";
import { classifyCombinedPhase } from "./combined-phase-classifier.js";
import { DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION, } from "./types.js";
function sortDrawsChronologically(draws) {
    return [...draws].sort((a, b) => a.drawDate.localeCompare(b.drawDate));
}
function buildHitSeries(draws, number) {
    return draws.map((draw) => {
        const unique = new Set(draw.mainNumbers);
        return unique.has(number);
    });
}
function buildHitPrefixSum(hits) {
    const prefix = new Array(hits.length + 1);
    prefix[0] = 0;
    for (let index = 0; index < hits.length; index += 1) {
        prefix[index + 1] = prefix[index] + (hits[index] ? 1 : 0);
    }
    return prefix;
}
function hitCountInRange(prefix, startInclusive, endInclusive) {
    return prefix[endInclusive + 1] - prefix[startInclusive];
}
export function buildGlobalNumberStatistics(number, hits) {
    const drawCount = hits.length;
    const hitCount = hits.filter(Boolean).length;
    const missCount = drawCount - hitCount;
    const { completedMissStreaks, trailingMissStreak } = analyzeGlobalMissStreaks(hits);
    const missStreakStatistics = buildMissStreakStatistics(completedMissStreaks);
    return {
        number,
        drawCount,
        hitCount,
        missCount,
        hitRate: drawCount === 0 ? 0 : hitCount / drawCount,
        trailingMissStreak,
        completedMissStreaks,
        missStreakStatistics,
        maximumMissStreak: missStreakStatistics.maximum,
    };
}
export function analyzeNumberWindow(number, hits, hitPrefix, draws, windowStartIndex, windowEndIndex, windowSize, global, includeBoundaryCensoredStreaksInStatistics) {
    const drawCount = windowEndIndex - windowStartIndex + 1;
    const hitCount = hitCountInRange(hitPrefix, windowStartIndex, windowEndIndex);
    const missCount = drawCount - hitCount;
    const hitRate = drawCount === 0 ? 0 : hitCount / drawCount;
    const streakAnalysis = analyzeWindowMissStreaks(hits, windowStartIndex, windowEndIndex, includeBoundaryCensoredStreaksInStatistics);
    const missStreakStatistics = buildMissStreakStatistics(streakAnalysis.statisticsSample);
    const comparisonToGlobal = compareWindowToGlobal(hitRate, missStreakStatistics, global);
    return {
        number,
        windowSize,
        windowStartIndex,
        windowEndIndex,
        ...(draws[windowStartIndex]?.drawDate !== undefined
            ? { windowStartDate: draws[windowStartIndex].drawDate }
            : {}),
        ...(draws[windowEndIndex]?.drawDate !== undefined
            ? { windowEndDate: draws[windowEndIndex].drawDate }
            : {}),
        drawCount,
        hitCount,
        missCount,
        hitRate,
        completedMissStreaks: streakAnalysis.completedMissStreaks,
        boundaryStreaks: streakAnalysis.boundaryStreaks,
        missStreakStatistics,
        trailingMissStreak: streakAnalysis.trailingMissStreak,
        comparisonToGlobal,
        hitGaps: streakAnalysis.hitGaps,
    };
}
function assessHorizon(windowSize, windows, configuration) {
    if (windows.length === 0) {
        return null;
    }
    const current = windows[windows.length - 1];
    const recent = windows.slice(-configuration.trendWindowCount);
    const hitRateTrend = computeMetricTrend(recent.map((window) => window.hitRate), configuration.trendWindowCount, configuration.trendStableSlopeThreshold);
    const medianMissStreakTrend = computeMetricTrend(recent.map((window) => window.missStreakStatistics.median), configuration.trendWindowCount, configuration.trendStableSlopeThreshold);
    // Prior phase types from earlier windows (lightweight re-score without recursion).
    const previousPhaseTypes = [];
    for (const prior of windows.slice(0, -1).slice(-3)) {
        const priorAssessment = classifyNumberPhase({
            windowSize,
            window: prior,
            comparisonToGlobal: prior.comparisonToGlobal,
            hitRateTrend: { direction: "stable", slope: 0, comparedWindowCount: 1 },
            medianMissStreakTrend: {
                direction: "stable",
                slope: 0,
                comparedWindowCount: 1,
            },
            previousPhaseTypes: [],
            configuration,
        });
        previousPhaseTypes.push(priorAssessment.phaseType);
    }
    return classifyNumberPhase({
        windowSize,
        window: current,
        comparisonToGlobal: current.comparisonToGlobal,
        hitRateTrend,
        medianMissStreakTrend,
        previousPhaseTypes,
        configuration,
    });
}
/**
 * Full rolling-phase analysis for one lottery number.
 * Draws are sorted oldest→newest regardless of UI order.
 */
export function analyzeNumberRollingPhase(number, draws, configuration = DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION) {
    const chronological = sortDrawsChronologically(draws);
    const hits = buildHitSeries(chronological, number);
    const hitPrefix = buildHitPrefixSum(hits);
    const globalStatistics = buildGlobalNumberStatistics(number, hits);
    const windowsBySize = {};
    const currentWindows = {};
    for (const windowSize of configuration.windowSizes) {
        const ranges = buildRollingWindows(chronological.length, windowSize, configuration.stepSize);
        const windows = ranges.map((range) => analyzeNumberWindow(number, hits, hitPrefix, chronological, range.windowStartIndex, range.windowEndIndex, windowSize, globalStatistics, configuration.includeBoundaryCensoredStreaksInStatistics));
        windowsBySize[windowSize] = windows;
        currentWindows[windowSize] =
            windows.length > 0 ? windows[windows.length - 1] : null;
    }
    const { shortTerm: shortSize, mediumTerm: mediumSize, longTerm: longSize } = configuration.horizonWindowSizes;
    const shortTerm = assessHorizon(shortSize, windowsBySize[shortSize] ?? [], configuration);
    const mediumTerm = assessHorizon(mediumSize, windowsBySize[mediumSize] ?? [], configuration);
    const longTerm = assessHorizon(longSize, windowsBySize[longSize] ?? [], configuration);
    const currentPhaseAssessment = {
        shortTerm,
        mediumTerm,
        longTerm,
        combinedAssessment: classifyCombinedPhase({
            shortTerm,
            mediumTerm,
            longTerm,
        }),
    };
    return {
        number,
        globalStatistics,
        windowsBySize,
        currentWindows,
        currentPhaseAssessment,
    };
}
/**
 * Analyze every number in `[minimum, maximum]` independently.
 */
export function analyzeAllNumbersRollingPhase(draws, options = {}) {
    const configuration = options.configuration ?? DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION;
    const chronological = sortDrawsChronologically(draws);
    const numbers = options.numbers
        ?? (() => {
            const minimum = options.minimumNumber ?? 1;
            const maximum = options.maximumNumber ?? 49;
            return Array.from({ length: maximum - minimum + 1 }, (_, index) => minimum + index);
        })();
    return numbers.map((number) => analyzeNumberRollingPhase(number, chronological, configuration));
}
//# sourceMappingURL=number-rolling-phase-analyzer.js.map