import { serializeShapeStatisticsKey } from "../domain/shape-statistics-key.js";
import { ShapeAnalysisError } from "../shape-analysis-error.js";
import type { ShapeRun } from "../statistics/shape-run.js";
import {
  buildSurvivalDistribution,
  calculateHistoricalRunPercentile,
} from "../statistics/run-statistics.js";
import type {
  ShapeOverdueBatchRequest,
  ShapeOverdueEvaluationRequest,
} from "./shape-overdue-evaluation-request.js";
import type {
  ShapeOverdueBatchResult,
  ShapeOverdueBatchSummary,
  ShapeOverdueEvaluation,
} from "./shape-overdue-evaluation-result.js";
import {
  compareAgainstAverage,
  compareAgainstMaximum,
  compareAgainstMedian,
  compareAgainstModes,
  findProbabilityAtLeast,
} from "./shape-run-comparison.js";
import {
  DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
  SHAPE_OVERDUE_DISCLAIMER_CODES,
  type MaximumComparison,
  type ShapeOverdueClassification,
  type ShapeOverdueEvaluationConfiguration,
  type ShapeOverdueReason,
} from "./shape-overdue-types.js";

export interface ShapeOverdueEvaluator {
  evaluate(request: ShapeOverdueEvaluationRequest): ShapeOverdueEvaluation;
}

export class DefaultShapeOverdueEvaluator implements ShapeOverdueEvaluator {
  public evaluate(
    request: ShapeOverdueEvaluationRequest,
  ): ShapeOverdueEvaluation {
    const configuration = request.configuration;
    this.validateConfiguration(configuration);
    this.validateCurrent(request.current);
    this.validateHistorical(request.historical);
    this.validateKeys(request);

    const currentRunLength = request.current.coveredCardCount;
    const isCensored = !request.current.isCompleteRun;
    const runsForStats: readonly ShapeRun[] = configuration.useCompletedRunsOnly
      ? request.historical.completedRuns
      : request.historical.runs;

    const percentile =
      runsForStats.length === 0
        ? null
        : calculateHistoricalRunPercentile(currentRunLength, runsForStats);

    const percentageShorterThanCurrent =
      percentile === null ? null : percentile.percentageShorterThan / 100;
    const percentageAtMostCurrent =
      percentile === null ? null : percentile.percentageAtMost / 100;

    const survival =
      configuration.useCompletedRunsOnly &&
      request.historical.survivalDistribution.length > 0
        ? request.historical.survivalDistribution
        : buildSurvivalDistribution(runsForStats);

    const probabilityAtLeastCurrentLength =
      runsForStats.length === 0
        ? null
        : findProbabilityAtLeast(currentRunLength, survival);

    const insufficient =
      request.historical.completedRunCount <
      configuration.minimumCompletedRunCount;

    const reasons: ShapeOverdueReason[] = [];

    if (insufficient) {
      reasons.push({
        code: "INSUFFICIENT_COMPLETED_RUNS",
        actual: request.historical.completedRunCount,
        required: configuration.minimumCompletedRunCount,
      });
    }

    if (isCensored) {
      reasons.push({
        code: "CURRENT_RUN_CENSORED",
        observedLength: currentRunLength,
      });
    }

    let modeComparison = null;
    if (
      configuration.compareAgainstMode &&
      request.historical.mode !== null
    ) {
      modeComparison = compareAgainstModes(
        currentRunLength,
        request.historical.mode.runLengths,
        request.historical.mode.frequency,
      );

      if (modeComparison.relation === "above-all-modes") {
        reasons.push({
          code: "ABOVE_ALL_HISTORICAL_MODES",
          current: currentRunLength,
          modes: modeComparison.modeRunLengths,
        });
      } else if (modeComparison.relation === "matches-mode") {
        reasons.push({
          code: "MATCHES_HISTORICAL_MODE",
          current: currentRunLength,
        });
      }
    }

    let medianComparison = null;
    if (
      configuration.compareAgainstMedian &&
      request.historical.medianRunLength !== null
    ) {
      medianComparison = compareAgainstMedian(
        currentRunLength,
        request.historical.medianRunLength,
      );

      if (medianComparison.difference > 0) {
        reasons.push({
          code: "ABOVE_HISTORICAL_MEDIAN",
          current: currentRunLength,
          median: medianComparison.medianRunLength,
        });
      }
    }

    let averageComparison = null;
    if (request.historical.averageRunLength !== null) {
      averageComparison = compareAgainstAverage(
        currentRunLength,
        request.historical.averageRunLength,
      );
    }

    let maximumComparison = null;
    if (
      configuration.compareAgainstMaximum &&
      request.historical.maximumRunLength !== null
    ) {
      maximumComparison = compareAgainstMaximum(
        currentRunLength,
        request.historical.maximumRunLength,
      );

      if (maximumComparison.relation === "exceeds-maximum") {
        reasons.push({
          code: "EXCEEDS_HISTORICAL_MAXIMUM",
          current: currentRunLength,
          maximum: maximumComparison.maximumRunLength,
        });
      } else if (maximumComparison.relation === "matches-maximum") {
        reasons.push({
          code: "MATCHES_HISTORICAL_MAXIMUM",
          current: currentRunLength,
        });
      }
    }

    const classification = this.classify({
      insufficient,
      maximumComparison,
      percentageShorterThanCurrent,
      configuration,
    });

    if (
      classification === "rare" ||
      classification === "extreme" ||
      classification === "elevated"
    ) {
      if (percentageShorterThanCurrent !== null) {
        reasons.push({
          code: "RARE_BY_PERCENTILE",
          percentile: percentageShorterThanCurrent,
        });
      }
    }

    const overdueScore = insufficient
      ? null
      : percentageShorterThanCurrent === null
        ? null
        : Math.round(percentageShorterThanCurrent * 100);

    let dataQualityStatus: ShapeOverdueEvaluation["dataQuality"]["status"];
    if (request.historical.completedRunCount <= 0) {
      dataQualityStatus = "insufficient";
    } else if (insufficient) {
      dataQualityStatus = "insufficient";
    } else {
      dataQualityStatus = request.historical.dataQuality.status;
    }

    let evaluationConfidence: "high" | "medium" | "low";
    if (
      dataQualityStatus === "insufficient" ||
      dataQualityStatus === "limited"
    ) {
      evaluationConfidence = "low";
    } else if (isCensored) {
      evaluationConfidence = "medium";
    } else {
      evaluationConfidence = "high";
    }

    return {
      key: request.historical.key,
      currentRun: {
        observedRunLength: currentRunLength,
        isCompleteRun: request.current.isCompleteRun,
        isCensored,
        displayQualifier: request.current.isCompleteRun ? "exactly" : "at-least",
      },
      historicalSummary: {
        completedRunCount: request.historical.completedRunCount,
        mode: request.historical.mode,
        medianRunLength: request.historical.medianRunLength,
        averageRunLength: request.historical.averageRunLength,
        maximumRunLength: request.historical.maximumRunLength,
        probabilityAtLeastCurrentLength,
        percentageShorterThanCurrent,
        percentageAtMostCurrent,
      },
      comparisons: {
        mode: modeComparison,
        median: medianComparison,
        average: averageComparison,
        maximum: maximumComparison,
      },
      classification,
      overdueScore,
      reasons,
      dataQuality: {
        status: dataQualityStatus,
        completedRunCount: request.historical.completedRunCount,
        minimumRequiredRunCount: configuration.minimumCompletedRunCount,
        currentRunIsCensored: isCensored,
        historicalDataContainsCensoring:
          request.historical.censoredRunCount > 0,
        evaluationConfidence,
      },
      disclaimers: [...SHAPE_OVERDUE_DISCLAIMER_CODES],
    };
  }

