import { describe, expect, it } from "vitest";

import { DefaultShapeAnalyzerRegistry } from "../../src/shape-analysis/detection/shape-detector-registry.js";
import { RectangleShapeDetector } from "../../src/shape-analysis/detection/rectangle/rectangle-shape-detector.js";
import { createRectangleGeometryKey } from "../../src/shape-analysis/detection/rectangle/rectangle-geometry.js";
import type { RectangleGeometry } from "../../src/shape-analysis/domain/geometry.js";
import { SequentialIdGenerator } from "../../src/shape-analysis/id-generator.js";
import {
  BASIS_CARD_COUNT,
  CurrentShapePersistenceEngine,
} from "../../src/shape-analysis/persistence/current-shape-persistence-engine.js";
import { ShapeAnalysisError } from "../../src/shape-analysis/shape-analysis-error.js";
import { createFilledCard } from "./test-helpers.js";

function rect(
  originRow: number,
  originColumn: number,
  width: number,
  height: number,
): RectangleGeometry {
  return { originRow, originColumn, width, height };
}

function createEngine(): CurrentShapePersistenceEngine {
  const registry = new DefaultShapeAnalyzerRegistry();
  registry.register(new RectangleShapeDetector());
  return new CurrentShapePersistenceEngine({
    detectorRegistry: registry,
    idGenerator: new SequentialIdGenerator(),
    now: () => new Date("2026-01-01T00:00:00.000Z"),
  });
}

const six = rect(0, 0, 3, 2);
const four = rect(0, 1, 2, 2);
const sixKey = createRectangleGeometryKey(six);
const fourKey = createRectangleGeometryKey(four);

const fenceAlways = [
  { row: 0, column: 3 },
  { row: 1, column: 3 },
  { row: 2, column: 0 },
  { row: 2, column: 1 },
  { row: 2, column: 2 },
  { row: 2, column: 3 },
  { row: 3, column: 0 },
  { row: 3, column: 1 },
  { row: 3, column: 2 },
  { row: 3, column: 3 },
] as const;

function cardOpen(id: string, chronologicalIndex: number) {
  return createFilledCard({
    id,
    chronologicalIndex,
    rowCount: 4,
    columnCount: 4,
    hitPositions: [...fenceAlways],
  });
}

function cardBreakSix(id: string, chronologicalIndex: number) {
  return createFilledCard({
    id,
    chronologicalIndex,
    rowCount: 4,
    columnCount: 4,
    hitPositions: [{ row: 0, column: 0 }, ...fenceAlways],
  });
}

