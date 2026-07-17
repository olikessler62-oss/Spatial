import { describe, expect, it } from "vitest";

import type {
  LayoutDefinition,
  ResolvedLayoutValue,
} from "../../src/domain/layout.js";
import { AbstractLayout } from "../../src/layout/abstract-layout.js";
import { LayoutError } from "../../src/layout/layout-error.js";

class TestLayout extends AbstractLayout {
  protected resolveIndex(
    zeroBasedIndex: number,
  ): ResolvedLayoutValue["position"] {
    return {
      kind: "cartesian",
      x: zeroBasedIndex,
      y: zeroBasedIndex * 10,
    };
  }
}

const createDefinition = (
  overrides: Partial<LayoutDefinition> = {},
): LayoutDefinition => ({
  id: "test-layout",
  name: "Test Layout",
  type: "grid",
  minimumValue: 1,
  maximumValue: 3,
  ...overrides,
});

describe("AbstractLayout", () => {
  it("retains the supplied definition", () => {
    const definition = createDefinition();
    const layout = new TestLayout(definition);

    expect(layout.definition).toBe(definition);
  });

  it("resolves a value to a zero-based index and position", () => {
    const layout = new TestLayout(
      createDefinition({
        minimumValue: 5,
        maximumValue: 7,
      }),
    );

    expect(layout.resolve(5)).toEqual({
      value: 5,
      index: 0,
      position: {
        kind: "cartesian",
        x: 0,
        y: 0,
      },
    });

    expect(layout.resolve(7)).toEqual({
      value: 7,
      index: 2,
      position: {
        kind: "cartesian",
        x: 2,
        y: 20,
      },
    });
  });

  it.each([
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])("rejects non-integer value %s", (value) => {
    expect(() =>
      new TestLayout(createDefinition()).resolve(value),
    ).toThrow(
      `Layout values must be integers. Received ${value}.`,
    );
  });

  it("throws NON_INTEGER_VALUE for a non-integer value", () => {
    try {
      new TestLayout(createDefinition()).resolve(1.5);

      throw new Error(
        "Expected resolve to reject a non-integer value.",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(LayoutError);
      expect((error as LayoutError).code).toBe(
        "NON_INTEGER_VALUE",
      );
    }
  });

  it.each([
    0,
    4,
  ])("rejects out-of-range value %s", (value) => {
    expect(() =>
      new TestLayout(createDefinition()).resolve(value),
    ).toThrow(
      `Value ${value} is outside 1-3.`,
    );
  });

  it("throws VALUE_OUT_OF_RANGE for an out-of-range value", () => {
    try {
      new TestLayout(createDefinition()).resolve(4);

      throw new Error(
        "Expected resolve to reject an out-of-range value.",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(LayoutError);
      expect((error as LayoutError).code).toBe(
        "VALUE_OUT_OF_RANGE",
      );
    }
  });

  it("rejects an invalid value range", () => {
    expect(() =>
      new TestLayout(
        createDefinition({
          minimumValue: 10,
          maximumValue: 1,
        }),
      ),
    ).toThrow(
      "minimumValue must not be greater than maximumValue.",
    );
  });

  it("throws INVALID_VALUE_RANGE for an invalid range", () => {
    try {
      new TestLayout(
        createDefinition({
          minimumValue: 10,
          maximumValue: 1,
        }),
      );

      throw new Error(
        "Expected constructor to reject an invalid range.",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(LayoutError);
      expect((error as LayoutError).code).toBe(
        "INVALID_VALUE_RANGE",
      );
    }
  });

  it("resolves every value in the configured range", () => {
    const layout = new TestLayout(
      createDefinition({
        minimumValue: 3,
        maximumValue: 5,
      }),
    );

    expect(layout.resolveAll()).toEqual([
      {
        value: 3,
        index: 0,
        position: {
          kind: "cartesian",
          x: 0,
          y: 0,
        },
      },
      {
        value: 4,
        index: 1,
        position: {
          kind: "cartesian",
          x: 1,
          y: 10,
        },
      },
      {
        value: 5,
        index: 2,
        position: {
          kind: "cartesian",
          x: 2,
          y: 20,
        },
      },
    ]);
  });

  it("resolves a single-value range", () => {
    const layout = new TestLayout(
      createDefinition({
        minimumValue: 7,
        maximumValue: 7,
      }),
    );

    expect(layout.resolveAll()).toEqual([
      {
        value: 7,
        index: 0,
        position: {
          kind: "cartesian",
          x: 0,
          y: 0,
        },
      },
    ]);
  });
});