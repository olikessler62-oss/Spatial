import type { ShapeGeometry } from "../domain/geometry.js";
import type { ShapeOccurrenceType } from "../domain/tracked-shape.js";
export type CellEdge = "top" | "right" | "bottom" | "left";
export type GridEdgeOrientation = "horizontal" | "vertical";
/**
 * Horizontal: row = line index between rows (0..rowCount), column = cell column.
 * Vertical: column = line index between columns (0..columnCount), row = cell row.
 */
export interface GridEdgeKey {
    readonly orientation: GridEdgeOrientation;
    readonly row: number;
    readonly column: number;
}
export declare function serializeGridEdgeKey(edge: GridEdgeKey): string;
export declare function parseGridEdgeKey(key: string): GridEdgeKey;
export interface ShapeVisualColor {
    readonly hue: number;
    readonly saturation: number;
    readonly baseLightness: number;
}
export interface ShapeBrightnessConfiguration {
    readonly minBrightness: number;
    readonly maxBrightness: number;
}
export interface ShapeVisualizationConfiguration {
    readonly stepDelayMs: number;
    readonly brightness: ShapeBrightnessConfiguration;
    readonly overlapColor: string;
}
export declare const DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION: ShapeVisualizationConfiguration;
export interface ShapeVisualizationOccurrence {
    readonly occurrenceKey: string;
    readonly shapeId: string;
    readonly cardId: string;
    readonly geometry: ShapeGeometry;
    readonly geometryKey: string;
    readonly colorKey: string;
    readonly color: ShapeVisualColor;
    readonly brightnessLevel: number;
    /** Free streak length ending at newest (drives dominance / stroke weight). */
    readonly coveredCardCount: number;
    readonly occurrenceType: ShapeOccurrenceType;
    readonly distanceFromSelectedCard: number;
}
export interface VisibleShapeOccurrence extends ShapeVisualizationOccurrence {
    readonly isVisible: boolean;
}
export interface ShowShapeOccurrenceAction {
    readonly type: "show-shape-occurrence";
    readonly occurrenceKey: string;
}
export interface UpdateShapeBrightnessAction {
    readonly type: "update-shape-brightness";
    readonly shapeId: string;
    readonly updates: readonly {
        readonly occurrenceKey: string;
        readonly brightnessLevel: number;
    }[];
}
export interface RegisterSplitAction {
    readonly type: "register-split";
    readonly parentShapeId: string;
    readonly childShapeIds: readonly string[];
    readonly cardId: string;
}
export interface CompleteVisualizationAction {
    readonly type: "complete-visualization";
}
export type ShapeVisualizationAction = ShowShapeOccurrenceAction | UpdateShapeBrightnessAction | RegisterSplitAction | CompleteVisualizationAction;
export interface ShapeVisualizationStep {
    readonly index: number;
    readonly delayAfterPreviousMs: number;
    readonly actions: readonly ShapeVisualizationAction[];
}
export interface ShapeVisualizationPlan {
    readonly analysisId: string;
    readonly selectedCardId: string;
    readonly steps: readonly ShapeVisualizationStep[];
    readonly finalOccurrences: readonly ShapeVisualizationOccurrence[];
    readonly colorByShapeId: ReadonlyMap<string, ShapeVisualColor>;
}
export type ShapeVisualizationStatus = "idle" | "analyzing" | "playing" | "paused" | "completed" | "cancelled" | "error";
export interface ShapeVisualizationState {
    readonly status: ShapeVisualizationStatus;
    readonly selectedCardId: string | null;
    readonly analysisId: string | null;
    readonly visibleOccurrences: ReadonlyMap<string, VisibleShapeOccurrence>;
    readonly activeStepIndex: number;
    readonly totalStepCount: number;
    readonly errorCode?: string;
}
export interface ShapeEdgeContribution {
    readonly shapeId: string;
    readonly cardId: string;
    readonly edgeKey: string;
    readonly color: string;
    readonly brightness: number;
    readonly coveredCardCount: number;
    readonly cellCount: number;
}
export interface RenderedGridEdge {
    readonly edgeKey: string;
    readonly color: string;
    readonly opacity: number;
    /** CSS pixel stroke width (`non-scaling-stroke`). */
    readonly strokeWidth: number;
    /** Dominant shape streak — used for paint order (longest on top). */
    readonly coveredCardCount: number;
    readonly contributorShapeIds: readonly string[];
}
export type ShapeVisualizationErrorCode = "NO_SELECTED_CARD" | "NO_ANALYSIS_CARDS" | "ANALYSIS_FAILED" | "INVALID_VISUALIZATION_PLAN" | "CARD_NOT_RENDERABLE" | "VISUALIZATION_CANCELLED";
export declare function createOccurrenceVisualizationKey(shapeId: string, cardId: string): string;
//# sourceMappingURL=visualization-types.d.ts.map