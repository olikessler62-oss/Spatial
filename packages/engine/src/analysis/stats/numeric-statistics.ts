/**
 * Shared numeric statistics on plain number arrays.
 * Prefer these over ShapeRun-specific wrappers when analyzing miss streaks.
 */

import { nearestRankPercentile } from "../../shape-analysis/statistics/run-statistics.js";

export function sortAscending(values: readonly number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

export function computeArithmeticMean(
  values: readonly number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

export function computeMedian(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = sortAscending(values);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? null;
  }

  const left = sorted[middle - 1];
  const right = sorted[middle];

  if (left === undefined || right === undefined) {
    return null;
  }

  return (left + right) / 2;
}

/**
 * All modes (most frequent values). Empty when input is empty.
 * Multimodal: every value tied for highest frequency, ascending.
 */
export function computeMode(values: readonly number[]): readonly number[] {
  if (values.length === 0) {
    return [];
  }

  const counts = new Map<number, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let maxFrequency = 0;

  for (const frequency of counts.values()) {
    if (frequency > maxFrequency) {
      maxFrequency = frequency;
    }
  }

  return [...counts.entries()]
    .filter(([, frequency]) => frequency === maxFrequency)
    .map(([value]) => value)
    .sort((a, b) => a - b);
}

/**
 * Trim `trimFraction` (e.g. 0.1) from each tail, then mean of the remainder.
 * When too few samples remain, returns null.
 */
export function computeTrimmedMean(
  values: readonly number[],
  trimFraction: number,
): number | null {
  if (values.length === 0) {
    return null;
  }

  const fraction = Math.min(0.49, Math.max(0, trimFraction));
  const sorted = sortAscending(values);
  const trimCount = Math.floor(sorted.length * fraction);

  if (trimCount * 2 >= sorted.length) {
    return null;
  }

  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  return computeArithmeticMean(trimmed);
}

export function computePercentile(
  values: readonly number[],
  percentile: number,
): number | null {
  return nearestRankPercentile(sortAscending(values), percentile);
}

export function computeMinimum(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.min(...values);
}

export function computeMaximum(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
}

export {
  nearestRankPercentile,
};
