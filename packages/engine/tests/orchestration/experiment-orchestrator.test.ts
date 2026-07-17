import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  IndexedDraw,
} from "../../src/indexing/draw-indexer.js";
import type {
  IndexedPlacement,
} from "../../src/indexing/placement-indexer.js";
import {
  BitMask,
} from "../../src/indexing/bit-mask.js";
import {
  ExperimentOrchestrator,
} from "../../src/orchestration/experiment-orchestrator.js";
import {
  AverageHitMetric,
} from "../../src/analysis/metrics/average-hit-metric.js";
import {
  MaxHitMetric,
} from "../../src/analysis/metrics/max-hit-metric.js";
import {
  createMetricRankingAdapter,
} from "../../src/analysis/metric-ranking-adapter.js";

function createPlacement(
  anchorValue: number,
  values: readonly number[],
): IndexedPlacement {
  return {
    anchorValue,
    positionCount: values.length,
    mask: BitMask.fromIndices(values),
  };
}

function createDraw(
  drawDate: string,
  values: readonly number[],
): IndexedDraw {
  return {
    drawDate,
    mask: BitMask.fromIndices(values),
  };
}

describe("ExperimentOrchestrator", () => {
  it(
    "runs experiment candidates and returns a ranked report",
    () => {
      const averageHitMetric =
        new AverageHitMetric();

      const maxHitMetric =
        new MaxHitMetric();

      const orchestrator =
        new ExperimentOrchestrator();

      const report = orchestrator.run({
        metadata: {
          experimentId: "orchestrator-test",
          createdAt:
            "2026-07-17T13:00:00.000Z",
          engineVersion: "0.5.0",
        },

        candidates: [
          {
            resultId: "candidate-a",
            input: {
              experimentId: "candidate-a-run",
              placements: [
                createPlacement(
                  1,
                  [1, 2, 3, 4, 5],
                ),
              ],
              draws: [
                createDraw(
                  "2026-01-01",
                  [1, 20, 21, 22, 23],
                ),
                createDraw(
                  "2026-01-02",
                  [1, 2, 20, 21, 22],
                ),
              ],
            },
          },
          {
            resultId: "candidate-b",
            input: {
              experimentId: "candidate-b-run",
              placements: [
                createPlacement(
                  2,
                  [10, 11, 12, 13, 14],
                ),
              ],
              draws: [
                createDraw(
                  "2026-01-01",
                  [10, 11, 12, 20, 21],
                ),
                createDraw(
                  "2026-01-02",
                  [10, 11, 12, 13, 20],
                ),
              ],
            },
          },
        ],

        metricAdapters: [
          createMetricRankingAdapter(
            averageHitMetric,
            (result) =>
              result.averageHits,
          ),
          createMetricRankingAdapter(
            maxHitMetric,
            (result) =>
              result.maximumHits,
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
              id: "average-hits",
            },
            {
              id: "maximum-hits",
            },
          ],
          ranking: {
            criteria: [
              {
                metricId: "average-hits",
                weight: 0.7,
                direction: "descending",
              },
              {
                metricId: "maximum-hits",
                weight: 0.3,
                direction: "descending",
              },
            ],
          },
        },

        generatedAt:
          "2026-07-17T13:05:00.000Z",
      });

      expect(report.metadata).toMatchObject({
        experimentId: "orchestrator-test",
        createdAt:
          "2026-07-17T13:00:00.000Z",
        generatedAt:
          "2026-07-17T13:05:00.000Z",
        engineVersion: "0.5.0",
      });

      expect(report.statistics).toEqual({
        totalPlacements: 2,
        evaluatedPlacements: 2,
        rejectedPlacements: 0,
        rankedPlacements: 2,
      });

      expect(
        report.ranking.entries,
      ).toHaveLength(2);

      expect(
        report.ranking.entries[0],
      ).toMatchObject({
        rank: 1,
        resultId: "candidate-b",
        score: 1,
      });

      expect(
        report.ranking.entries[1],
      ).toMatchObject({
        rank: 2,
        resultId: "candidate-a",
        score: 0,
      });
    },
  );

  it(
    "returns an empty ranking when no candidates are provided",
    () => {
      const averageHitMetric =
        new AverageHitMetric();

      const orchestrator =
        new ExperimentOrchestrator();

      const report = orchestrator.run({
        metadata: {
          experimentId: "empty-orchestrator-test",
          createdAt:
            "2026-07-17T13:00:00.000Z",
        },

        candidates: [],

        metricAdapters: [
          createMetricRankingAdapter(
            averageHitMetric,
            (result) =>
              result.averageHits,
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
              id: "average-hits",
            },
          ],
          ranking: {
            criteria: [
              {
                metricId: "average-hits",
                weight: 1,
                direction: "descending",
              },
            ],
          },
        },

        generatedAt:
          "2026-07-17T13:05:00.000Z",
      });

      expect(report.statistics).toEqual({
        totalPlacements: 0,
        evaluatedPlacements: 0,
        rejectedPlacements: 0,
        rankedPlacements: 0,
      });

      expect(report.ranking.entries).toEqual([]);
      expect(
        report.ranking.totalResultCount,
      ).toBe(0);
    },
  );
});