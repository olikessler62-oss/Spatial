import { describe, expect, it } from "vitest";

import type { ShapePlacement } from "../../src/domain/shape.js";
import { GridLayout } from "../../src/layout/grid-layout.js";
import { LayoutPositionIndex } from "../../src/indexing/layout-position-index.js";
import { PlacementIndexer } from "../../src/indexing/placement-indexer.js";
import { CartesianShapeResolver } from "../../src/shape/cartesian-shape-resolver.js";

const createLayout = (): GridLayout =>
  new GridLayout({
    id: "grid-7x7",
    name: "Lotto Grid",
    type: "grid",
    minimumValue: 1,
    maximumValue: 49,
    columns: 7,
  });

describe("PlacementIndexer", () => {
  it("encodes a 2x2 placement as a BitMask", () => {
    const layout = createLayout();

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

    expect(indexed.anchorValue).toBe(17);
    expect(indexed.positionCount).toBe(4);

    expect(indexed.mask.has(16)).toBe(true);
    expect(indexed.mask.has(17)).toBe(true);
    expect(indexed.mask.has(23)).toBe(true);
    expect(indexed.mask.has(24)).toBe(true);
    expect(indexed.mask.count()).toBe(4);
  });

  it("rejects an invalid placement", () => {
    const layout = createLayout();

    const placement: ShapePlacement = {
      anchorValue: 49,
      isValid: false,
      positions: [],
    };

    const indexer = new PlacementIndexer(
      new LayoutPositionIndex(layout),
    );

    expect(() =>
      indexer.index(placement),
    ).toThrow(
      "Cannot index invalid placement at anchor 49.",
    );
  });

  it("rejects a position that does not exist in the layout", () => {
    const layout = createLayout();

    const placement: ShapePlacement = {
      anchorValue: 1,
      isValid: true,
      positions: [
        {
          relative: { x: 0, y: 0 },
          absolute: { x: 99, y: 99 },
        },
      ],
    };

    const indexer = new PlacementIndexer(
      new LayoutPositionIndex(layout),
    );

    expect(() =>
      indexer.index(placement),
    ).toThrow(
      "Placement position 99:99 does not exist in the Layout.",
    );
  });

  it("rejects duplicate absolute positions", () => {
    const layout = createLayout();

    const placement: ShapePlacement = {
      anchorValue: 1,
      isValid: true,
      positions: [
        {
          relative: { x: 0, y: 0 },
          absolute: { x: 0, y: 0 },
        },
        {
          relative: { x: 1, y: 0 },
          absolute: { x: 0, y: 0 },
        },
      ],
    };

    const indexer = new PlacementIndexer(
      new LayoutPositionIndex(layout),
    );

    expect(() =>
      indexer.index(placement),
    ).toThrow(
      "Placement contains duplicate absolute positions.",
    );
  });

  it("indexes an empty valid placement", () => {
    const layout = createLayout();

    const placement: ShapePlacement = {
      anchorValue: 1,
      isValid: true,
      positions: [],
    };

    const indexed = new PlacementIndexer(
      new LayoutPositionIndex(layout),
    ).index(placement);

    expect(indexed.anchorValue).toBe(1);
    expect(indexed.positionCount).toBe(0);
    expect(indexed.mask.count()).toBe(0);
  });

  it("indexes multiple placements in order", () => {
    const layout = createLayout();
    const resolver = new CartesianShapeResolver();

    const shape = {
      id: "horizontal-pair",
      name: "Horizontal Pair",
      positions: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    };

    const placements = [
      resolver.resolve(shape, layout, 1),
      resolver.resolve(shape, layout, 8),
    ];

    const indexed = new PlacementIndexer(
      new LayoutPositionIndex(layout),
    ).indexAll(placements);

    expect(indexed).toHaveLength(2);

    expect(indexed[0]?.anchorValue).toBe(1);
    expect(indexed[0]?.positionCount).toBe(2);
    expect(indexed[0]?.mask.has(0)).toBe(true);
    expect(indexed[0]?.mask.has(1)).toBe(true);

    expect(indexed[1]?.anchorValue).toBe(8);
    expect(indexed[1]?.positionCount).toBe(2);
    expect(indexed[1]?.mask.has(7)).toBe(true);
    expect(indexed[1]?.mask.has(8)).toBe(true);
  });

  it("returns an empty array when indexing no placements", () => {
    const layout = createLayout();

    const indexed = new PlacementIndexer(
      new LayoutPositionIndex(layout),
    ).indexAll([]);

    expect(indexed).toEqual([]);
  });
});