import { describe, expect, it } from "vitest";
import type {
  ExperimentExecutionResult,
} from "../../src/domain/experiment.js";
import {
  ExperimentAnalysisError,
} from "../../src/analysis/experiment-analysis-error.js";
import {
  ExperimentAnalysisService,
} from "../../src/analysis/experiment-analysis-service.js";
import type {
  ExperimentAnalysisRequest,
} from "../../src/analysis/experiment-analysis-types.js";
import {
  createMetricRankingAdapter,
} from "../../src/analysis/metric-ranking-adapter.js";
import {
  AverageHitMetric,
} from "../../src/analysis/metrics/average-hit-metric.js";

function createExecutionResult(
  experimentId: string,
  hitCounts: readonly number[],
): ExperimentExecutionResult {
  return {
    experimentId,
    analyzedDraws: hitCounts.length,
    analyzedPlacements: 1,
    comparisons: hitCounts.length,
    results: hitCounts.map((hitCount, index) => ({
      anchorValue: 1,
      drawDate: `2026-01-${String(index + 1).padStart(2, "0")}`,
      hitCount,
      placementSize: 5,
      coverage: hitCount / 5,
      isHit: hitCount > 0,
    })),
    placementSummaries: [],
  };
}

function createRequest(): ExperimentAnalysisRequest {
  const averageHitMetric = new AverageHitMetric();

  return {
    metadata: {
      experimentId: "experiment-1",
      createdAt: "2026-07-17T10:00:00.000Z",
      engineVersion: "0.5.0",
    },
    candidates: [
      {
        resultId: "result-a",
        executionResult: createExecutionResult(
          "experiment-1",
          [1, 3],
        ),
      },
      {
        resultId: "result-b",
        executionResult: createExecutionResult(
          "experiment-1",
          [2, 4],
        ),
      },
    ],
    metricAdapters: [
      createMetricRankingAdapter(
        averageHitMetric,
        (result) => result.averageHits,
      ),
    ],
    configuration: {
      layout: {
        type: "test-layout",
      },
      placementGenerator: {
        type: "test-generator",
      },
      metrics: [
        {
          id: averageHitMetric.name,
        },
      ],
      ranking: {
        criteria: [
          {
            metricId: averageHitMetric.name,
            weight: 1,
            direction: "descending",
          },
        ],
      },
    },
    generatedAt: "2026-07-17T12:00:00.000Z",
  };
}

describe("ExperimentAnalysisService", () => {
  it("creates an experiment report for a valid request", () => {
    const service = new ExperimentAnalysisService({
      now: () => 100,
    });

    const report = service.analyze(createRequest());

    expect(report.metadata).toEqual({
      experimentId: "experiment-1",
      createdAt: "2026-07-17T10:00:00.000Z",
      generatedAt: "2026-07-17T12:00:00.000Z",
      runtimeMs: 0,
      engineVersion: "0.5.0",
    });

    expect(report.statistics).toEqual({
      totalPlacements: 2,
      evaluatedPlacements: 2,
      rejectedPlacements: 0,
      rankedPlacements: 2,
    });

    expect(report.ranking.totalResultCount).toBe(2);
    expect(report.ranking.entries).toHaveLength(2);

    expect(report.ranking.entries[0]).toMatchObject({
      rank: 1,
      resultId: "result-b",
    });

    expect(report.ranking.entries[1]).toMatchObject({
      rank: 2,
      resultId: "result-a",
    });
  });

  it("throws EMPTY_EXPERIMENT_ID for an empty experiment ID", () => {
    const service = new ExperimentAnalysisService();
    const request = createRequest();

    const invalidRequest: ExperimentAnalysisRequest = {
      ...request,
      metadata: {
        ...request.metadata,
        experimentId: "   ",
      },
    };

    expect(() => service.analyze(invalidRequest)).toThrowError(
      expect.objectContaining<Partial<ExperimentAnalysisError>>({
        code: "EMPTY_EXPERIMENT_ID",
      }),
    );
  });

  it("throws INVALID_CREATED_AT for an invalid creation timestamp", () => {
    const service = new ExperimentAnalysisService();
    const request = createRequest();

    const invalidRequest: ExperimentAnalysisRequest = {
      ...request,
      metadata: {
        ...request.metadata,
        createdAt: "not-a-date",
      },
    };

    expect(() => service.analyze(invalidRequest)).toThrowError(
      expect.objectContaining<Partial<ExperimentAnalysisError>>({
        code: "INVALID_CREATED_AT",
      }),
    );
  });

  it("throws EMPTY_RESULT_ID for an empty result ID", () => {
    const service = new ExperimentAnalysisService();
    const request = createRequest();

    const invalidRequest: ExperimentAnalysisRequest = {
      ...request,
      candidates: [
        {
          ...request.candidates[0]!,
          resultId: " ",
        },
      ],
    };

    expect(() => service.analyze(invalidRequest)).toThrowError(
      expect.objectContaining<Partial<ExperimentAnalysisError>>({
        code: "EMPTY_RESULT_ID",
        details: {
          candidateIndex: 0,
        },
      }),
    );
  });

  it("throws DUPLICATE_RESULT_ID for duplicate result IDs", () => {
    const service = new ExperimentAnalysisService();
    const request = createRequest();

    const duplicateResultId =
      request.candidates[0]!.resultId;

    const invalidRequest: ExperimentAnalysisRequest = {
      ...request,
      candidates: [
        request.candidates[0]!,
        {
          ...request.candidates[1]!,
          resultId: duplicateResultId,
        },
      ],
    };

    expect(() => service.analyze(invalidRequest)).toThrowError(
      expect.objectContaining<Partial<ExperimentAnalysisError>>({
        code: "DUPLICATE_RESULT_ID",
        details: {
          resultId: duplicateResultId,
          candidateIndex: 1,
        },
      }),
    );
  });

  it("uses extracted metric values for ranking", () => {
    const service = new ExperimentAnalysisService({
      now: () => 100,
    });

    const report = service.analyze(createRequest());

    expect(report.ranking.entries[0]?.criteria).toEqual([
      {
        metricId: "average-hits",
        rawValue: 3,
        normalizedValue: 1,
        normalizedWeight: 1,
        contribution: 1,
      },
    ]);

    expect(report.ranking.entries[1]?.criteria).toEqual([
      {
        metricId: "average-hits",
        rawValue: 2,
        normalizedValue: 0,
        normalizedWeight: 1,
        contribution: 0,
      },
    ]);
  });
});