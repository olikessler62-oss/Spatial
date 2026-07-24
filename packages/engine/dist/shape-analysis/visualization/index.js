export { DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION, createOccurrenceVisualizationKey, serializeGridEdgeKey, parseGridEdgeKey, } from "./visualization-types.js";
export { getShapeVisualColor, getShapeColorKey, assignDistinctShapeColors, resolveShapeCssColor, SHAPE_COLOR_PALETTE, } from "./shape-color.js";
export { computeShapeBrightnessLevel } from "./shape-brightness.js";
export { rectangleGeometryToEdgeKeys, getRectangleEdgeKeysCached, } from "./rectangle-edges.js";
export { buildEdgeContributions, renderGridEdges, } from "./edge-overlay.js";
export { buildShapeVisualizationPlan } from "./plan-builder.js";
export { playShapeVisualizationPlan, } from "./visualization-runner.js";
export { applyVisualizationActions, createFinalVisibleOccurrences, } from "./apply-actions.js";
//# sourceMappingURL=index.js.map