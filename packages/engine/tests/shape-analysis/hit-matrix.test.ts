import { describe, expect, it } from "vitest";

import {
  buildHitMatrix,
  hitMatricesEqual,
} from "../../src/shape-analysis/hit-matrix.js";
import {
  createFilledCard,
  shuffleValues,
} from "./test-helpers.js";

describe("number independence of analysis input", () => {
  it("produces identical hit matrices for different number layouts with same hits", () => {
    const hits = [
      { row: 0, column: 1 },
      { row: 2, column: 2 },
      { row: 3, column: 0 },
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

    expect(cardA.cells.map((cell) => cell.value)).not.toEqual(
      cardB.cells.map((cell) => cell.value),
    );

    const matrixA = buildHitMatrix(cardA);
    const matrixB = buildHitMatrix(cardB);

    expect(hitMatricesEqual(matrixA, matrixB)).toBe(true);
    expect(matrixA[0]?.[1]).toBe(true);
    expect(matrixA[2]?.[2]).toBe(true);
    expect(matrixA[3]?.[0]).toBe(true);
    expect(matrixA[0]?.[0]).toBe(false);
  });
});
