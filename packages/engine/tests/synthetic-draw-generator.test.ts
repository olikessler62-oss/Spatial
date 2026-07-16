import { describe, expect, it } from "vitest";
import { SyntheticDrawGenerator } from "../src/benchmark/synthetic-draw-generator.js";

describe("SyntheticDrawGenerator", () => {
  it("generates deterministic draws", () => {
    const generator = new SyntheticDrawGenerator();

    const first = generator.generate({
      drawCount: 3,
      layoutSize: 49,
      numbersPerDraw: 6,
      seed: 42,
    });

    const second = generator.generate({
      drawCount: 3,
      layoutSize: 49,
      numbersPerDraw: 6,
      seed: 42,
    });

    expect(first.map((draw) => draw.mask.value)).toEqual(
      second.map((draw) => draw.mask.value),
    );
  });

  it("creates the requested number of unique values", () => {
    const [draw] = new SyntheticDrawGenerator().generate({
      drawCount: 1,
      layoutSize: 49,
      numbersPerDraw: 6,
    });

    expect(draw?.mask.count()).toBe(6);
  });
});