export interface GridCoordinate {
    readonly row: number;
    readonly column: number;
}
export type ShapeType = "rectangle" | "circle" | "polygon" | "custom";
/**
 * Axis-aligned rectangle on a zero-based grid.
 * Origin is the top-left cell.
 */
export interface RectangleGeometry {
    readonly originRow: number;
    readonly originColumn: number;
    readonly width: number;
    readonly height: number;
}
/** Extension point — not implemented in Spec 1. */
export interface CircleGeometry {
    readonly centerRow: number;
    readonly centerColumn: number;
    readonly radius: number;
}
/** Extension point — not implemented in Spec 1. */
export interface PolygonGeometry {
    readonly vertices: readonly GridCoordinate[];
}
export type ShapeGeometry = RectangleGeometry | CircleGeometry | PolygonGeometry;
export declare function isRectangleGeometry(geometry: ShapeGeometry): geometry is RectangleGeometry;
//# sourceMappingURL=geometry.d.ts.map