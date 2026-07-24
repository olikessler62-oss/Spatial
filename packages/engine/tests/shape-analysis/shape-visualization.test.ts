import { describe, expect, it } from "vitest";

import { computeShapeBrightnessLevel } from "../../src/shape-analysis/visualization/shape-brightness.js";
import {
  assignDistinctShapeColors,
  getShapeColorKey,
  getShapeVisualColor,
  resolveShapeCssColor,
} from "../../src/shape-analysis/visualization/shape-color.js";
import { rectangleGeometryToEdgeKeys } from "../../src/shape-analysis/visualization/rectangle-edges.js";
import { renderGridEdges } from "../../src/shape-analysis/visualization/edge-overlay.js";
import { buildShapeVisualizationPlan } from "../../src/shape-analysis/visualization/plan-builder.js";
import {
  applyVisualizationActions,
  createFinalVisibleOccurrences,
} from "../../src/shape-analysis/visualization/apply-actions.js";
import { playShapeVisualizationPlan } from "../../src/shape-analysis/visualization/visualization-runner.js";
import {
  DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
  type VisibleShapeOccurrence,
} from "../../src/shape-analysis/visualization/visualization-types.js";
import type { CurrentShapePersistenceResult } from "../../src/shape-analysis/persistence/current-shape-persistence-result.js";
import type { RectangleGeometry } from "../../src/shape-analysis/domain/geometry.js";

const geometryA: RectangleGeometry = {
  originRow: 0,
  originColumn: 0,
  width: 2,
  height: 2,
};
const geometryB: RectangleGeometry = {
  originRow: 0,
  originColumn: 1,
  width: 2,
  height: 2,
};

function visible(
  partial: Omit<VisibleShapeOccurrence, "isVisible" | "colorKey" | "color"> & {
    readonly color?: VisibleShapeOccurrence["color"];
  },
): VisibleShapeOccurrence {
  const color = partial.color ?? getShapeVisualColor(partial.shapeId);
  return {
    ...partial,
    color,
    colorKey: getShapeColorKey(partial.shapeId),
    isVisible: true,
  };
}

describe("shape color and brightness", () => {
  it("assigns stable deterministic colors", () => {
    expect(getShapeColorKey("shape-001")).toBe(getShapeColorKey("shape-001"));
    expect(getShapeColorKey("shape-001")).not.toBe(getShapeColorKey("shape-002"));
  });

  it("keeps brightness constant regardless of covered card count", () => {
    const brightness =
      DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION.brightness;
    const short = computeShapeBrightnessLevel(0, 1, brightness);
    const mid = computeShapeBrightnessLevel(0, 3, brightness);
    const longA = computeShapeBrightnessLevel(0, 5, brightness);
    const longB = computeShapeBrightnessLevel(5, 10, brightness);

    expect(short).toBe(brightness.maxBrightness);
    expect(mid).toBe(brightness.maxBrightness);
    expect(longA).toBe(brightness.maxBrightness);
    expect(longB).toBe(longA);
  });

  it("assigns distinct palette colors per geometry in one analysis", () => {
    const bySeed = assignDistinctShapeColors([
      "rectangle:a",
      "rectangle:b",
      "rectangle:c",
    ]);
    const hues = [...bySeed.values()].map((color) => color.hue);
    expect(new Set(hues).size).toBe(3);
  });
});

describe("rectangle edges", () => {
  it("returns twelve segments for a 2x2 rectangle including inner lines", () => {
    const keys = rectangleGeometryToEdgeKeys(geometryA);

    expect(keys).toHaveLength(12);
    expect(keys).toContain("h:1:0");
    expect(keys).toContain("h:1:1");
    expect(keys).toContain("v:0:1");
    expect(keys).toContain("v:1:1");
  });

  it("marks internal separators for a 1x4 vertical line", () => {
    const keys = rectangleGeometryToEdgeKeys({
      originRow: 0,
      originColumn: 0,
      width: 1,
      height: 4,
    });

    expect(keys).toContain("h:1:0");
    expect(keys).toContain("h:2:0");
    expect(keys).toContain("h:3:0");
    expect(keys.filter((key) => key.startsWith("h:"))).toHaveLength(5);
  });
});

