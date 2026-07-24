import type { ShapeType } from "../domain/geometry.js";
import type { ShapeDetector } from "./shape-detector.js";
export interface ShapeAnalyzerRegistry {
    register(detector: ShapeDetector): void;
    get(shapeType: ShapeType): ShapeDetector;
    has(shapeType: ShapeType): boolean;
}
export declare class DefaultShapeAnalyzerRegistry implements ShapeAnalyzerRegistry {
    private readonly detectors;
    register(detector: ShapeDetector): void;
    get(shapeType: ShapeType): ShapeDetector;
    has(shapeType: ShapeType): boolean;
}
//# sourceMappingURL=shape-detector-registry.d.ts.map