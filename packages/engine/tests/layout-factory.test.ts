import { describe, expect, it } from "vitest";
import { createLayout } from "../src/layout/layout-factory.js";

describe("createLayout", () => {
  it("creates grid and circle layouts", () => {
    const grid = createLayout({ id:"grid", name:"Grid", type:"grid", minimumValue:1, maximumValue:9, columns:3 });
    const circle = createLayout({ id:"circle", name:"Circle", type:"circle", minimumValue:1, maximumValue:8 });
    expect(grid.resolve(5).position).toMatchObject({ x:1, y:1 });
    expect(circle.resolveAll()).toHaveLength(8);
  });
});
