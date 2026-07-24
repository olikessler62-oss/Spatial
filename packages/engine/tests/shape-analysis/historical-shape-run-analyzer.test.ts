import { describe, expect, it } from "vitest";

import { DefaultShapeAnalyzerRegistry } from "../../src/shape-analysis/detection/shape-detector-registry.js";
import { RectangleShapeDetector } from "../../src/shape-analysis/detection/rectangle/rectangle-shape-detector.js";
import type { RectangleGeometry } from "../../src/shape-analysis/domain/geometry.js";
import { createLayoutKey } from "../../src/shape-analysis/domain/shape-statistics-key.js";
import { SequentialIdGenerator } from "../../src/shape-analysis/id-generator.js";
import { HistoricalShapeRunAnalyzer } from "../../src/shape-analysis/statistics/historical-shape-run-analyzer.js";
import {
  buildFrequencyDistribution,
  buildSurvivalDistribution,
  calculateHistoricalRunPercentile,
  computeAverageRunLength,
  computeMedianRunLength,
  computeRunLengthMode,
  detectShapeRuns,
} from "../../src/shape-analysis/statistics/index.js";
import type { ShapeRun } from "../../src/shape-analysis/statistics/shape-run.js";
import {
  createFilledCard,
  shuffleValues,
} from "./test-helpers.js";

const geometry: RectangleGeometry = {
  originRow: 0,
  originColumn: 0,
  width: 2,
  height: 2,
};

function createAnalyzer(): HistoricalShapeRunAnalyzer {
  const registry = new DefaultShapeAnalyzerRegistry();
  registry.register(new RectangleShapeDetector());
  return new HistoricalShapeRunAnalyzer({
    detectorRegistry: registry,
    idGenerator: new SequentialIdGenerator(),
  });
}

/**
 * Build cards where presence[i]=true means the 2×2 at (0,0) is free AND
 * inclusion-maximal (fenced so it cannot expand).
 */
function cardsFromPresence(
  presence: readonly boolean[],
  values?: readonly number[],
) {
  const fence = [
    { row: 0, column: 2 },
    { row: 1, column: 2 },
    { row: 2, column: 0 },
    { row: 2, column: 1 },
    { row: 2, column: 2 },
  ] as const;

  return presence.map((isFree, index) =>
    createFilledCard({
      id: `card-${index}`,
      chronologicalIndex: index + 1,
      rowCount: 4,
      columnCount: 4,
      hitPositions: isFree
        ? [...fence]
        : [{ row: 0, column: 0 }, ...fence],
      values: values ? [...values] : undefined,
    }),
  );
}

function completedLengths(runs: readonly ShapeRun[]): number[] {
  return runs.filter((run) => run.isComplete).map((run) => run.length);
}

describe("detectShapeRuns", () => {
  it("detects completed runs from a presence sequence", () => {
    const cards = cardsFromPresence([false, true, true, false, true, true, true, false]);
    const presence = [false, true, true, false, true, true, true, false];
    let counter = 0;

    const runs = detectShapeRuns({
      cards,
      presence,
      nextId: () => `run-${++counter}`,
    });

    expect(completedLengths(runs)).toEqual([2, 3]);
    expect(runs.every((run) => run.isComplete)).toBe(true);
  });

  it("marks left-, right-, and both-censored runs", () => {
    const left = detectShapeRuns({
      cards: cardsFromPresence([true, true, true, false]),
      presence: [true, true, true, false],
      nextId: () => "l",
    });
    expect(left).toHaveLength(1);
    expect(left[0]?.boundaryStatus).toBe("left-censored");
    expect(left[0]?.isComplete).toBe(false);

    const right = detectShapeRuns({
      cards: cardsFromPresence([false, true, true, true]),
      presence: [false, true, true, true],
      nextId: () => "r",
    });
    expect(right[0]?.boundaryStatus).toBe("right-censored");

    const both = detectShapeRuns({
      cards: cardsFromPresence([true, true, true, true]),
      presence: [true, true, true, true],
      nextId: () => "b",
    });
    expect(both[0]?.boundaryStatus).toBe("both-censored");
  });
});

