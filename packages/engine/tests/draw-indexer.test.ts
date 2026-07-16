import { describe, expect, it } from "vitest";
import { GridLayout } from "../src/layout/grid-layout.js";
import { DrawIndexer } from "../src/indexing/draw-indexer.js";

describe("DrawIndexer", () => {
  it("encodes drawn values using Layout indices", () => {
    const layout = new GridLayout({
      id: "grid-7x7",
      name: "Lotto Grid",
      type: "grid",
      minimumValue: 1,
      maximumValue: 49,
      columns: 7,
    });

    const indexed = new DrawIndexer(layout).index({
      drawDate: "2026-07-15",
      mainNumbers: [1, 17, 25, 33, 41, 49],
      bonusNumbers: [7],
      sourceRow: 2,
    });

    expect(indexed.mask.count()).toBe(6);
    expect(indexed.mask.has(0)).toBe(true);
    expect(indexed.mask.has(16)).toBe(true);
    expect(indexed.mask.has(48)).toBe(true);
  });
});