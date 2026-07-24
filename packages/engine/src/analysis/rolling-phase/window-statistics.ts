import {
  computeArithmeticMean,
  computeMaximum,
  computeMedian,
  computeMinimum,
  computeMode,
  computePercentile,
  computeTrimmedMean,
} from "../stats/numeric-statistics.js";
import type { WindowMissStreakStatistics } from "./types.js";

export function buildMissStreakStatistics(
  sample: readonly number[],
): WindowMissStreakStatistics {
  return {
    sampleSize: sample.length,
    minimum: computeMinimum(sample),
    maximum: computeMaximum(sample),
    arithmeticMean: computeArithmeticMean(sample),
    median: computeMedian(sample),
    mode: computeMode(sample),
    percentile25: computePercentile(sample, 25),
    percentile75: computePercentile(sample, 75),
    percentile90: computePercentile(sample, 90),
    percentile95: computePercentile(sample, 95),
    trimmedMean10Percent: computeTrimmedMean(sample, 0.1),
  };
}
