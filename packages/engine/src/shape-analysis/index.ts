export type {
  GridCoordinate,
  ShapeType,
  RectangleGeometry,
  CircleGeometry,
  PolygonGeometry,
  ShapeGeometry,
} from "./domain/geometry.js";
export { isRectangleGeometry } from "./domain/geometry.js";

export type {
  ShapeAnalysisCell,
  ShapeAnalysisCard,
} from "./domain/analysis-card.js";

export type {
  DetectedShape,
  ShapeInstance,
} from "./domain/detected-shape.js";

export type {
  TrackedShapeStatus,
  ShapeTerminationReason,
  ShapeOccurrenceType,
  TrackedShape,
  ShapeCardOccurrence,
} from "./domain/tracked-shape.js";
export {
  coveredCardCount,
  inheritPreviousCardCount,
  initialChildPreviousCardCount,
  createAnalysisBoundaryOutcome,
} from "./domain/tracked-shape.js";

export type {
  ShapeEvolutionEdge,
  ShapeEvolutionGraph,
} from "./domain/evolution-graph.js";
export {
  createEmptyEvolutionGraph,
  deduplicateByShapeKey,
  createOccurrenceKey,
  appendSplitEdge,
} from "./domain/evolution-graph.js";

export type {
  InitialShapeDetectedEvent,
  ShapeConfirmedEvent,
  ShapeSplitEvent,
  ChildShapeDetectedEvent,
  RetrospectiveShapeOccurrenceEvent,
  ShapeTerminatedEvent,
  AnalysisStartedEvent,
  CardAnalysisStartedEvent,
  CardAnalysisCompletedEvent,
  ShapeReachedBoundaryEvent,
  AnalysisCompletedEvent,
  ShapeAnalysisEvent,
} from "./domain/analysis-event.js";

export type {
  ShapeAnalysisConfiguration,
  ShapeAnalysisRequest,
  ShapeAnalysisExecutionOptions,
  IdGenerator,
} from "./domain/analysis-request.js";
export { DEFAULT_SHAPE_ANALYSIS_CONFIGURATION } from "./domain/analysis-request.js";

export type {
  ShapeAnalysisMetadata,
  ShapeAnalysisResult,
} from "./domain/analysis-result.js";

export type { ShapeStatisticsKey } from "./domain/shape-statistics-key.js";
export {
  createLayoutKey,
  createShapeStatisticsKey,
  serializeShapeStatisticsKey,
} from "./domain/shape-statistics-key.js";

export type {
  ShapeDetectionContext,
  ShapeDetector,
} from "./detection/shape-detector.js";

export type { ShapeAnalyzerRegistry } from "./detection/shape-detector-registry.js";
export { DefaultShapeAnalyzerRegistry } from "./detection/shape-detector-registry.js";

export {
  ShapeAnalysisError,
  type ShapeAnalysisErrorCode,
  type ShapeAnalysisErrorDetails,
} from "./shape-analysis-error.js";

export {
  validateShapeAnalysisCard,
  validateShapeAnalysisCards,
} from "./validation/validate-shape-analysis-cards.js";

export {
  buildAnalysisCardSequence,
  buildForwardFromSelectedSequence,
  buildNewestToSelectedSequence,
  buildThroughSelectedSequence,
  validateChronology,
  countIgnoredNewerCards,
  countIgnoredOlderCards,
} from "./analysis-window.js";

export {
  buildHitMatrix,
  buildIntersectionHitMatrix,
  hitMatricesEqual,
  type HitMatrix,
} from "./hit-matrix.js";

export {
  createRectangleGeometryKey,
  createShapeGeometryKey,
  rectangleCellCount,
} from "./geometry-key.js";

export {
  RectangleShapeDetector,
  MaximalEmptyRectangleFinder,
  buildHitPrefixSum,
  countHitsInRectangle,
  isEmptyRectangle,
  isMaximalEmptyRectangle,
  compareRectangles,
  containsRectangle,
  isGeometricallyValidRectangle,
  fullGridSearchArea,
  type HitPrefixSum,
} from "./detection/rectangle/index.js";

export { SequentialIdGenerator } from "./id-generator.js";

export {
  BASIS_CARD_COUNT,
  CurrentShapePersistenceEngine,
  ShapeOccurrenceIndex,
  createShapeTrackingKey,
} from "./persistence/index.js";

