import type {
  ShapeVisualizationAction,
  ShapeVisualizationOccurrence,
  VisibleShapeOccurrence,
} from "./visualization-types.js";

export function applyVisualizationActions(
  visible: ReadonlyMap<string, VisibleShapeOccurrence>,
  catalog: ReadonlyMap<string, ShapeVisualizationOccurrence>,
  actions: readonly ShapeVisualizationAction[],
): Map<string, VisibleShapeOccurrence> {
  const next = new Map(visible);

  for (const action of actions) {
    switch (action.type) {
      case "show-shape-occurrence": {
        const occurrence = catalog.get(action.occurrenceKey);

        if (occurrence === undefined) {
          break;
        }

        next.set(action.occurrenceKey, {
          ...occurrence,
          isVisible: true,
        });
        break;
      }
      case "update-shape-brightness": {
        for (const update of action.updates) {
          const current = next.get(update.occurrenceKey);
          const catalogItem = catalog.get(update.occurrenceKey);

          if (current !== undefined) {
            next.set(update.occurrenceKey, {
              ...current,
              brightnessLevel: update.brightnessLevel,
            });
          } else if (catalogItem !== undefined) {
            next.set(update.occurrenceKey, {
              ...catalogItem,
              brightnessLevel: update.brightnessLevel,
              isVisible: false,
            });
          }
        }
        break;
      }
      case "register-split":
      case "complete-visualization":
        break;
      default:
        break;
    }
  }

  return next;
}

export function createFinalVisibleOccurrences(
  finalOccurrences: readonly ShapeVisualizationOccurrence[],
): Map<string, VisibleShapeOccurrence> {
  return new Map(
    finalOccurrences.map((occurrence) => [
      occurrence.occurrenceKey,
      { ...occurrence, isVisible: true },
    ]),
  );
}
