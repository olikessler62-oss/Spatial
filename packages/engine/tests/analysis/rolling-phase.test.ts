import { describe, expect, it } from "vitest";

import { buildRollingWindows } from "../../src/analysis/rolling-phase/rolling-window-builder.js";
import {
  analyzeGlobalMissStreaks,
  analyzeWindowMissStreaks,
} from "../../src/analysis/rolling-phase/miss-streak-analyzer.js";
import { buildMissStreakStatistics } from "../../src/analysis/rolling-phase/window-statistics.js";
import { compareWindowToGlobal } from "../../src/analysis/rolling-phase/window-global-comparison.js";
import { computeMetricTrend } from "../../src/analysis/rolling-phase/window-trend-analyzer.js";
import { classifyNumberPhase } from "../../src/analysis/rolling-phase/number-phase-classifier.js";
import { classifyCombinedPhase } from "../../src/analysis/rolling-phase/combined-phase-classifier.js";
import {
  analyzeNumberRollingPhase,
  buildGlobalNumberStatistics,
} from "../../src/analysis/rolling-phase/number-rolling-phase-analyzer.js";
import {
  DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
  type RollingNumberWindowAnalysis,
} from "../../src/analysis/rolling-phase/types.js";
import {
  computeMedian,
  computeTrimmedMean,
} from "../../src/analysis/stats/numeric-statistics.js";

/** Spec §19 hit pattern for number 3 (true = hit). */
const SPEC_HITS = [
  true,
  false,
  true,
  false,
  false,
  true,
  false,
  false,
  false,
  true,
] as const;

function drawsFromHits(hits: readonly boolean[], number = 3) {
  return hits.map((hit, index) => ({
    drawDate: `2020-01-${String(index + 1).padStart(2, "0")}`,
    mainNumbers: hit ? [number] : [1],
  }));
}

describe("buildRollingWindows", () => {
  it("builds correct count and indices for step 1", () => {
    const windows = buildRollingWindows(10, 5, 1);
    expect(windows).toHaveLength(6);
    expect(windows[0]).toMatchObject({
      windowStartIndex: 0,
      windowEndIndex: 4,
      drawCount: 5,
    });
    expect(windows[5]).toMatchObject({
      windowStartIndex: 5,
      windowEndIndex: 9,
    });
  });

  it("supports step size greater than 1", () => {
    const windows = buildRollingWindows(10, 5, 2);
    expect(windows.map((window) => window.windowStartIndex)).toEqual([
      0, 2, 4,
    ]);
  });

  it("returns one window when size equals dataset size", () => {
    expect(buildRollingWindows(5, 5, 1)).toHaveLength(1);
  });

  it("returns empty when window larger than dataset", () => {
    expect(buildRollingWindows(4, 5, 1)).toEqual([]);
  });

  it("returns empty for invalid inputs", () => {
    expect(buildRollingWindows(0, 5, 1)).toEqual([]);
    expect(buildRollingWindows(10, 0, 1)).toEqual([]);
    expect(buildRollingWindows(10, 5, 0)).toEqual([]);
  });
});

describe("miss streak analysis (spec §19)", () => {
  it("computes global completed streaks 1, 2, 3", () => {
    const global = analyzeGlobalMissStreaks(SPEC_HITS);
    expect(global.completedMissStreaks).toEqual([1, 2, 3]);
    expect(global.trailingMissStreak).toBe(0);
  });

  it("analyzes each size-5 window", () => {
    const cases = [
      {
        start: 0,
        end: 4,
        completed: [1],
        trailing: 2,
        hits: 2,
      },
      {
        start: 1,
        end: 5,
        completed: [1, 2],
        trailing: 0,
        hits: 2,
      },
      {
        start: 2,
        end: 6,
        completed: [2],
        trailing: 1,
        hits: 2,
      },
      {
        start: 3,
        end: 7,
        completed: [2],
        trailing: 2,
        hits: 1,
      },
      {
        start: 4,
        end: 8,
        completed: [],
        trailing: 3,
        hits: 1,
      },
      {
        start: 5,
        end: 9,
        completed: [3],
        trailing: 0,
        hits: 2,
      },
    ] as const;

    for (const testCase of cases) {
      const analysis = analyzeWindowMissStreaks(
        SPEC_HITS,
        testCase.start,
        testCase.end,
        false,
      );
      const hitCount = SPEC_HITS.slice(testCase.start, testCase.end + 1).filter(
        Boolean,
      ).length;

      expect(hitCount).toBe(testCase.hits);
      expect(analysis.completedMissStreaks).toEqual([...testCase.completed]);
      expect(analysis.trailingMissStreak).toBe(testCase.trailing);
    }
  });

  it("marks leading streak as startedBeforeWindow", () => {
    // Window 2..6 starts on a miss after a prior miss? draw1 is miss, draw0 is hit
    // Window starting at index 3 (miss) after miss at 3? 
    // Use window 4..8: starts on miss at 4, previous index 3 is also miss
    const analysis = analyzeWindowMissStreaks(SPEC_HITS, 4, 8, false);
    expect(analysis.boundaryStreaks.some((streak) => streak.startedBeforeWindow)).toBe(
      true,
    );
    expect(analysis.statisticsSample).toEqual([]);
  });

  it("can include censored streaks in statistics", () => {
    const analysis = analyzeWindowMissStreaks(SPEC_HITS, 4, 8, true);
    expect(analysis.statisticsSample.length).toBeGreaterThan(0);
  });

  it("handles never-hit and always-hit windows", () => {
    const never = analyzeWindowMissStreaks(
      [false, false, false, false],
      0,
      3,
      false,
    );
    expect(never.completedMissStreaks).toEqual([]);
    expect(never.trailingMissStreak).toBe(4);
    expect(never.boundaryStreaks[0]?.continuesAfterWindow).toBe(false);

    const always = analyzeWindowMissStreaks(
      [true, true, true, true],
      0,
      3,
      false,
    );
    expect(always.completedMissStreaks).toEqual([]);
    expect(always.trailingMissStreak).toBe(0);
  });

  it("handles streak continuing after window", () => {
    const hits = [true, false, false, false, false];
    const analysis = analyzeWindowMissStreaks(hits, 1, 2, false);
    expect(analysis.trailingMissStreak).toBe(2);
    expect(analysis.boundaryStreaks[0]?.continuesAfterWindow).toBe(true);
    expect(analysis.boundaryStreaks[0]?.fullHistoricalLength).toBe(4);
  });
});

