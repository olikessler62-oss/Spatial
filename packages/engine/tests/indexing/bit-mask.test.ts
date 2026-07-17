import { describe, expect, it } from "vitest";

import { BitMask } from "../../src/indexing/bit-mask.js";

describe("BitMask", () => {
  it("creates an empty mask", () => {
    const mask = BitMask.empty();

    expect(mask.value).toBe(0n);
    expect(mask.count()).toBe(0);
    expect(mask.has(0)).toBe(false);
    expect(mask.toString()).toBe("0");
  });

  it("creates a mask from indices", () => {
    const mask = BitMask.fromIndices([
      0,
      2,
      5,
    ]);

    expect(mask.has(0)).toBe(true);
    expect(mask.has(2)).toBe(true);
    expect(mask.has(5)).toBe(true);
    expect(mask.has(1)).toBe(false);
    expect(mask.count()).toBe(3);
  });

  it("ignores duplicate indices", () => {
    const mask = BitMask.fromIndices([
      1,
      1,
      2,
      2,
    ]);

    expect(mask.count()).toBe(2);
    expect(mask.has(1)).toBe(true);
    expect(mask.has(2)).toBe(true);
  });

  it.each([
    [-1],
    [1.5],
    [Number.NaN],
    [Number.POSITIVE_INFINITY],
  ])("rejects invalid index %s", (index) => {
    expect(() =>
      BitMask.fromIndices([index]),
    ).toThrow(
      "Bit index must be a non-negative integer",
    );
  });

  it("returns false for invalid indices in has", () => {
    const mask = BitMask.fromIndices([0]);

    expect(mask.has(-1)).toBe(false);
    expect(mask.has(1.5)).toBe(false);
    expect(mask.has(Number.NaN)).toBe(false);
  });

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

  it("detects whether two masks intersect", () => {
    const first = BitMask.fromIndices([1, 2]);
    const overlapping = BitMask.fromIndices([2, 3]);
    const separate = BitMask.fromIndices([4, 5]);

    expect(first.intersects(overlapping)).toBe(true);
    expect(first.intersects(separate)).toBe(false);
  });

  it("calculates a union", () => {
    const first = BitMask.fromIndices([1, 2]);
    const second = BitMask.fromIndices([2, 3]);

    const union = first.union(second);

    expect(union.count()).toBe(3);
    expect(union.has(1)).toBe(true);
    expect(union.has(2)).toBe(true);
    expect(union.has(3)).toBe(true);
  });

  it("detects contained masks", () => {
    const mask = BitMask.fromIndices([
      1,
      2,
      3,
    ]);

    expect(
      mask.contains(
        BitMask.fromIndices([1, 3]),
      ),
    ).toBe(true);

    expect(
      mask.contains(
        BitMask.fromIndices([1, 4]),
      ),
    ).toBe(false);

    expect(mask.contains(BitMask.empty())).toBe(true);
  });

  it("compares masks by value", () => {
    const first = BitMask.fromIndices([1, 3]);
    const equal = BitMask.fromIndices([3, 1]);
    const different = BitMask.fromIndices([1, 2]);

    expect(first.equals(equal)).toBe(true);
    expect(first.equals(different)).toBe(false);
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

  it("formats the mask as hexadecimal", () => {
    const mask = BitMask.fromIndices([
      0,
      1,
      4,
    ]);

    expect(mask.toString()).toBe("13");
  });

  it("satisfies intersection identities", () => {
    const mask = BitMask.fromIndices([
      1,
      4,
      8,
    ]);

    expect(
      mask.intersection(mask).equals(mask),
    ).toBe(true);

    expect(
      mask
        .intersection(BitMask.empty())
        .equals(BitMask.empty()),
    ).toBe(true);
  });

  it("satisfies union identities", () => {
    const mask = BitMask.fromIndices([
      1,
      4,
      8,
    ]);

    expect(
      mask.union(mask).equals(mask),
    ).toBe(true);

    expect(
      mask
        .union(BitMask.empty())
        .equals(mask),
    ).toBe(true);
  });

  it("never produces more intersection bits than either operand", () => {
    const first = BitMask.fromIndices([
      1,
      2,
      3,
      10,
    ]);

    const second = BitMask.fromIndices([
      2,
      3,
      4,
    ]);

    const intersection =
      first.intersection(second);

    expect(
      intersection.count(),
    ).toBeLessThanOrEqual(first.count());

    expect(
      intersection.count(),
    ).toBeLessThanOrEqual(second.count());
  });
});