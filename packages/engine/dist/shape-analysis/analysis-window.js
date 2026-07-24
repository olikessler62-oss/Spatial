import { ShapeAnalysisError } from "./shape-analysis-error.js";
import { validateShapeAnalysisCards } from "./validation/validate-shape-analysis-cards.js";
/**
 * Legacy Spec-3 window: selected card first, then older cards only,
 * sorted newest → oldest. Newer cards than the selection are ignored.
 */
export function buildAnalysisCardSequence(cards, selectedCardId) {
    const selectedCard = validateShapeAnalysisCards(cards, selectedCardId);
    validateChronology(cards);
    const analysisCards = cards
        .filter((card) => card.chronologicalIndex <= selectedCard.chronologicalIndex)
        .slice()
        .sort((a, b) => b.chronologicalIndex - a.chronologicalIndex);
    return analysisCards;
}
/**
 * Persistence window ending at the selected card (typically the newest / last draw).
 * Includes selected and all older loaded cards, ascending oldest → selected.
 * Newer cards than the selection are ignored.
 */
export function buildThroughSelectedSequence(cards, selectedCardId) {
    const selectedCard = validateShapeAnalysisCards(cards, selectedCardId);
    validateChronology(cards);
    return cards
        .filter((card) => card.chronologicalIndex <= selectedCard.chronologicalIndex)
        .slice()
        .sort((a, b) => a.chronologicalIndex - b.chronologicalIndex);
}
/**
 * Persistence window: selected card → newer cards → newest loaded.
 * Sorted chronologically ascending (selected first, newest last).
 * Older cards than the selection are ignored.
 */
export function buildForwardFromSelectedSequence(cards, selectedCardId) {
    const selectedCard = validateShapeAnalysisCards(cards, selectedCardId);
    validateChronology(cards);
    return cards
        .filter((card) => card.chronologicalIndex >= selectedCard.chronologicalIndex)
        .slice()
        .sort((a, b) => a.chronologicalIndex - b.chronologicalIndex);
}
/**
 * Same window as {@link buildForwardFromSelectedSequence}, ordered newest → selected
 * (chronologically descending) for leftward persistence tracking.
 */
export function buildNewestToSelectedSequence(cards, selectedCardId) {
    return buildForwardFromSelectedSequence(cards, selectedCardId)
        .slice()
        .reverse();
}
/**
 * Ensures chronological indices uniquely define order.
 */
export function validateChronology(cards) {
    const seen = new Map();
    for (const card of cards) {
        const existingId = seen.get(card.chronologicalIndex);
        if (existingId !== undefined && existingId !== card.id) {
            throw new ShapeAnalysisError("INVALID_CHRONOLOGY", `Cards "${existingId}" and "${card.id}" share chronologicalIndex ${card.chronologicalIndex}.`, {
                cardId: card.id,
                expected: "unique chronologicalIndex per card",
                actual: String(card.chronologicalIndex),
            });
        }
        seen.set(card.chronologicalIndex, card.id);
    }
}
export function countIgnoredNewerCards(cards, selectedCardId) {
    const selectedCard = cards.find((card) => card.id === selectedCardId);
    if (selectedCard === undefined) {
        throw new ShapeAnalysisError("SELECTED_CARD_NOT_FOUND", `Selected card "${selectedCardId}" was not found in the supplied card set.`, { cardId: selectedCardId });
    }
    return cards.filter((card) => card.chronologicalIndex > selectedCard.chronologicalIndex).length;
}
export function countIgnoredOlderCards(cards, selectedCardId) {
    const selectedCard = cards.find((card) => card.id === selectedCardId);
    if (selectedCard === undefined) {
        throw new ShapeAnalysisError("SELECTED_CARD_NOT_FOUND", `Selected card "${selectedCardId}" was not found in the supplied card set.`, { cardId: selectedCardId });
    }
    return cards.filter((card) => card.chronologicalIndex < selectedCard.chronologicalIndex).length;
}
//# sourceMappingURL=analysis-window.js.map