import { buildHitMatrix } from "../../hit-matrix.js";
import { ShapeAnalysisError } from "../../shape-analysis-error.js";
import { validateShapeAnalysisCard } from "../../validation/validate-shape-analysis-cards.js";
import { buildHitPrefixSum, isEmptyRectangle, } from "./hit-prefix-sum.js";
import { MaximalEmptyRectangleFinder, fullGridSearchArea, } from "./maximal-empty-rectangle-finder.js";
import { createRectangleGeometryKey, isGeometricallyValidRectangle, rectangleCellCount, } from "./rectangle-geometry.js";
export class RectangleShapeDetector {
    shapeType = "rectangle";
    finder = new MaximalEmptyRectangleFinder();
    detectInitialShapes(card, context) {
        validateShapeAnalysisCard(card);
        this.assertContextMatchesCard(card, context);
        const prefixSum = this.buildPrefixSum(card);
        const searchArea = fullGridSearchArea(card.rowCount, card.columnCount);
        return this.toDetectedShapes(this.finder.find(prefixSum, searchArea, context.minimumShapeCellCount));
    }
    detectChildShapes(parent, card, context) {
        validateShapeAnalysisCard(card);
        this.assertContextMatchesCard(card, context);
        this.assertValidParentGeometry(parent.geometry, card);
        const prefixSum = this.buildPrefixSum(card);
        return this.toDetectedShapes(this.finder.find(prefixSum, parent.geometry, context.minimumShapeCellCount));
    }
    existsUnchanged(shape, card) {
        validateShapeAnalysisCard(card);
        this.assertValidParentGeometry(shape.geometry, card);
        const prefixSum = this.buildPrefixSum(card);
        return isEmptyRectangle(prefixSum, shape.geometry);
    }
    buildPrefixSum(card) {
        return buildHitPrefixSum(buildHitMatrix(card));
    }
    toDetectedShapes(geometries) {
        return geometries.map((geometry) => ({
            type: "rectangle",
            geometry,
            key: createRectangleGeometryKey(geometry),
            cellCount: rectangleCellCount(geometry),
        }));
    }
    assertContextMatchesCard(card, context) {
        if (context.rowCount !== card.rowCount ||
            context.columnCount !== card.columnCount) {
            throw new ShapeAnalysisError("INCONSISTENT_GRID_LAYOUT", `Detection context ${context.rowCount}x${context.columnCount} does not match card "${card.id}" ${card.rowCount}x${card.columnCount}.`, {
                cardId: card.id,
                expected: `${card.rowCount}x${card.columnCount}`,
                actual: `${context.rowCount}x${context.columnCount}`,
            });
        }
    }
    assertValidParentGeometry(geometry, card) {
        if (!isGeometricallyValidRectangle(geometry, card.rowCount, card.columnCount)) {
            throw new ShapeAnalysisError("INVALID_PARENT_GEOMETRY", `Parent rectangle geometry is invalid for card "${card.id}" (${card.rowCount}x${card.columnCount}).`, {
                cardId: card.id,
                expected: "geometry fully inside card grid",
                actual: `r=${geometry.originRow},c=${geometry.originColumn},w=${geometry.width},h=${geometry.height}`,
            });
        }
    }
}
//# sourceMappingURL=rectangle-shape-detector.js.map