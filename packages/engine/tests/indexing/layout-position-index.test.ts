import { describe, expect, it } from "vitest";

import type {
  Layout,
  LayoutPosition,
  ResolvedLayoutValue,
} from "../../src/domain/layout.js";
import { LayoutPositionIndex } from "../../src/indexing/layout-position-index.js";
import { GridLayout } from "../../src/layout/grid-layout.js";

describe("LayoutPositionIndex", () => {
  it("indexes all resolved layout positions", () => {
    const layout = new GridLayout({
      id: "grid-3x3",
      name: "3x3 Grid",
      type: "grid",
      minimumValue: 1,
      maximumValue: 9,
      columns: 3,
    });

    const index = new LayoutPositionIndex(layout);

    expect(index.size).toBe(9);

    expect(index.getIndex({ x: 0, y: 0 })).toBe(0);
    expect(index.getIndex({ x: 1, y: 0 })).toBe(1);
    expect(index.getIndex({ x: 2, y: 2 })).toBe(8);
  });

  it("returns values for known coordinates", () => {
    const layout = new GridLayout({
      id: "grid-3x3",
      name: "3x3 Grid",
      type: "grid",
      minimumValue: 1,
      maximumValue: 9,
      columns: 3,
    });

    const index = new LayoutPositionIndex(layout);

    expect(index.getValue({ x: 0, y: 0 })).toBe(1);
    expect(index.getValue({ x: 1, y: 0 })).toBe(2);
    expect(index.getValue({ x: 2, y: 2 })).toBe(9);
  });

  it("returns undefined for unknown coordinates", () => {
    const layout = new GridLayout({
      id: "grid-3x3",
      name: "3x3 Grid",
      type: "grid",
      minimumValue: 1,
      maximumValue: 9,
      columns: 3,
    });

    const index = new LayoutPositionIndex(layout);

    expect(index.getIndex({ x: 99, y: 99 })).toBeUndefined();
    expect(index.getValue({ x: 99, y: 99 })).toBeUndefined();
  });

  it("retains the source layout", () => {
    const layout = new GridLayout({
      id: "grid-3x3",
      name: "3x3 Grid",
      type: "grid",
      minimumValue: 1,
      maximumValue: 9,
      columns: 3,
    });

    const index = new LayoutPositionIndex(layout);

    expect(index.layout).toBe(layout);
  });

  it("rejects duplicate coordinates", () => {
    const duplicatePosition: LayoutPosition = {
      x: 0,
      y: 0,
    };

    const entries: readonly ResolvedLayoutValue[] = [
      {
        value: 1,
        index: 0,
        position: duplicatePosition,
      },
      {
        value: 2,
        index: 1,
        position: duplicatePosition,
      },
    ];

    const layout: Layout = {
      id: "duplicate-layout",
      name: "Duplicate Layout",
      type: "grid",
      minimumValue: 1,
      maximumValue: 2,

      resolve(value: number): ResolvedLayoutValue {
        const entry = entries.find(
          (candidate) => candidate.value === value,
        );

        if (!entry) {
          throw new Error(
            `Unknown layout value ${value}.`,
          );
        }

        return entry;
      },

      resolveAll(): readonly ResolvedLayoutValue[] {
        return entries;
      },
    };

    expect(() =>
      new LayoutPositionIndex(layout),
    ).toThrow(
      "Layout contains duplicate coordinate 0:0.",
    );
  });
});