import { describe, expect, it, vi } from "vitest";

import type { Layout } from "../../src/domain/layout.js";
import type { ParsedDraw } from "../../src/domain/parsed-draw.js";
import { DrawIndexer } from "../../src/indexing/draw-indexer.js";

const createLayout = (): Layout => ({
  definition: {
    id: "test-layout",
    name: "Test Layout",
    type: "grid",
    minimumValue: 1,
    maximumValue: 10,
  },

  resolve(value) {
    return {
      value,
      index: value - 1,
      position: {
        kind: "cartesian",
        x: value - 1,
        y: 0,
      },
    };
  },

  resolveAll() {
    return [];
  },
});

const createDraw = (
  overrides: Partial<ParsedDraw> = {},
): ParsedDraw => ({
  drawDate: "2026-07-17",
  mainNumbers: [1, 3, 5],
  bonusNumbers: [],
  ...overrides,
});

describe("DrawIndexer", () => {
  it("indexes the main numbers into a bit mask", () => {
    const indexer = new DrawIndexer(createLayout());

    const result = indexer.index(createDraw());

    expect(result.drawDate).toBe("2026-07-17");
    expect(result.drawnValueCount).toBe(3);

    expect(result.mask.has(0)).toBe(true);
    expect(result.mask.has(2)).toBe(true);
    expect(result.mask.has(4)).toBe(true);
    expect(result.mask.has(1)).toBe(false);
  });

  it("includes the external id when it is present", () => {
    const indexer = new DrawIndexer(createLayout());

    const result = indexer.index(
      createDraw({
        externalId: "draw-123",
      }),
    );

    expect(result.externalId).toBe("draw-123");
    expect(result).toHaveProperty("externalId");
  });

  it("omits the external id when it is undefined", () => {
    const indexer = new DrawIndexer(createLayout());

    const result = indexer.index(
      createDraw({
        externalId: undefined,
      }),
    );

    expect(result.externalId).toBeUndefined();
    expect(result).not.toHaveProperty("externalId");
  });

  it("omits the external id when it is an empty string", () => {
    const indexer = new DrawIndexer(createLayout());

    const result = indexer.index(
      createDraw({
        externalId: "",
      }),
    );

    expect(result).not.toHaveProperty("externalId");
  });

  it("creates an empty mask for a draw without main numbers", () => {
    const indexer = new DrawIndexer(createLayout());

    const result = indexer.index(
      createDraw({
        mainNumbers: [],
      }),
    );

    expect(result.drawnValueCount).toBe(0);
    expect(result.mask.toString()).toBe("0");
  });

  it("resolves every main number through the layout", () => {
    const layout = createLayout();
    const resolveSpy = vi.spyOn(layout, "resolve");
    const indexer = new DrawIndexer(layout);

    indexer.index(
      createDraw({
        mainNumbers: [2, 4, 7],
      }),
    );

    expect(resolveSpy).toHaveBeenCalledTimes(3);
    expect(resolveSpy).toHaveBeenNthCalledWith(1, 2);
    expect(resolveSpy).toHaveBeenNthCalledWith(2, 4);
    expect(resolveSpy).toHaveBeenNthCalledWith(3, 7);
  });

  it("does not include bonus numbers in the mask", () => {
    const layout = createLayout();
    const resolveSpy = vi.spyOn(layout, "resolve");
    const indexer = new DrawIndexer(layout);

    const result = indexer.index(
      createDraw({
        mainNumbers: [1, 2],
        bonusNumbers: [9, 10],
      }),
    );

    expect(resolveSpy).toHaveBeenCalledTimes(2);
    expect(resolveSpy).toHaveBeenCalledWith(1);
    expect(resolveSpy).toHaveBeenCalledWith(2);
    expect(resolveSpy).not.toHaveBeenCalledWith(9);
    expect(resolveSpy).not.toHaveBeenCalledWith(10);

    expect(result.drawnValueCount).toBe(2);
    expect(result.mask.has(0)).toBe(true);
    expect(result.mask.has(1)).toBe(true);
    expect(result.mask.has(8)).toBe(false);
    expect(result.mask.has(9)).toBe(false);
  });

  it("propagates layout resolution errors", () => {
    const layout = createLayout();

    vi.spyOn(layout, "resolve").mockImplementation((value) => {
      if (value === 99) {
        throw new Error("Value outside layout.");
      }

      return {
        value,
        index: value - 1,
        position: {
          kind: "cartesian",
          x: value - 1,
          y: 0,
        },
      };
    });

    const indexer = new DrawIndexer(layout);

    expect(() =>
      indexer.index(
        createDraw({
          mainNumbers: [1, 99],
        }),
      ),
    ).toThrow("Value outside layout.");
  });
});