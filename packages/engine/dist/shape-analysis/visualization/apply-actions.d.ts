import type { ShapeVisualizationAction, ShapeVisualizationOccurrence, VisibleShapeOccurrence } from "./visualization-types.js";
export declare function applyVisualizationActions(visible: ReadonlyMap<string, VisibleShapeOccurrence>, catalog: ReadonlyMap<string, ShapeVisualizationOccurrence>, actions: readonly ShapeVisualizationAction[]): Map<string, VisibleShapeOccurrence>;
export declare function createFinalVisibleOccurrences(finalOccurrences: readonly ShapeVisualizationOccurrence[]): Map<string, VisibleShapeOccurrence>;
//# sourceMappingURL=apply-actions.d.ts.map