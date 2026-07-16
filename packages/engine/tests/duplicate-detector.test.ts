import { describe, expect, it } from "vitest";
import { DuplicateDetector } from "../src/import/duplicate-detector.js";
import type { ParsedDraw } from "../src/domain/parsed-draw.js";

describe("DuplicateDetector", () => {
  it("detects normalized duplicate rows", () => {
    const draws: ParsedDraw[] = [
      {
        drawDate: "2026-07-15",
        mainNumbers: [1, 8, 17, 24, 33, 49],
        bonusNumbers: [7],
        externalId: "draw-001",
        sourceRow: 2,
      },
      {
        drawDate: "2026-07-15",
        mainNumbers: [49, 33, 24, 17, 8, 1],
        bonusNumbers: [7],
        externalId: "draw-001",
        sourceRow: 3,
      },
    ];

    expect(new DuplicateDetector().find(draws)).toEqual([
      {
        key: "2026-07-15|1-8-17-24-33-49|7|draw-001",
        rows: [2, 3],
      },
    ]);
  });
});
