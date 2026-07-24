import { describe, expect, it } from "vitest";

import {
  buildStabilitySegments,
  runExperiment1MultiSeed,
} from "../../src/experiment/experiment1-report.js";
import { runNonSpatialGroupBaseline } from "../../src/experiment/baselines/nonspatial-group-baseline.js";
import type { WalkForwardStep } from "../../src/experiment/walk-forward-runner.js";
import type { ParsedDraw } from "../../src/domain/parsed-draw.js";

function stubStep(
  drawIndex: number,
  hit: boolean,
): WalkForwardStep {
  return {
    drawIndex,
    drawDate: `2020-01-${String(drawIndex + 1).padStart(2, "0")}`,
    historySize: drawIndex,
    actualMainNumbers: [1, 2, 3, 4, 5, 6],
    top1: {
      resultId: "a",
      shapeId: "s",
      shapeName: "S",
      anchorValue: 1,
      values: [1, 2, 3, 4],
      features: {
        drawsSinceLastHit: 0,
        averageHistoricalGap: 0,
        maximumHistoricalGap: 0,
        hitFrequency: 0,
        hitsLast10: 0,
        hitsLast25: 0,
        hitsLast50: 0,
        currentGapRatio: 0,
        recentInactivity: 1,
      },
      score: 1,
      hitCount: hit ? 1 : 0,
      hitAtLeast1: hit,
      hitAtLeast2: false,
    },
    top5: [],
  };
}

describe("stability segments", () => {
  it("splits steps into three chronological thirds", () => {
    const steps = Array.from({ length: 9 }, (_, index) =>
      stubStep(index + 10, index < 3),
    );

    const segments = buildStabilitySegments(steps);
    expect(segments).toHaveLength(3);
    expect(segments[0]!.drawCount).toBe(3);
    expect(segments[0]!.top1HitRate).toBe(1);
  });
});

describe("non-spatial baseline", () => {
  it("supports minHits=2", () => {
    const draws: ParsedDraw[] = Array.from({ length: 20 }, (_, index) => ({
      drawDate: `2020-02-${String((index % 28) + 1).padStart(2, "0")}`,
      mainNumbers: [1, 2, 3, 4, 5, 6],
      bonusNumbers: [0],
      sourceRow: index + 1,
    }));

    const pool = Array.from({ length: 49 }, (_, index) => index + 1);
    const result = runNonSpatialGroupBaseline({
      draws,
      testStartIndex: 10,
      testEndIndex: 15,
      topK: 1,
      groupSize: 4,
      numberPool: pool,
      minHits: 2,
      seeds: ["a", "b"],
    });

    expect(result.repetitions).toBe(2);
    expect(Number.isFinite(result.meanHitRate)).toBe(true);
  });
});

describe("holdout multi-seed", () => {
  it("selects on selection window and reports holdout", () => {
    const draws: ParsedDraw[] = Array.from({ length: 40 }, (_, index) => {
      const base = (index % 44) + 1;
      return {
        drawDate: `2019-03-${String((index % 28) + 1).padStart(2, "0")}`,
        mainNumbers: [base, base + 1, base + 2, base + 3, base + 4, base + 5],
        bonusNumbers: [0],
        sourceRow: index + 1,
      };
    });

    const multi = runExperiment1MultiSeed({
      draws,
      datasetLabel: "test",
      seedCount: 3,
      initialHistorySize: 10,
      holdoutStartIndex: 25,
      baselineRepetitions: 4,
    });

    expect(multi.protocol.selectionFromIndex).toBe(10);
    expect(multi.protocol.selectionToIndexExclusive).toBe(25);
    expect(multi.protocol.holdoutFromIndex).toBe(25);
    expect(multi.runs).toHaveLength(3);
    expect(multi.holdout.drawCount).toBe(15);
    expect(multi.selection.drawCount).toBe(15);
    expect(multi.best.configuration.layoutSeed).toBe(
      `experiment1-fixed-layout-${multi.bestSeedIndex}`,
    );
  });
});
