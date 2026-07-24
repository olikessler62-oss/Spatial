import type { ShapeGeometry, ShapeType } from "./geometry.js";
/**
 * Pure geometry detection result (no tracking id).
 */
export interface DetectedShape<TGeometry extends ShapeGeometry = ShapeGeometry> {
    readonly type: ShapeType;
    readonly geometry: TGeometry;
    readonly key: string;
    readonly cellCount: number;
}
/**
 * Concrete shape instance at a grid position.
 */
export interface ShapeInstance {
    readonly id: string;
    readonly type: ShapeType;
    readonly geometry: ShapeGeometry;
    readonly cellCount: number;
    readonly key: string;
}
//# sourceMappingURL=detected-shape.d.ts.map