import type { ShapeAnalysisCard } from "../../domain/analysis-card.js";
import type { DetectedShape } from "../../domain/detected-shape.js";
import type { RectangleGeometry } from "../../domain/geometry.js";
import type { TrackedShape } from "../../domain/tracked-shape.js";
import type { ShapeDetectionContext, ShapeDetector } from "../shape-detector.js";
export declare class RectangleShapeDetector implements ShapeDetector<RectangleGeometry> {
    readonly shapeType: "rectangle";
    private readonly finder;
    detectInitialShapes(card: ShapeAnalysisCard, context: ShapeDetectionContext): readonly DetectedShape<RectangleGeometry>[];
    detectChildShapes(parent: TrackedShape<RectangleGeometry>, card: ShapeAnalysisCard, context: ShapeDetectionContext): readonly DetectedShape<RectangleGeometry>[];
    existsUnchanged(shape: TrackedShape<RectangleGeometry>, card: ShapeAnalysisCard): boolean;
    private buildPrefixSum;
    private toDetectedShapes;
    private assertContextMatchesCard;
    private assertValidParentGeometry;
}
//# sourceMappingURL=rectangle-shape-detector.d.ts.map