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

export function createLayoutKey(
  rowCount: number,
  columnCount: number,
): string {
  return `${rowCount}x${columnCount}`;
}

export function createShapeStatisticsKey(
  rowCount: number,
  columnCount: number,
  shapeType: ShapeType,
  geometryKey: string,
): ShapeStatisticsKey {
  return {
    layoutKey: createLayoutKey(rowCount, columnCount),
    shapeType,
    geometryKey,
  };
}

export function serializeShapeStatisticsKey(
  key: ShapeStatisticsKey,
): string {
  return `layout=${key.layoutKey}|shape=${key.shapeType}|geometry=${key.geometryKey}`;
}
