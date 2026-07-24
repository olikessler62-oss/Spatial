import type {
  HistoricalPercentileBreakdown,
  HistoricalRunDataQuality,
  RunLengthFrequencyEntry,
  RunLengthMode,
  RunLengthQuantiles,
  RunLengthSurvivalEntry,
  ShapeRun,
} from "./shape-run.js";

export function buildFrequencyDistribution(
  completedRuns: readonly ShapeRun[],
): readonly RunLengthFrequencyEntry[] {
  const counts = new Map<number, number>();

  for (const run of completedRuns) {
    counts.set(run.length, (counts.get(run.length) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([runLength, frequency]) => ({ runLength, frequency }));
}

export function buildSurvivalDistribution(
  completedRuns: readonly ShapeRun[],
): readonly RunLengthSurvivalEntry[] {
  if (completedRuns.length === 0) {
    return [];
  }

  const maxLength = Math.max(...completedRuns.map((run) => run.length));
  const total = completedRuns.length;
  const entries: RunLengthSurvivalEntry[] = [];

  for (let runLength = 1; runLength <= maxLength; runLength += 1) {
    const countAtLeast = completedRuns.filter(
      (run) => run.length >= runLength,
    ).length;

    entries.push({
      runLength,
      countAtLeast,
      probabilityAtLeast: countAtLeast / total,
    });
  }

  return entries;
}

export function computeRunLengthMode(
  completedRuns: readonly ShapeRun[],
): RunLengthMode | null {
  if (completedRuns.length === 0) {
    return null;
  }

  const frequency = buildFrequencyDistribution(completedRuns);
  const maxFrequency = Math.max(
    ...frequency.map((entry) => entry.frequency),
  );
  const runLengths = frequency
    .filter((entry) => entry.frequency === maxFrequency)
    .map((entry) => entry.runLength)
    .sort((a, b) => a - b);

  return {
    runLengths,
    frequency: maxFrequency,
  };
}

export function computeAverageRunLength(
  completedRuns: readonly ShapeRun[],
): number | null {
  if (completedRuns.length === 0) {
    return null;
  }

  const sum = completedRuns.reduce((total, run) => total + run.length, 0);
  return sum / completedRuns.length;
}

export function computeMedianRunLength(
  completedRuns: readonly ShapeRun[],
): number | null {
  if (completedRuns.length === 0) {
    return null;
  }

  const sorted = completedRuns
    .map((run) => run.length)
    .sort((a, b) => a - b);
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
 * Nearest-rank percentile on sorted ascending values.
 * rank = ceil(p/100 * n), 1-based.
 */
export function nearestRankPercentile(
  sortedAscending: readonly number[],
  percentile: number,
): number | null {
  if (sortedAscending.length === 0) {
    return null;
  }

  const rank = Math.ceil((percentile / 100) * sortedAscending.length);
  return sortedAscending[Math.max(0, rank - 1)] ?? null;
}

export function computeRunLengthQuantiles(
  completedRuns: readonly ShapeRun[],
): RunLengthQuantiles {
  const sorted = completedRuns
    .map((run) => run.length)
    .sort((a, b) => a - b);

  return {
    p50: nearestRankPercentile(sorted, 50),
    p75: nearestRankPercentile(sorted, 75),
    p90: nearestRankPercentile(sorted, 90),
    p95: nearestRankPercentile(sorted, 95),
  };
}

export function evaluateHistoricalDataQuality(options: {
  readonly completedRunCount: number;
  readonly minimumRequiredRunCount: number;
  readonly hasLeftCensoredRun: boolean;
  readonly hasRightCensoredRun: boolean;
}): HistoricalRunDataQuality {
  const {
    completedRunCount,
    minimumRequiredRunCount,
    hasLeftCensoredRun,
    hasRightCensoredRun,
  } = options;

  let status: HistoricalRunDataQuality["status"];
  const notes: string[] = [];

  if (completedRunCount <= 0) {
    status = "insufficient";
    notes.push("No completed historical runs.");
  } else if (completedRunCount < minimumRequiredRunCount) {
    status = "limited";
    notes.push(
      `Only ${completedRunCount} completed runs; ${minimumRequiredRunCount} required for sufficient quality.`,
    );
  } else {
    status = "sufficient";
  }

  if (hasLeftCensoredRun) {
    notes.push("Dataset includes a left-censored run at the oldest edge.");
  }

  if (hasRightCensoredRun) {
    notes.push("Dataset includes a right-censored run at the newest edge.");
  }

  return {
    status,
    completedRunCount,
    minimumRequiredRunCount,
    hasLeftCensoredRun,
    hasRightCensoredRun,
    notes,
  };
}

/**
 * percentageShorterThan: share of completed runs with length < current
 * percentageAtMost: share of completed runs with length <= current
 */
export function calculateHistoricalRunPercentile(
  currentRunLength: number,
  completedRuns: readonly ShapeRun[],
): HistoricalPercentileBreakdown | null {
  if (completedRuns.length === 0) {
    return null;
  }

  const total = completedRuns.length;
  const shorter = completedRuns.filter(
    (run) => run.length < currentRunLength,
  ).length;
  const atMost = completedRuns.filter(
    (run) => run.length <= currentRunLength,
  ).length;

  return {
    percentageShorterThan: (shorter / total) * 100,
    percentageAtMost: (atMost / total) * 100,
  };
}
