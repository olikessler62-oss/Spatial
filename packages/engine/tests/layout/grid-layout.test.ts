import { describe, expect, it } from "vitest";

import { GridLayout } from "../../src/layout/grid-layout.js";
import { LayoutError } from "../../src/layout/layout-error.js";

describe("GridLayout", () => {
  it("resolves values into row and column coordinates", () => {
    const layout = new GridLayout({
      id: "grid-3x3",
      name: "3x3 Grid",
      type: "grid",
      minimumValue: 1,
      maximumValue: 9,
      columns: 3,
    });

    expect(layout.resolve(1)).toEqual({
      value: 1,
      index: 0,
      position: {
        kind: "cartesian",
        x: 0,
        y: 0,
        row: 0,
        column: 0,
      },
    });

    expect(layout.resolve(5)).toEqual({
      value: 5,
      index: 4,
      position: {
        kind: "cartesian",
        x: 1,
        y: 1,
        row: 1,
        column: 1,
      },
    });

    expect(layout.resolve(9)).toEqual({
      value: 9,
      index: 8,
      position: {
        kind: "cartesian",
        x: 2,
        y: 2,
        row: 2,
        column: 2,
      },
    });
  });

  it("uses custom cell dimensions", () => {
    const layout = new GridLayout({
      id: "scaled-grid",
      name: "Scaled Grid",
      type: "grid",
      minimumValue: 1,
      maximumValue: 6,
      columns: 3,
      cellWidth: 10,
      cellHeight: 20,
    });

    expect(layout.resolve(5).position).toEqual({
      kind: "cartesian",
      x: 10,
      y: 20,
      row: 1,
      column: 1,
    });

    expect(layout.resolve(6).position).toEqual({
      kind: "cartesian",
      x: 20,
      y: 20,
      row: 1,
      column: 2,
    });
  });

  it.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])("rejects invalid column count %s", (columns) => {
    expect(
      () =>
        new GridLayout({
          id: "invalid-grid",
          name: "Invalid Grid",
          type: "grid",
          minimumValue: 1,
          maximumValue: 9,
          columns,
        }),
    ).toThrowError(
      new LayoutError(
        "Grid columns must be a positive integer.",
        "INVALID_GRID_COLUMNS",
      ),
    );
  });

  it.each([
    0,
    -1,
  ])("rejects invalid cell width %s", (cellWidth) => {
    expect(
      () =>
        new GridLayout({
          id: "invalid-width-grid",
          name: "Invalid Width Grid",
          type: "grid",
          minimumValue: 1,
          maximumValue: 9,
          columns: 3,
          cellWidth,
        }),
    ).toThrowError(
      new LayoutError(
        "cellWidth must be greater than zero.",
        "INVALID_CELL_WIDTH",
      ),
    );
  });

  it.each([
    0,
    -1,
  ])("rejects invalid cell height %s", (cellHeight) => {
    expect(
      () =>
        new GridLayout({
          id: "invalid-height-grid",
          name: "Invalid Height Grid",
          type: "grid",
          minimumValue: 1,
          maximumValue: 9,
          columns: 3,
          cellHeight,
        }),
    ).toThrowError(
      new LayoutError(
        "cellHeight must be greater than zero.",
        "INVALID_CELL_HEIGHT",
      ),
    );
  });
});