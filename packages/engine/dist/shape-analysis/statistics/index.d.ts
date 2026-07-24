export type { ShapeRunBoundaryStatus, ShapeRun, HistoricalOpenRunPolicy, HistoricalShapeRunOptions, RunLengthFrequencyEntry, RunLengthSurvivalEntry, RunLengthMode, RunLengthQuantiles, HistoricalRunDataQuality, CensoredRunSummary, HistoricalPercentileBreakdown, } from "./shape-run.js";
export { DEFAULT_HISTORICAL_SHAPE_RUN_OPTIONS } from "./shape-run.js";
export type { HistoricalShapeRunRequest, HistoricalShapeTarget, HistoricalShapeRunBatchRequest, HistoricalShapeRunAnalyzerDependencies, } from "./historical-shape-run-request.js";
export type { HistoricalShapeRunStatistics, HistoricalShapeBatchMetadata, HistoricalShapeRunBatchResult, } from "./historical-shape-run-result.js";
export { detectShapeRuns, resolveBoundaryStatus, } from "./run-detector.js";
export { buildFrequencyDistribution, buildSurvivalDistribution, computeRunLengthMode, computeAverageRunLength, computeMedianRunLength, nearestRankPercentile, computeRunLengthQuantiles, evaluateHistoricalDataQuality, calculateHistoricalRunPercentile, } from "./run-statistics.js";
export { HistoricalShapeRunAnalyzer, } from "./historical-shape-run-analyzer.js";
//# sourceMappingURL=index.d.ts.map