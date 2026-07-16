import { describe, expect, it } from "vitest";
import { GridLayout } from "../src/layout/grid-layout.js";
import { CartesianShapeResolver } from "../src/shape/cartesian-shape-resolver.js";
import { LayoutPositionIndex } from "../src/indexing/layout-position-index.js";
import { PlacementIndexer } from "../src/indexing/placement-indexer.js";

describe("PlacementIndexer", () => {
  it("encodes a 2x2 placement as a BitMask", () => {
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

    const placement =
      new CartesianShapeResolver().resolve(
        shape,
        layout,
        17,
      );

    const indexed = new PlacementIndexer(
      new LayoutPositionIndex(layout),
    ).index(placement);

    expect(indexed.positionCount).toBe(4);

    expect(indexed.mask.has(16)).toBe(true); // 17
    expect(indexed.mask.has(17)).toBe(true); // 18
    expect(indexed.mask.has(23)).toBe(true); // 24
    expect(indexed.mask.has(24)).toBe(true); // 25
    expect(indexed.mask.count()).toBe(4);
  });
});