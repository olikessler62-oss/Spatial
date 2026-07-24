import { describe, expect, it } from "vitest";

import { RectangleShapeDetector } from "../../src/shape-analysis/detection/rectangle/rectangle-shape-detector.js";
import type { RectangleGeometry } from "../../src/shape-analysis/domain/geometry.js";
import type { TrackedShape } from "../../src/shape-analysis/domain/tracked-shape.js";
import { createRectangleGeometryKey } from "../../src/shape-analysis/detection/rectangle/rectangle-geometry.js";
import { ShapeAnalysisError } from "../../src/shape-analysis/shape-analysis-error.js";
import {
  createDetectionContext,
  createFilledCard,
  hitPositionsFromGrid,
  shuffleValues,
} from "./test-helpers.js";

const detector = new RectangleShapeDetector();

function trackedRectangle(
  geometry: RectangleGeometry,
): TrackedShape<RectangleGeometry> {
  return {
    id: "parent-1",
    shapeType: "rectangle",
    geometry,
    geometryKey: createRectangleGeometryKey(geometry),
    discoveredAtCardId: "card-0",
    discoveredAtSequenceIndex: 0,
    previousCardCount: 0,
    coveredCardCount: 1,
    status: "active",
    parentIds: [],
    childIds: [],
    lastUnchangedCardId: "card-0",
    isCompleteRun: false,
  };
}

describe("RectangleShapeDetector basics", () => {
  it("returns the full grid for a completely free 7x7 card", () => {
    const card = createFilledCard({
      id: "free",
      chronologicalIndex: 1,
      rowCount: 7,
      columnCount: 7,
    });

    const shapes = detector.detectInitialShapes(
      card,
      createDetectionContext(card),
    );

    expect(shapes).toEqual([
      {
        type: "rectangle",
        geometry: {
          originRow: 0,
          originColumn: 0,
          width: 7,
          height: 7,
        },
        key: "rectangle:r=0:c=0:w=7:h=7",
        cellCount: 49,
      },
    ]);
  });

  it("returns no rectangles for a fully hit card", () => {
    const hits = hitPositionsFromGrid(
      Array.from({ length: 4 }, () =>
        Array.from({ length: 4 }, () => true),
      ),
    );

    const card = createFilledCard({
      id: "full",
      chronologicalIndex: 1,
      rowCount: 4,
      columnCount: 4,
      hitPositions: hits,
    });

    expect(
      detector.detectInitialShapes(card, createDetectionContext(card)),
    ).toEqual([]);
  });

  it("detects a free horizontal line of four cells", () => {
    const card = createFilledCard({
      id: "hline",
      chronologicalIndex: 1,
      rowCount: 2,
      columnCount: 4,
      hitPositions: [
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        { row: 0, column: 2 },
        { row: 0, column: 3 },
      ],
    });

    const shapes = detector.detectInitialShapes(
      card,
      createDetectionContext(card),
    );

    expect(shapes).toEqual([
      {
        type: "rectangle",
        geometry: {
          originRow: 1,
          originColumn: 0,
          width: 4,
          height: 1,
        },
        key: "rectangle:r=1:c=0:w=4:h=1",
        cellCount: 4,
      },
    ]);
  });

  it("detects a free vertical line of four cells", () => {
    const card = createFilledCard({
      id: "vline",
      chronologicalIndex: 1,
      rowCount: 4,
      columnCount: 2,
      hitPositions: [
        { row: 0, column: 0 },
        { row: 1, column: 0 },
        { row: 2, column: 0 },
        { row: 3, column: 0 },
      ],
    });

    const shapes = detector.detectInitialShapes(
      card,
      createDetectionContext(card),
    );

    expect(shapes).toEqual([
      {
        type: "rectangle",
        geometry: {
          originRow: 0,
          originColumn: 1,
          width: 1,
          height: 4,
        },
        key: "rectangle:r=0:c=1:w=1:h=4",
        cellCount: 4,
      },
    ]);
  });

  it("detects a free 2x2 block", () => {
    const card = createFilledCard({
      id: "block",
      chronologicalIndex: 1,
      rowCount: 3,
      columnCount: 3,
      hitPositions: [
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        { row: 0, column: 2 },
        { row: 1, column: 2 },
        { row: 2, column: 2 },
      ],
    });

    const shapes = detector.detectInitialShapes(
      card,
      createDetectionContext(card),
    );

    expect(shapes).toHaveLength(1);
    expect(shapes[0]?.geometry).toEqual({
      originRow: 1,
      originColumn: 0,
      width: 2,
      height: 2,
    });
  });
});

