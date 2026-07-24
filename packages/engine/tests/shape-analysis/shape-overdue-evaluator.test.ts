import type { RectangleGeometry } from "../../src/shape-analysis/domain/geometry.js";
import {
  createLayoutKey,
  createShapeStatisticsKey,
} from "../../src/shape-analysis/domain/shape-statistics-key.js";
import { createRectangleGeometryKey } from "../../src/shape-analysis/geometry-key.js";
import type { CurrentShapePersistenceEntry } from "../../src/shape-analysis/persistence/current-shape-persistence-result.js";
import {
  buildSurvivalDistribution,
  calculateHistoricalRunPercentile,
  computeAverageRunLength,
  computeMedianRunLength,
  computeRunLengthMode,
  evaluateHistoricalDataQuality,
} from "../../src/shape-analysis/statistics/run-statistics.js";
import type { HistoricalShapeRunStatistics } from "../../src/shape-analysis/statistics/historical-shape-run-result.js";
import type { ShapeRun } from "../../src/shape-analysis/statistics/shape-run.js";
import {
  compareShapeOverdueEvaluations,
  DefaultShapeOverdueEvaluator,
  DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
  evaluateShapeOverdueBatch,
  findProbabilityAtLeast,
} from "../../src/shape-analysis/evaluation/index.js";
import { ShapeAnalysisError } from "../../src/shape-analysis/shape-analysis-error.js";
import { describe, expect, it } from "vitest";

const geometry: RectangleGeometry = {
  originRow: 5,
  originColumn: 5,
  width: 2,
  height: 2,
};

const geometryKey = createRectangleGeometryKey(geometry);
const layoutKey = createLayoutKey(7, 7);
const statsKey = createShapeStatisticsKey(7, 7, "rectangle", geometryKey);

function completedRun(length: number, index: number): ShapeRun {
  return {
    id: `run-${index}`,
    startCardId: `s-${index}`,
    endCardId: `e-${index}`,
    startChronologicalIndex: index,
    endChronologicalIndex: index + length,
    length,
    boundaryStatus: "complete",
    isComplete: true,
  };
}

function buildHistorical(
  lengths: readonly number[],
  options?: {
    readonly minimumCompletedRunCount?: number;
    readonly censoredLengths?: readonly number[];
  },
): HistoricalShapeRunStatistics {
  const completedRuns = lengths.map(completedRun);
  const censoredRuns = (options?.censoredLengths ?? []).map((length, index) => ({
    ...completedRun(length, 1000 + index),
    boundaryStatus: "right-censored" as const,
    isComplete: false,
  }));
  const minimum =
    options?.minimumCompletedRunCount ??
    DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION.minimumCompletedRunCount;

  return {
    key: statsKey,
    analyzedCardCount: lengths.reduce((sum, length) => sum + length, 0),
    runs: [...completedRuns, ...censoredRuns],
    completedRuns,
    censoredRuns,
    completedRunCount: completedRuns.length,
    censoredRunCount: censoredRuns.length,
    frequencyDistribution: [],
    survivalDistribution: buildSurvivalDistribution(completedRuns),
    mode: computeRunLengthMode(completedRuns),
    minimumRunLength:
      completedRuns.length === 0
        ? null
        : Math.min(...completedRuns.map((run) => run.length)),
    maximumRunLength:
      completedRuns.length === 0
        ? null
        : Math.max(...completedRuns.map((run) => run.length)),
    averageRunLength: computeAverageRunLength(completedRuns),
    medianRunLength: computeMedianRunLength(completedRuns),
    quantiles: { p50: null, p75: null, p90: null, p95: null },
    dataQuality: evaluateHistoricalDataQuality({
      completedRunCount: completedRuns.length,
      minimumRequiredRunCount: minimum,
      hasLeftCensoredRun: false,
      hasRightCensoredRun: censoredRuns.length > 0,
    }),
  };
}

function buildCurrent(
  coveredCardCount: number,
  options?: {
    readonly isCompleteRun?: boolean;
  },
): CurrentShapePersistenceEntry {
  return {
    shapeId: "shape-1",
    shapeType: "rectangle",
    geometry,
    geometryKey,
    discoveredAtCardId: "card-0",
    discoveredAtSequenceIndex: 0,
    previousCardCount: coveredCardCount - 1,
    coveredCardCount,
    status: options?.isCompleteRun === false ? "boundary" : "active",
    isCompleteRun: options?.isCompleteRun ?? true,
    parentIds: [],
    childIds: [],
    occurrenceCardIds: Array.from(
      { length: coveredCardCount },
      (_, index) => `card-${index}`,
    ),
  };
}

const lowMinimumConfig = {
  ...DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
  minimumCompletedRunCount: 5,
};

