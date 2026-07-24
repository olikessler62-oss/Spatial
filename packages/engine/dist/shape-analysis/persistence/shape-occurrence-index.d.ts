import type { ShapeCardOccurrence } from "../domain/tracked-shape.js";
export declare class ShapeOccurrenceIndex {
    private readonly byKey;
    add(occurrence: ShapeCardOccurrence): boolean;
    list(): readonly ShapeCardOccurrence[];
    cardIdsForShape(shapeId: string): readonly string[];
}
//# sourceMappingURL=shape-occurrence-index.d.ts.map