describe("Spec example with five maximal rectangles", () => {
  it("matches the documented 7x7 example after deterministic sort", () => {
    const card = createFilledCard({
      id: "example",
      chronologicalIndex: 1,
      rowCount: 7,
      columnCount: 7,
      hitPositions: [
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        { row: 0, column: 2 },
        { row: 0, column: 3 },
        { row: 0, column: 4 },
        { row: 3, column: 3 },
      ],
    });

    const shapes = detector.detectInitialShapes(
      card,
      createDetectionContext(card),
    );

    expect(shapes.map((shape) => shape.geometry)).toEqual([
      { originRow: 4, originColumn: 0, width: 7, height: 3 },
      { originRow: 1, originColumn: 0, width: 3, height: 6 },
      { originRow: 1, originColumn: 4, width: 3, height: 6 },
      { originRow: 0, originColumn: 5, width: 2, height: 7 },
      { originRow: 1, originColumn: 0, width: 7, height: 2 },
    ]);
  });
});

describe("maximality", () => {
  it("returns only the maximal 5x4 free search area, not nested parts", () => {
    const card = createFilledCard({
      id: "max",
      chronologicalIndex: 1,
      rowCount: 5,
      columnCount: 4,
    });

    const shapes = detector.detectInitialShapes(
      card,
      createDetectionContext(card),
    );

    expect(shapes).toHaveLength(1);
    expect(shapes[0]?.geometry).toEqual({
      originRow: 0,
      originColumn: 0,
      width: 4,
      height: 5,
    });
  });

  it("returns both separated free regions", () => {
    const card = createFilledCard({
      id: "sep",
      chronologicalIndex: 1,
      rowCount: 4,
      columnCount: 5,
      hitPositions: [
        { row: 0, column: 2 },
        { row: 1, column: 2 },
        { row: 2, column: 2 },
        { row: 3, column: 2 },
      ],
    });

    const geometries = detector
      .detectInitialShapes(card, createDetectionContext(card))
      .map((shape) => shape.geometry);

    expect(geometries).toEqual([
      { originRow: 0, originColumn: 0, width: 2, height: 4 },
      { originRow: 0, originColumn: 3, width: 2, height: 4 },
    ]);
  });

  it("produces overlapping maximal rectangles around a center hit", () => {
    const card = createFilledCard({
      id: "overlap",
      chronologicalIndex: 1,
      rowCount: 5,
      columnCount: 5,
      hitPositions: [{ row: 2, column: 2 }],
    });

    const geometries = detector
      .detectInitialShapes(card, createDetectionContext(card))
      .map((shape) => shape.geometry);

    expect(geometries.length).toBeGreaterThanOrEqual(4);
    expect(geometries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ originRow: 0 }), // above-ish
        expect.objectContaining({
          originRow: expect.any(Number),
          originColumn: 0,
        }),
      ]),
    );

    // Above: rows 0-1, all columns → 5x2
    expect(geometries).toContainEqual({
      originRow: 0,
      originColumn: 0,
      width: 5,
      height: 2,
    });
    // Below: rows 3-4
    expect(geometries).toContainEqual({
      originRow: 3,
      originColumn: 0,
      width: 5,
      height: 2,
    });
    // Left: cols 0-1, all rows
    expect(geometries).toContainEqual({
      originRow: 0,
      originColumn: 0,
      width: 2,
      height: 5,
    });
    // Right: cols 3-4
    expect(geometries).toContainEqual({
      originRow: 0,
      originColumn: 3,
      width: 2,
      height: 5,
    });
  });

  it("does not return an expandable non-maximal rectangle", () => {
    const card = createFilledCard({
      id: "expandable",
      chronologicalIndex: 1,
      rowCount: 2,
      columnCount: 4,
    });

    const geometries = detector
      .detectInitialShapes(card, createDetectionContext(card))
      .map((shape) => shape.geometry);

    expect(geometries).toEqual([
      { originRow: 0, originColumn: 0, width: 4, height: 2 },
    ]);
    expect(geometries).not.toContainEqual({
      originRow: 0,
      originColumn: 0,
      width: 3,
      height: 2,
    });
  });
});

