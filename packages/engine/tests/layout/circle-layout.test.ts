import { describe, expect, it } from "vitest";

import { CircleLayout } from "../../src/layout/circle-layout.js";
import { LayoutError } from "../../src/layout/layout-error.js";

describe("CircleLayout", () => {
  it("places values clockwise around the unit circle by default", () => {
    const layout = new CircleLayout({
      id: "circle-4",
      name: "Four Positions",
      type: "circle",
      minimumValue: 1,
      maximumValue: 4,
    });

    const first = layout.resolve(1);
    const second = layout.resolve(2);
    const third = layout.resolve(3);
    const fourth = layout.resolve(4);

    expect(first.position.kind).toBe("polar");
    expect(first.position.angleRadians).toBeCloseTo(0);
    expect(first.position.radius).toBe(1);
    expect(first.position.x).toBeCloseTo(1);
    expect(first.position.y).toBeCloseTo(0);

    expect(second.position.angleRadians).toBeCloseTo(
      Math.PI / 2,
    );
    expect(second.position.x).toBeCloseTo(0);
    expect(second.position.y).toBeCloseTo(1);

    expect(third.position.angleRadians).toBeCloseTo(
      Math.PI,
    );
    expect(third.position.x).toBeCloseTo(-1);
    expect(third.position.y).toBeCloseTo(0);

    expect(fourth.position.angleRadians).toBeCloseTo(
      (Math.PI * 3) / 2,
    );
    expect(fourth.position.x).toBeCloseTo(0);
    expect(fourth.position.y).toBeCloseTo(-1);
  });

  it("uses a custom radius", () => {
    const layout = new CircleLayout({
      id: "circle-radius",
      name: "Custom Radius",
      type: "circle",
      minimumValue: 1,
      maximumValue: 4,
      radius: 5,
    });

    const position = layout.resolve(2).position;

    expect(position.kind).toBe("polar");
    expect(position.radius).toBe(5);
    expect(position.x).toBeCloseTo(0);
    expect(position.y).toBeCloseTo(5);
  });

  it("uses a custom start angle", () => {
    const layout = new CircleLayout({
      id: "circle-start-angle",
      name: "Custom Start Angle",
      type: "circle",
      minimumValue: 1,
      maximumValue: 4,
      startAngleRadians: Math.PI / 2,
    });

    const position = layout.resolve(1).position;

    expect(position.kind).toBe("polar");
    expect(position.angleRadians).toBeCloseTo(
      Math.PI / 2,
    );
    expect(position.x).toBeCloseTo(0);
    expect(position.y).toBeCloseTo(1);
  });

  it("places values counter-clockwise when clockwise is false", () => {
    const layout = new CircleLayout({
      id: "counter-clockwise-circle",
      name: "Counter-clockwise Circle",
      type: "circle",
      minimumValue: 1,
      maximumValue: 4,
      clockwise: false,
    });

    const second = layout.resolve(2).position;

    expect(second.kind).toBe("polar");
    expect(second.angleRadians).toBeCloseTo(
      -Math.PI / 2,
    );
    expect(second.x).toBeCloseTo(0);
    expect(second.y).toBeCloseTo(-1);
  });

  it("combines custom start angle, direction, and radius", () => {
    const layout = new CircleLayout({
      id: "custom-circle",
      name: "Custom Circle",
      type: "circle",
      minimumValue: 10,
      maximumValue: 13,
      radius: 2,
      startAngleRadians: Math.PI,
      clockwise: false,
    });

    const position = layout.resolve(11).position;

    expect(position.kind).toBe("polar");
    expect(position.angleRadians).toBeCloseTo(
      Math.PI / 2,
    );
    expect(position.radius).toBe(2);
    expect(position.x).toBeCloseTo(0);
    expect(position.y).toBeCloseTo(2);
  });

  it.each([
    0,
    -1,
  ])("rejects invalid radius %s", (radius) => {
    expect(
      () =>
        new CircleLayout({
          id: "invalid-circle",
          name: "Invalid Circle",
          type: "circle",
          minimumValue: 1,
          maximumValue: 4,
          radius,
        }),
    ).toThrow(
      "Circle radius must be greater than zero.",
    );
  });

  it("throws INVALID_CIRCLE_RADIUS for an invalid radius", () => {
    try {
      new CircleLayout({
        id: "invalid-circle",
        name: "Invalid Circle",
        type: "circle",
        minimumValue: 1,
        maximumValue: 4,
        radius: 0,
      });

      throw new Error(
        "Expected constructor to reject the radius.",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(LayoutError);
      expect((error as LayoutError).code).toBe(
        "INVALID_CIRCLE_RADIUS",
      );
    }
  });
});