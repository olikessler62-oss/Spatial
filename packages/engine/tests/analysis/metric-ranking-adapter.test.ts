import { describe, expect, it } from "vitest";

import type {
  ExperimentExecutionResult,
} from "../../src/domain/experiment.js";
import {
  AverageHitMetric,
  type AverageHitMetricResult,
} from "../../src/analysis/metrics/average-hit-metric.js";
import {
  MaxHitMetric,
  type MaxHitMetricResult,
} from "../../src/analysis/metrics/max-hit-metric.js";
import {
  createMetricRankingAdapter,
  type MetricRankingAdapter,
} from "../../src/analysis/metric-ranking-adapter.js";

describe("createMetricRankingAdapter", () => {
  it("creates an adapter for AverageHitMetric", () => {
    const metric = new AverageHitMetric();

    const adapter = createMetricRankingAdapter(
      metric,
      (result) => result.averageHits,
    );

    const metricResult: AverageHitMetricResult = {
      name: "average-hits",
      averageHits: 4.5,
    };

    expect(adapter.metric).toBe(metric);
    expect(
      adapter.extractRankingValue(metricResult),
    ).toBe(4.5);
  });

  it("creates an adapter for MaxHitMetric", () => {
    const metric = new MaxHitMetric();

    const adapter = createMetricRankingAdapter(
      metric,
      (result) => result.maximumHits,
    );

    const metricResult: MaxHitMetricResult = {
      name: "maximum-hits",
      maximumHits: 12,
    };

    expect(adapter.metric).toBe(metric);
    expect(
      adapter.extractRankingValue(metricResult),
    ).toBe(12);
  });

  it("preserves the metric instance", () => {
    const metric = new AverageHitMetric();

    const adapter: MetricRankingAdapter =
      createMetricRankingAdapter(
        metric,
        (result) => result.averageHits,
      );

    expect(adapter.metric).toBe(metric);
  });

  it("delegates value extraction to the supplied function", () => {
    const metric = new AverageHitMetric();

    let receivedResult:
      | AverageHitMetricResult
      | undefined;

    const adapter = createMetricRankingAdapter(
      metric,
      (result) => {
        receivedResult = result;

        return result.averageHits * 2;
      },
    );

    const metricResult: AverageHitMetricResult = {
      name: "average-hits",
      averageHits: 3,
    };

    const value =
      adapter.extractRankingValue(metricResult);

    expect(receivedResult).toBe(metricResult);
    expect(value).toBe(6);
  });

  it("does not execute the metric while creating the adapter", () => {
    let calculationCount = 0;

    const metric = {
      name: "test-metric",

      calculate(
        _experiment: ExperimentExecutionResult,
      ) {
        calculationCount += 1;

        return {
          name: "test-metric",
          value: 7,
        };
      },
    };

    const adapter = createMetricRankingAdapter(
      metric,
      (result) => result.value,
    );

    expect(calculationCount).toBe(0);
    expect(adapter.metric).toBe(metric);
  });
});