describe("CurrentShapePersistenceEngine (lookback streaks)", () => {
  it(`requires at least ${BASIS_CARD_COUNT} free cards from newest`, () => {
    expect(BASIS_CARD_COUNT).toBe(3);
  });

  it("reports a block free across the last three cards", () => {
    const cards = [
      cardBreakSix("c1", 1),
      cardOpen("c2", 2),
      cardOpen("c3", 3),
      cardOpen("c4", 4),
    ];

    const result = createEngine().analyze({
      selectedCardId: "c4",
      cards,
      enabledShapeTypes: ["rectangle"],
      minimumShapeCellCount: 4,
    });

    const sixShape = result.shapes.find((s) => s.geometryKey === sixKey);
    expect(sixShape?.coveredCardCount).toBe(3);
    expect(sixShape?.occurrenceCardIds).toEqual(["c2", "c3", "c4"]);
    expect(sixShape?.discoveredAtCardId).toBe("c4");
  });

  it("gives a nested 4-block a longer streak than its parent 6-block", () => {
    const cards = [
      cardBreakSix("c1", 1),
      cardBreakSix("c2", 2),
      cardOpen("c3", 3),
      cardOpen("c4", 4),
      cardOpen("c5", 5),
    ];

    const result = createEngine().analyze({
      selectedCardId: "c5",
      cards,
      enabledShapeTypes: ["rectangle"],
      minimumShapeCellCount: 4,
    });

    const sixShape = result.shapes.find((s) => s.geometryKey === sixKey);
    const fourShape = result.shapes.find((s) => s.geometryKey === fourKey);

    expect(sixShape?.coveredCardCount).toBe(3);
    expect(sixShape?.occurrenceCardIds).toEqual(["c3", "c4", "c5"]);

    expect(fourShape?.coveredCardCount).toBe(5);
    expect(fourShape?.streakIncludingNewest).toBe(5);
    expect(fourShape?.streakExcludingNewest).toBe(4);
    expect(fourShape?.occurrenceCardIds).toEqual([
      "c1",
      "c2",
      "c3",
      "c4",
      "c5",
    ]);
    expect(fourShape?.status).toBe("active");

    expect(sixShape?.streakIncludingNewest).toBe(3);
    expect(sixShape?.streakExcludingNewest).toBe(2);
  });

  it("keeps overlapping maximals from the same lookback", () => {
    const cards = [1, 2, 3].map((index) => cardOpen(`c${index}`, index));

    const result = createEngine().analyze({
      selectedCardId: "c3",
      cards,
      enabledShapeTypes: ["rectangle"],
      minimumShapeCellCount: 4,
    });

    expect(result.shapes.some((s) => s.geometryKey === sixKey)).toBe(true);
    expect(result.shapes.every((s) => s.coveredCardCount >= 3)).toBe(true);
  });

  it("ignores newer cards after the selected (last) card", () => {
    const cards = [
      cardOpen("c1", 1),
      cardOpen("c2", 2),
      cardOpen("c3", 3),
      cardOpen("c4", 4),
    ];

    const result = createEngine().analyze({
      selectedCardId: "c3",
      cards,
      enabledShapeTypes: ["rectangle"],
      minimumShapeCellCount: 4,
    });

    expect(result.analyzedCardIds).toEqual(["c1", "c2", "c3"]);
    expect(result.metadata.ignoredNewerCardCount).toBe(1);

    const sixShape = result.shapes.find((s) => s.geometryKey === sixKey);
    expect(sixShape?.coveredCardCount).toBe(3);
    expect(sixShape?.occurrenceCardIds).toEqual(["c1", "c2", "c3"]);
  });

  it("does not report a geometry free on fewer than three newest cards", () => {
    const cards = [
      cardBreakSix("c1", 1),
      cardBreakSix("c2", 2),
      cardBreakSix("c3", 3),
      cardOpen("c4", 4),
      cardOpen("c5", 5),
    ];

    const result = createEngine().analyze({
      selectedCardId: "c5",
      cards,
      enabledShapeTypes: ["rectangle"],
      minimumShapeCellCount: 4,
    });

    expect(result.shapes.some((s) => s.geometryKey === sixKey)).toBe(false);
  });

  it("respects AbortSignal", () => {
    const controller = new AbortController();
    controller.abort();

    expect(() =>
      createEngine().analyze({
        selectedCardId: "c3",
        cards: [cardOpen("c1", 1), cardOpen("c2", 2), cardOpen("c3", 3)],
        enabledShapeTypes: ["rectangle"],
        minimumShapeCellCount: 4,
        executionOptions: { signal: controller.signal },
      }),
    ).toThrow(ShapeAnalysisError);
  });

  it("does not emit split events", () => {
    const cards = [1, 2, 3, 4, 5].map((index) =>
      index <= 2 ? cardBreakSix(`c${index}`, index) : cardOpen(`c${index}`, index),
    );

    const result = createEngine().analyze({
      selectedCardId: "c5",
      cards,
      enabledShapeTypes: ["rectangle"],
      minimumShapeCellCount: 4,
    });

    expect(result.graph.edges).toEqual([]);
    expect(result.metadata.splitCount).toBe(0);
    expect(
      result.events.some(
        (event) =>
          event.type === "shape-split"
          || event.type === "child-shape-detected",
      ),
    ).toBe(false);
  });

  it("reports a nested horizontal line with a longer streak than a vertical rival", () => {
    // Row of four (22–25 analogue) free for 6 cards; a vertical 4-stack free for 3.
    // Wider parent maximal stays free for all 6 as well — line must still win.
    const fence = [
      { row: 0, column: 0 },
      { row: 0, column: 5 },
      { row: 1, column: 0 },
      { row: 1, column: 2 },
      { row: 1, column: 3 },
      { row: 1, column: 4 },
      { row: 1, column: 5 },
      { row: 2, column: 0 },
      { row: 2, column: 2 },
      { row: 2, column: 3 },
      { row: 2, column: 4 },
      { row: 2, column: 5 },
      { row: 3, column: 0 },
      { row: 3, column: 5 },
      { row: 4, column: 0 },
      { row: 4, column: 1 },
      { row: 4, column: 2 },
      { row: 4, column: 3 },
      { row: 4, column: 4 },
      { row: 4, column: 5 },
    ] as const;

    const horizontal = rect(3, 1, 4, 1); // 4-cell line
    const vertical = rect(0, 1, 1, 4); // 4-cell column through same cell
    const horizontalKey = createRectangleGeometryKey(horizontal);
    const verticalKey = createRectangleGeometryKey(vertical);

    function cardBothOpen(id: string, chronologicalIndex: number) {
      return createFilledCard({
        id,
        chronologicalIndex,
        rowCount: 5,
        columnCount: 6,
        hitPositions: [...fence],
      });
    }

    function cardBreakVertical(id: string, chronologicalIndex: number) {
      return createFilledCard({
        id,
        chronologicalIndex,
        rowCount: 5,
        columnCount: 6,
        hitPositions: [{ row: 0, column: 1 }, ...fence],
      });
    }

    const cards = [
      cardBreakVertical("c1", 1),
      cardBreakVertical("c2", 2),
      cardBreakVertical("c3", 3),
      cardBothOpen("c4", 4),
      cardBothOpen("c5", 5),
      cardBothOpen("c6", 6),
    ];

    const result = createEngine().analyze({
      selectedCardId: "c6",
      cards,
      enabledShapeTypes: ["rectangle"],
      minimumShapeCellCount: 4,
    });

    const line = result.shapes.find((s) => s.geometryKey === horizontalKey);
    const col = result.shapes.find((s) => s.geometryKey === verticalKey);

    expect(line?.coveredCardCount).toBe(6);
    expect(col?.coveredCardCount).toBe(3);
    expect(result.shapes[0]?.geometryKey).toBe(horizontalKey);
  });
});
