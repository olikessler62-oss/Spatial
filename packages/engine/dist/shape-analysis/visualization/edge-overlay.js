import { isRectangleGeometry } from "../domain/geometry.js";
import { rectangleCellCount } from "../detection/rectangle/rectangle-geometry.js";
import { resolveShapeCssColor } from "./shape-color.js";
import { getRectangleEdgeKeysCached } from "./rectangle-edges.js";
/** Fixed frame thickness in CSS pixels (`vectorEffect: non-scaling-stroke`). */
export const SHAPE_FRAME_STROKE_WIDTH_PX = 2;
/** Uniform frame opacity — streak only affects dominance / paint order. */
export const SHAPE_FRAME_OPACITY = 0.78;
export function buildEdgeContributions(cardId, occurrences) {
    const contributions = [];
    for (const occurrence of occurrences) {
        if (!occurrence.isVisible || occurrence.cardId !== cardId) {
            continue;
        }
        if (!isRectangleGeometry(occurrence.geometry)) {
            continue;
        }
        const edgeKeys = getRectangleEdgeKeysCached(occurrence.geometryKey, occurrence.geometry);
        const cssColor = resolveShapeCssColor(occurrence.color, occurrence.brightnessLevel);
        const cellCount = rectangleCellCount(occurrence.geometry);
        for (const edgeKey of edgeKeys) {
            contributions.push({
                shapeId: occurrence.shapeId,
                cardId,
                edgeKey,
                color: cssColor,
                brightness: occurrence.brightnessLevel,
                coveredCardCount: occurrence.coveredCardCount,
                cellCount,
            });
        }
    }
    return contributions;
}
function compareDominance(a, b) {
    if (b.coveredCardCount !== a.coveredCardCount) {
        return b.coveredCardCount - a.coveredCardCount;
    }
    if (a.cellCount !== b.cellCount) {
        return a.cellCount - b.cellCount;
    }
    return a.shapeId.localeCompare(b.shapeId);
}
export function renderGridEdges(cardId, occurrences, _configuration) {
    const contributions = buildEdgeContributions(cardId, occurrences);
    const byEdge = new Map();
    for (const contribution of contributions) {
        const list = byEdge.get(contribution.edgeKey) ?? [];
        list.push(contribution);
        byEdge.set(contribution.edgeKey, list);
    }
    const rendered = [];
    for (const [edgeKey, list] of byEdge) {
        const shapeIds = [...new Set(list.map((item) => item.shapeId))].sort((a, b) => a.localeCompare(b));
        const dominant = [...list].sort(compareDominance)[0];
        if (dominant === undefined) {
            continue;
        }
        rendered.push({
            edgeKey,
            color: dominant.color,
            opacity: SHAPE_FRAME_OPACITY,
            strokeWidth: SHAPE_FRAME_STROKE_WIDTH_PX,
            coveredCardCount: dominant.coveredCardCount,
            contributorShapeIds: shapeIds,
        });
    }
    // Shorter streaks first; longest last → strongest form paints on top.
    return rendered.sort((a, b) => {
        if (a.coveredCardCount !== b.coveredCardCount) {
            return a.coveredCardCount - b.coveredCardCount;
        }
        return a.edgeKey.localeCompare(b.edgeKey);
    });
}
//# sourceMappingURL=edge-overlay.js.map