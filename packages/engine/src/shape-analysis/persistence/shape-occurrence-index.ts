import type {
  ShapeCardOccurrence,
  ShapeOccurrenceType,
} from "../domain/tracked-shape.js";
import { createOccurrenceKey } from "../domain/evolution-graph.js";

const OCCURRENCE_PRIORITY: Record<ShapeOccurrenceType, number> = {
  discovered: 3,
  confirmed: 2,
  retrospective: 1,
};

export class ShapeOccurrenceIndex {
  private readonly byKey = new Map<string, ShapeCardOccurrence>();

  public add(occurrence: ShapeCardOccurrence): boolean {
    const key = createOccurrenceKey(occurrence.shapeId, occurrence.cardId);
    const existing = this.byKey.get(key);

    if (existing === undefined) {
      this.byKey.set(key, occurrence);
      return true;
    }

    if (
      OCCURRENCE_PRIORITY[occurrence.occurrenceType] >
      OCCURRENCE_PRIORITY[existing.occurrenceType]
    ) {
      this.byKey.set(key, occurrence);
      return true;
    }

    return false;
  }

  public list(): readonly ShapeCardOccurrence[] {
    return [...this.byKey.values()].sort((a, b) => {
      if (a.sequenceIndex !== b.sequenceIndex) {
        return a.sequenceIndex - b.sequenceIndex;
      }

      if (a.shapeId !== b.shapeId) {
        return a.shapeId.localeCompare(b.shapeId);
      }

      return (
        OCCURRENCE_PRIORITY[b.occurrenceType] -
        OCCURRENCE_PRIORITY[a.occurrenceType]
      );
    });
  }

  public cardIdsForShape(shapeId: string): readonly string[] {
    return this.list()
      .filter((occurrence) => occurrence.shapeId === shapeId)
      .map((occurrence) => occurrence.cardId);
  }
}
