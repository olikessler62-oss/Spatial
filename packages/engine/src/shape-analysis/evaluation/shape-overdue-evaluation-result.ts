import type { ShapeStatisticsKey } from "../domain/shape-statistics-key.js";
import type { RunLengthMode } from "../statistics/shape-run.js";
import type {
  AverageComparison,
  MaximumComparison,
  MedianComparison,
  ModeComparison,
  ShapeOverdueClassification,
  ShapeOverdueReason,
} from "./shape-overdue-types.js";

export interface CurrentRunEvaluationInput {
  readonly observedRunLength: number;
  readonly isCompleteRun: boolean;
  readonly isCensored: boolean;
  readonly displayQualifier: "exactly" | "at-least";
}

export interface HistoricalRunEvaluationSummary {
  readonly completedRunCount: number;
  readonly mode: RunLengthMode | null;
  readonly medianRunLength: number | null;
  readonly averageRunLength: number | null;
  readonly maximumRunLength: number | null;
  readonly probabilityAtLeastCurrentLength: number | null;
  /** Fraction 0–1 of completed runs with length < current. */
  readonly percentageShorterThanCurrent: number | null;
  /** Fraction 0–1 of completed runs with length <= current. */
  readonly percentageAtMostCurrent: number | null;
}

export interface ShapeRunComparisons {
  readonly mode: ModeComparison | null;
  readonly median: MedianComparison | null;
  readonly average: AverageComparison | null;
  readonly maximum: MaximumComparison | null;
}

export interface ShapeOverdueDataQuality {
  readonly status: "sufficient" | "limited" | "insufficient";
  readonly completedRunCount: number;
  readonly minimumRequiredRunCount: number;
  readonly currentRunIsCensored: boolean;
  readonly historicalDataContainsCensoring: boolean;
  readonly evaluationConfidence: "high" | "medium" | "low";
}

export interface ShapeOverdueEvaluation {
  readonly key: ShapeStatisticsKey;
  readonly currentRun: CurrentRunEvaluationInput;
  readonly historicalSummary: HistoricalRunEvaluationSummary;
  readonly comparisons: ShapeRunComparisons;
  readonly classification: ShapeOverdueClassification;
  readonly overdueScore: number | null;
  readonly reasons: readonly ShapeOverdueReason[];
  readonly dataQuality: ShapeOverdueDataQuality;
  readonly disclaimers: readonly string[];
}

export interface ShapeOverdueBatchSummary {
  readonly totalEvaluated: number;
  readonly classificationCounts: Readonly<
    Record<ShapeOverdueClassification, number>
  >;
  readonly highestScore: number | null;
  readonly highestScoringShapeKeys: readonly string[];
}

export interface ShapeOverdueBatchResult {
  readonly evaluations: readonly ShapeOverdueEvaluation[];
  readonly summary: ShapeOverdueBatchSummary;
}