describe("window statistics", () => {
  it("computes median, trimmed mean, percentiles", () => {
    const stats = buildMissStreakStatistics([1, 2, 3, 4, 5]);
    expect(stats.median).toBe(3);
    expect(stats.arithmeticMean).toBe(3);
    expect(stats.minimum).toBe(1);
    expect(stats.maximum).toBe(5);
    expect(stats.percentile25).toBe(2);
    expect(stats.trimmedMean10Percent).toBe(
      computeTrimmedMean([1, 2, 3, 4, 5], 0.1),
    );
  });

  it("returns nulls for empty sample", () => {
    const stats = buildMissStreakStatistics([]);
    expect(stats.sampleSize).toBe(0);
    expect(stats.median).toBeNull();
  });
});

describe("comparisons and trends", () => {
  it("compares window to global and guards division by zero", () => {
    const global = buildGlobalNumberStatistics(3, SPEC_HITS);
    const emptyStats = buildMissStreakStatistics([]);
    const comparison = compareWindowToGlobal(0.4, emptyStats, {
      ...global,
      hitRate: 0,
      missStreakStatistics: emptyStats,
    });

    expect(comparison.hitRateRatio).toBeNull();
    expect(comparison.medianMissStreakRatio).toBeNull();
  });

  it("detects increasing, decreasing, and stable trends", () => {
    expect(
      computeMetricTrend([1, 2, 3, 4, 5], 5, 0.05).direction,
    ).toBe("increasing");
    expect(
      computeMetricTrend([5, 4, 3, 2, 1], 5, 0.05).direction,
    ).toBe("decreasing");
    expect(
      computeMetricTrend([2, 2.01, 1.99, 2], 5, 0.05).direction,
    ).toBe("stable");
  });
});