describe("edge overlap rendering", () => {
  it("keeps the longest-streak color on shared edges (no white overlap)", () => {
    const occurrences = [
      visible({
        occurrenceKey: "a:card",
        shapeId: "shape-a",
        cardId: "card",
        geometry: geometryA,
        geometryKey: "rectangle:r=0:c=0:w=2:h=2",
        brightnessLevel: 0.8,
        coveredCardCount: 4,
        occurrenceType: "discovered",
        distanceFromSelectedCard: 0,
      }),
      visible({
        occurrenceKey: "b:card",
        shapeId: "shape-b",
        cardId: "card",
        geometry: geometryB,
        geometryKey: "rectangle:r=0:c=1:w=2:h=2",
        brightnessLevel: 0.5,
        coveredCardCount: 2,
        occurrenceType: "discovered",
        distanceFromSelectedCard: 0,
      }),
    ];

    const rendered = renderGridEdges(
      "card",
      occurrences,
      DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
    );

    const colorA = resolveShapeCssColor(
      getShapeVisualColor("shape-a"),
      0.8,
    );

    const shared = rendered.find((edge) => edge.edgeKey === "v:0:1");
    expect(shared?.contributorShapeIds).toEqual(["shape-a", "shape-b"]);
    expect(shared?.color).toBe(colorA);
    expect(shared?.color).not.toBe(
      DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION.overlapColor,
    );

    const onlyA = rendered.find((edge) => edge.edgeKey === "v:0:0");
    expect(onlyA?.contributorShapeIds).toEqual(["shape-a"]);
    expect(onlyA?.color).toBe(colorA);
  });

  it("picks one dominant color when several shapes share an edge", () => {
    const third: RectangleGeometry = {
      originRow: 0,
      originColumn: 0,
      width: 3,
      height: 1,
    };

    const occurrences = [
      visible({
        occurrenceKey: "a:card",
        shapeId: "shape-a",
        cardId: "card",
        geometry: geometryA,
        geometryKey: "ga",
        brightnessLevel: 0.6,
        coveredCardCount: 3,
        occurrenceType: "discovered",
        distanceFromSelectedCard: 0,
      }),
      visible({
        occurrenceKey: "b:card",
        shapeId: "shape-b",
        cardId: "card",
        geometry: geometryB,
        geometryKey: "gb",
        brightnessLevel: 1,
        coveredCardCount: 8,
        occurrenceType: "discovered",
        distanceFromSelectedCard: 0,
      }),
      visible({
        occurrenceKey: "c:card",
        shapeId: "shape-c",
        cardId: "card",
        geometry: third,
        geometryKey: "gc",
        brightnessLevel: 0.7,
        coveredCardCount: 4,
        occurrenceType: "discovered",
        distanceFromSelectedCard: 0,
      }),
    ];

    const shared = renderGridEdges(
      "card",
      occurrences,
      DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
    ).find((edge) => edge.edgeKey === "h:0:1");

    expect(shared?.contributorShapeIds).toHaveLength(3);
    expect(shared?.color).toBe(
      resolveShapeCssColor(getShapeVisualColor("shape-b"), 1),
    );
  });

  it("ranks by actual streak even when brightness is capped", () => {
    // Both at max brightness (≥5 covered), but streak 10 must beat streak 5.
    const longNarrow: RectangleGeometry = {
      originRow: 3,
      originColumn: 1,
      width: 4,
      height: 1,
    };
    const shortWide: RectangleGeometry = {
      originRow: 2,
      originColumn: 1,
      width: 4,
      height: 2,
    };

    const occurrences = [
      visible({
        occurrenceKey: "long:card",
        shapeId: "shape-long",
        cardId: "card",
        geometry: longNarrow,
        geometryKey: "long",
        brightnessLevel: 1,
        coveredCardCount: 10,
        occurrenceType: "discovered",
        distanceFromSelectedCard: 0,
      }),
      visible({
        occurrenceKey: "short:card",
        shapeId: "shape-short",
        cardId: "card",
        geometry: shortWide,
        geometryKey: "short",
        brightnessLevel: 1,
        coveredCardCount: 5,
        occurrenceType: "discovered",
        distanceFromSelectedCard: 0,
      }),
    ];

    const rendered = renderGridEdges(
      "card",
      occurrences,
      DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
    );

    const shared = rendered.find((edge) => edge.edgeKey === "h:3:1");
    expect(shared?.contributorShapeIds).toEqual([
      "shape-long",
      "shape-short",
    ]);
    expect(shared?.color).toBe(
      resolveShapeCssColor(getShapeVisualColor("shape-long"), 1),
    );

    // Longest streak edges painted last (on top).
    const last = rendered[rendered.length - 1];
    expect(last?.contributorShapeIds).toContain("shape-long");
    expect(last?.coveredCardCount).toBe(10);
    expect(rendered.every((edge) => edge.strokeWidth === 2)).toBe(true);
  });
});

