import { describe, expect, it } from "vitest";

import { HitEvaluator } from "../../src/experiment/hit-evaluator.js";
import { BitMask } from "../../src/indexing/bit-mask.js";
import type { IndexedDraw } from "../../src/indexing/draw-indexer.js";
import type { IndexedPlacement } from "../../src/indexing/placement-indexer.js";

describe("HitEvaluator", () => {
  it("calculates hits, coverage, and hit status", () => {
    const placement: IndexedPlacement = {
      anchorValue: 17,
      positionCount: 4,
      mask: BitMask.fromIndices([
        16,
        17,
        23,
        24,
      ]),
    };

    const draw: IndexedDraw = {
      drawDate: "2025-01-01",
      mask: BitMask.fromIndices([
        0,
        16,
        24,
        32,
      ]),
    };

    const result = new HitEvaluator().evaluate(
      placement,
      draw,
    );

    expect(result).toEqual({
      anchorValue: 17,
      drawDate: "2025-01-01",
      hitCount: 2,
      placementSize: 4,
      coverage: 0.5,
      isHit: true,
    });
  });

  it("returns zero coverage for an empty placement", () => {
    const placement: IndexedPlacement = {
      anchorValue: 1,
      positionCount: 0,
      mask: BitMask.empty(),
    };

    const draw: IndexedDraw = {
      drawDate: "2025-01-01",
      mask: BitMask.fromIndices([0, 1, 2]),
    };

    const result = new HitEvaluator().evaluate(
      placement,
      draw,
    );

    expect(result.hitCount).toBe(0);
    expect(result.placementSize).toBe(0);
    expect(result.coverage).toBe(0);
    expect(result.isHit).toBe(false);
  });

  it("returns no hit when placement and draw do not intersect", () => {
    const placement: IndexedPlacement = {
      anchorValue: 1,
      positionCount: 2,
      mask: BitMask.fromIndices([0, 1]),
    };

    const draw: IndexedDraw = {
      drawDate: "2025-01-01",
      mask: BitMask.fromIndices([10, 11]),
    };

    const result = new HitEvaluator().evaluate(
      placement,
      draw,
    );

    expect(result.hitCount).toBe(0);
    expect(result.coverage).toBe(0);
    expect(result.isHit).toBe(false);
  });

  it("includes the external draw id when present", () => {
    const placement: IndexedPlacement = {
      anchorValue: 1,
      positionCount: 2,
      mask: BitMask.fromIndices([0, 1]),
    };

    const draw: IndexedDraw = {
      externalId: "draw-123",
      drawDate: "2025-01-01",
      mask: BitMask.fromIndices([1, 5]),
    };

    const result = new HitEvaluator().evaluate(
      placement,
      draw,
    );

    expect(result.externalId).toBe("draw-123");
    expect(result).toHaveProperty(
      "externalId",
      "draw-123",
    );
  });

  it("omits the external draw id when absent", () => {
    const placement: IndexedPlacement = {
      anchorValue: 1,
      positionCount: 1,
      mask: BitMask.fromIndices([0]),
    };

    const draw: IndexedDraw = {
      drawDate: "2025-01-01",
      mask: BitMask.fromIndices([0]),
    };

    const result = new HitEvaluator().evaluate(
      placement,
      draw,
    );

    expect(result).not.toHaveProperty("externalId");
  });
});