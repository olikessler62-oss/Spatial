import type { ShapeType } from "./geometry.js";
/**
 * Position-based key for historical statistics (Spec 5).
 * Must not include lottery number values.
 */
export interface ShapeStatisticsKey {
    readonly layoutKey: string;
    readonly shapeType: ShapeType;
    readonly geometryKey: string;
}
export declare function createLayoutKey(rowCount: number, columnCount: number): string;
export declare function createShapeStatisticsKey(rowCount: number, columnCount: number, shapeType: ShapeType, geometryKey: string): ShapeStatisticsKey;
export declare function serializeShapeStatisticsKey(key: ShapeStatisticsKey): string;
//# sourceMappingURL=shape-statistics-key.d.ts.map