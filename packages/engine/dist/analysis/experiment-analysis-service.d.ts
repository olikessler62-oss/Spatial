import { RankingEngine } from "../ranking/ranking-engine.js";
import type { ExperimentReport } from "../reports/report-types.js";
import type { ExperimentAnalysisRequest, RuntimeNow } from "./experiment-analysis-types.js";
export interface ExperimentAnalysisServiceDependencies {
    readonly rankingEngine?: RankingEngine;
    readonly now?: RuntimeNow;
}
export declare class ExperimentAnalysisService {
    private readonly rankingEngine;
    private readonly now;
    constructor(dependencies?: ExperimentAnalysisServiceDependencies);
    analyze(request: ExperimentAnalysisRequest): ExperimentReport;
    private validateRequest;
    private isValidDate;
}
//# sourceMappingURL=experiment-analysis-service.d.ts.map