import { describe, expect, it } from "vitest";
import { CircleLayout } from "../src/layout/circle-layout.js";

describe("CircleLayout", () => {
  it("places values evenly around a circle", () => {
    const layout = new CircleLayout({
      id:"circle-4", name:"Four Point Circle", type:"circle",
      minimumValue:1, maximumValue:4, radius:10,
    });
    const first = layout.resolve(1).position;
    const second = layout.resolve(2).position;
    expect(first.x).toBeCloseTo(10);
    expect(first.y).toBeCloseTo(0);
    expect(second.x).toBeCloseTo(0);
    expect(second.y).toBeCloseTo(10);
  });

  it("supports counter-clockwise orientation", () => {
    const layout = new CircleLayout({
      id:"circle-4-counter", name:"Counter Clockwise", type:"circle",
      minimumValue:1, maximumValue:4, clockwise:false,
    });
    expect(layout.resolve(2).position.y).toBeCloseTo(-1);
  });
});
