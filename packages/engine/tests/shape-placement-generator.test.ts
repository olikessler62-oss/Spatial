import { describe, expect, it } from "vitest";
import { GridLayout } from "../src/layout/grid-layout.js";
import { CartesianShapeResolver } from "../src/shape/cartesian-shape-resolver.js";
import { ShapePlacementGenerator } from "../src/shape/shape-placement-generator.js";

describe("ShapePlacementGenerator", () => {
  it("generates all valid 2x2 placements on a 7x7 grid", () => {
    const layout = new GridLayout({
      id: "grid-7x7",
      name: "Lotto Grid",
      type: "grid",
      minimumValue: 1,
      maximumValue: 49,
      columns: 7,
    });

    const shape = {
      id: "square-2x2",
      name: "2x2 Square",
      positions: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
    };

    const generator = new ShapePlacementGenerator(
      new CartesianShapeResolver(),
    );

    const placements = generator.generate(
      shape,
      layout,
    );

    expect(placements).toHaveLength(36);
    expect(placements[0]?.anchorValue).toBe(1);
    expect(
      placements.at(-1)?.anchorValue,
    ).toBe(41);
  });
});