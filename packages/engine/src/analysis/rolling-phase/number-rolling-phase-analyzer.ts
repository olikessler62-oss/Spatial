import type { ParsedDraw } from "../../domain/parsed-draw.js";
import {
  analyzeGlobalMissStreaks,
  analyzeWindowMissStreaks,
} from "./miss-streak-analyzer.js";
import { buildRollingWindows } from "./rolling-window-builder.js";
import { compareWindowToGlobal } from "./window-global-comparison.js";
import { buildMissStreakStatistics } from "./window-statistics.js";
import { computeMetricTrend } from "./window-trend-analyzer.js";
import { classifyNumberPhase } from "./number-phase-classifier.js";
import { classifyCombinedPhase } from "./combined-phase-classifier.js";
import {
  DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
  type ChronologicalDrawRef,
  type CurrentNumberPhaseAssessment,
  type GlobalNumberStatistics,
  type NumberPhaseType,
  type NumberRollingPhaseAnalysis,
  type PhaseWindowAssessment,
  type RollingNumberWindowAnalysis,
  type RollingPhaseAnalysisConfiguration,
} from "./types.js";

function sortDrawsChronologically<T extends ChronologicalDrawRef>(
  draws: readonly T[],
): T[] {
  return [...draws].sort((a, b) => a.drawDate.localeCompare(b.drawDate));
}

function buildHitSeries(
  draws: readonly ChronologicalDrawRef[],
  number: number,
): boolean[] {
  return draws.map((draw) => {
    const unique = new Set(draw.mainNumbers);
    return unique.has(number);
  });
}

function buildHitPrefixSum(hits: readonly boolean[]): number[] {
  const prefix = new Array<number>(hits.length + 1);
  prefix[0] = 0;

  for (let index = 0; index < hits.length; index += 1) {
    prefix[index + 1] = prefix[index]! + (hits[index] ? 1 : 0);
  }

  return prefix;
}

function hitCountInRange(
  prefix: readonly number[],
  startInclusive: number,
  endInclusive: number,
): number {
  return prefix[endInclusive + 1]! - prefix[startInclusive]!;
}

