import type { ShapeType } from "../domain/geometry.js";
import { ShapeAnalysisError } from "../shape-analysis-error.js";
import type { ShapeDetector } from "./shape-detector.js";

export interface ShapeAnalyzerRegistry {
  register(detector: ShapeDetector): void;
  get(shapeType: ShapeType): ShapeDetector;
  has(shapeType: ShapeType): boolean;
}

export class DefaultShapeAnalyzerRegistry
  implements ShapeAnalyzerRegistry
{
  private readonly detectors = new Map<ShapeType, ShapeDetector>();

  public register(detector: ShapeDetector): void {
    this.detectors.set(detector.shapeType, detector);
  }

  public get(shapeType: ShapeType): ShapeDetector {
    const detector = this.detectors.get(shapeType);

    if (detector === undefined) {
      throw new ShapeAnalysisError(
        "UNSUPPORTED_SHAPE_TYPE",
        `No shape detector is registered for type "${shapeType}".`,
        { shapeType },
      );
    }

    return detector;
  }

  public has(shapeType: ShapeType): boolean {
    return this.detectors.has(shapeType);
  }
}
