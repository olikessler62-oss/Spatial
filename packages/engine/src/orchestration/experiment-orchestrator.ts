import type {
  ExperimentReport,
} from "../reports/report-types.js";
import {
  ExperimentRunner,
} from "../experiment/experiment-runner.js";
import {
  ExperimentAnalysisService,
} from "../analysis/experiment-analysis-service.js";
import type {
  ExperimentAnalysisRequest,
} from "../analysis/experiment-analysis-types.js";
import type {
  ExperimentOrchestratorRequest,
} from "./experiment-orchestrator-types.js";

export interface ExperimentOrchestratorDependencies {
  readonly experimentRunner?: ExperimentRunner;
  readonly analysisService?: ExperimentAnalysisService;
}

export class ExperimentOrchestrator {
  private readonly experimentRunner: ExperimentRunner;
  private readonly analysisService:
    ExperimentAnalysisService;

  public constructor(
    dependencies:
      ExperimentOrchestratorDependencies = {},
  ) {
    this.experimentRunner =
      dependencies.experimentRunner
      ?? new ExperimentRunner();

    this.analysisService =
      dependencies.analysisService
      ?? new ExperimentAnalysisService();
  }

  public run(
    request: ExperimentOrchestratorRequest,
  ): ExperimentReport {
    const candidates = request.candidates.map(
      (candidate) => ({
        resultId: candidate.resultId,
        executionResult:
          this.experimentRunner.run(candidate.input),
      }),
    );

    const analysisRequest: ExperimentAnalysisRequest = {
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

    return this.analysisService.analyze(
      analysisRequest,
    );
  }
}