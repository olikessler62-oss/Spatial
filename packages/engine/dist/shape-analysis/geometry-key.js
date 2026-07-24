import { isRectangleGeometry } from "./domain/geometry.js";
import { createRectangleGeometryKey, } from "./detection/rectangle/rectangle-geometry.js";
import { ShapeAnalysisError } from "./shape-analysis-error.js";
export { createRectangleGeometryKey, rectangleCellCount, } from "./detection/rectangle/rectangle-geometry.js";
export function createShapeGeometryKey(shapeType, geometry) {
    if (shapeType === "rectangle" && isRectangleGeometry(geometry)) {
        return createRectangleGeometryKey(geometry);
    }
    throw new ShapeAnalysisError("UNSUPPORTED_SHAPE_TYPE", `Geometry key generation is not implemented for shape type "${shapeType}".`, { shapeType });
}
//# sourceMappingURL=geometry-key.js.map