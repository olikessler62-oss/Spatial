import type { CurrentShapePersistenceResult } from "../persistence/current-shape-persistence-result.js";
import { computeShapeBrightnessLevel } from "./shape-brightness.js";
import {
  assignDistinctShapeColors,
} from "./shape-color.js";
import {
  DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
  createOccurrenceVisualizationKey,
  type ShapeVisualizationAction,
  type ShapeVisualizationConfiguration,
  type ShapeVisualizationOccurrence,
  type ShapeVisualizationPlan,
  type ShapeVisualizationStep,
  type ShapeVisualColor,
} from "./visualization-types.js";

export function buildShapeVisualizationPlan(
  result: CurrentShapePersistenceResult,
  configuration: ShapeVisualizationConfiguration = DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
  analysisId = `analysis-${result.selectedCardId}-${result.shapes.length}`,
): ShapeVisualizationPlan {
  const colorByGeometryKey = assignDistinctShapeColors(
    result.shapes.map((shape) => shape.geometryKey),
  );
  const colorByShapeId = new Map<string, ShapeVisualColor>();
  const coveredByShapeId = new Map<string, number>();
  const geometryByShapeId = new Map(
    result.shapes.map((shape) => [
      shape.shapeId,
      {
        geometry: shape.geometry,
        geometryKey: shape.geometryKey,
      },
    ]),
  );

  for (const shape of result.shapes) {
    const color =
      colorByGeometryKey.get(shape.geometryKey)
      ?? colorByGeometryKey.values().next().value;
    if (color !== undefined) {
      colorByShapeId.set(shape.shapeId, color);
    }
    coveredByShapeId.set(shape.shapeId, shape.coveredCardCount);
  }

  const occurrenceByKey = new Map<string, ShapeVisualizationOccurrence>();

  for (const occurrence of result.occurrences) {
    const shapeMeta = geometryByShapeId.get(occurrence.shapeId);
    const color = colorByShapeId.get(occurrence.shapeId);

    if (shapeMeta === undefined || color === undefined) {
      continue;
    }

    const covered = coveredByShapeId.get(occurrence.shapeId) ?? 1;
    const occurrenceKey = createOccurrenceVisualizationKey(
      occurrence.shapeId,
      occurrence.cardId,
    );

    occurrenceByKey.set(occurrenceKey, {
      occurrenceKey,
      shapeId: occurrence.shapeId,
      cardId: occurrence.cardId,
      geometry: shapeMeta.geometry,
      geometryKey: shapeMeta.geometryKey,
      colorKey: `hsl:${color.hue}:${color.saturation}:${color.baseLightness}`,
      color,
      brightnessLevel: computeShapeBrightnessLevel(
        occurrence.distanceFromSelectedCard,
        covered,
        configuration.brightness,
      ),
      coveredCardCount: covered,
      occurrenceType: occurrence.occurrenceType,
      distanceFromSelectedCard: occurrence.distanceFromSelectedCard,
    });
  }

  const steps: ShapeVisualizationStep[] = [];
  const knownOccurrenceKeys = new Set<string>();

  const pushStep = (actions: readonly ShapeVisualizationAction[]): void => {
    if (actions.length === 0) {
      return;
    }

    steps.push({
      index: steps.length,
      delayAfterPreviousMs: steps.length === 0 ? 0 : configuration.stepDelayMs,
      actions,
    });
  };

  const brightnessUpdatesForShape = (
    shapeId: string,
  ): ShapeVisualizationAction => {
    const updates = [...occurrenceByKey.values()]
      .filter((occurrence) => occurrence.shapeId === shapeId)
      .filter(
        (occurrence) =>
          knownOccurrenceKeys.has(occurrence.occurrenceKey) ||
          occurrence.occurrenceType === "discovered",
      )
      .map((occurrence) => ({
        occurrenceKey: occurrence.occurrenceKey,
        brightnessLevel: occurrence.brightnessLevel,
      }));

    return {
      type: "update-shape-brightness",
      shapeId,
      updates,
    };
  };

  for (const event of result.events) {
    switch (event.type) {
      case "initial-shape-detected": {
        const key = createOccurrenceVisualizationKey(
          event.shapeId,
          event.cardId,
        );
        knownOccurrenceKeys.add(key);
        pushStep([
          { type: "show-shape-occurrence", occurrenceKey: key },
          brightnessUpdatesForShape(event.shapeId),
        ]);
        break;
      }
      case "shape-confirmed": {
        const key = createOccurrenceVisualizationKey(
          event.shapeId,
          event.cardId,
        );
        knownOccurrenceKeys.add(key);
        pushStep([
          { type: "show-shape-occurrence", occurrenceKey: key },
          brightnessUpdatesForShape(event.shapeId),
        ]);
        break;
      }
      case "child-shape-detected": {
        const key = createOccurrenceVisualizationKey(
          event.shapeId,
          event.cardId,
        );
        knownOccurrenceKeys.add(key);
        pushStep([
          { type: "show-shape-occurrence", occurrenceKey: key },
          brightnessUpdatesForShape(event.shapeId),
        ]);
        break;
      }
      case "retrospective-shape-occurrence": {
        const key = createOccurrenceVisualizationKey(
          event.shapeId,
          event.cardId,
        );
        knownOccurrenceKeys.add(key);
        pushStep([
          { type: "show-shape-occurrence", occurrenceKey: key },
          brightnessUpdatesForShape(event.shapeId),
        ]);
        break;
      }
      case "shape-split": {
        pushStep([
          {
            type: "register-split",
            parentShapeId: event.parentShapeId,
            childShapeIds: event.childShapeIds,
            cardId: event.cardId,
          },
        ]);
        break;
      }
      default:
        break;
    }
  }

  pushStep([{ type: "complete-visualization" }]);

  return {
    analysisId,
    selectedCardId: result.selectedCardId,
    steps,
    finalOccurrences: [...occurrenceByKey.values()],
    colorByShapeId,
  };
}
