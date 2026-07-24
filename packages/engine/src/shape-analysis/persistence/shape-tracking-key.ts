import type { ShapeType } from "../domain/geometry.js";

export function createShapeTrackingKey(
  shapeType: ShapeType,
  geometryKey: string,
  discoveredAtCardId: string,
): string {
  return `${shapeType}:${geometryKey}:discovered=${discoveredAtCardId}`;
}
