import type { ExperimentReport } from "../reports/report-types.js";
import { ExperimentRunner } from "../experiment/experiment-runner.js";
import { ExperimentAnalysisService } from "../analysis/experiment-analysis-service.js";
import type { ExperimentOrchestratorRequest } from "./experiment-orchestrator-types.js";
export interface ExperimentOrchestratorDependencies {
    readonly experimentRunner?: ExperimentRunner;
    readonly analysisService?: ExperimentAnalysisService;
}
export declare class ExperimentOrchestrator {
    private readonly experimentRunner;
    private readonly analysisService;
    constructor(dependencies?: ExperimentOrchestratorDependencies);
    run(request: ExperimentOrchestratorRequest): ExperimentReport;
}
//# sourceMappingURL=experiment-orchestrator.d.ts.map