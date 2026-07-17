import type { ExperimentExecutionResult } from "../domain/experiment.js";
import type { RankingConfiguration } from "../ranking/ranking-types.js";
import type { ExperimentReportConfiguration } from "../reports/report-types.js";
import type { MetricRankingAdapter } from "./metric-ranking-adapter.js";
export interface ExperimentAnalysisMetadata {
    readonly experimentId: string;
    readonly createdAt: string;
    readonly engineVersion?: string;
}
export interface ExperimentAnalysisCandidate {
    readonly resultId: string;
    readonly executionResult: ExperimentExecutionResult;
}
export interface ExperimentAnalysisConfiguration extends ExperimentReportConfiguration {
    readonly ranking: RankingConfiguration;
}
export interface ExperimentAnalysisRequest {
    readonly metadata: ExperimentAnalysisMetadata;
    readonly candidates: readonly ExperimentAnalysisCandidate[];
    readonly metricAdapters: readonly MetricRankingAdapter[];
    readonly configuration: ExperimentAnalysisConfiguration;
    readonly generatedAt?: string;
}
export type RuntimeNow = () => number;
//# sourceMappingURL=experiment-analysis-types.d.ts.map