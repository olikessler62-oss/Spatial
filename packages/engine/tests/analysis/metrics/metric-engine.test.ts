import { expect, it } from "vitest";

import type {
  ExperimentExecutionResult,
} from "../../../src/domain/experiment.js";

import { MetricEngine } from "../../../src/analysis/metrics/metric-engine.js";
import { AverageHitMetric } from "../../../src/analysis/metrics/average-hit-metric.js";
import { MaxHitMetric } from "../../../src/analysis/metrics/max-hit-metric.js";
import { HitDistributionMetric } from "../../../src/analysis/metrics/hit-distribution.js";

it("calculates multiple metrics", () => {
  const engine = new MetricEngine([
    new AverageHitMetric(),
    new MaxHitMetric(),
    new HitDistributionMetric(),
  ]);

  const experiment: ExperimentExecutionResult = {
    experimentId: "experiment-1",
    analyzedDraws: 3,
    analyzedPlacements: 1,
    comparisons: 3,
    results: [
      {
        anchorValue: 1,
        drawDate: "2026-01-01",
        hitCount: 0,
        placementSize: 3,
        coverage: 0,
        isHit: false,
      },
      {
        anchorValue: 1,
        drawDate: "2026-01-02",
        hitCount: 2,
        placementSize: 3,
        coverage: 2 / 3,
        isHit: true,
      },
      {
        anchorValue: 1,
        drawDate: "2026-01-03",
        hitCount: 3,
        placementSize: 3,
        coverage: 1,
        isHit: true,
      },
    ],
    placementSummaries: [
      {
        anchorValue: 1,
        placementSize: 3,
        analyzedDraws: 3,
        drawsWithHits: 2,
        totalHits: 5,
        maximumHits: 3,
        averageHits: 5 / 3,
      },
    ],
  };

  const metrics = engine.calculate(experiment);

  expect(metrics).toHaveLength(3);
});