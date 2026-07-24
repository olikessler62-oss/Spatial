import type {
  GlobalNumberStatistics,
  WindowGlobalComparison,
  WindowMissStreakStatistics,
} from "./types.js";

function safeRatio(
  numerator: number | null,
  denominator: number | null,
): number | null {
  if (
    numerator === null
    || denominator === null
    || denominator === 0
    || !Number.isFinite(numerator)
    || !Number.isFinite(denominator)
  ) {
    return null;
  }

  return numerator / denominator;
}

function safeDifference(
  left: number | null,
  right: number | null,
): number | null {
  if (left === null || right === null) {
    return null;
  }

  return left - right;
}

export function compareWindowToGlobal(
  windowHitRate: number,
  windowStats: WindowMissStreakStatistics,
  global: GlobalNumberStatistics,
): WindowGlobalComparison {
  return {
    hitRateDifference: windowHitRate - global.hitRate,
    hitRateRatio: safeRatio(windowHitRate, global.hitRate),
    medianMissStreakDifference: safeDifference(
      windowStats.median,
      global.missStreakStatistics.median,
    ),
    medianMissStreakRatio: safeRatio(
      windowStats.median,
      global.missStreakStatistics.median,
    ),
    trimmedMeanDifference: safeDifference(
      windowStats.trimmedMean10Percent,
      global.missStreakStatistics.trimmedMean10Percent,
    ),
    trimmedMeanRatio: safeRatio(
      windowStats.trimmedMean10Percent,
      global.missStreakStatistics.trimmedMean10Percent,
    ),
  };
}
