import type { ShapeGeometry, ShapeType } from "./domain/geometry.js";
import { isRectangleGeometry } from "./domain/geometry.js";
import {
  createRectangleGeometryKey,
  rectangleCellCount,
} from "./detection/rectangle/rectangle-geometry.js";
import { ShapeAnalysisError } from "./shape-analysis-error.js";

export {
  createRectangleGeometryKey,
  rectangleCellCount,
} from "./detection/rectangle/rectangle-geometry.js";

export function createShapeGeometryKey(
  shapeType: ShapeType,
  geometry: ShapeGeometry,
): string {
  if (shapeType === "rectangle" && isRectangleGeometry(geometry)) {
    return createRectangleGeometryKey(geometry);
  }

  throw new ShapeAnalysisError(
    "UNSUPPORTED_SHAPE_TYPE",
    `Geometry key generation is not implemented for shape type "${shapeType}".`,
    { shapeType },
  );
}