describe("plan builder and runner", () => {
  const result: CurrentShapePersistenceResult = {
    selectedCardId: "card-0",
    analyzedCardIds: ["card-0", "card-1"],
    graph: { nodes: new Map(), edges: [] },
    shapes: [
      {
        shapeId: "shape-001",
        shapeType: "rectangle",
        geometry: geometryA,
        geometryKey: "rectangle:r=0:c=0:w=2:h=2",
        discoveredAtCardId: "card-0",
        discoveredAtSequenceIndex: 0,
        previousCardCount: 1,
        coveredCardCount: 2,
        streakIncludingNewest: 2,
        streakExcludingNewest: 1,
        status: "analysis-boundary",
        isCompleteRun: false,
        parentIds: [],
        childIds: [],
        occurrenceCardIds: ["card-0", "card-1"],
      },
      {
        shapeId: "shape-002",
        shapeType: "rectangle",
        geometry: geometryB,
        geometryKey: "rectangle:r=0:c=1:w=2:h=2",
        discoveredAtCardId: "card-0",
        discoveredAtSequenceIndex: 0,
        previousCardCount: 0,
        coveredCardCount: 1,
        streakIncludingNewest: 1,
        streakExcludingNewest: 0,
        status: "analysis-boundary",
        isCompleteRun: false,
        parentIds: [],
        childIds: [],
        occurrenceCardIds: ["card-0"],
      },
      {
        shapeId: "shape-003",
        shapeType: "rectangle",
        geometry: {
          originRow: 2,
          originColumn: 2,
          width: 2,
          height: 2,
        },
        geometryKey: "rectangle:r=2:c=2:w=2:h=2",
        discoveredAtCardId: "card-0",
        discoveredAtSequenceIndex: 0,
        previousCardCount: 0,
        coveredCardCount: 1,
        streakIncludingNewest: 1,
        streakExcludingNewest: 0,
        status: "analysis-boundary",
        isCompleteRun: false,
        parentIds: [],
        childIds: [],
        occurrenceCardIds: ["card-0"],
      },
    ],
    completedRuns: [],
    occurrences: [
      {
        shapeId: "shape-001",
        cardId: "card-0",
        sequenceIndex: 0,
        occurrenceType: "discovered",
        distanceFromSelectedCard: 0,
      },
      {
        shapeId: "shape-002",
        cardId: "card-0",
        sequenceIndex: 0,
        occurrenceType: "discovered",
        distanceFromSelectedCard: 0,
      },
      {
        shapeId: "shape-003",
        cardId: "card-0",
        sequenceIndex: 0,
        occurrenceType: "discovered",
        distanceFromSelectedCard: 0,
      },
      {
        shapeId: "shape-001",
        cardId: "card-1",
        sequenceIndex: 1,
        occurrenceType: "confirmed",
        distanceFromSelectedCard: 1,
      },
    ],
    events: [
      {
        type: "analysis-started",
        selectedCardId: "card-0",
        analyzedCardIds: ["card-0", "card-1"],
      },
      {
        type: "initial-shape-detected",
        shapeId: "shape-001",
        shapeType: "rectangle",
        geometryKey: "rectangle:r=0:c=0:w=2:h=2",
        cardId: "card-0",
        sequenceIndex: 0,
      },
      {
        type: "initial-shape-detected",
        shapeId: "shape-002",
        shapeType: "rectangle",
        geometryKey: "rectangle:r=0:c=1:w=2:h=2",
        cardId: "card-0",
        sequenceIndex: 0,
      },
      {
        type: "initial-shape-detected",
        shapeId: "shape-003",
        shapeType: "rectangle",
        geometryKey: "rectangle:r=2:c=2:w=2:h=2",
        cardId: "card-0",
        sequenceIndex: 0,
      },
      {
        type: "shape-confirmed",
        shapeId: "shape-001",
        cardId: "card-1",
        sequenceIndex: 1,
        previousCardCount: 1,
        coveredCardCount: 2,
      },
      {
        type: "analysis-completed",
        selectedCardId: "card-0",
        analyzedCardIds: ["card-0", "card-1"],
      },
    ],
    metadata: {
      rowCount: 4,
      columnCount: 4,
      suppliedCardCount: 2,
      analyzedCardCount: 2,
      ignoredNewerCardCount: 0,
      rootShapeCount: 3,
      totalShapeCount: 3,
      splitCount: 0,
      terminatedShapeCount: 0,
      boundaryShapeCount: 3,
      reachedAnalysisBoundary: true,
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
      completedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  };

  it("creates one delayed step per initial root shape", () => {
    const plan = buildShapeVisualizationPlan(result);

    const showSteps = plan.steps.filter((step) =>
      step.actions.some((action) => action.type === "show-shape-occurrence"),
    );

    expect(showSteps.length).toBeGreaterThanOrEqual(3);
    expect(showSteps[0]?.delayAfterPreviousMs).toBe(0);
    expect(showSteps[1]?.delayAfterPreviousMs).toBe(150);
    expect(showSteps[2]?.delayAfterPreviousMs).toBe(150);
  });

  it("can abort the runner before later steps", async () => {
    const plan = buildShapeVisualizationPlan(result);
    const controller = new AbortController();
    const applied: number[] = [];

    const play = playShapeVisualizationPlan(plan, {
      signal: controller.signal,
      sleep: async () => undefined,
      onStep: (step) => {
        applied.push(step.index);
        if (step.index === 0) {
          controller.abort();
        }
      },
    });

    await expect(play).rejects.toMatchObject({ name: "AbortError" });
    expect(applied.length).toBe(1);
  });

  it("applies actions into visible state without DOM", () => {
    const plan = buildShapeVisualizationPlan(result);
    const catalog = new Map(
      plan.finalOccurrences.map((occurrence) => [
        occurrence.occurrenceKey,
        occurrence,
      ]),
    );

    let visibleMap = new Map<string, VisibleShapeOccurrence>();
    const first = plan.steps[0];

    if (first === undefined) {
      throw new Error("expected step");
    }

    visibleMap = applyVisualizationActions(visibleMap, catalog, first.actions);
    expect(visibleMap.size).toBe(1);

    const finals = createFinalVisibleOccurrences(plan.finalOccurrences);
    expect(finals.size).toBe(plan.finalOccurrences.length);
  });
});
