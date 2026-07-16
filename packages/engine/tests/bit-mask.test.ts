import { describe, expect, it } from "vitest";
import { BitMask } from "../src/indexing/bit-mask.js";

describe("BitMask", () => {
  it("calculates intersection and hit count", () => {
    const placement = BitMask.fromIndices([
      16,
      17,
      23,
      24,
    ]);

    const draw = BitMask.fromIndices([
      0,
      16,
      24,
      32,
      40,
      48,
    ]);

    const hits = placement.intersection(draw);

    expect(hits.count()).toBe(2);
    expect(hits.has(16)).toBe(true);
    expect(hits.has(24)).toBe(true);
  });

  it("supports positions beyond 64 bits", () => {
    const mask = BitMask.fromIndices([
      0,
      64,
      128,
    ]);

    expect(mask.has(128)).toBe(true);
    expect(mask.count()).toBe(3);
  });
});