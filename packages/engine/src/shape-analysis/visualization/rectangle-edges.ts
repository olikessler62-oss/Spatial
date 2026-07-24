import type { RectangleGeometry } from "../domain/geometry.js";
import {
  serializeGridEdgeKey,
  type GridEdgeKey,
} from "./visualization-types.js";

/**
 * All grid line segments belonging to a rectangle (outer + inner separators).
 */
export function rectangleGeometryToEdgeKeys(
  geometry: RectangleGeometry,
): readonly string[] {
  const edges: GridEdgeKey[] = [];

  for (
    let lineRow = geometry.originRow;
    lineRow <= geometry.originRow + geometry.height;
    lineRow += 1
  ) {
    for (
      let column = geometry.originColumn;
      column < geometry.originColumn + geometry.width;
      column += 1
    ) {
      edges.push({
        orientation: "horizontal",
        row: lineRow,
        column,
      });
    }
  }

  for (
    let lineColumn = geometry.originColumn;
    lineColumn <= geometry.originColumn + geometry.width;
    lineColumn += 1
  ) {
    for (
      let row = geometry.originRow;
      row < geometry.originRow + geometry.height;
      row += 1
    ) {
      edges.push({
        orientation: "vertical",
        row,
        column: lineColumn,
      });
    }
  }

  return edges.map(serializeGridEdgeKey);
}

const edgeCache = new Map<string, readonly string[]>();

export function getRectangleEdgeKeysCached(
  geometryKey: string,
  geometry: RectangleGeometry,
): readonly string[] {
  const cached = edgeCache.get(geometryKey);

  if (cached !== undefined) {
    return cached;
  }

  const keys = rectangleGeometryToEdgeKeys(geometry);
  edgeCache.set(geometryKey, keys);
  return keys;
}
