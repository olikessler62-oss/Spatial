export function createLayoutKey(rowCount, columnCount) {
    return `${rowCount}x${columnCount}`;
}
export function createShapeStatisticsKey(rowCount, columnCount, shapeType, geometryKey) {
    return {
        layoutKey: createLayoutKey(rowCount, columnCount),
        shapeType,
        geometryKey,
    };
}
export function serializeShapeStatisticsKey(key) {
    return `layout=${key.layoutKey}|shape=${key.shapeType}|geometry=${key.geometryKey}`;
}
//# sourceMappingURL=shape-statistics-key.js.map