import { describe, expect, it } from "vitest";

import { GridLayout } from "../../src/layout/grid-layout.js";
import { analyzeShapeGaps } from "../../src/analysis/features/shape-gap-analysis.js";
import type { ParsedDraw } from "../../src/domain/parsed-draw.js";
import type { ShapeDefinition } from "../../src/domain/shape.js";

const lShape: ShapeDefinition = {
  id: "l-3",
  name: "L-Form 3",
  positions: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
};

describe("shape gap analysis", () => {
  it("reports the most common miss-streak length", () => {
    const layout = new GridLayout({
      id: "g",
      name: "3x3",
      type: "grid",
      minimumValue: 1,
      maximumValue: 9,
      columns: 3,
    });

    const draws: ParsedDraw[] = [
      { drawDate: "2020-01-01", mainNumbers: [1, 2, 3, 4, 5, 6], bonusNumbers: [], sourceRow: 1 },
      { drawDate: "2020-01-02", mainNumbers: [7, 8, 9, 4, 5, 6], bonusNumbers: [], sourceRow: 2 },
      { drawDate: "2020-01-03", mainNumbers: [1, 2, 3, 4, 5, 6], bonusNumbers: [], sourceRow: 3 },
      { drawDate: "2020-01-04", mainNumbers: [7, 8, 9, 4, 5, 6], bonusNumbers: [], sourceRow: 4 },
      { drawDate: "2020-01-05", mainNumbers: [7, 8, 9, 4, 5, 6], bonusNumbers: [], sourceRow: 5 },
      { drawDate: "2020-01-06", mainNumbers: [1, 2, 3, 4, 5, 6], bonusNumbers: [], sourceRow: 6 },
    ];

    const report = analyzeShapeGaps({
      layout,
      shapes: [lShape],
      draws,
      layoutSeed: "test",
    });

    const shape = report.shapes[0]!;
    expect(shape.totalMissStreaks).toBeGreaterThan(0);
    expect(shape.missFrequencies.length).toBeGreaterThan(0);
    expect(shape.mostCommonMissCount).not.toBeNull();
    expect(shape.mostCommonShare).toBeGreaterThan(0);
  });
});
