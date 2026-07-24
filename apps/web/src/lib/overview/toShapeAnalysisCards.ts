import type {
  Overview1Move,
} from "@/lib/overview/overview1Moves";
import type {
  ShapeAnalysisCard,
  ShapeAnalysisCell,
} from "@spatial/engine";

/**
 * Maps overview-1 draw cards into shape-analysis cards.
 * Numbers are attached for debugging only; analysis uses isHit + coordinates.
 */
export function toShapeAnalysisCards(options: {
  readonly moves: readonly (Overview1Move | null)[];
  readonly grid: readonly (readonly number[])[];
  readonly cardKeys: readonly string[];
}): {
  readonly cards: ShapeAnalysisCard[];
  readonly cardKeyByMoveId: Map<string, string>;
  readonly moveIdByCardKey: Map<string, string>;
} {
  const rowCount = options.grid.length;
  const columnCount = options.grid[0]?.length ?? 0;
  const cards: ShapeAnalysisCard[] = [];
  const cardKeyByMoveId = new Map<string, string>();
  const moveIdByCardKey = new Map<string, string>();

  options.moves.forEach((move, index) => {
    if (!move) {
      return;
    }

    const cardKey = options.cardKeys[index] ?? `draw-${index}`;
    const hitValues = new Set(move.values);
    const cells: ShapeAnalysisCell[] = [];

    for (let row = 0; row < rowCount; row += 1) {
      const gridRow = options.grid[row];

      if (gridRow === undefined) {
        continue;
      }

      for (let column = 0; column < columnCount; column += 1) {
        const value = gridRow[column];

        if (value === undefined) {
          continue;
        }

        cells.push({
          row,
          column,
          isHit: hitValues.has(value),
          value,
        });
      }
    }

    cards.push({
      id: move.id,
      drawDate: new Date(move.drawDate),
      chronologicalIndex: index,
      rowCount,
      columnCount,
      cells,
    });

    cardKeyByMoveId.set(move.id, cardKey);
    moveIdByCardKey.set(cardKey, move.id);
  });

  return { cards, cardKeyByMoveId, moveIdByCardKey };
}
