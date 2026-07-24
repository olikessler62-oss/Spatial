export const EXPERIMENT1_LAYOUT_SEED = "experiment1-fixed-layout";
export const EXPERIMENT1_INITIAL_HISTORY = 400;
/** 0-based draw index where holdout starts (= 701st draw). */
export const EXPERIMENT1_HOLDOUT_START_INDEX = 700;
export const EXPERIMENT1_BASELINE_REPETITIONS = 100;
export const EXPERIMENT1_SHAPES = [
    {
        id: "square-2x2",
        name: "Quadrat 2x2",
        positions: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
        ],
    },
    {
        id: "cross-5",
        name: "Kreuz 5",
        positions: [
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: 0, y: 1 },
        ],
    },
    {
        id: "hline-4",
        name: "Horizontale Linie 4",
        positions: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 3, y: 0 },
        ],
    },
    {
        id: "vline-4",
        name: "Vertikale Linie 4",
        positions: [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: 2 },
            { x: 0, y: 3 },
        ],
    },
    {
        id: "diag-4",
        name: "Diagonale Linie 4",
        positions: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 3, y: 3 },
        ],
    },
    {
        id: "l-4",
        name: "L-Form 4",
        positions: [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: 2 },
            { x: 1, y: 2 },
        ],
    },
    {
        id: "l-3",
        name: "L-Form 3",
        positions: [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
        ],
    },
    {
        id: "l-5",
        name: "L-Form 5",
        positions: [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: 2 },
            { x: 1, y: 2 },
            { x: 2, y: 2 },
        ],
    },
];
//# sourceMappingURL=experiment1-shapes.js.map