describe("phase classification", () => {
  function stubWindow(
    overrides: Partial<RollingNumberWindowAnalysis>,
  ): RollingNumberWindowAnalysis {
    const missStreakStatistics = buildMissStreakStatistics([2, 3, 4]);
    return {
      number: 3,
      windowSize: 25,
      windowStartIndex: 0,
      windowEndIndex: 24,
      drawCount: 25,
      hitCount: 5,
      missCount: 20,
      hitRate: 0.2,
      completedMissStreaks: [2, 3, 4],
      boundaryStreaks: [],
      missStreakStatistics,
      trailingMissStreak: 0,
      comparisonToGlobal: {
        hitRateDifference: 0,
        hitRateRatio: 1,
        medianMissStreakDifference: 0,
        medianMissStreakRatio: 1,
        trimmedMeanDifference: 0,
        trimmedMeanRatio: 1,
      },
      hitGaps: [2, 3, 4],
      ...overrides,
    };
  }

  it("classifies insufficient data", () => {
    const assessment = classifyNumberPhase({
      windowSize: 25,
      window: stubWindow({
        missStreakStatistics: buildMissStreakStatistics([1]),
        completedMissStreaks: [1],
      }),
      comparisonToGlobal: stubWindow({}).comparisonToGlobal,
      hitRateTrend: { direction: "stable", slope: 0, comparedWindowCount: 1 },
      medianMissStreakTrend: {
        direction: "stable",
        slope: 0,
        comparedWindowCount: 1,
      },
      previousPhaseTypes: [],
      configuration: DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
    });

    expect(assessment.phaseType).toBe("insufficient-data");
  });

  it("classifies short-interval when hit rate high and streaks low", () => {
    const window = stubWindow({
      hitRate: 0.4,
      missStreakStatistics: buildMissStreakStatistics([1, 1, 2]),
      comparisonToGlobal: {
        hitRateDifference: 0.2,
        hitRateRatio: 2,
        medianMissStreakDifference: -2,
        medianMissStreakRatio: 0.5,
        trimmedMeanDifference: -2,
        trimmedMeanRatio: 0.5,
      },
    });

    const assessment = classifyNumberPhase({
      windowSize: 25,
      window,
      comparisonToGlobal: window.comparisonToGlobal,
      hitRateTrend: { direction: "stable", slope: 0, comparedWindowCount: 5 },
      medianMissStreakTrend: {
        direction: "decreasing",
        slope: -0.2,
        comparedWindowCount: 5,
      },
      previousPhaseTypes: ["short-interval"],
      configuration: DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
    });

    expect(assessment.phaseType).toBe("short-interval");
  });

  it("classifies long-interval when hit rate low and streaks high", () => {
    const window = stubWindow({
      hitRate: 0.05,
      missStreakStatistics: buildMissStreakStatistics([8, 9, 10]),
      comparisonToGlobal: {
        hitRateDifference: -0.1,
        hitRateRatio: 0.4,
        medianMissStreakDifference: 4,
        medianMissStreakRatio: 2,
        trimmedMeanDifference: 4,
        trimmedMeanRatio: 2,
      },
    });

    const assessment = classifyNumberPhase({
      windowSize: 25,
      window,
      comparisonToGlobal: window.comparisonToGlobal,
      hitRateTrend: { direction: "stable", slope: 0, comparedWindowCount: 5 },
      medianMissStreakTrend: {
        direction: "stable",
        slope: 0,
        comparedWindowCount: 5,
      },
      previousPhaseTypes: ["long-interval"],
      configuration: DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
    });

    expect(assessment.phaseType).toBe("long-interval");
  });

  it("classifies transition on divergent trends vs prior phase", () => {
    const window = stubWindow({
      comparisonToGlobal: {
        hitRateDifference: 0,
        hitRateRatio: 1,
        medianMissStreakDifference: 0,
        medianMissStreakRatio: 1,
        trimmedMeanDifference: 0,
        trimmedMeanRatio: 1,
      },
    });

    const assessment = classifyNumberPhase({
      windowSize: 25,
      window,
      comparisonToGlobal: window.comparisonToGlobal,
      hitRateTrend: {
        direction: "increasing",
        slope: 0.2,
        comparedWindowCount: 5,
      },
      medianMissStreakTrend: {
        direction: "decreasing",
        slope: -0.2,
        comparedWindowCount: 5,
      },
      previousPhaseTypes: ["long-interval"],
      configuration: DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
    });

    expect(assessment.phaseType).toBe("transition");
  });

  it("combines horizons without averaging", () => {
    const long = {
      windowSize: 25,
      phaseType: "long-interval" as const,
      classificationStrength: 0.8,
      comparisonToGlobal: stubWindow({}).comparisonToGlobal,
      hitRateTrend: { direction: "stable" as const, slope: 0, comparedWindowCount: 5 },
      medianMissStreakTrend: {
        direction: "stable" as const,
        slope: 0,
        comparedWindowCount: 5,
      },
      explanationKeys: [],
    };
    const normal = { ...long, windowSize: 50, phaseType: "normal" as const };
    const normal100 = { ...long, windowSize: 100, phaseType: "normal" as const };

    expect(
      classifyCombinedPhase({
        shortTerm: long,
        mediumTerm: normal,
        longTerm: normal100,
      }).pattern,
    ).toBe("short-term-deviation");

    expect(
      classifyCombinedPhase({
        shortTerm: long,
        mediumTerm: long,
        longTerm: long,
      }).pattern,
    ).toBe("aligned-long-interval");
  });
});

describe("analyzeNumberRollingPhase integration", () => {
  it("sorts unsorted draws and analyzes number 3", () => {
    const draws = drawsFromHits(SPEC_HITS).reverse();
    const result = analyzeNumberRollingPhase(3, draws, {
      ...DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
      windowSizes: [5],
      horizonWindowSizes: {
        shortTerm: 5,
        mediumTerm: 5,
        longTerm: 5,
      },
    });

    expect(result.globalStatistics.completedMissStreaks).toEqual([1, 2, 3]);
    expect(result.globalStatistics.hitCount).toBe(4);
    expect(result.windowsBySize[5]).toHaveLength(6);
    expect(result.currentWindows[5]?.hitCount).toBe(2);
    expect(computeMedian([1, 2, 3])).toBe(2);
  });

  it("returns empty windows when history is shorter than window", () => {
    const result = analyzeNumberRollingPhase(3, drawsFromHits(SPEC_HITS), {
      ...DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
      windowSizes: [25, 50, 100],
    });

    expect(result.windowsBySize[25]).toEqual([]);
    expect(result.currentWindows[50]).toBeNull();
    expect(result.currentPhaseAssessment.combinedAssessment.pattern).toBe(
      "insufficient-data",
    );
  });
});
