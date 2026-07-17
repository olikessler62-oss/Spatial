import type { ExperimentInput } from "../domain/experiment.js";
import type { ExperimentAnalysisConfiguration, ExperimentAnalysisMetadata } from "../analysis/experiment-analysis-types.js";
import type { MetricRankingAdapter } from "../analysis/metric-ranking-adapter.js";
export interface ExperimentOrchestratorCandidate {
    readonly resultId: string;
    readonly input: ExperimentInput;
}
export interface ExperimentOrchestratorRequest {
    readonly metadata: ExperimentAnalysisMetadata;
    readonly candidates: readonly ExperimentOrchestratorCandidate[];
    readonly metricAdapters: readonly MetricRankingAdapter[];
    readonly configuration: ExperimentAnalysisConfiguration;
    readonly generatedAt?: string;
}
//# sourceMappingURL=experiment-orchestrator-types.d.ts.map