export type {
  CurrentShapePersistenceRequest,
  ShapePersistenceDependencies,
  CurrentShapePersistenceEntry,
  CurrentShapePersistenceMetadata,
  CurrentShapePersistenceResult,
  CompletedRectangleRun,
} from "./persistence/index.js";

export {
  DEFAULT_HISTORICAL_SHAPE_RUN_OPTIONS,
  HistoricalShapeRunAnalyzer,
  buildFrequencyDistribution,
  buildSurvivalDistribution,
  calculateHistoricalRunPercentile,
  computeAverageRunLength,
  computeMedianRunLength,
  computeRunLengthMode,
  computeRunLengthQuantiles,
  detectShapeRuns,
  evaluateHistoricalDataQuality,
  nearestRankPercentile,
  resolveBoundaryStatus,
} from "./statistics/index.js";

export type {
  CensoredRunSummary,
  HistoricalOpenRunPolicy,
  HistoricalPercentileBreakdown,
  HistoricalRunDataQuality,
  HistoricalShapeBatchMetadata,
  HistoricalShapeRunAnalyzerDependencies,
  HistoricalShapeRunBatchRequest,
  HistoricalShapeRunBatchResult,
  HistoricalShapeRunOptions,
  HistoricalShapeRunRequest,
  HistoricalShapeRunStatistics,
  HistoricalShapeTarget,
  RunLengthFrequencyEntry,
  RunLengthMode,
  RunLengthQuantiles,
  RunLengthSurvivalEntry,
  ShapeRun,
  ShapeRunBoundaryStatus,
} from "./statistics/index.js";

export {
  DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION,
  DefaultShapeOverdueEvaluator,
  SHAPE_OVERDUE_DISCLAIMER_CODES,
  compareAgainstAverage,
  compareAgainstMaximum,
  compareAgainstMedian,
  compareAgainstModes,
  compareShapeOverdueEvaluations,
  evaluateShapeOverdueBatch,
  findProbabilityAtLeast,
  summarizeShapeOverdueBatch,
} from "./evaluation/index.js";

export type {
  AverageComparison,
  CurrentRunEvaluationInput,
  HistoricalRunEvaluationSummary,
  MaximumComparison,
  MaximumRelation,
  MedianComparison,
  ModeComparison,
  ModeRelation,
  ShapeOverdueBatchEntry,
  ShapeOverdueBatchRequest,
  ShapeOverdueBatchResult,
  ShapeOverdueBatchSummary,
  ShapeOverdueClassification,
  ShapeOverdueDataQuality,
  ShapeOverdueEvaluation,
  ShapeOverdueEvaluationConfiguration,
  ShapeOverdueEvaluationRequest,
  ShapeOverdueEvaluator,
  ShapeOverdueReason,
  ShapeRunComparisons,
} from "./evaluation/index.js";

export {
  DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
  applyVisualizationActions,
  buildEdgeContributions,
  buildShapeVisualizationPlan,
  computeShapeBrightnessLevel,
  createFinalVisibleOccurrences,
  createOccurrenceVisualizationKey,
  getRectangleEdgeKeysCached,
  getShapeColorKey,
  getShapeVisualColor,
  assignDistinctShapeColors,
  parseGridEdgeKey,
  playShapeVisualizationPlan,
  rectangleGeometryToEdgeKeys,
  renderGridEdges,
  resolveShapeCssColor,
  serializeGridEdgeKey,
} from "./visualization/index.js";

export type {
  CellEdge,
  CompleteVisualizationAction,
  GridEdgeKey,
  GridEdgeOrientation,
  RegisterSplitAction,
  RenderedGridEdge,
  ShapeBrightnessConfiguration,
  ShapeEdgeContribution,
  ShapeVisualizationAction,
  ShapeVisualizationConfiguration,
  ShapeVisualizationErrorCode,
  ShapeVisualizationOccurrence,
  ShapeVisualizationPlan,
  ShapeVisualizationRunnerOptions,
  ShapeVisualizationState,
  ShapeVisualizationStatus,
  ShapeVisualizationStep,
  ShapeVisualColor,
  ShowShapeOccurrenceAction,
  UpdateShapeBrightnessAction,
  VisibleShapeOccurrence,
} from "./visualization/index.js";
