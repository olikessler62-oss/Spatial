import { describe, expect, it } from "vitest";
import { GridLayout } from "../src/layout/grid-layout.js";
import { CartesianShapeResolver } from "../src/shape/cartesian-shape-resolver.js";

describe("CartesianShapeResolver", () => {
  it("places a 2x2 Shape relative to an anchor value", () => {
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

    const result = new CartesianShapeResolver().resolve(
      shape,
      layout,
      17,
    );

    expect(result.positions.map((position) => position.absolute)).toEqual([
      { kind: "cartesian", x: 2, y: 2 },
      { kind: "cartesian", x: 3, y: 2 },
      { kind: "cartesian", x: 2, y: 3 },
      { kind: "cartesian", x: 3, y: 3 },
    ]);
  });
});

it("marks placements outside the layout as invalid", () => {
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

  const result =
    new CartesianShapeResolver().resolve(
      shape,
      layout,
      49,
    );

  expect(result.isValid).toBe(false);
  expect(result.invalidPositions).toHaveLength(3);
});