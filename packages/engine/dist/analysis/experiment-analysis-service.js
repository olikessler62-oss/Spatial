import { RankingEngine, } from "../ranking/ranking-engine.js";
import { ExperimentAnalysisError, } from "./experiment-analysis-error.js";
export class ExperimentAnalysisService {
    rankingEngine;
    now;
    constructor(dependencies = {}) {
        this.rankingEngine =
            dependencies.rankingEngine ?? new RankingEngine();
        this.now = dependencies.now ?? Date.now;
    }
    analyze(request) {
        this.validateRequest(request);
        const startedAt = this.now();
        const rankableResults = request.candidates.map((candidate) => {
            const metricValues = {};
            for (const adapter of request.metricAdapters) {
                const metricResult = adapter.metric.calculate(candidate.executionResult);
                metricValues[adapter.metric.name] =
                    adapter.extractRankingValue(metricResult);
            }
            return {
                resultId: candidate.resultId,
                metricValues,
            };
        });
        const ranking = this.rankingEngine.rank(rankableResults, request.configuration.ranking);
        const finishedAt = this.now();
        return {
            metadata: {
                experimentId: request.metadata.experimentId,
                createdAt: request.metadata.createdAt,
                generatedAt: request.generatedAt ??
                    new Date(finishedAt).toISOString(),
                runtimeMs: Math.max(0, finishedAt - startedAt),
                ...(request.metadata.engineVersion === undefined
                    ? {}
                    : {
                        engineVersion: request.metadata.engineVersion,
                    }),
            },
            configuration: {
                layout: request.configuration.layout,
                placementGenerator: request.configuration.placementGenerator,
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
    validateRequest(request) {
        if (request.metadata.experimentId.trim().length === 0) {
            throw new ExperimentAnalysisError("EMPTY_EXPERIMENT_ID", "Experiment ID must not be empty.");
        }
        if (!this.isValidDate(request.metadata.createdAt)) {
            throw new ExperimentAnalysisError("INVALID_CREATED_AT", `Created-at value "${request.metadata.createdAt}" is invalid.`);
        }
        const resultIds = new Set();
        request.candidates.forEach((candidate, candidateIndex) => {
            const resultId = candidate.resultId.trim();
            if (resultId.length === 0) {
                throw new ExperimentAnalysisError("EMPTY_RESULT_ID", "Candidate result ID must not be empty.", {
                    candidateIndex,
                });
            }
            if (resultIds.has(resultId)) {
                throw new ExperimentAnalysisError("DUPLICATE_RESULT_ID", `Candidate result ID "${resultId}" occurs more than once.`, {
                    resultId,
                    candidateIndex,
                });
            }
            resultIds.add(resultId);
        });
    }
    isValidDate(value) {
        if (value.trim().length === 0) {
            return false;
        }
        return Number.isFinite(Date.parse(value));
    }
}
//# sourceMappingURL=experiment-analysis-service.js.map