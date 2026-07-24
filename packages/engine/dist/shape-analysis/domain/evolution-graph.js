export function createEmptyEvolutionGraph() {
    return {
        nodes: new Map(),
        edges: [],
    };
}
export function deduplicateByShapeKey(items) {
    const seen = new Map();
    for (const item of items) {
        if (!seen.has(item.key)) {
            seen.set(item.key, item);
        }
    }
    return [...seen.values()];
}
export function createOccurrenceKey(shapeId, cardId) {
    return `${shapeId}:${cardId}`;
}
/**
 * Registers a split edge. Multiple parents may point to the same child.
 */
export function appendSplitEdge(edges, edge) {
    const exists = edges.some((existing) => existing.parentShapeId === edge.parentShapeId &&
        existing.childShapeId === edge.childShapeId &&
        existing.splitCardId === edge.splitCardId);
    if (exists) {
        return edges;
    }
    return [...edges, edge];
}
//# sourceMappingURL=evolution-graph.js.map