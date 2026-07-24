import type { ShapeDefinition } from "../domain/shape.js";

/** Fixed once — not a 10-seed sweep. */
export const CORNER_5X5_LAYOUT_SEED = "lotto-7x7-corner5x5-v1";

/**
 * Nine 5-cell patterns for the top-left 5×5 window of a 7×7 grid.
 * Coordinates: x = column, y = row.
 */
export const CORNER_5X5_SHAPES: readonly ShapeDefinition[] = [
  {
    id: "hline-5",
    name: "Horizontale Linie",
    positions: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
    ],
  },
  {
    id: "vline-5",
    name: "Vertikale Linie",
    positions: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 0, y: 4 },
    ],
  },
  {
    id: "diag-5",
    name: "Diagonale Linie",
    positions: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 4 },
    ],
  },
  {
    id: "cross-5",
    name: "Kreuz",
    positions: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
    ],
  },
  {
    id: "x-5",
    name: "X-Form",
    positions: [
      { x: 0, y: 0 },
      { x: -1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
    ],
  },
  {
    id: "l-5",
    name: "L-Form",
    positions: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
    ],
  },
  {
    id: "l-5-mirror",
    name: "L-Form spiegelverkehrt",
    positions: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: -1, y: 3 },
    ],
  },
  {
    id: "c-5",
    name: "C-Form",
    positions: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 0 },
      { x: 1, y: 2 },
    ],
  },
  {
    id: "c-5-mirror",
    name: "C-Form spiegelverkehrt",
    positions: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: -1, y: 0 },
      { x: -1, y: 2 },
    ],
  },
];
