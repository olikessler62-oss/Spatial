import type { ShapeAnalysisCard } from "../domain/analysis-card.js";
/**
 * Validates a single analysis card grid.
 * Numbers (cell.value) are ignored.
 */
export declare function validateShapeAnalysisCard(card: ShapeAnalysisCard): void;
/**
 * Validates all cards of one analysis request against the selected card.
 */
export declare function validateShapeAnalysisCards(cards: readonly ShapeAnalysisCard[], selectedCardId: string): ShapeAnalysisCard;
//# sourceMappingURL=validate-shape-analysis-cards.d.ts.map