describe("findProbabilityAtLeast", () => {
  it("returns exact survival probability and 0 beyond max", () => {
    const runs = [2, 3, 3, 4, 5].map(completedRun);
    const survival = buildSurvivalDistribution(runs);

    expect(findProbabilityAtLeast(3, survival)).toBeCloseTo(4 / 5);
    expect(findProbabilityAtLeast(6, survival)).toBe(0);
    expect(findProbabilityAtLeast(1, [])).toBeNull();
  });
});

describe("DefaultShapeOverdueEvaluator", () => {
  const evaluator = new DefaultShapeOverdueEvaluator();

  it("classifies a typical current run", () => {
    const historical = buildHistorical([2, 3, 3, 4, 4, 5, 5, 6], {
      minimumCompletedRunCount: 5,
    });
    const result = evaluator.evaluate({
      current: buildCurrent(4),
      historical,
      layoutKey,
      configuration: lowMinimumConfig,
    });

    expect(result.classification).toBe("typical");
    expect(result.currentRun.observedRunLength).toBe(4);
    expect(result.overdueScore).not.toBeNull();
    expect(result.overdueScore!).toBeLessThan(75);
    expect(result.disclaimers).toEqual([
      "HISTORICAL_DESCRIPTION_ONLY",
      "NO_CHANGE_TO_DRAW_PROBABILITY",
    ]);
  });

  it("classifies elevated / rare / extreme by percentile", () => {
    // 20 completed runs: lengths 1..19 once, plus one 1 → max=19
    const lengths = [
      1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    ];
    const historical = buildHistorical(lengths);

    const elevated = evaluator.evaluate({
      current: buildCurrent(16),
      historical,
      layoutKey,
      configuration: DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
    });
    // shorter than 16: 1..15 + extra 1 = 16/20 = 0.80
    expect(elevated.historicalSummary.percentageShorterThanCurrent).toBe(0.8);
    expect(elevated.classification).toBe("elevated");

    const rare = evaluator.evaluate({
      current: buildCurrent(19),
      historical,
      layoutKey,
      configuration: DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
    });
    // shorter than 19: 19/20 = 0.95 → extreme (max matched takes priority)
    expect(rare.classification).toBe("historical-maximum-matched");

    const belowMaxRare = evaluator.evaluate({
      current: buildCurrent(18),
      historical,
      layoutKey,
      configuration: DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
    });
    // shorter than 18: 18/20 = 0.90 → rare
    expect(belowMaxRare.classification).toBe("rare");
    expect(belowMaxRare.overdueScore).toBe(90);

    const extremeConfig = {
      ...DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
      compareAgainstMaximum: false,
    };
    const extreme = evaluator.evaluate({
      current: buildCurrent(19),
      historical,
      layoutKey,
      configuration: extremeConfig,
    });
    expect(extreme.historicalSummary.percentageShorterThanCurrent).toBe(0.95);
    expect(extreme.classification).toBe("extreme");
  });

  it("prioritizes historical maximum exceeded and matched", () => {
    const historical = buildHistorical(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    );

    const matched = evaluator.evaluate({
      current: buildCurrent(10),
      historical,
      layoutKey,
      configuration: DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
    });
    expect(matched.classification).toBe("historical-maximum-matched");
    expect(
      matched.reasons.some((reason) => reason.code === "MATCHES_HISTORICAL_MAXIMUM"),
    ).toBe(true);

    const exceeded = evaluator.evaluate({
      current: buildCurrent(12),
      historical,
      layoutKey,
      configuration: DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
    });
    expect(exceeded.classification).toBe("historical-maximum-exceeded");
    expect(exceeded.historicalSummary.probabilityAtLeastCurrentLength).toBe(0);
    expect(
      exceeded.reasons.some((reason) => reason.code === "EXCEEDS_HISTORICAL_MAXIMUM"),
    ).toBe(true);
  });

  it("marks censored current runs and keeps maximum exceeded", () => {
    const historical = buildHistorical(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    );
    const result = evaluator.evaluate({
      current: buildCurrent(12, { isCompleteRun: false }),
      historical,
      layoutKey,
      configuration: DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
    });

    expect(result.currentRun.isCensored).toBe(true);
    expect(result.currentRun.displayQualifier).toBe("at-least");
    expect(result.classification).toBe("historical-maximum-exceeded");
    expect(result.dataQuality.evaluationConfidence).toBe("medium");
    expect(
      result.reasons.some((reason) => reason.code === "CURRENT_RUN_CENSORED"),
    ).toBe(true);
  });

  it("returns insufficient-data even when current exceeds historical max", () => {
    const historical = buildHistorical([2, 4, 5], {
      minimumCompletedRunCount: 10,
    });
    const result = evaluator.evaluate({
      current: buildCurrent(6),
      historical,
      layoutKey,
      configuration: DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
    });

    expect(result.classification).toBe("insufficient-data");
    expect(result.overdueScore).toBeNull();
    expect(result.dataQuality.status).toBe("insufficient");
    expect(result.dataQuality.evaluationConfidence).toBe("low");
    expect(result.comparisons.maximum?.relation).toBe("exceeds-maximum");
    expect(
      result.reasons.some((reason) => reason.code === "INSUFFICIENT_COMPLETED_RUNS"),
    ).toBe(true);
  });

  it("compares against modes and median without letting mode drive rarity", () => {
    const historical = buildHistorical([2, 2, 2, 2, 2, 15], {
      minimumCompletedRunCount: 5,
    });
    const result = evaluator.evaluate({
      current: buildCurrent(4),
      historical,
      layoutKey,
      configuration: lowMinimumConfig,
    });

    expect(result.comparisons.mode?.relation).toBe("above-all-modes");
    expect(result.comparisons.median?.difference).toBe(2);
    // 5/6 ≈ 0.833 of completed runs are shorter → elevated, not driven by average alone
    expect(result.classification).toBe("elevated");
    expect(result.historicalSummary.averageRunLength).toBeCloseTo(25 / 6);
  });

  it("throws on shape key mismatch", () => {
    const historical = buildHistorical([2, 3, 4, 5, 6], {
      minimumCompletedRunCount: 5,
    });

    expect(() =>
      evaluator.evaluate({
        current: buildCurrent(4),
        historical,
        layoutKey: "5x10",
        configuration: lowMinimumConfig,
      }),
    ).toThrow(ShapeAnalysisError);

    try {
      evaluator.evaluate({
        current: buildCurrent(4),
        historical,
        layoutKey: "5x10",
        configuration: lowMinimumConfig,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ShapeAnalysisError);
      expect((error as ShapeAnalysisError).code).toBe(
        "SHAPE_STATISTICS_KEY_MISMATCH",
      );
    }
  });

  it("throws on invalid current run and configuration", () => {
    const historical = buildHistorical([2, 3, 4, 5, 6], {
      minimumCompletedRunCount: 5,
    });

    const badCurrent = {
      ...buildCurrent(4),
      previousCardCount: 1,
    };

    expect(() =>
      evaluator.evaluate({
        current: badCurrent,
        historical,
        layoutKey,
        configuration: lowMinimumConfig,
      }),
    ).toThrowError(/previousCardCount/);

    expect(() =>
      evaluator.evaluate({
        current: buildCurrent(4),
        historical,
        layoutKey,
        configuration: {
          ...lowMinimumConfig,
          elevatedPercentileThreshold: 0.9,
          rarePercentileThreshold: 0.8,
          extremePercentileThreshold: 0.95,
        },
      }),
    ).toThrowError(/elevated < rare < extreme/);
  });

  it("uses coveredCardCount as current run length", () => {
    const historical = buildHistorical([2, 3, 4, 5, 6, 7], {
      minimumCompletedRunCount: 5,
    });
    const current = buildCurrent(6);
    const result = evaluator.evaluate({
      current,
      historical,
      layoutKey,
      configuration: lowMinimumConfig,
    });

    expect(result.currentRun.observedRunLength).toBe(current.coveredCardCount);
    expect(result.currentRun.observedRunLength).not.toBe(
      current.previousCardCount,
    );

    const expected = calculateHistoricalRunPercentile(
      6,
      historical.completedRuns,
    )!;
    expect(result.historicalSummary.percentageShorterThanCurrent).toBe(
      expected.percentageShorterThan / 100,
    );
  });
});

describe("evaluateShapeOverdueBatch + sort", () => {
  it("summarizes classifications and sorts deterministically", () => {
    const historicalA = buildHistorical([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const historicalB = {
      ...buildHistorical([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      key: createShapeStatisticsKey(
        7,
        7,
        "rectangle",
        createRectangleGeometryKey({
          originRow: 0,
          originColumn: 0,
          width: 3,
          height: 3,
        }),
      ),
    };

    const currentB: CurrentShapePersistenceEntry = {
      ...buildCurrent(12),
      geometry: {
        originRow: 0,
        originColumn: 0,
        width: 3,
        height: 3,
      },
      geometryKey: historicalB.key.geometryKey,
      shapeId: "shape-b",
    };

    const batch = evaluateShapeOverdueBatch({
      entries: [
        {
          current: buildCurrent(4),
          historical: historicalA,
          layoutKey,
        },
        {
          current: currentB,
          historical: historicalB,
          layoutKey,
        },
        {
          current: buildCurrent(10),
          historical: historicalA,
          layoutKey,
        },
      ],
      configuration: DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
    });

    expect(batch.summary.totalEvaluated).toBe(3);
    expect(batch.summary.classificationCounts["historical-maximum-exceeded"]).toBe(
      1,
    );
    expect(batch.summary.classificationCounts["historical-maximum-matched"]).toBe(
      1,
    );

    const sorted = [...batch.evaluations].sort(compareShapeOverdueEvaluations);
    expect(sorted[0]?.classification).toBe("historical-maximum-exceeded");
    expect(sorted[1]?.classification).toBe("historical-maximum-matched");
  });
});
