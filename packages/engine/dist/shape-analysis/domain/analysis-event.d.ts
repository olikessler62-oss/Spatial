import type { ShapeType } from "./geometry.js";
import type { ShapeTerminationReason } from "./tracked-shape.js";
export interface AnalysisStartedEvent {
    readonly type: "analysis-started";
    readonly selectedCardId: string;
    readonly analyzedCardIds: readonly string[];
}
export interface InitialShapeDetectedEvent {
    readonly type: "initial-shape-detected";
    readonly shapeId: string;
    readonly shapeType: ShapeType;
    readonly geometryKey: string;
    readonly cardId: string;
    readonly sequenceIndex: number;
}
export interface CardAnalysisStartedEvent {
    readonly type: "card-analysis-started";
    readonly cardId: string;
    readonly sequenceIndex: number;
    readonly activeShapeCount: number;
}
export interface ShapeConfirmedEvent {
    readonly type: "shape-confirmed";
    readonly shapeId: string;
    readonly cardId: string;
    readonly sequenceIndex: number;
    readonly previousCardCount: number;
    readonly coveredCardCount: number;
}
export interface ShapeSplitEvent {
    readonly type: "shape-split";
    readonly parentShapeId: string;
    readonly childShapeIds: readonly string[];
    readonly cardId: string;
    readonly sequenceIndex: number;
}
export interface ChildShapeDetectedEvent {
    readonly type: "child-shape-detected";
    readonly shapeId: string;
    readonly parentShapeIds: readonly string[];
    readonly cardId: string;
    readonly sequenceIndex: number;
    readonly previousCardCount: number;
    readonly coveredCardCount: number;
}
export interface RetrospectiveShapeOccurrenceEvent {
    readonly type: "retrospective-shape-occurrence";
    readonly shapeId: string;
    readonly cardId: string;
    readonly sequenceIndex: number;
    readonly discoveryCardId: string;
    readonly discoverySequenceIndex: number;
}
export interface ShapeTerminatedEvent {
    readonly type: "shape-terminated";
    readonly shapeId: string;
    readonly cardId: string;
    readonly sequenceIndex: number;
    readonly reason: "no-valid-child-shape";
}
export interface ShapeReachedBoundaryEvent {
    readonly type: "shape-reached-boundary";
    readonly shapeId: string;
    readonly oldestAnalyzedCardId: string;
    readonly previousCardCount: number;
    readonly coveredCardCount: number;
}
export interface CardAnalysisCompletedEvent {
    readonly type: "card-analysis-completed";
    readonly cardId: string;
    readonly sequenceIndex: number;
}
export interface AnalysisCompletedEvent {
    readonly type: "analysis-completed";
    readonly selectedCardId: string;
    readonly analyzedCardIds: readonly string[];
}
export type ShapeAnalysisEvent = AnalysisStartedEvent | InitialShapeDetectedEvent | CardAnalysisStartedEvent | ShapeConfirmedEvent | ShapeSplitEvent | ChildShapeDetectedEvent | RetrospectiveShapeOccurrenceEvent | ShapeTerminatedEvent | ShapeReachedBoundaryEvent | CardAnalysisCompletedEvent | AnalysisCompletedEvent;
export type { ShapeTerminationReason };
//# sourceMappingURL=analysis-event.d.ts.map