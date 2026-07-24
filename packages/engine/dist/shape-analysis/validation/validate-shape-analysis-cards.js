import { ShapeAnalysisError } from "../shape-analysis-error.js";
/**
 * Validates a single analysis card grid.
 * Numbers (cell.value) are ignored.
 */
export function validateShapeAnalysisCard(card) {
    if (card.rowCount <= 0 || card.columnCount <= 0) {
        throw new ShapeAnalysisError("INVALID_GRID_DIMENSIONS", `Card "${card.id}" has invalid grid dimensions ${card.rowCount}x${card.columnCount}.`, {
            cardId: card.id,
            expected: "rowCount > 0 and columnCount > 0",
            actual: `${card.rowCount}x${card.columnCount}`,
        });
    }
    const expectedCellCount = card.rowCount * card.columnCount;
    if (card.cells.length !== expectedCellCount) {
        throw new ShapeAnalysisError("INCOMPLETE_GRID", `Card "${card.id}" expects ${expectedCellCount} cells but has ${card.cells.length}.`, {
            cardId: card.id,
            expected: String(expectedCellCount),
            actual: String(card.cells.length),
        });
    }
    const seen = new Set();
    for (const cell of card.cells) {
        if (cell.row < 0 ||
            cell.column < 0 ||
            cell.row >= card.rowCount ||
            cell.column >= card.columnCount) {
            throw new ShapeAnalysisError("INCOMPLETE_GRID", `Card "${card.id}" has a cell outside the grid at (${cell.row}, ${cell.column}).`, {
                cardId: card.id,
                row: cell.row,
                column: cell.column,
            });
        }
        const key = `${cell.row}:${cell.column}`;
        if (seen.has(key)) {
            throw new ShapeAnalysisError("DUPLICATE_CELL_COORDINATE", `Card "${card.id}" has a duplicate cell coordinate (${cell.row}, ${cell.column}).`, {
                cardId: card.id,
                row: cell.row,
                column: cell.column,
            });
        }
        seen.add(key);
    }
    if (seen.size !== expectedCellCount) {
        throw new ShapeAnalysisError("INCOMPLETE_GRID", `Card "${card.id}" is missing cell coordinates.`, {
            cardId: card.id,
            expected: String(expectedCellCount),
            actual: String(seen.size),
        });
    }
}
/**
 * Validates all cards of one analysis request against the selected card.
 */
export function validateShapeAnalysisCards(cards, selectedCardId) {
    if (cards.length === 0) {
        throw new ShapeAnalysisError("EMPTY_CARD_SET", "Shape analysis requires at least one card.");
    }
    for (const card of cards) {
        validateShapeAnalysisCard(card);
    }
    const selectedCard = cards.find((card) => card.id === selectedCardId);
    if (selectedCard === undefined) {
        throw new ShapeAnalysisError("SELECTED_CARD_NOT_FOUND", `Selected card "${selectedCardId}" was not found in the supplied card set.`, { cardId: selectedCardId });
    }
    const inconsistent = cards.find((card) => card.rowCount !== selectedCard.rowCount ||
        card.columnCount !== selectedCard.columnCount);
    if (inconsistent !== undefined) {
        throw new ShapeAnalysisError("INCONSISTENT_GRID_LAYOUT", `Card "${inconsistent.id}" has layout ${inconsistent.rowCount}x${inconsistent.columnCount}, expected ${selectedCard.rowCount}x${selectedCard.columnCount}.`, {
            cardId: inconsistent.id,
            expected: `${selectedCard.rowCount}x${selectedCard.columnCount}`,
            actual: `${inconsistent.rowCount}x${inconsistent.columnCount}`,
        });
    }
    return selectedCard;
}
//# sourceMappingURL=validate-shape-analysis-cards.js.map