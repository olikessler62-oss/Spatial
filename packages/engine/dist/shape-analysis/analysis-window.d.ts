import type { ShapeAnalysisCard } from "./domain/analysis-card.js";
/**
 * Legacy Spec-3 window: selected card first, then older cards only,
 * sorted newest → oldest. Newer cards than the selection are ignored.
 */
export declare function buildAnalysisCardSequence(cards: readonly ShapeAnalysisCard[], selectedCardId: string): readonly ShapeAnalysisCard[];
/**
 * Persistence window ending at the selected card (typically the newest / last draw).
 * Includes selected and all older loaded cards, ascending oldest → selected.
 * Newer cards than the selection are ignored.
 */
export declare function buildThroughSelectedSequence(cards: readonly ShapeAnalysisCard[], selectedCardId: string): readonly ShapeAnalysisCard[];
/**
 * Persistence window: selected card → newer cards → newest loaded.
 * Sorted chronologically ascending (selected first, newest last).
 * Older cards than the selection are ignored.
 */
export declare function buildForwardFromSelectedSequence(cards: readonly ShapeAnalysisCard[], selectedCardId: string): readonly ShapeAnalysisCard[];
/**
 * Same window as {@link buildForwardFromSelectedSequence}, ordered newest → selected
 * (chronologically descending) for leftward persistence tracking.
 */
export declare function buildNewestToSelectedSequence(cards: readonly ShapeAnalysisCard[], selectedCardId: string): readonly ShapeAnalysisCard[];
/**
 * Ensures chronological indices uniquely define order.
 */
export declare function validateChronology(cards: readonly ShapeAnalysisCard[]): void;
export declare function countIgnoredNewerCards(cards: readonly ShapeAnalysisCard[], selectedCardId: string): number;
export declare function countIgnoredOlderCards(cards: readonly ShapeAnalysisCard[], selectedCardId: string): number;
//# sourceMappingURL=analysis-window.d.ts.map