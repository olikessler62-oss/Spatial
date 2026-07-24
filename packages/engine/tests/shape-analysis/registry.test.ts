import { describe, expect, it } from "vitest";

import { DefaultShapeAnalyzerRegistry } from "../../src/shape-analysis/detection/shape-detector-registry.js";
import type { ShapeDetector } from "../../src/shape-analysis/detection/shape-detector.js";
import type { RectangleGeometry } from "../../src/shape-analysis/domain/geometry.js";
import { ShapeAnalysisError } from "../../src/shape-analysis/shape-analysis-error.js";
import { SequentialIdGenerator } from "../../src/shape-analysis/id-generator.js";
import {
  createLayoutKey,
  createShapeStatisticsKey,
} from "../../src/shape-analysis/domain/shape-statistics-key.js";

const stubRectangleDetector: ShapeDetector<RectangleGeometry> = {
  shapeType: "rectangle",
  detectInitialShapes: () => [],
  detectChildShapes: () => [],
  existsUnchanged: () => true,
};

describe("DefaultShapeAnalyzerRegistry", () => {
  it("registers and resolves detectors without hard-coding concrete classes", () => {
    const registry = new DefaultShapeAnalyzerRegistry();

    expect(registry.has("rectangle")).toBe(false);

    registry.register(stubRectangleDetector);

    expect(registry.has("rectangle")).toBe(true);
    expect(registry.get("rectangle")).toBe(stubRectangleDetector);
  });

  it("throws UNSUPPORTED_SHAPE_TYPE for missing detectors", () => {
    const registry = new DefaultShapeAnalyzerRegistry();

    expect(() => registry.get("circle")).toThrow(ShapeAnalysisError);

    try {
      registry.get("circle");
    } catch (error) {
      expect((error as ShapeAnalysisError).code).toBe(
        "UNSUPPORTED_SHAPE_TYPE",
      );
    }
  });
});

describe("SequentialIdGenerator", () => {
  it("produces deterministic ids for tests", () => {
    const ids = new SequentialIdGenerator();

    expect(ids.nextId("shape")).toBe("shape-001");
    expect(ids.nextId("shape")).toBe("shape-002");
  });
});

describe("layout statistics key", () => {
  it("uses layout dimensions only, without lottery values", () => {
    expect(createLayoutKey(7, 7)).toBe("7x7");
    expect(createLayoutKey(5, 10)).toBe("5x10");

    const key = createShapeStatisticsKey(
      7,
      7,
      "rectangle",
      "rectangle:r=5:c=5:w=2:h=2",
    );

    expect(key.layoutKey).toBe("7x7");
    expect(key.shapeType).toBe("rectangle");
    expect(key.geometryKey).not.toMatch(/value/i);
  });
});
