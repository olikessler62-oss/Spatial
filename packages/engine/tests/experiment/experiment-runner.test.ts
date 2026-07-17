import { describe, expect, it } from "vitest";
import { ExperimentRunner } from "../../src/experiment/experiment-runner.js";
import { BitMask } from "../../src/indexing/bit-mask.js";

describe("ExperimentRunner", () => {
  it("compares every placement with every draw", () => {
    const result = new ExperimentRunner().run({
      experimentId: "experiment-001",
      placements: [
        {
          anchorValue: 1,
          positionCount: 4,
          mask: BitMask.fromIndices([0, 1, 7, 8]),
        },
        {
          anchorValue: 17,
          positionCount: 4,
          mask: BitMask.fromIndices([
            16,
            17,
            23,
            24,
          ]),
        },
      ],
      draws: [
        {
          drawDate: "2026-07-15",
          drawnValueCount: 6,
          mask: BitMask.fromIndices([
            0,
            16,
            24,
            32,
            40,
            48,
          ]),
        },
        {
          drawDate: "2026-07-12",
          drawnValueCount: 6,
          mask: BitMask.fromIndices([
            2,
            10,
            18,
            27,
            33,
            44,
          ]),
        },
      ],
    });

    expect(result.analyzedPlacements).toBe(2);
    expect(result.analyzedDraws).toBe(2);
    expect(result.comparisons).toBe(4);
    expect(result.results).toHaveLength(4);

    expect(result.placementSummaries).toEqual([
      {
        anchorValue: 1,
        placementSize: 4,
        analyzedDraws: 2,
        drawsWithHits: 1,
        totalHits: 1,
        maximumHits: 1,
        averageHits: 0.5,
      },
      {
        anchorValue: 17,
        placementSize: 4,
        analyzedDraws: 2,
        drawsWithHits: 1,
        totalHits: 2,
        maximumHits: 2,
        averageHits: 1,
      },
    ]);
  });

  it("handles an experiment without draws", () => {
    const result = new ExperimentRunner().run({
      experimentId: "empty-experiment",
      placements: [
        {
          anchorValue: 1,
          positionCount: 1,
          mask: BitMask.fromIndices([0]),
        },
      ],
      draws: [],
    });

    expect(result.comparisons).toBe(0);
    expect(result.results).toEqual([]);
    expect(
      result.placementSummaries[0]?.averageHits,
    ).toBe(0);
  });
});
