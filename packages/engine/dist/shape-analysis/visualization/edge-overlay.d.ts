import type { RenderedGridEdge, ShapeEdgeContribution, ShapeVisualizationConfiguration, VisibleShapeOccurrence } from "./visualization-types.js";
/** Fixed frame thickness in CSS pixels (`vectorEffect: non-scaling-stroke`). */
export declare const SHAPE_FRAME_STROKE_WIDTH_PX = 2;
/** Uniform frame opacity — streak only affects dominance / paint order. */
export declare const SHAPE_FRAME_OPACITY = 0.78;
export declare function buildEdgeContributions(cardId: string, occurrences: readonly VisibleShapeOccurrence[]): readonly ShapeEdgeContribution[];
export declare function renderGridEdges(cardId: string, occurrences: readonly VisibleShapeOccurrence[], _configuration: ShapeVisualizationConfiguration): readonly RenderedGridEdge[];
//# sourceMappingURL=edge-overlay.d.ts.map