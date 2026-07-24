import { describe, expect, it } from "vitest";

import {
  createRectangleGeometryKey,
  createShapeGeometryKey,
} from "../../src/shape-analysis/geometry-key.js";
import type { RectangleGeometry } from "../../src/shape-analysis/domain/geometry.js";

describe("shape identity keys", () => {
  const base: RectangleGeometry = {
    originRow: 5,
    originColumn: 5,
    width: 2,
    height: 2,
  };

  it("produces the same key for identical geometries", () => {
    const copy: RectangleGeometry = { ...base };

    expect(createRectangleGeometryKey(base)).toBe(
      createRectangleGeometryKey(copy),
    );
    expect(createShapeGeometryKey("rectangle", base)).toBe(
      "rectangle:r=5:c=5:w=2:h=2",
    );
  });

  it("produces different keys for different origins", () => {
    const other: RectangleGeometry = {
      ...base,
      originRow: 4,
    };

    expect(createRectangleGeometryKey(base)).not.toBe(
      createRectangleGeometryKey(other),
    );
  });

  it("produces different keys for different sizes", () => {
    const other: RectangleGeometry = {
      ...base,
      width: 3,
    };

    expect(createRectangleGeometryKey(base)).not.toBe(
      createRectangleGeometryKey(other),
    );
  });

  it("does not include lottery values in the key", () => {
    const key = createRectangleGeometryKey(base);

    expect(key).not.toMatch(/\bvalue\b/i);
    expect(key).not.toMatch(/\d+:\d+:\d+:\d+:\d+/);
    expect(key).toBe("rectangle:r=5:c=5:w=2:h=2");
  });
});
