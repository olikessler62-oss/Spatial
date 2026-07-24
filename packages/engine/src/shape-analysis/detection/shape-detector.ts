import type { ShapeAnalysisCard } from "../domain/analysis-card.js";
import type { DetectedShape } from "../domain/detected-shape.js";
import type { ShapeGeometry, ShapeType } from "../domain/geometry.js";
import type { TrackedShape } from "../domain/tracked-shape.js";

export interface ShapeDetectionContext {
  readonly rowCount: number;
  readonly columnCount: number;
  readonly minimumShapeCellCount: number;
  readonly options?: Readonly<Record<string, unknown>>;
}

/**
 * Geometric detector contract. Implementations must not touch UI,
 * persistence, or historical overdue evaluation.
 */
export interface ShapeDetector<
  TGeometry extends ShapeGeometry = ShapeGeometry,
> {
  readonly shapeType: ShapeType;

  detectInitialShapes(
    card: ShapeAnalysisCard,
    context: ShapeDetectionContext,
  ): readonly DetectedShape<TGeometry>[];

  detectChildShapes(
    parent: TrackedShape<TGeometry>,
    card: ShapeAnalysisCard,
    context: ShapeDetectionContext,
  ): readonly DetectedShape<TGeometry>[];

  existsUnchanged(
    shape: TrackedShape<TGeometry>,
    card: ShapeAnalysisCard,
  ): boolean;
}
