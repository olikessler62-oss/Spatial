import type { ShapeAnalysisCard } from "../../domain/analysis-card.js";
import type { DetectedShape } from "../../domain/detected-shape.js";
import type { RectangleGeometry } from "../../domain/geometry.js";
import type { TrackedShape } from "../../domain/tracked-shape.js";
import { buildHitMatrix } from "../../hit-matrix.js";
import { ShapeAnalysisError } from "../../shape-analysis-error.js";
import { validateShapeAnalysisCard } from "../../validation/validate-shape-analysis-cards.js";
import type {
  ShapeDetectionContext,
  ShapeDetector,
} from "../shape-detector.js";
import {
  buildHitPrefixSum,
  isEmptyRectangle,
  type HitPrefixSum,
} from "./hit-prefix-sum.js";
import {
  MaximalEmptyRectangleFinder,
  fullGridSearchArea,
} from "./maximal-empty-rectangle-finder.js";
import {
  createRectangleGeometryKey,
  isGeometricallyValidRectangle,
  rectangleCellCount,
} from "./rectangle-geometry.js";

export class RectangleShapeDetector
  implements ShapeDetector<RectangleGeometry>
{
  public readonly shapeType = "rectangle" as const;

  private readonly finder = new MaximalEmptyRectangleFinder();

  public detectInitialShapes(
    card: ShapeAnalysisCard,
    context: ShapeDetectionContext,
  ): readonly DetectedShape<RectangleGeometry>[] {
    validateShapeAnalysisCard(card);
    this.assertContextMatchesCard(card, context);

    const prefixSum = this.buildPrefixSum(card);
    const searchArea = fullGridSearchArea(
      card.rowCount,
      card.columnCount,
    );

    return this.toDetectedShapes(
      this.finder.find(
        prefixSum,
        searchArea,
        context.minimumShapeCellCount,
      ),
    );
  }

  public detectChildShapes(
    parent: TrackedShape<RectangleGeometry>,
    card: ShapeAnalysisCard,
    context: ShapeDetectionContext,
  ): readonly DetectedShape<RectangleGeometry>[] {
    validateShapeAnalysisCard(card);
    this.assertContextMatchesCard(card, context);
    this.assertValidParentGeometry(parent.geometry, card);

    const prefixSum = this.buildPrefixSum(card);

    return this.toDetectedShapes(
      this.finder.find(
        prefixSum,
        parent.geometry,
        context.minimumShapeCellCount,
      ),
    );
  }

  public existsUnchanged(
    shape: TrackedShape<RectangleGeometry>,
    card: ShapeAnalysisCard,
  ): boolean {
    validateShapeAnalysisCard(card);
    this.assertValidParentGeometry(shape.geometry, card);

    const prefixSum = this.buildPrefixSum(card);
    return isEmptyRectangle(prefixSum, shape.geometry);
  }

  private buildPrefixSum(card: ShapeAnalysisCard): HitPrefixSum {
    return buildHitPrefixSum(buildHitMatrix(card));
  }

  private toDetectedShapes(
    geometries: readonly RectangleGeometry[],
  ): readonly DetectedShape<RectangleGeometry>[] {
    return geometries.map((geometry) => ({
      type: "rectangle" as const,
      geometry,
      key: createRectangleGeometryKey(geometry),
      cellCount: rectangleCellCount(geometry),
    }));
  }

  private assertContextMatchesCard(
    card: ShapeAnalysisCard,
    context: ShapeDetectionContext,
  ): void {
    if (
      context.rowCount !== card.rowCount ||
      context.columnCount !== card.columnCount
    ) {
      throw new ShapeAnalysisError(
        "INCONSISTENT_GRID_LAYOUT",
        `Detection context ${context.rowCount}x${context.columnCount} does not match card "${card.id}" ${card.rowCount}x${card.columnCount}.`,
        {
          cardId: card.id,
          expected: `${card.rowCount}x${card.columnCount}`,
          actual: `${context.rowCount}x${context.columnCount}`,
        },
      );
    }
  }

  private assertValidParentGeometry(
    geometry: RectangleGeometry,
    card: ShapeAnalysisCard,
  ): void {
    if (
      !isGeometricallyValidRectangle(
        geometry,
        card.rowCount,
        card.columnCount,
      )
    ) {
      throw new ShapeAnalysisError(
        "INVALID_PARENT_GEOMETRY",
        `Parent rectangle geometry is invalid for card "${card.id}" (${card.rowCount}x${card.columnCount}).`,
        {
          cardId: card.id,
          expected: "geometry fully inside card grid",
          actual: `r=${geometry.originRow},c=${geometry.originColumn},w=${geometry.width},h=${geometry.height}`,
        },
      );
    }
  }
}
