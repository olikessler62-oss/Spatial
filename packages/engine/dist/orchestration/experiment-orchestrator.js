import { ExperimentRunner, } from "../experiment/experiment-runner.js";
import { ExperimentAnalysisService, } from "../analysis/experiment-analysis-service.js";
export class ExperimentOrchestrator {
    experimentRunner;
    analysisService;
    constructor(dependencies = {}) {
        this.experimentRunner =
            dependencies.experimentRunner
                ?? new ExperimentRunner();
        this.analysisService =
            dependencies.analysisService
                ?? new ExperimentAnalysisService();
    }
    run(request) {
        const candidates = request.candidates.map((candidate) => ({
            resultId: candidate.resultId,
            executionResult: this.experimentRunner.run(candidate.input),
        }));
        const analysisRequest = {
            metadata: request.metadata,
            candidates,
            metricAdapters: request.metricAdapters,
            configuration: request.configuration,
            ...(request.generatedAt === undefined
                ? {}
                : {
                    generatedAt: request.generatedAt,
                }),
        };
        return this.analysisService.analyze(analysisRequest);
    }
}
//# sourceMappingURL=experiment-orchestrator.js.map