describe("run statistics calculators", () => {
  const sampleRuns: ShapeRun[] = [2, 5, 3, 5, 7, 4, 5, 2, 6, 5, 9, 3].map(
    (length, index) => ({
      id: `r-${index}`,
      startCardId: "a",
      endCardId: "b",
      startChronologicalIndex: index,
      endChronologicalIndex: index + length,
      length,
      boundaryStatus: "complete",
      isComplete: true,
    }),
  );

  it("builds frequency and mode", () => {
    expect(buildFrequencyDistribution(sampleRuns)).toEqual([
      { runLength: 2, frequency: 2 },
      { runLength: 3, frequency: 2 },
      { runLength: 4, frequency: 1 },
      { runLength: 5, frequency: 4 },
      { runLength: 6, frequency: 1 },
      { runLength: 7, frequency: 1 },
      { runLength: 9, frequency: 1 },
    ]);
    expect(computeRunLengthMode(sampleRuns)).toEqual({
      runLengths: [5],
      frequency: 4,
    });
  });

  it("supports multimodal modes", () => {
    const runs: ShapeRun[] = [2, 2, 3, 3, 4].map((length, index) => ({
      id: `m-${index}`,
      startCardId: "a",
      endCardId: "b",
      startChronologicalIndex: index,
      endChronologicalIndex: index,
      length,
      boundaryStatus: "complete" as const,
      isComplete: true,
    }));

    expect(computeRunLengthMode(runs)).toEqual({
      runLengths: [2, 3],
      frequency: 2,
    });
  });

  it("builds survival distribution", () => {
    const runs: ShapeRun[] = [2, 3, 3, 5].map((length, index) => ({
      id: `s-${index}`,
      startCardId: "a",
      endCardId: "b",
      startChronologicalIndex: index,
      endChronologicalIndex: index,
      length,
      boundaryStatus: "complete" as const,
      isComplete: true,
    }));

    expect(buildSurvivalDistribution(runs)).toEqual([
      { runLength: 1, countAtLeast: 4, probabilityAtLeast: 1 },
      { runLength: 2, countAtLeast: 4, probabilityAtLeast: 1 },
      { runLength: 3, countAtLeast: 3, probabilityAtLeast: 0.75 },
      { runLength: 4, countAtLeast: 1, probabilityAtLeast: 0.25 },
      { runLength: 5, countAtLeast: 1, probabilityAtLeast: 0.25 },
    ]);
  });

  it("computes average and median with outliers", () => {
    const runs: ShapeRun[] = [2, 2, 2, 15].map((length, index) => ({
      id: `o-${index}`,
      startCardId: "a",
      endCardId: "b",
      startChronologicalIndex: index,
      endChronologicalIndex: index,
      length,
      boundaryStatus: "complete" as const,
      isComplete: true,
    }));

    expect(computeAverageRunLength(runs)).toBe(5.25);
    expect(computeMedianRunLength(runs)).toBe(2);
    expect(computeRunLengthMode(runs)?.runLengths).toEqual([2]);
  });

  it("calculates shorter-than and at-most percentiles", () => {
    const breakdown = calculateHistoricalRunPercentile(5, sampleRuns);
    expect(breakdown).not.toBeNull();
    expect(breakdown!.percentageAtMost).toBeGreaterThanOrEqual(
      breakdown!.percentageShorterThan,
    );
  });
});

describe("HistoricalShapeRunAnalyzer", () => {
  it("analyzes completed runs and excludes censored by default", () => {
    const analyzer = createAnalyzer();
    const cards = cardsFromPresence([
      false,
      true,
      true,
      false,
      true,
      true,
      true,
      false,
    ]);

    const result = analyzer.analyze({
      shapeType: "rectangle",
      geometry,
      cards,
      layoutKey: createLayoutKey(4, 4),
      options: { openRunPolicy: "exclude", minimumCompletedRunCount: 2 },
    });

    expect(result.completedRuns.map((run) => run.length)).toEqual([2, 3]);
    expect(result.censoredRunCount).toBe(0);
    expect(result.dataQuality.status).toBe("sufficient");
    expect(result.mode).toEqual({ runLengths: [2, 3], frequency: 1 });
  });

  it("handles no free cards as insufficient", () => {
    const result = createAnalyzer().analyze({
      shapeType: "rectangle",
      geometry,
      cards: cardsFromPresence([false, false, false, false]),
      layoutKey: "4x4",
    });

    expect(result.runs).toEqual([]);
    expect(result.completedRunCount).toBe(0);
    expect(result.averageRunLength).toBeNull();
    expect(result.dataQuality.status).toBe("insufficient");
  });

  it("marks single free card as complete length 1", () => {
    const result = createAnalyzer().analyze({
      shapeType: "rectangle",
      geometry,
      cards: cardsFromPresence([false, true, false]),
      layoutKey: "4x4",
    });

    expect(result.completedRuns).toHaveLength(1);
    expect(result.completedRuns[0]?.length).toBe(1);
  });

  it("is independent of lottery values", () => {
    const presence = [false, true, true, false, true, false];
    const sequential = Array.from({ length: 16 }, (_, index) => index + 1);
    const shuffled = shuffleValues(sequential);

    const a = createAnalyzer().analyze({
      shapeType: "rectangle",
      geometry,
      cards: cardsFromPresence(presence, sequential),
      layoutKey: "4x4",
    });
    const b = createAnalyzer().analyze({
      shapeType: "rectangle",
      geometry,
      cards: cardsFromPresence(presence, shuffled),
      layoutKey: "4x4",
    });

    expect(a.completedRuns.map((run) => run.length)).toEqual(
      b.completedRuns.map((run) => run.length),
    );
    expect(a.frequencyDistribution).toEqual(b.frequencyDistribution);
  });

  it("deduplicates identical batch targets", () => {
    const cards = cardsFromPresence([false, true, true, false]);
    const target = {
      shapeType: "rectangle" as const,
      geometry,
      layoutKey: "4x4",
    };

    const result = createAnalyzer().analyzeBatch({
      cards,
      shapes: [target, target, target],
    });

    expect(result.metadata.suppliedTargetCount).toBe(3);
    expect(result.metadata.uniqueTargetCount).toBe(1);
    expect(result.results).toHaveLength(1);
  });

  it("reports limited quality below the minimum completed-run threshold", () => {
    const result = createAnalyzer().analyze({
      shapeType: "rectangle",
      geometry,
      cards: cardsFromPresence([false, true, true, false]),
      layoutKey: "4x4",
      options: {
        openRunPolicy: "exclude",
        minimumCompletedRunCount: 10,
      },
    });

    expect(result.completedRunCount).toBe(1);
    expect(result.dataQuality.status).toBe("limited");
  });

  it("exposes censored summary when policy requests it", () => {
    const result = createAnalyzer().analyze({
      shapeType: "rectangle",
      geometry,
      cards: cardsFromPresence([false, true, true, true]),
      layoutKey: "4x4",
      options: {
        openRunPolicy: "include-as-censored",
        minimumCompletedRunCount: 10,
      },
    });

    expect(result.completedRunCount).toBe(0);
    expect(result.censoredSummary?.rightCensoredCurrentLength).toBe(3);
  });
});
