/**
 * Spec 2 geometry key — no lottery values, card ids, or persistence data.
 * Format: rectangle:r={originRow}:c={originColumn}:w={width}:h={height}
 */
export function createRectangleGeometryKey(geometry) {
    return `rectangle:r=${geometry.originRow}:c=${geometry.originColumn}:w=${geometry.width}:h=${geometry.height}`;
}
export function rectangleCellCount(geometry) {
    return geometry.width * geometry.height;
}
export function compareRectangles(a, b) {
    const areaA = rectangleCellCount(a);
    const areaB = rectangleCellCount(b);
    if (areaA !== areaB) {
        return areaB - areaA;
    }
    if (a.originRow !== b.originRow) {
        return a.originRow - b.originRow;
    }
    if (a.originColumn !== b.originColumn) {
        return a.originColumn - b.originColumn;
    }
    if (a.width !== b.width) {
        return b.width - a.width;
    }
    return b.height - a.height;
}
export function isGeometricallyValidRectangle(geometry, rowCount, columnCount) {
    return (geometry.originRow >= 0 &&
        geometry.originColumn >= 0 &&
        geometry.width >= 1 &&
        geometry.height >= 1 &&
        geometry.originRow + geometry.height <= rowCount &&
        geometry.originColumn + geometry.width <= columnCount);
}
export function containsRectangle(outer, inner) {
    const outerEndRow = outer.originRow + outer.height;
    const outerEndColumn = outer.originColumn + outer.width;
    const innerEndRow = inner.originRow + inner.height;
    const innerEndColumn = inner.originColumn + inner.width;
    return (inner.originRow >= outer.originRow &&
        inner.originColumn >= outer.originColumn &&
        innerEndRow <= outerEndRow &&
        innerEndColumn <= outerEndColumn);
}
//# sourceMappingURL=rectangle-geometry.js.map