import type { RectangleGeometry } from "../domain/geometry.js";
/**
 * All grid line segments belonging to a rectangle (outer + inner separators).
 */
export declare function rectangleGeometryToEdgeKeys(geometry: RectangleGeometry): readonly string[];
export declare function getRectangleEdgeKeysCached(geometryKey: string, geometry: RectangleGeometry): readonly string[];
//# sourceMappingURL=rectangle-edges.d.ts.map