  private classify(input: {
    readonly insufficient: boolean;
    readonly maximumComparison: MaximumComparison | null;
    readonly percentageShorterThanCurrent: number | null;
    readonly configuration: ShapeOverdueEvaluationConfiguration;
  }): ShapeOverdueClassification {
    if (input.insufficient) {
      return "insufficient-data";
    }

    if (input.maximumComparison?.relation === "exceeds-maximum") {
      return "historical-maximum-exceeded";
    }

    if (input.maximumComparison?.relation === "matches-maximum") {
      return "historical-maximum-matched";
    }

    const percentile = input.percentageShorterThanCurrent ?? 0;

    if (percentile >= input.configuration.extremePercentileThreshold) {
      return "extreme";
    }

    if (percentile >= input.configuration.rarePercentileThreshold) {
      return "rare";
    }

    if (percentile >= input.configuration.elevatedPercentileThreshold) {
      return "elevated";
    }

    return "typical";
  }

  private validateKeys(request: ShapeOverdueEvaluationRequest): void {
    const { current, historical, layoutKey } = request;

    if (
      current.shapeType !== historical.key.shapeType ||
      current.geometryKey !== historical.key.geometryKey ||
      layoutKey !== historical.key.layoutKey
    ) {
      throw new ShapeAnalysisError(
        "SHAPE_STATISTICS_KEY_MISMATCH",
        "Current persistence entry and historical statistics refer to different shapes.",
        {
          expected: serializeShapeStatisticsKey(historical.key),
          actual: `${layoutKey}|${current.shapeType}|${current.geometryKey}`,
        },
      );
    }
  }

  private validateCurrent(
    current: ShapeOverdueEvaluationRequest["current"],
  ): void {
    if (current.coveredCardCount < 1) {
      throw new ShapeAnalysisError(
        "INVALID_CURRENT_RUN",
        "coveredCardCount must be at least 1.",
      );
    }

    if (current.previousCardCount !== current.coveredCardCount - 1) {
      throw new ShapeAnalysisError(
        "INVALID_CURRENT_RUN",
        "previousCardCount must equal coveredCardCount - 1.",
      );
    }
  }

