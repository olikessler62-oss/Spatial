import {
  RankingEngine,
} from "../ranking/ranking-engine.js";
import type {
  RankableResult,
} from "../ranking/ranking-types.js";
import type {
  ExperimentReport,
} from "../reports/report-types.js";
import {
  ExperimentAnalysisError,
} from "./experiment-analysis-error.js";
import type {
  ExperimentAnalysisRequest,
  RuntimeNow,
} from "./experiment-analysis-types.js";

export interface ExperimentAnalysisServiceDependencies {
  readonly rankingEngine?: RankingEngine;
  readonly now?: RuntimeNow;
}

export class ExperimentAnalysisService {
  private readonly rankingEngine: RankingEngine;
  private readonly now: RuntimeNow;

  public constructor(
    dependencies: ExperimentAnalysisServiceDependencies = {},
  ) {
    this.rankingEngine =
      dependencies.rankingEngine ?? new RankingEngine();

    this.now = dependencies.now ?? Date.now;
  }

  public analyze(
    request: ExperimentAnalysisRequest,
  ): ExperimentReport {
    this.validateRequest(request);

    const startedAt = this.now();

    const rankableResults = request.candidates.map(
      (candidate): RankableResult => {
        const metricValues: Record<string, number> = {};

        for (const adapter of request.metricAdapters) {
          const metricResult = adapter.metric.calculate(
            candidate.executionResult,
          );

          metricValues[adapter.metric.name] =
            adapter.extractRankingValue(metricResult);
        }

        return {
          resultId: candidate.resultId,
          metricValues,
        };
      },
    );

    const ranking = this.rankingEngine.rank(
      rankableResults,
      request.configuration.ranking,
    );

    const finishedAt = this.now();

    return {
      metadata: {
        experimentId: request.metadata.experimentId,
        createdAt: request.metadata.createdAt,
        generatedAt:
          request.generatedAt ??
          new Date(finishedAt).toISOString(),
        runtimeMs: Math.max(0, finishedAt - startedAt),
        ...(request.metadata.engineVersion === undefined
          ? {}
          : {
              engineVersion:
                request.metadata.engineVersion,
            }),
      },

      configuration: {
        layout: request.configuration.layout,
        placementGenerator:
          request.configuration.placementGenerator,
        metrics: request.configuration.metrics,
        ranking: request.configuration.ranking,
      },

      statistics: {
        totalPlacements: request.candidates.length,
        evaluatedPlacements: rankableResults.length,
        rejectedPlacements: 0,
        rankedPlacements: ranking.entries.length,
      },

      ranking: {
        entries: ranking.entries,
        appliedCriteria: ranking.appliedCriteria,
        totalResultCount: ranking.totalResultCount,
      },
    };
  }

  private validateRequest(
    request: ExperimentAnalysisRequest,
  ): void {
    if (request.metadata.experimentId.trim().length === 0) {
      throw new ExperimentAnalysisError(
        "EMPTY_EXPERIMENT_ID",
        "Experiment ID must not be empty.",
      );
    }

    if (!this.isValidDate(request.metadata.createdAt)) {
      throw new ExperimentAnalysisError(
        "INVALID_CREATED_AT",
        `Created-at value "${request.metadata.createdAt}" is invalid.`,
      );
    }

    const resultIds = new Set<string>();

    request.candidates.forEach(
      (candidate, candidateIndex): void => {
        const resultId = candidate.resultId.trim();

        if (resultId.length === 0) {
          throw new ExperimentAnalysisError(
            "EMPTY_RESULT_ID",
            "Candidate result ID must not be empty.",
            {
              candidateIndex,
            },
          );
        }

        if (resultIds.has(resultId)) {
          throw new ExperimentAnalysisError(
            "DUPLICATE_RESULT_ID",
            `Candidate result ID "${resultId}" occurs more than once.`,
            {
              resultId,
              candidateIndex,
            },
          );
        }

        resultIds.add(resultId);
      },
    );
  }

  private isValidDate(value: string): boolean {
    if (value.trim().length === 0) {
      return false;
    }

    return Number.isFinite(Date.parse(value));
  }
}