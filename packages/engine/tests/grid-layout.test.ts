import { describe, expect, it } from "vitest";
import { GridLayout } from "../src/layout/grid-layout.js";

describe("GridLayout", () => {
  const layout = new GridLayout({
    id: "lotto-grid-7x7", name: "Lotto 6 aus 49 Grid", type: "grid",
    minimumValue: 1, maximumValue: 49, columns: 7,
  });

  it("maps values to deterministic positions", () => {
    expect(layout.resolve(1).position).toEqual({ kind:"cartesian", x:0, y:0, row:0, column:0 });
    expect(layout.resolve(8).position).toEqual({ kind:"cartesian", x:0, y:1, row:1, column:0 });
    expect(layout.resolve(49).position).toEqual({ kind:"cartesian", x:6, y:6, row:6, column:6 });
  });

  it("resolves every value exactly once", () => {
    const all = layout.resolveAll();
    expect(all).toHaveLength(49);
    expect(new Set(all.map(x => `${x.position.x}:${x.position.y}`)).size).toBe(49);
  });

  it("rejects out-of-range values", () => {
    expect(() => layout.resolve(0)).toThrow("outside 1-49");
    expect(() => layout.resolve(50)).toThrow("outside 1-49");
  });
});
