export type {
  CellEdge,
  GridEdgeKey,
  GridEdgeOrientation,
  ShapeVisualColor,
  ShapeBrightnessConfiguration,
  ShapeVisualizationConfiguration,
  ShapeVisualizationOccurrence,
  VisibleShapeOccurrence,
  ShowShapeOccurrenceAction,
  UpdateShapeBrightnessAction,
  RegisterSplitAction,
  CompleteVisualizationAction,
  ShapeVisualizationAction,
  ShapeVisualizationStep,
  ShapeVisualizationPlan,
  ShapeVisualizationStatus,
  ShapeVisualizationState,
  ShapeEdgeContribution,
  RenderedGridEdge,
  ShapeVisualizationErrorCode,
} from "./visualization-types.js";

export {
  DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
  createOccurrenceVisualizationKey,
  serializeGridEdgeKey,
  parseGridEdgeKey,
} from "./visualization-types.js";

export {
  getShapeVisualColor,
  getShapeColorKey,
  assignDistinctShapeColors,
  resolveShapeCssColor,
  SHAPE_COLOR_PALETTE,
} from "./shape-color.js";

export { computeShapeBrightnessLevel } from "./shape-brightness.js";

export {
  rectangleGeometryToEdgeKeys,
  getRectangleEdgeKeysCached,
} from "./rectangle-edges.js";

export {
  buildEdgeContributions,
  renderGridEdges,
} from "./edge-overlay.js";

export { buildShapeVisualizationPlan } from "./plan-builder.js";

export {
  playShapeVisualizationPlan,
  type ShapeVisualizationRunnerOptions,
} from "./visualization-runner.js";

export {
  applyVisualizationActions,
  createFinalVisibleOccurrences,
} from "./apply-actions.js";
