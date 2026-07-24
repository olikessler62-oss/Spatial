import { describe, expect, it } from "vitest";

import {
  appendSplitEdge,
  createOccurrenceKey,
  deduplicateByShapeKey,
} from "../../src/shape-analysis/domain/evolution-graph.js";
import type { DetectedShape } from "../../src/shape-analysis/domain/detected-shape.js";
import type { RectangleGeometry } from "../../src/shape-analysis/domain/geometry.js";
import type { TrackedShape } from "../../src/shape-analysis/domain/tracked-shape.js";
import {
  createAnalysisBoundaryOutcome,
  coveredCardCount,
  initialChildPreviousCardCount,
} from "../../src/shape-analysis/domain/tracked-shape.js";
import { createRectangleGeometryKey } from "../../src/shape-analysis/detection/rectangle/rectangle-geometry.js";

const rect = (
  originRow: number,
  originColumn: number,
  width: number,
  height: number,
): RectangleGeometry => ({
  originRow,
  originColumn,
  width,
  height,
});

const detected = (
  geometry: RectangleGeometry,
): DetectedShape<RectangleGeometry> => ({
  type: "rectangle",
  geometry,
  key: createRectangleGeometryKey(geometry),
  cellCount: geometry.width * geometry.height,
});

describe("shape evolution domain rules", () => {
  it("initializes child previousCardCount from discovery sequence index", () => {
    const parent: TrackedShape<RectangleGeometry> = {
      id: "shape-001",
      shapeType: "rectangle",
      geometry: rect(0, 0, 4, 4),
      geometryKey: createRectangleGeometryKey(rect(0, 0, 4, 4)),
      discoveredAtCardId: "card-0",
      discoveredAtSequenceIndex: 0,
      previousCardCount: 3,
      coveredCardCount: 4,
      status: "split",
      parentIds: [],
      childIds: [],
      lastUnchangedCardId: "card-2",
      isCompleteRun: true,
      terminationReason: "split-into-child-shapes",
    };

    // Split discovered at sequence index 3 → child starts at 3
    const childPrevious = initialChildPreviousCardCount(3);

    expect(childPrevious).toBe(parent.previousCardCount);
    expect(coveredCardCount(childPrevious)).toBe(4);
  });

  it("allows overlapping child shapes", () => {
    const children = [
      detected(rect(0, 0, 3, 2)),
      detected(rect(0, 1, 3, 2)),
    ];

    expect(children[0]?.cellCount).toBe(6);
    expect(children[1]?.cellCount).toBe(6);
    expect(children[0]?.key).not.toBe(children[1]?.key);
  });

  it("deduplicates the same child geometry within one card", () => {
    const geometry = rect(1, 1, 2, 2);
    const duplicates = [
      detected(geometry),
      detected(geometry),
      detected(geometry),
    ];

    const unique = deduplicateByShapeKey(duplicates);

    expect(unique).toHaveLength(1);
    expect(unique[0]?.key).toBe(createRectangleGeometryKey(geometry));
    expect(createOccurrenceKey("shape-1", "card-a")).toBe("shape-1:card-a");
  });

  it("allows multiple parent-child edges to the same child node", () => {
    let edges = appendSplitEdge([], {
      parentShapeId: "parent-a",
      childShapeId: "child-c",
      splitCardId: "card-3",
      splitSequenceIndex: 3,
      type: "split",
    });

    edges = appendSplitEdge(edges, {
      parentShapeId: "parent-b",
      childShapeId: "child-c",
      splitCardId: "card-3",
      splitSequenceIndex: 3,
      type: "split",
    });

    edges = appendSplitEdge(edges, {
      parentShapeId: "parent-a",
      childShapeId: "child-c",
      splitCardId: "card-3",
      splitSequenceIndex: 3,
      type: "split",
    });

    expect(edges).toHaveLength(2);
    expect(edges.map((edge) => edge.parentShapeId).sort()).toEqual([
      "parent-a",
      "parent-b",
    ]);
    expect(edges.every((edge) => edge.childShapeId === "child-c")).toBe(true);
  });
});

describe("analysis boundary outcome", () => {
  it("marks a shape that reaches the oldest card as incomplete", () => {
    const outcome = createAnalysisBoundaryOutcome(9);

    expect(outcome).toEqual({
      status: "analysis-boundary",
      terminationReason: "analysis-window-exhausted",
      isCompleteRun: false,
      previousCardCount: 9,
      coveredCardCount: 10,
    });
  });
});
