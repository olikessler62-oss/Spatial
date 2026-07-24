import type { ShapeAnalysisCard } from "./domain/analysis-card.js";
export type HitMatrix = readonly (readonly boolean[])[];
/**
 * Converts a validated card into a row-major hit matrix.
 * cell.value is intentionally ignored.
 */
export declare function buildHitMatrix(card: ShapeAnalysisCard): HitMatrix;
/**
 * Cell is a hit if it was hit on **any** card — free only if free on every card.
 */
export declare function buildIntersectionHitMatrix(cards: readonly ShapeAnalysisCard[]): HitMatrix;
/**
 * Geometrically equivalent cards share the same hit matrix
 * regardless of lottery number placement.
 */
export declare function hitMatricesEqual(a: HitMatrix, b: HitMatrix): boolean;
//# sourceMappingURL=hit-matrix.d.ts.map