  private validateHistorical(
    historical: ShapeOverdueEvaluationRequest["historical"],
  ): void {
    if (historical.completedRunCount !== historical.completedRuns.length) {
      throw new ShapeAnalysisError(
        "INVALID_HISTORICAL_STATISTICS",
        "completedRunCount does not match completedRuns.length.",
      );
    }
  }

  private validateConfiguration(
    configuration: ShapeOverdueEvaluationConfiguration,
  ): void {
    const {
      elevatedPercentileThreshold: elevated,
      rarePercentileThreshold: rare,
      extremePercentileThreshold: extreme,
      minimumCompletedRunCount,
    } = configuration;

    if (
      elevated < 0 ||
      elevated > 1 ||
      rare < 0 ||
      rare > 1 ||
      extreme < 0 ||
      extreme > 1
    ) {
      throw new ShapeAnalysisError(
        "INVALID_EVALUATION_CONFIGURATION",
        "Percentile thresholds must be between 0 and 1.",
      );
    }

    if (!(elevated < rare && rare < extreme)) {
      throw new ShapeAnalysisError(
        "INVALID_EVALUATION_CONFIGURATION",
        "Thresholds must satisfy elevated < rare < extreme.",
      );
    }

    if (minimumCompletedRunCount < 0) {
      throw new ShapeAnalysisError(
        "INVALID_EVALUATION_CONFIGURATION",
        "minimumCompletedRunCount must not be negative.",
      );
    }
  }
}

export function evaluateShapeOverdueBatch(
  request: ShapeOverdueBatchRequest,
  evaluator: ShapeOverdueEvaluator = new DefaultShapeOverdueEvaluator(),
): ShapeOverdueBatchResult {
  const evaluations = request.entries.map((entry) =>
    evaluator.evaluate({
      current: entry.current,
      historical: entry.historical,
      layoutKey: entry.layoutKey,
      configuration: request.configuration,
    }),
  );

  return {
    evaluations,
    summary: summarizeShapeOverdueBatch(evaluations),
  };
}

export function summarizeShapeOverdueBatch(
  evaluations: readonly ShapeOverdueEvaluation[],
): ShapeOverdueBatchSummary {
  const classificationCounts: Record<ShapeOverdueClassification, number> = {
    "insufficient-data": 0,
    typical: 0,
    elevated: 0,
    rare: 0,
    extreme: 0,
    "historical-maximum-matched": 0,
    "historical-maximum-exceeded": 0,
  };

  for (const evaluation of evaluations) {
    classificationCounts[evaluation.classification] += 1;
  }

  const scored = evaluations.filter(
    (evaluation) => evaluation.overdueScore !== null,
  );
  const highestScore =
    scored.length === 0
      ? null
      : Math.max(...scored.map((evaluation) => evaluation.overdueScore!));

  const highestScoringShapeKeys =
    highestScore === null
      ? []
      : scored
          .filter((evaluation) => evaluation.overdueScore === highestScore)
          .map((evaluation) => serializeShapeStatisticsKey(evaluation.key))
          .sort((a, b) => a.localeCompare(b));

  return {
    totalEvaluated: evaluations.length,
    classificationCounts,
    highestScore,
    highestScoringShapeKeys,
  };
}

const CLASSIFICATION_SORT_RANK: Record<ShapeOverdueClassification, number> = {
  "historical-maximum-exceeded": 0,
  "historical-maximum-matched": 1,
  extreme: 2,
  rare: 3,
  elevated: 4,
  typical: 5,
  "insufficient-data": 6,
};

export function compareShapeOverdueEvaluations(
  a: ShapeOverdueEvaluation,
  b: ShapeOverdueEvaluation,
): number {
  const rankDiff =
    CLASSIFICATION_SORT_RANK[a.classification] -
    CLASSIFICATION_SORT_RANK[b.classification];

  if (rankDiff !== 0) {
    return rankDiff;
  }

  const scoreA = a.overdueScore ?? -1;
  const scoreB = b.overdueScore ?? -1;

  if (scoreA !== scoreB) {
    return scoreB - scoreA;
  }

  if (a.currentRun.observedRunLength !== b.currentRun.observedRunLength) {
    return b.currentRun.observedRunLength - a.currentRun.observedRunLength;
  }

  const areaA = rectangleAreaFromKey(a.key.geometryKey);
  const areaB = rectangleAreaFromKey(b.key.geometryKey);

  if (areaA !== areaB) {
    return areaB - areaA;
  }

  return a.key.geometryKey.localeCompare(b.key.geometryKey);
}

function rectangleAreaFromKey(geometryKey: string): number {
  const match = /w=(\d+):h=(\d+)/.exec(geometryKey);

  if (match === null) {
    return 0;
  }

  return Number(match[1]) * Number(match[2]);
}

export {
  DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
  findProbabilityAtLeast,
};
