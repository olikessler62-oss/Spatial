import { ShapeAnalysisError } from "../shape-analysis-error.js";
export class DefaultShapeAnalyzerRegistry {
    detectors = new Map();
    register(detector) {
        this.detectors.set(detector.shapeType, detector);
    }
    get(shapeType) {
        const detector = this.detectors.get(shapeType);
        if (detector === undefined) {
            throw new ShapeAnalysisError("UNSUPPORTED_SHAPE_TYPE", `No shape detector is registered for type "${shapeType}".`, { shapeType });
        }
        return detector;
    }
    has(shapeType) {
        return this.detectors.has(shapeType);
    }
}
//# sourceMappingURL=shape-detector-registry.js.map