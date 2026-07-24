export function serializeGridEdgeKey(edge) {
    const prefix = edge.orientation === "horizontal" ? "h" : "v";
    return `${prefix}:${edge.row}:${edge.column}`;
}
export function parseGridEdgeKey(key) {
    const [prefix, rowText, columnText] = key.split(":");
    const row = Number(rowText);
    const column = Number(columnText);
    if ((prefix !== "h" && prefix !== "v") ||
        !Number.isInteger(row) ||
        !Number.isInteger(column)) {
        throw new Error(`Invalid grid edge key: ${key}`);
    }
    return {
        orientation: prefix === "h" ? "horizontal" : "vertical",
        row,
        column,
    };
}
export const DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION = {
    stepDelayMs: 150,
    brightness: {
        minBrightness: 0.5,
        maxBrightness: 1,
    },
    overlapColor: "rgba(255, 255, 255, 0.92)",
};
export function createOccurrenceVisualizationKey(shapeId, cardId) {
    return `${shapeId}:${cardId}`;
}
//# sourceMappingURL=visualization-types.js.map