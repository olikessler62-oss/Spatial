import type { ShapeGeometry, ShapeType } from "./geometry.js";
export type TrackedShapeStatus = "active" | "split" | "terminated" | "analysis-boundary";
export type ShapeTerminationReason = "split-into-child-shapes" | "no-valid-child-shape" | "hit-inside-shape" | "analysis-window-exhausted" | "invalid-input" | "cancelled";
export type ShapeOccurrenceType = "discovered" | "confirmed" | "retrospective";
/**
 * A tracked shape in the temporal evolution graph (Spec 3).
 *
 * `previousCardCount` = confirmed older cards relative to the selected card.
 * `coveredCardCount` = previousCardCount + 1.
 */
export interface TrackedShape<TGeometry extends ShapeGeometry = ShapeGeometry> {
    readonly id: string;
    readonly shapeType: ShapeType;
    readonly geometry: TGeometry;
    readonly geometryKey: string;
    readonly discoveredAtCardId: string;
    readonly discoveredAtSequenceIndex: number;
    readonly previousCardCount: number;
    readonly coveredCardCount: number;
    readonly status: TrackedShapeStatus;
    readonly parentIds: readonly string[];
    readonly childIds: readonly string[];
    readonly lastUnchangedCardId: string;
    readonly splitAtCardId?: string;
    readonly terminatedAtCardId?: string;
    readonly terminationReason?: ShapeTerminationReason;
    readonly isCompleteRun: boolean;
}
export interface ShapeCardOccurrence {
    readonly shapeId: string;
    readonly cardId: string;
    readonly sequenceIndex: number;
    readonly occurrenceType: ShapeOccurrenceType;
    readonly distanceFromSelectedCard: number;
}
export declare function coveredCardCount(previousCardCount: number): number;
/**
 * Spec 3: a child discovered at sequence index i starts with
 * previousCardCount = i (distance from the selected card).
 */
export declare function initialChildPreviousCardCount(discoverySequenceIndex: number): number;
/**
 * @deprecated Prefer initialChildPreviousCardCount(discoverySequenceIndex).
 * Kept for Spec 1 wording where discovery index equals parent count at split.
 */
export declare function inheritPreviousCardCount(parent: Pick<TrackedShape, "previousCardCount">): number;
export declare function createAnalysisBoundaryOutcome(previousCardCount: number): {
    readonly status: "analysis-boundary";
    readonly terminationReason: "analysis-window-exhausted";
    readonly isCompleteRun: false;
    readonly previousCardCount: number;
    readonly coveredCardCount: number;
};
//# sourceMappingURL=tracked-shape.d.ts.map