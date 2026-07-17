import { describe, expect, it } from "vitest";

import type {
  Layout,
  ResolvedLayoutValue,
} from "../../src/domain/layout.js";
import type {
  ShapeDefinition,
} from "../../src/domain/shape.js";
import { GridLayout } from "../../src/layout/grid-layout.js";
import { CartesianShapeResolver } from "../../src/shape/cartesian-shape-resolver.js";
import { ShapeError } from "../../src/shape/shape-error.js";

const createGridLayout = (): GridLayout =>
  new GridLayout({
    id: "grid-3x3",
    name: "3x3 Grid",
    type: "grid",
    minimumValue: 1,
    maximumValue: 9,
    columns: 3,
  });

describe("CartesianShapeResolver", () => {
  it("resolves a valid cartesian shape placement", () => {
    const layout = createGridLayout();

    const shape: ShapeDefinition = {
      id: "horizontal-pair",
      name: "Horizontal Pair",
      positions: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    };

    const placement =
      new CartesianShapeResolver().resolve(
        shape,
        layout,
        1,
      );

    expect(placement.anchorValue).toBe(1);
    expect(placement.isValid).toBe(true);
    expect(placement.invalidPositions).toEqual([]);

    expect(placement.positions).toEqual([
      {
        relative: { x: 0, y: 0 },
        absolute: {
          kind: "cartesian",
          x: 0,
          y: 0,
        },
      },
      {
        relative: { x: 1, y: 0 },
        absolute: {
          kind: "cartesian",
          x: 1,
          y: 0,
        },
      },
    ]);
  });

  it("marks a placement as invalid when a position lies outside the layout", () => {
    const layout = createGridLayout();

    const shape: ShapeDefinition = {
      id: "horizontal-pair",
      name: "Horizontal Pair",
      positions: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    };

    const placement =
      new CartesianShapeResolver().resolve(
        shape,
        layout,
        3,
      );

    expect(placement.isValid).toBe(false);
    expect(placement.invalidPositions).toHaveLength(1);

    expect(placement.invalidPositions[0]).toEqual({
      relative: { x: 1, y: 0 },
      absolute: {
        kind: "cartesian",
        x: 3,
        y: 0,
      },
    });
  });

  it("collects all invalid positions", () => {
    const layout = createGridLayout();

    const shape: ShapeDefinition = {
      id: "oversized-shape",
      name: "Oversized Shape",
      positions: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
    };

    const placement =
      new CartesianShapeResolver().resolve(
        shape,
        layout,
        3,
      );

    expect(placement.isValid).toBe(false);
    expect(placement.invalidPositions).toEqual([
      {
        relative: { x: 1, y: 0 },
        absolute: {
          kind: "cartesian",
          x: 3,
          y: 0,
        },
      },
      {
        relative: { x: 2, y: 0 },
        absolute: {
          kind: "cartesian",
          x: 4,
          y: 0,
        },
      },
    ]);
  });

  it("rejects an empty shape", () => {
    const layout = createGridLayout();

    const shape: ShapeDefinition = {
      id: "empty-shape",
      name: "Empty Shape",
      positions: [],
    };

    expect(() =>
      new CartesianShapeResolver().resolve(
        shape,
        layout,
        1,
      ),
    ).toThrow(
      "A Shape must contain at least one relative position.",
    );
  });

  it("throws EMPTY_SHAPE for an empty shape", () => {
    const layout = createGridLayout();

    const shape: ShapeDefinition = {
      id: "empty-shape",
      name: "Empty Shape",
      positions: [],
    };

    try {
      new CartesianShapeResolver().resolve(
        shape,
        layout,
        1,
      );

      throw new Error(
        "Expected resolver to reject an empty shape.",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ShapeError);
      expect((error as ShapeError).code).toBe(
        "EMPTY_SHAPE",
      );
    }
  });

  it("rejects a non-cartesian layout", () => {
    const resolvedEntry: ResolvedLayoutValue = {
      value: 1,
      index: 0,
      position: {
        kind: "circular",
        angle: 0,
        radius: 1,
      },
    };

    const layout: Layout = {
      id: "circular-layout",
      name: "Circular Layout",
      type: "circle",
      minimumValue: 1,
      maximumValue: 1,

      resolve(): ResolvedLayoutValue {
        return resolvedEntry;
      },

      resolveAll(): readonly ResolvedLayoutValue[] {
        return [resolvedEntry];
      },
    };

    const shape: ShapeDefinition = {
      id: "single-position",
      name: "Single Position",
      positions: [
        { x: 0, y: 0 },
      ],
    };

    expect(() =>
      new CartesianShapeResolver().resolve(
        shape,
        layout,
        1,
      ),
    ).toThrow(
      "CartesianShapeResolver requires a cartesian Layout.",
    );
  });

  it("throws INCOMPATIBLE_LAYOUT for a non-cartesian layout", () => {
    const resolvedEntry: ResolvedLayoutValue = {
      value: 1,
      index: 0,
      position: {
        kind: "circular",
        angle: 0,
        radius: 1,
      },
    };

    const layout: Layout = {
      id: "circular-layout",
      name: "Circular Layout",
      type: "circle",
      minimumValue: 1,
      maximumValue: 1,

      resolve(): ResolvedLayoutValue {
        return resolvedEntry;
      },

      resolveAll(): readonly ResolvedLayoutValue[] {
        return [resolvedEntry];
      },
    };

    const shape: ShapeDefinition = {
      id: "single-position",
      name: "Single Position",
      positions: [
        { x: 0, y: 0 },
      ],
    };

    try {
      new CartesianShapeResolver().resolve(
        shape,
        layout,
        1,
      );

      throw new Error(
        "Expected resolver to reject a non-cartesian layout.",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ShapeError);
      expect((error as ShapeError).code).toBe(
        "INCOMPATIBLE_LAYOUT",
      );
    }
  });

  it("ignores non-cartesian entries when building valid coordinates", () => {
    const entries: readonly ResolvedLayoutValue[] = [
      {
        value: 1,
        index: 0,
        position: {
          kind: "cartesian",
          x: 0,
          y: 0,
        },
      },
      {
        value: 2,
        index: 1,
        position: {
          kind: "circular",
          angle: 90,
          radius: 1,
        },
      },
    ];

    const layout: Layout = {
      id: "mixed-layout",
      name: "Mixed Layout",
      type: "grid",
      minimumValue: 1,
      maximumValue: 2,

      resolve(): ResolvedLayoutValue {
        return entries[0]!;
      },

      resolveAll(): readonly ResolvedLayoutValue[] {
        return entries;
      },
    };

    const shape: ShapeDefinition = {
      id: "horizontal-pair",
      name: "Horizontal Pair",
      positions: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    };

    const placement =
      new CartesianShapeResolver().resolve(
        shape,
        layout,
        1,
      );

    expect(placement.isValid).toBe(false);
    expect(placement.invalidPositions).toHaveLength(1);
    expect(
      placement.invalidPositions[0]?.absolute,
    ).toEqual({
      kind: "cartesian",
      x: 1,
      y: 0,
    });
  });
});