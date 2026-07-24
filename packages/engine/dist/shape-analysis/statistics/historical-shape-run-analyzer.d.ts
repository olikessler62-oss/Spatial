import type { HistoricalShapeRunAnalyzerDependencies, HistoricalShapeRunBatchRequest, HistoricalShapeRunRequest } from "./historical-shape-run-request.js";
import type { HistoricalShapeRunBatchResult, HistoricalShapeRunStatistics } from "./historical-shape-run-result.js";
export declare class HistoricalShapeRunAnalyzer {
    private readonly dependencies;
    constructor(dependencies: HistoricalShapeRunAnalyzerDependencies);
    analyze(request: HistoricalShapeRunRequest): HistoricalShapeRunStatistics;
    analyzeBatch(request: HistoricalShapeRunBatchRequest): HistoricalShapeRunBatchResult;
    private buildStatistics;
    private buildCensoredSummary;
    private buildPresenceSequence;
    private prepareCards;
    private assertDetector;
    private assertGeometry;
    private resolveOptions;
    private deduplicateTargets;
}
export { calculateHistoricalRunPercentile } from "./run-statistics.js";
//# sourceMappingURL=historical-shape-run-analyzer.d.ts.map