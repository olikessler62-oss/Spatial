import { describe, expect, it } from "vitest";

import { analyzeCorner5x5LatestMisses } from "../../src/experiment/corner-5x5-miss-analysis.js";
import type { ParsedDraw } from "../../src/domain/parsed-draw.js";

describe("corner 5x5 latest misses", () => {
  it("uses one fixed layout and reports misses on the latest draw", () => {
    const draws: ParsedDraw[] = Array.from({ length: 30 }, (_, index) => {
      const base = (index % 44) + 1;
      return {
        drawDate: `2020-05-${String((index % 28) + 1).padStart(2, "0")}`,
        mainNumbers: [base, base + 1, base + 2, base + 3, base + 4, base + 5],
        bonusNumbers: [0],
        sourceRow: index + 1,
      };
    });

    const report = analyzeCorner5x5LatestMisses({ draws });

    expect(report.layoutSeed).toBe("lotto-7x7-corner5x5-v1");
    expect(report.valueMapping).toHaveLength(49);
    expect(new Set(report.valueMapping).size).toBe(49);
    expect(report.window).toBe("top-left-5x5");
    expect(report.placementCountInWindow).toBeGreaterThan(0);
    expect(
      report.hitOnLatestCount + report.missedOnLatest.length,
    ).toBe(report.placementCountInWindow);

    for (const missed of report.missedOnLatest) {
      expect(missed.values).toHaveLength(5);
      expect(missed.currentMissStreak).toBeGreaterThanOrEqual(1);
      expect(missed.historicalMissRate).toBeGreaterThan(0);
    }
  });
});
