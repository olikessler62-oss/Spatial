import { describe, expect, it } from "vitest";

import { GridLayout } from "../../src/layout/grid-layout.js";
import {
  createShuffledValueMapping,
  validateValueMapping,
} from "../../src/layout/value-mapping.js";

describe("value mapping", () => {
  it("creates a reproducible permutation for the same seed", () => {
    const first = createShuffledValueMapping(1, 49, "experiment1");
    const second = createShuffledValueMapping(1, 49, "experiment1");

    expect(first).toEqual(second);
    expect(new Set(first).size).toBe(49);
    expect(first).not.toEqual(
      Array.from({ length: 49 }, (_, index) => index + 1),
    );
  });

  it("rejects invalid mappings", () => {
    expect(() => validateValueMapping([1, 1, 3], 1, 3)).toThrow(
      /duplicate/,
    );
  });

  it("resolves shuffled values onto grid cells", () => {
    const mapping = createShuffledValueMapping(1, 9, 42);
    const layout = new GridLayout({
      id: "g",
      name: "3x3",
      type: "grid",
      minimumValue: 1,
      maximumValue: 9,
      columns: 3,
      valueMapping: mapping,
    });

    const resolved = layout.resolveAll();
    expect(resolved.map((entry) => entry.value)).toEqual(mapping);
    expect(layout.resolve(mapping[0]!).index).toBe(0);
    expect(layout.resolve(mapping[8]!).index).toBe(8);
  });
});