export function buildGlobalNumberStatistics(
  number: number,
  hits: readonly boolean[],
): GlobalNumberStatistics {
  const drawCount = hits.length;
  const hitCount = hits.filter(Boolean).length;
  const missCount = drawCount - hitCount;
  const { completedMissStreaks, trailingMissStreak } =
    analyzeGlobalMissStreaks(hits);
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

export function analyzeNumberWindow(
  number: number,
  hits: readonly boolean[],
  hitPrefix: readonly number[],
  draws: readonly ChronologicalDrawRef[],
  windowStartIndex: number,
  windowEndIndex: number,
  windowSize: number,
  global: GlobalNumberStatistics,
  includeBoundaryCensoredStreaksInStatistics: boolean,
): RollingNumberWindowAnalysis {
  const drawCount = windowEndIndex - windowStartIndex + 1;
  const hitCount = hitCountInRange(hitPrefix, windowStartIndex, windowEndIndex);
  const missCount = drawCount - hitCount;
  const hitRate = drawCount === 0 ? 0 : hitCount / drawCount;

  const streakAnalysis = analyzeWindowMissStreaks(
    hits,
    windowStartIndex,
    windowEndIndex,
    includeBoundaryCensoredStreaksInStatistics,
  );
  const missStreakStatistics = buildMissStreakStatistics(
    streakAnalysis.statisticsSample,
  );
  const comparisonToGlobal = compareWindowToGlobal(
    hitRate,
    missStreakStatistics,
    global,
  );

  return {
    number,
    windowSize,
    windowStartIndex,
    windowEndIndex,
    ...(draws[windowStartIndex]?.drawDate !== undefined
      ? { windowStartDate: draws[windowStartIndex]!.drawDate }
      : {}),
    ...(draws[windowEndIndex]?.drawDate !== undefined
      ? { windowEndDate: draws[windowEndIndex]!.drawDate }
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

function assessHorizon(
  windowSize: number,
  windows: readonly RollingNumberWindowAnalysis[],
  configuration: RollingPhaseAnalysisConfiguration,
): PhaseWindowAssessment | null {
  if (windows.length === 0) {
    return null;
  }

  const current = windows[windows.length - 1]!;
  const recent = windows.slice(-configuration.trendWindowCount);
  const hitRateTrend = computeMetricTrend(
    recent.map((window) => window.hitRate),
    configuration.trendWindowCount,
    configuration.trendStableSlopeThreshold,
  );
  const medianMissStreakTrend = computeMetricTrend(
    recent.map((window) => window.missStreakStatistics.median),
    configuration.trendWindowCount,
    configuration.trendStableSlopeThreshold,
  );

  // Prior phase types from earlier windows (lightweight re-score without recursion).
  const previousPhaseTypes: NumberPhaseType[] = [];

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
export function analyzeNumberRollingPhase(
  number: number,
  draws: readonly ChronologicalDrawRef[],
  configuration: RollingPhaseAnalysisConfiguration = DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION,
): NumberRollingPhaseAnalysis {
  const chronological = sortDrawsChronologically(draws);
  const hits = buildHitSeries(chronological, number);
  const hitPrefix = buildHitPrefixSum(hits);
  const globalStatistics = buildGlobalNumberStatistics(number, hits);

  const windowsBySize: Record<number, RollingNumberWindowAnalysis[]> = {};
  const currentWindows: Record<number, RollingNumberWindowAnalysis | null> = {};

  for (const windowSize of configuration.windowSizes) {
    const ranges = buildRollingWindows(
      chronological.length,
      windowSize,
      configuration.stepSize,
    );
    const windows = ranges.map((range) =>
      analyzeNumberWindow(
        number,
        hits,
        hitPrefix,
        chronological,
        range.windowStartIndex,
        range.windowEndIndex,
        windowSize,
        globalStatistics,
        configuration.includeBoundaryCensoredStreaksInStatistics,
      ),
    );

    windowsBySize[windowSize] = windows;
    currentWindows[windowSize] =
      windows.length > 0 ? windows[windows.length - 1]! : null;
  }

  const { shortTerm: shortSize, mediumTerm: mediumSize, longTerm: longSize } =
    configuration.horizonWindowSizes;

  const shortTerm = assessHorizon(
    shortSize,
    windowsBySize[shortSize] ?? [],
    configuration,
  );
  const mediumTerm = assessHorizon(
    mediumSize,
    windowsBySize[mediumSize] ?? [],
    configuration,
  );
  const longTerm = assessHorizon(
    longSize,
    windowsBySize[longSize] ?? [],
    configuration,
  );

  const currentPhaseAssessment: CurrentNumberPhaseAssessment = {
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
export function analyzeAllNumbersRollingPhase(
  draws: readonly ParsedDraw[] | readonly ChronologicalDrawRef[],
  options: {
    readonly minimumNumber?: number;
    readonly maximumNumber?: number;
    readonly numbers?: readonly number[];
    readonly configuration?: RollingPhaseAnalysisConfiguration;
  } = {},
): readonly NumberRollingPhaseAnalysis[] {
  const configuration =
    options.configuration ?? DEFAULT_ROLLING_PHASE_ANALYSIS_CONFIGURATION;
  const chronological = sortDrawsChronologically(draws);

  const numbers =
    options.numbers
    ?? (() => {
      const minimum = options.minimumNumber ?? 1;
      const maximum = options.maximumNumber ?? 49;
      return Array.from(
        { length: maximum - minimum + 1 },
        (_, index) => minimum + index,
      );
    })();

  return numbers.map((number) =>
    analyzeNumberRollingPhase(number, chronological, configuration),
  );
}
