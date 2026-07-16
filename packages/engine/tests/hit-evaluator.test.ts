import { describe, expect, it } from "vitest";
import { BitMask } from "../src/indexing/bit-mask.js";
import { HitEvaluator } from "../src/experiment/hit-evaluator.js";

describe("HitEvaluator", () => {
  it("calculates hits between placement and draw masks", () => {
    const result = new HitEvaluator().evaluate(
      {
        anchorValue: 17,
        positionCount: 4,
        mask: BitMask.fromIndices([16, 17, 23, 24]),
      },
      {
        drawDate: "2026-07-15",
        drawnValueCount: 6,
        mask: BitMask.fromIndices([
          0,
          16,
          24,
          32,
          40,
          48,
        ]),
      },
    );

    expect(result.hitCount).toBe(2);
    expect(result.coverage).toBe(0.5);
    expect(result.isHit).toBe(true);
  });
});