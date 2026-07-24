import { describe, expect, it } from "vitest";

import { GridLayout } from "../../src/layout/grid-layout.js";
import { createShuffledValueMapping } from "../../src/layout/value-mapping.js";
import { WalkForwardRunner } from "../../src/experiment/walk-forward-runner.js";
import type { ParsedDraw } from "../../src/domain/parsed-draw.js";
import type { ShapeDefinition } from "../../src/domain/shape.js";

function createDraws(count: number): ParsedDraw[] {
  const draws: ParsedDraw[] = [];

  for (let index = 0; index < count; index += 1) {
    const base = (index % 44) + 1;
    draws.push({
      drawDate: `2020-01-${String((index % 28) + 1).padStart(2, "0")}`,
      mainNumbers: [base, base + 1, base + 2, base + 3, base + 4, base + 5],
      bonusNumbers: [index % 10],
      sourceRow: index + 1,
    });
  }

  return draws;
}

const square: ShapeDefinition = {
  id: "square",
  name: "Quadrat 2x2",
  positions: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
};

describe("WalkForwardRunner", () => {
  it("evaluates each test draw once and never uses future draws for ranking", () => {
    const mapping = createShuffledValueMapping(1, 49, "wf-test");
    const layout = new GridLayout({
      id: "lotto-7x7",
      name: "7x7",
      type: "grid",
      minimumValue: 1,
      maximumValue: 49,
      columns: 7,
      valueMapping: mapping,
    });

    const draws = createDraws(20);
    const result = new WalkForwardRunner().run({
      experimentId: "wf-1",
      layout,
      shapes: [square],
      draws,
      config: { initialHistorySize: 10 },
    });

    expect(result.evaluatedDraws).toBe(10);
    expect(result.steps).toHaveLength(10);
    expect(result.steps.map((step) => step.drawIndex)).toEqual([
      10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    ]);

    for (const step of result.steps) {
      expect(step.historySize).toBe(step.drawIndex);
      expect(step.top5).toHaveLength(5);
      expect(step.top1.resultId).toBe(step.top5[0]!.resultId);
      expect(Number.isFinite(step.top1.score)).toBe(true);
      expect(Number.isFinite(step.top1.features.currentGapRatio)).toBe(true);
    }
  });

  it("is deterministic for the same inputs", () => {
    const mapping = createShuffledValueMapping(1, 49, "wf-det");
    const layout = new GridLayout({
      id: "lotto-7x7",
      name: "7x7",
      type: "grid",
      minimumValue: 1,
      maximumValue: 49,
      columns: 7,
      valueMapping: mapping,
    });
    const draws = createDraws(15);
    const runner = new WalkForwardRunner();

    const first = runner.run({
      experimentId: "det",
      layout,
      shapes: [square],
      draws,
      config: { initialHistorySize: 8 },
    });
    const second = runner.run({
      experimentId: "det",
      layout,
      shapes: [square],
      draws,
      config: { initialHistorySize: 8 },
    });

    expect(first.summary).toEqual(second.summary);
    expect(first.steps.map((step) => step.top1.resultId)).toEqual(
      second.steps.map((step) => step.top1.resultId),
    );
  });
});