describe("child shapes", () => {
  it("existsUnchanged is true when parent stays free", () => {
    const card = createFilledCard({
      id: "unchanged",
      chronologicalIndex: 1,
      rowCount: 5,
      columnCount: 5,
      hitPositions: [{ row: 0, column: 0 }],
    });

    const parent = trackedRectangle({
      originRow: 1,
      originColumn: 1,
      width: 3,
      height: 3,
    });

    expect(detector.existsUnchanged(parent, card)).toBe(true);
  });

  it("splits into maximal children when parent is hit", () => {
    const card = createFilledCard({
      id: "split",
      chronologicalIndex: 1,
      rowCount: 5,
      columnCount: 5,
      hitPositions: [{ row: 2, column: 2 }],
    });

    const parent = trackedRectangle({
      originRow: 0,
      originColumn: 0,
      width: 5,
      height: 5,
    });

    expect(detector.existsUnchanged(parent, card)).toBe(false);

    const children = detector.detectChildShapes(
      parent,
      card,
      createDetectionContext(card),
    );

    expect(children.length).toBeGreaterThanOrEqual(4);
    expect(
      children.every((child) =>
        child.geometry.originRow >= 0 &&
        child.geometry.originColumn >= 0 &&
        child.geometry.originRow + child.geometry.height <= 5 &&
        child.geometry.originColumn + child.geometry.width <= 5,
      ),
    ).toBe(true);
  });

  it("ignores hits outside the parent geometry", () => {
    const card = createFilledCard({
      id: "outside",
      chronologicalIndex: 1,
      rowCount: 5,
      columnCount: 5,
      hitPositions: [{ row: 0, column: 0 }],
    });

    const parent = trackedRectangle({
      originRow: 2,
      originColumn: 2,
      width: 2,
      height: 2,
    });

    expect(detector.existsUnchanged(parent, card)).toBe(true);
  });

  it("does not expand children beyond the parent search area", () => {
    const card = createFilledCard({
      id: "bounded",
      chronologicalIndex: 1,
      rowCount: 6,
      columnCount: 6,
      hitPositions: [{ row: 3, column: 3 }],
    });

    const parent = trackedRectangle({
      originRow: 2,
      originColumn: 2,
      width: 3,
      height: 3,
    });

    const children = detector.detectChildShapes(
      parent,
      card,
      createDetectionContext(card),
    );

    for (const child of children) {
      expect(child.geometry.originRow).toBeGreaterThanOrEqual(2);
      expect(child.geometry.originColumn).toBeGreaterThanOrEqual(2);
      expect(
        child.geometry.originRow + child.geometry.height,
      ).toBeLessThanOrEqual(5);
      expect(
        child.geometry.originColumn + child.geometry.width,
      ).toBeLessThanOrEqual(5);
    }
  });

  it("returns [] when no child reaches the minimum cell count", () => {
    const card = createFilledCard({
      id: "tiny",
      chronologicalIndex: 1,
      rowCount: 3,
      columnCount: 3,
      hitPositions: [
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        { row: 0, column: 2 },
        { row: 1, column: 0 },
        { row: 1, column: 1 },
        { row: 1, column: 2 },
        { row: 2, column: 0 },
        { row: 2, column: 1 },
      ],
    });

    const parent = trackedRectangle({
      originRow: 0,
      originColumn: 0,
      width: 3,
      height: 3,
    });

    expect(
      detector.detectChildShapes(
        parent,
        card,
        createDetectionContext(card),
      ),
    ).toEqual([]);
  });

  it("throws for invalid parent geometry", () => {
    const card = createFilledCard({
      id: "bad-parent",
      chronologicalIndex: 1,
      rowCount: 4,
      columnCount: 4,
    });

    const parent = trackedRectangle({
      originRow: 3,
      originColumn: 3,
      width: 3,
      height: 3,
    });

    expect(() =>
      detector.detectChildShapes(
        parent,
        card,
        createDetectionContext(card),
      ),
    ).toThrow(ShapeAnalysisError);

    try {
      detector.detectChildShapes(
        parent,
        card,
        createDetectionContext(card),
      );
    } catch (error) {
      expect((error as ShapeAnalysisError).code).toBe(
        "INVALID_PARENT_GEOMETRY",
      );
    }
  });
});

