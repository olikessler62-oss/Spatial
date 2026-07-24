import { describe, expect, it } from "vitest";

import { ShapeAnalysisError } from "../../src/shape-analysis/shape-analysis-error.js";
import {
  validateShapeAnalysisCard,
  validateShapeAnalysisCards,
} from "../../src/shape-analysis/validation/validate-shape-analysis-cards.js";
import { createFilledCard } from "./test-helpers.js";

describe("validateShapeAnalysisCard", () => {
  it("accepts a fully filled 7x7 grid", () => {
    const card = createFilledCard({
      id: "c7",
      chronologicalIndex: 1,
      rowCount: 7,
      columnCount: 7,
    });

    expect(() => validateShapeAnalysisCard(card)).not.toThrow();
  });

  it("accepts a fully filled 5x10 grid", () => {
    const card = createFilledCard({
      id: "c510",
      chronologicalIndex: 1,
      rowCount: 5,
      columnCount: 10,
    });

    expect(() => validateShapeAnalysisCard(card)).not.toThrow();
  });

  it("accepts a fully filled 7x10 grid", () => {
    const card = createFilledCard({
      id: "c710",
      chronologicalIndex: 1,
      rowCount: 7,
      columnCount: 10,
    });

    expect(() => validateShapeAnalysisCard(card)).not.toThrow();
  });

  it("rejects a missing cell", () => {
    const card = createFilledCard({
      id: "missing",
      chronologicalIndex: 1,
      rowCount: 2,
      columnCount: 2,
    });

    const incomplete = {
      ...card,
      cells: card.cells.slice(0, 3),
    };

    expect(() => validateShapeAnalysisCard(incomplete)).toThrow(
      ShapeAnalysisError,
    );

    try {
      validateShapeAnalysisCard(incomplete);
    } catch (error) {
      expect(error).toBeInstanceOf(ShapeAnalysisError);
      expect((error as ShapeAnalysisError).code).toBe("INCOMPLETE_GRID");
    }
  });

  it("rejects a duplicate cell coordinate", () => {
    const card = createFilledCard({
      id: "dup",
      chronologicalIndex: 1,
      rowCount: 2,
      columnCount: 2,
    });

    const first = card.cells[0];

    if (first === undefined) {
      throw new Error("expected first cell");
    }

    const duplicated = {
      ...card,
      cells: [...card.cells.slice(0, 3), first],
    };

    expect(() => validateShapeAnalysisCard(duplicated)).toThrow(
      ShapeAnalysisError,
    );

    try {
      validateShapeAnalysisCard(duplicated);
    } catch (error) {
      expect((error as ShapeAnalysisError).code).toBe(
        "DUPLICATE_CELL_COORDINATE",
      );
    }
  });

  it("rejects a cell outside the grid", () => {
    const card = createFilledCard({
      id: "oob",
      chronologicalIndex: 1,
      rowCount: 2,
      columnCount: 2,
    });

    const outOfBounds = {
      ...card,
      cells: [
        ...card.cells.slice(0, 3),
        { row: 5, column: 0, isHit: false, value: 99 },
      ],
    };

    expect(() => validateShapeAnalysisCard(outOfBounds)).toThrow(
      ShapeAnalysisError,
    );

    try {
      validateShapeAnalysisCard(outOfBounds);
    } catch (error) {
      expect((error as ShapeAnalysisError).code).toBe("INCOMPLETE_GRID");
    }
  });

  it("rejects cards with inconsistent grid dimensions", () => {
    const cardA = createFilledCard({
      id: "a",
      chronologicalIndex: 1,
      rowCount: 7,
      columnCount: 7,
    });
    const cardB = createFilledCard({
      id: "b",
      chronologicalIndex: 2,
      rowCount: 5,
      columnCount: 10,
    });

    expect(() =>
      validateShapeAnalysisCards([cardA, cardB], "a"),
    ).toThrow(ShapeAnalysisError);

    try {
      validateShapeAnalysisCards([cardA, cardB], "a");
    } catch (error) {
      expect((error as ShapeAnalysisError).code).toBe(
        "INCONSISTENT_GRID_LAYOUT",
      );
    }
  });
});
