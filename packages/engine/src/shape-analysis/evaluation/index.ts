export {
  findProbabilityAtLeast,
  compareAgainstModes,
  compareAgainstMedian,
  compareAgainstAverage,
  compareAgainstMaximum,
} from "./shape-run-comparison.js";

export {
  DefaultShapeOverdueEvaluator,
  evaluateShapeOverdueBatch,
  summarizeShapeOverdueBatch,
  compareShapeOverdueEvaluations,
  DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
  type ShapeOverdueEvaluator,
} from "./shape-overdue-evaluator.js";

export type {
  ShapeOverdueEvaluationRequest,
  ShapeOverdueBatchEntry,
  ShapeOverdueBatchRequest,
} from "./shape-overdue-evaluation-request.js";

export type {
  CurrentRunEvaluationInput,
  HistoricalRunEvaluationSummary,
  ShapeRunComparisons,
  ShapeOverdueDataQuality,
  ShapeOverdueEvaluation,
  ShapeOverdueBatchSummary,
  ShapeOverdueBatchResult,
} from "./shape-overdue-evaluation-result.js";

export type {
  ShapeOverdueClassification,
  ShapeOverdueEvaluationConfiguration,
  ModeRelation,
  ModeComparison,
  MedianComparison,
  AverageComparison,
  MaximumRelation,
  MaximumComparison,
  ShapeOverdueReason,
} from "./shape-overdue-types.js";

export { SHAPE_OVERDUE_DISCLAIMER_CODES } from "./shape-overdue-types.js";
