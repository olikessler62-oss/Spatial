import { describe, expect, it } from "vitest";

import { GridLayout } from "../../src/layout/grid-layout.js";
import { serializeLayout } from "../../src/layout/layout-serializer.js";

describe("serializeLayout", () => {
  it("serializes layout metadata and resolved positions", () => {
    const layout = new GridLayout({
      id: "grid-2x2",
      name: "2x2 Grid",
      type: "grid",
      minimumValue: 1,
      maximumValue: 4,
      columns: 2,
    });

    const serialized = serializeLayout(layout);

    expect(serialized).toEqual({
      id: "grid-2x2",
      name: "2x2 Grid",
      type: "grid",
      minimumValue: 1,
      maximumValue: 4,
      positions: [
        {
          value: 1,
          index: 0,
          position: {
            kind: "cartesian",
            x: 0,
            y: 0,
            row: 0,
            column: 0,
          },
        },
        {
          value: 2,
          index: 1,
          position: {
            kind: "cartesian",
            x: 1,
            y: 0,
            row: 0,
            column: 1,
          },
        },
        {
          value: 3,
          index: 2,
          position: {
            kind: "cartesian",
            x: 0,
            y: 1,
            row: 1,
            column: 0,
          },
        },
        {
          value: 4,
          index: 3,
          position: {
            kind: "cartesian",
            x: 1,
            y: 1,
            row: 1,
            column: 1,
          },
        },
      ],
    });
  });

  it("returns the resolved positions produced by the layout", () => {
    const positions = [
      {
        value: 10,
        index: 0,
        position: {
          kind: "cartesian" as const,
          x: 5,
          y: 6,
        },
      },
    ];

    const layout = {
      definition: {
        id: "custom-layout",
        name: "Custom Layout",
        type: "custom",
        minimumValue: 10,
        maximumValue: 10,
      },

      resolve() {
        return positions[0]!;
      },

      resolveAll() {
        return positions;
      },
    };

    const serialized = serializeLayout(layout);

    expect(serialized.positions).toBe(positions);
    expect(serialized.id).toBe("custom-layout");
    expect(serialized.name).toBe("Custom Layout");
    expect(serialized.type).toBe("custom");
    expect(serialized.minimumValue).toBe(10);
    expect(serialized.maximumValue).toBe(10);
  });
});