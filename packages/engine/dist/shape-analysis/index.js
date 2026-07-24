export { isRectangleGeometry } from "./domain/geometry.js";
export { coveredCardCount, inheritPreviousCardCount, initialChildPreviousCardCount, createAnalysisBoundaryOutcome, } from "./domain/tracked-shape.js";
export { createEmptyEvolutionGraph, deduplicateByShapeKey, createOccurrenceKey, appendSplitEdge, } from "./domain/evolution-graph.js";
export { DEFAULT_SHAPE_ANALYSIS_CONFIGURATION } from "./domain/analysis-request.js";
export { createLayoutKey, createShapeStatisticsKey, serializeShapeStatisticsKey, } from "./domain/shape-statistics-key.js";
export { DefaultShapeAnalyzerRegistry } from "./detection/shape-detector-registry.js";
export { ShapeAnalysisError, } from "./shape-analysis-error.js";
export { validateShapeAnalysisCard, validateShapeAnalysisCards, } from "./validation/validate-shape-analysis-cards.js";
export { buildAnalysisCardSequence, buildForwardFromSelectedSequence, buildNewestToSelectedSequence, buildThroughSelectedSequence, validateChronology, countIgnoredNewerCards, countIgnoredOlderCards, } from "./analysis-window.js";
export { buildHitMatrix, buildIntersectionHitMatrix, hitMatricesEqual, } from "./hit-matrix.js";
export { createRectangleGeometryKey, createShapeGeometryKey, rectangleCellCount, } from "./geometry-key.js";
export { RectangleShapeDetector, MaximalEmptyRectangleFinder, buildHitPrefixSum, countHitsInRectangle, isEmptyRectangle, isMaximalEmptyRectangle, compareRectangles, containsRectangle, isGeometricallyValidRectangle, fullGridSearchArea, } from "./detection/rectangle/index.js";
export { SequentialIdGenerator } from "./id-generator.js";
export { BASIS_CARD_COUNT, CurrentShapePersistenceEngine, ShapeOccurrenceIndex, createShapeTrackingKey, } from "./persistence/index.js";
export { DEFAULT_HISTORICAL_SHAPE_RUN_OPTIONS, HistoricalShapeRunAnalyzer, buildFrequencyDistribution, buildSurvivalDistribution, calculateHistoricalRunPercentile, computeAverageRunLength, computeMedianRunLength, computeRunLengthMode, computeRunLengthQuantiles, detectShapeRuns, evaluateHistoricalDataQuality, nearestRankPercentile, resolveBoundaryStatus, } from "./statistics/index.js";
export { DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION, DefaultShapeOverdueEvaluator, SHAPE_OVERDUE_DISCLAIMER_CODES, compareAgainstAverage, compareAgainstMaximum, compareAgainstMedian, compareAgainstModes, compareShapeOverdueEvaluations, evaluateShapeOverdueBatch, findProbabilityAtLeast, summarizeShapeOverdueBatch, } from "./evaluation/index.js";
export { DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION, applyVisualizationActions, buildEdgeContributions, buildShapeVisualizationPlan, computeShapeBrightnessLevel, createFinalVisibleOccurrences, createOccurrenceVisualizationKey, getRectangleEdgeKeysCached, getShapeColorKey, getShapeVisualColor, assignDistinctShapeColors, parseGridEdgeKey, playShapeVisualizationPlan, rectangleGeometryToEdgeKeys, renderGridEdges, resolveShapeCssColor, serializeGridEdgeKey, } from "./visualization/index.js";
//# sourceMappingURL=index.js.map