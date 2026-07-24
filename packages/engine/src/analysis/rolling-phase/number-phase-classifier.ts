import type {
  NumberPhaseType,
  PhaseWindowAssessment,
  RollingPhaseAnalysisConfiguration,
  RollingNumberWindowAnalysis,
  WindowGlobalComparison,
  WindowMetricTrend,
} from "./types.js";

export interface PhaseClassificationInput {
  readonly windowSize: number;
  readonly window: RollingNumberWindowAnalysis;
  readonly comparisonToGlobal: WindowGlobalComparison;
  readonly hitRateTrend: WindowMetricTrend;
  readonly medianMissStreakTrend: WindowMetricTrend;
  readonly previousPhaseTypes: readonly NumberPhaseType[];
  readonly configuration: RollingPhaseAnalysisConfiguration;
}

function relativeDelta(
  windowValue: number | null,
  globalValue: number | null,
): number | null {
  if (
    windowValue === null
    || globalValue === null
    || globalValue === 0
    || !Number.isFinite(windowValue)
    || !Number.isFinite(globalValue)
  ) {
    return null;
  }

  return (windowValue - globalValue) / Math.abs(globalValue);
}

/**
 * Descriptive phase classification (not a prediction).
 * Scores long-interval evidence; strong trends → transition.
 */
export function classifyNumberPhase(
  input: PhaseClassificationInput,
): PhaseWindowAssessment {
  const { window, comparisonToGlobal, configuration } = input;
  const explanationKeys: string[] = [];
  const stats = window.missStreakStatistics;

  if (
    window.drawCount < window.windowSize
    || stats.sampleSize < configuration.minimumCompletedStreaksForClassification
  ) {
    return {
      windowSize: input.windowSize,
      phaseType: "insufficient-data",
      classificationStrength: 0,
      comparisonToGlobal,
      hitRateTrend: input.hitRateTrend,
      medianMissStreakTrend: input.medianMissStreakTrend,
      explanationKeys: ["phase.insufficient-data"],
    };
  }

  let longIntervalScore = 0;

  const hitRateRatio = comparisonToGlobal.hitRateRatio;
  if (
    hitRateRatio !== null
    && hitRateRatio >= 1 + configuration.hitRateDeviationThreshold
  ) {
    longIntervalScore -= 1;
    explanationKeys.push("phase.hit-rate-above-global");
  } else if (
    hitRateRatio !== null
    && hitRateRatio <= 1 - configuration.hitRateDeviationThreshold
  ) {
    longIntervalScore += 1;
    explanationKeys.push("phase.hit-rate-below-global");
  }

  const medianDelta = relativeDelta(
    stats.median,
    stats.median !== null
      ? stats.median - (comparisonToGlobal.medianMissStreakDifference ?? 0)
      : null,
  );
  // Prefer comparison fields directly
  const medianDiff = comparisonToGlobal.medianMissStreakDifference;
  const globalMedianEstimate =
    stats.median !== null && medianDiff !== null
      ? stats.median - medianDiff
      : null;

  if (
    globalMedianEstimate !== null
    && stats.median !== null
    && globalMedianEstimate !== 0
  ) {
    const rel = (stats.median - globalMedianEstimate) / Math.abs(globalMedianEstimate);
    if (rel <= -configuration.streakDeviationThreshold) {
      longIntervalScore -= 1;
      explanationKeys.push("phase.median-below-global");
    } else if (rel >= configuration.streakDeviationThreshold) {
      longIntervalScore += 1;
      explanationKeys.push("phase.median-above-global");
    }
  }

  const trimmedDiff = comparisonToGlobal.trimmedMeanDifference;
  const globalTrimmedEstimate =
    stats.trimmedMean10Percent !== null && trimmedDiff !== null
      ? stats.trimmedMean10Percent - trimmedDiff
      : null;

  if (
    globalTrimmedEstimate !== null
    && stats.trimmedMean10Percent !== null
    && globalTrimmedEstimate !== 0
  ) {
    const rel =
      (stats.trimmedMean10Percent - globalTrimmedEstimate)
      / Math.abs(globalTrimmedEstimate);
    if (rel <= -configuration.streakDeviationThreshold) {
      longIntervalScore -= 1;
      explanationKeys.push("phase.trimmed-mean-below-global");
    } else if (rel >= configuration.streakDeviationThreshold) {
      longIntervalScore += 1;
      explanationKeys.push("phase.trimmed-mean-above-global");
    }
  }

  void medianDelta;

  const strongTrend =
    input.hitRateTrend.direction !== "stable"
    || input.medianMissStreakTrend.direction !== "stable";

  const previousDistinct = new Set(
    input.previousPhaseTypes.filter(
      (phase) => phase !== "insufficient-data" && phase !== "transition",
    ),
  );

  let phaseType: NumberPhaseType;

  if (longIntervalScore <= configuration.shortIntervalScoreThreshold) {
    phaseType = "short-interval";
  } else if (longIntervalScore >= configuration.longIntervalScoreThreshold) {
    phaseType = "long-interval";
  } else {
    phaseType = "normal";
  }

  if (
    strongTrend
    && (previousDistinct.size >= 1
      || input.hitRateTrend.direction !== input.medianMissStreakTrend.direction)
  ) {
    // Transition when trend is clear and/or disagrees with a prior stable phase.
    if (
      previousDistinct.size > 0
      && !previousDistinct.has(phaseType)
    ) {
      phaseType = "transition";
      explanationKeys.push("phase.transition-trend");
    } else if (
      input.hitRateTrend.direction !== "stable"
      && input.medianMissStreakTrend.direction !== "stable"
      && input.hitRateTrend.direction !== input.medianMissStreakTrend.direction
    ) {
      phaseType = "transition";
      explanationKeys.push("phase.transition-divergent-metrics");
    }
  }

  if (phaseType === "short-interval") {
    explanationKeys.push("phase.short-interval");
  } else if (phaseType === "long-interval") {
    explanationKeys.push("phase.long-interval");
  } else if (phaseType === "normal") {
    explanationKeys.push("phase.normal");
  }

  const strengthRaw = Math.min(3, Math.abs(longIntervalScore)) / 3;
  const classificationStrength =
    phaseType === "transition"
      ? Math.min(1, 0.45 + strengthRaw * 0.4)
      : strengthRaw;

  return {
    windowSize: input.windowSize,
    phaseType,
    classificationStrength,
    comparisonToGlobal,
    hitRateTrend: input.hitRateTrend,
    medianMissStreakTrend: input.medianMissStreakTrend,
    explanationKeys,
  };
}