describe("number independence and dynamic grids", () => {
  it("ignores lottery values", () => {
    const hits = [
      { row: 0, column: 0 },
      { row: 1, column: 1 },
    ] as const;

    const sequential = Array.from({ length: 25 }, (_, index) => index + 1);
    const shuffled = shuffleValues(sequential);

    const cardA = createFilledCard({
      id: "a",
      chronologicalIndex: 1,
      rowCount: 5,
      columnCount: 5,
      hitPositions: hits,
      values: sequential,
    });
    const cardB = createFilledCard({
      id: "b",
      chronologicalIndex: 1,
      rowCount: 5,
      columnCount: 5,
      hitPositions: hits,
      values: shuffled,
    });

    const shapesA = detector.detectInitialShapes(
      cardA,
      createDetectionContext(cardA),
    );
    const shapesB = detector.detectInitialShapes(
      cardB,
      createDetectionContext(cardB),
    );

    expect(shapesA.map((shape) => shape.key)).toEqual(
      shapesB.map((shape) => shape.key),
    );
    expect(shapesA.map((shape) => shape.geometry)).toEqual(
      shapesB.map((shape) => shape.geometry),
    );
  });

  it.each([
    [7, 7],
    [5, 9],
    [5, 10],
    [7, 10],
    [10, 7],
  ] as const)(
    "supports %ix%i grids without hard-coded 7x7 assumptions",
    (rowCount, columnCount) => {
      const card = createFilledCard({
        id: `${rowCount}x${columnCount}`,
        chronologicalIndex: 1,
        rowCount,
        columnCount,
        hitPositions: [{ row: 0, column: 0 }],
      });

      const shapes = detector.detectInitialShapes(
        card,
        createDetectionContext(card),
      );

      expect(shapes.length).toBeGreaterThan(0);
      expect(
        shapes.every(
          (shape) =>
            shape.geometry.originRow + shape.geometry.height <= rowCount &&
            shape.geometry.originColumn + shape.geometry.width <=
              columnCount &&
            shape.cellCount >= 4,
        ),
      ).toBe(true);
    },
  );

  it("respects a raised minimumShapeCellCount", () => {
    const card = createFilledCard({
      id: "min6",
      chronologicalIndex: 1,
      rowCount: 3,
      columnCount: 3,
      hitPositions: [
        { row: 0, column: 2 },
        { row: 1, column: 2 },
        { row: 2, column: 2 },
      ],
    });

    // Free 3x2 = 6 cells maximal
    const withMin4 = detector.detectInitialShapes(
      card,
      createDetectionContext(card, 4),
    );
    const withMin6 = detector.detectInitialShapes(
      card,
      createDetectionContext(card, 6),
    );
    const withMin7 = detector.detectInitialShapes(
      card,
      createDetectionContext(card, 7),
    );

    expect(withMin4[0]?.geometry).toEqual({
      originRow: 0,
      originColumn: 0,
      width: 2,
      height: 3,
    });
    expect(withMin6).toEqual(withMin4);
    expect(withMin7).toEqual([]);
  });
});

describe("rectangle invariants", () => {
  it("every detected rectangle is empty, sized, maximal, and unique", () => {
    const card = createFilledCard({
      id: "invariants",
      chronologicalIndex: 1,
      rowCount: 6,
      columnCount: 6,
      hitPositions: [
        { row: 1, column: 1 },
        { row: 2, column: 4 },
        { row: 4, column: 2 },
      ],
    });

    const context = createDetectionContext(card);
    const shapes = detector.detectInitialShapes(card, context);
    const keys = new Set(shapes.map((shape) => shape.key));

    expect(keys.size).toBe(shapes.length);

    for (const shape of shapes) {
      expect(shape.cellCount).toBeGreaterThanOrEqual(
        context.minimumShapeCellCount,
      );
      expect(shape.cellCount).toBe(
        shape.geometry.width * shape.geometry.height,
      );
      expect(
        detector.existsUnchanged(trackedRectangle(shape.geometry), card),
      ).toBe(true);
    }
  });
});
