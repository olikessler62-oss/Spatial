import { describe, expect, it } from "vitest";

import { computePlacementHistoryFeatures } from "../../src/analysis/features/placement-history-features.js";

describe("placement history features", () => {
  it("handles empty history without NaN", () => {
    const features = computePlacementHistoryFeatures([]);

    for (const value of Object.values(features)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("handles never-hit sequences", () => {
    const features = computePlacementHistoryFeatures([
      false,
      false,
      false,
      false,
    ]);

    expect(features.drawsSinceLastHit).toBe(4);
    expect(features.hitFrequency).toBe(0);
    expect(features.currentGapRatio).toBe(1);
    expect(Number.isFinite(features.currentGapRatio)).toBe(true);
  });

  it("computes gap ratio from prior hits only", () => {
    // hits at indices 0 and 3 → gaps include trailing since-last
    const features = computePlacementHistoryFeatures([
      true,
      false,
      false,
      true,
      false,
      false,
    ]);

    expect(features.drawsSinceLastHit).toBe(2);
    expect(features.hitsLast10).toBe(2);
    expect(features.hitFrequency).toBeCloseTo(2 / 6);
    expect(Number.isFinite(features.currentGapRatio)).toBe(true);
    expect(features.currentGapRatio).not.toBe(Number.POSITIVE_INFINITY);
  });
});
