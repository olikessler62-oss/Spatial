import type { RectangleGeometry } from "../../domain/geometry.js";
/**
 * Spec 2 geometry key — no lottery values, card ids, or persistence data.
 * Format: rectangle:r={originRow}:c={originColumn}:w={width}:h={height}
 */
export declare function createRectangleGeometryKey(geometry: RectangleGeometry): string;
export declare function rectangleCellCount(geometry: RectangleGeometry): number;
export declare function compareRectangles(a: RectangleGeometry, b: RectangleGeometry): number;
export declare function isGeometricallyValidRectangle(geometry: RectangleGeometry, rowCount: number, columnCount: number): boolean;
export declare function containsRectangle(outer: RectangleGeometry, inner: RectangleGeometry): boolean;
//# sourceMappingURL=rectangle-geometry.d.ts.map