import { describe, expect, it } from "vitest";

import { RankingEngine } from "../../src/ranking/ranking-engine.js";
import {
  RankingError,
  type RankingErrorCode,
} from "../../src/ranking/ranking-error.js";
import type {
  RankableResult,
  RankingConfiguration,
} from "../../src/ranking/ranking-types.js";

const createResult = (
  resultId: string,
  metricValues: Readonly<Record<string, number>>,
): RankableResult => ({
  resultId,
  metricValues,
});

const expectRankingError = (
  operation: () => unknown,
  expectedCode: RankingErrorCode,
): void => {
  try {
    operation();
    throw new Error(
      `Expected ranking operation to throw ${expectedCode}.`,
    );
  } catch (error) {
    expect(error).toBeInstanceOf(RankingError);
    expect((error as RankingError).code).toBe(expectedCode);
  }
};

describe("RankingEngine", () => {
  it("ranks higher values first for a descending criterion", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("placement-a", {
          "average-hit": 2,
        }),
        createResult("placement-b", {
          "average-hit": 5,
        }),
        createResult("placement-c", {
          "average-hit": 3,
        }),
      ],
      {
        criteria: [
          {
            metricId: "average-hit",
            weight: 1,
            direction: "descending",
          },
        ],
      },
    );

    expect(result.entries.map((entry) => entry.resultId)).toEqual([
      "placement-b",
      "placement-c",
      "placement-a",
    ]);

    expect(result.entries.map((entry) => entry.rank)).toEqual([
      1,
      2,
      3,
    ]);
  });

  it("ranks lower values first for an ascending criterion", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("slow", {
          duration: 300,
        }),
        createResult("fast", {
          duration: 100,
        }),
        createResult("medium", {
          duration: 200,
        }),
      ],
      {
        criteria: [
          {
            metricId: "duration",
            weight: 1,
            direction: "ascending",
          },
        ],
      },
    );

    expect(result.entries.map((entry) => entry.resultId)).toEqual([
      "fast",
      "medium",
      "slow",
    ]);
  });

  it("normalizes descending metric values between zero and one", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("minimum", {
          score: 10,
        }),
        createResult("middle", {
          score: 20,
        }),
        createResult("maximum", {
          score: 30,
        }),
      ],
      {
        criteria: [
          {
            metricId: "score",
            weight: 1,
            direction: "descending",
          },
        ],
      },
    );

    const maximum = result.entries.find(
      (entry) => entry.resultId === "maximum",
    );
    const middle = result.entries.find(
      (entry) => entry.resultId === "middle",
    );
    const minimum = result.entries.find(
      (entry) => entry.resultId === "minimum",
    );

    expect(maximum?.criteria[0]?.normalizedValue).toBeCloseTo(1);
    expect(middle?.criteria[0]?.normalizedValue).toBeCloseTo(0.5);
    expect(minimum?.criteria[0]?.normalizedValue).toBeCloseTo(0);
  });

  it("normalizes ascending metric values between zero and one", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("minimum", {
          duration: 10,
        }),
        createResult("middle", {
          duration: 20,
        }),
        createResult("maximum", {
          duration: 30,
        }),
      ],
      {
        criteria: [
          {
            metricId: "duration",
            weight: 1,
            direction: "ascending",
          },
        ],
      },
    );

    const minimum = result.entries.find(
      (entry) => entry.resultId === "minimum",
    );
    const middle = result.entries.find(
      (entry) => entry.resultId === "middle",
    );
    const maximum = result.entries.find(
      (entry) => entry.resultId === "maximum",
    );

    expect(minimum?.criteria[0]?.normalizedValue).toBeCloseTo(1);
    expect(middle?.criteria[0]?.normalizedValue).toBeCloseTo(0.5);
    expect(maximum?.criteria[0]?.normalizedValue).toBeCloseTo(0);
  });

  it("normalizes every metric independently", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("placement-a", {
          "average-hit": 1,
          "max-hit": 100,
        }),
        createResult("placement-b", {
          "average-hit": 2,
          "max-hit": 200,
        }),
        createResult("placement-c", {
          "average-hit": 3,
          "max-hit": 300,
        }),
      ],
      {
        criteria: [
          {
            metricId: "average-hit",
            weight: 1,
            direction: "descending",
          },
          {
            metricId: "max-hit",
            weight: 1,
            direction: "descending",
          },
        ],
      },
    );

    const placementB = result.entries.find(
      (entry) => entry.resultId === "placement-b",
    );

    expect(placementB?.criteria[0]?.normalizedValue).toBeCloseTo(
      0.5,
    );
    expect(placementB?.criteria[1]?.normalizedValue).toBeCloseTo(
      0.5,
    );
  });

  it("normalizes criterion weights before calculating scores", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("placement-a", {
          "average-hit": 2,
          "max-hit": 5,
        }),
        createResult("placement-b", {
          "average-hit": 3,
          "max-hit": 4,
        }),
      ],
      {
        criteria: [
          {
            metricId: "average-hit",
            weight: 7,
            direction: "descending",
          },
          {
            metricId: "max-hit",
            weight: 3,
            direction: "descending",
          },
        ],
      },
    );

    const placementA = result.entries.find(
      (entry) => entry.resultId === "placement-a",
    );
    const placementB = result.entries.find(
      (entry) => entry.resultId === "placement-b",
    );

    expect(
      placementA?.criteria[0]?.normalizedWeight,
    ).toBeCloseTo(0.7);
    expect(
      placementA?.criteria[1]?.normalizedWeight,
    ).toBeCloseTo(0.3);

    expect(placementA?.score).toBeCloseTo(0.3);
    expect(placementB?.score).toBeCloseTo(0.7);
  });

  it("treats proportional weight configurations as equivalent", () => {
    const engine = new RankingEngine();

    const results = [
      createResult("placement-a", {
        "average-hit": 2,
        "max-hit": 5,
      }),
      createResult("placement-b", {
        "average-hit": 3,
        "max-hit": 4,
      }),
    ];

    const percentageWeights = engine.rank(results, {
      criteria: [
        {
          metricId: "average-hit",
          weight: 0.7,
          direction: "descending",
        },
        {
          metricId: "max-hit",
          weight: 0.3,
          direction: "descending",
        },
      ],
    });

    const integerWeights = engine.rank(results, {
      criteria: [
        {
          metricId: "average-hit",
          weight: 7,
          direction: "descending",
        },
        {
          metricId: "max-hit",
          weight: 3,
          direction: "descending",
        },
      ],
    });

    expect(
      integerWeights.entries.map((entry) => entry.resultId),
    ).toEqual(
      percentageWeights.entries.map((entry) => entry.resultId),
    );

    expect(integerWeights.entries[0]?.score).toBeCloseTo(
      percentageWeights.entries[0]?.score ?? 0,
    );
    expect(integerWeights.entries[1]?.score).toBeCloseTo(
      percentageWeights.entries[1]?.score ?? 0,
    );
  });

  it("calculates and exposes criterion contributions", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("placement-a", {
          "average-hit": 2,
          "max-hit": 5,
        }),
        createResult("placement-b", {
          "average-hit": 3,
          "max-hit": 4,
        }),
      ],
      {
        criteria: [
          {
            metricId: "average-hit",
            weight: 0.75,
            direction: "descending",
          },
          {
            metricId: "max-hit",
            weight: 0.25,
            direction: "descending",
          },
        ],
      },
    );

    const placementB = result.entries.find(
      (entry) => entry.resultId === "placement-b",
    );

    expect(placementB?.criteria).toEqual([
      {
        metricId: "average-hit",
        rawValue: 3,
        normalizedValue: 1,
        normalizedWeight: 0.75,
        contribution: 0.75,
      },
      {
        metricId: "max-hit",
        rawValue: 4,
        normalizedValue: 0,
        normalizedWeight: 0.25,
        contribution: 0,
      },
    ]);

    expect(placementB?.score).toBeCloseTo(0.75);
  });

  it("assigns a normalized value of one when all metric values are equal", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("placement-b", {
          score: 10,
        }),
        createResult("placement-a", {
          score: 10,
        }),
      ],
      {
        criteria: [
          {
            metricId: "score",
            weight: 1,
            direction: "descending",
          },
        ],
      },
    );

    for (const entry of result.entries) {
      expect(entry.criteria[0]?.normalizedValue).toBe(1);
      expect(entry.score).toBe(1);
    }
  });

  it("uses criteria in declared order to break equal composite scores", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("placement-a", {
          metricA: 10,
          metricB: 20,
        }),
        createResult("placement-b", {
          metricA: 20,
          metricB: 10,
        }),
      ],
      {
        criteria: [
          {
            metricId: "metricA",
            weight: 1,
            direction: "descending",
          },
          {
            metricId: "metricB",
            weight: 1,
            direction: "descending",
          },
        ],
      },
    );

    expect(result.entries[0]?.resultId).toBe("placement-b");
    expect(result.entries[1]?.resultId).toBe("placement-a");
    expect(result.entries[0]?.score).toBeCloseTo(
      result.entries[1]?.score ?? 0,
    );
  });

  it("respects ascending direction when applying a metric tie-breaker", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("placement-a", {
          quality: 10,
          duration: 200,
        }),
        createResult("placement-b", {
          quality: 10,
          duration: 100,
        }),
      ],
      {
        criteria: [
          {
            metricId: "quality",
            weight: 1,
            direction: "descending",
          },
          {
            metricId: "duration",
            weight: 0,
            direction: "ascending",
          },
        ],
      },
    );

    expect(result.entries.map((entry) => entry.resultId)).toEqual([
      "placement-b",
      "placement-a",
    ]);
  });

  it("uses resultId as the final deterministic tie-breaker", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("placement-c", {
          score: 10,
        }),
        createResult("placement-a", {
          score: 10,
        }),
        createResult("placement-b", {
          score: 10,
        }),
      ],
      {
        criteria: [
          {
            metricId: "score",
            weight: 1,
            direction: "descending",
          },
        ],
      },
    );

    expect(result.entries.map((entry) => entry.resultId)).toEqual([
      "placement-a",
      "placement-b",
      "placement-c",
    ]);
  });

  it("assigns ordinal one-based ranks after deterministic sorting", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("placement-b", {
          score: 10,
        }),
        createResult("placement-a", {
          score: 10,
        }),
        createResult("placement-c", {
          score: 5,
        }),
      ],
      {
        criteria: [
          {
            metricId: "score",
            weight: 1,
            direction: "descending",
          },
        ],
      },
    );

    expect(result.entries).toEqual([
      expect.objectContaining({
        rank: 1,
        resultId: "placement-a",
      }),
      expect.objectContaining({
        rank: 2,
        resultId: "placement-b",
      }),
      expect.objectContaining({
        rank: 3,
        resultId: "placement-c",
      }),
    ]);
  });

  it("returns only the requested number of entries", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("placement-a", {
          score: 1,
        }),
        createResult("placement-b", {
          score: 3,
        }),
        createResult("placement-c", {
          score: 2,
        }),
      ],
      {
        criteria: [
          {
            metricId: "score",
            weight: 1,
            direction: "descending",
          },
        ],
        limit: 2,
      },
    );

    expect(result.entries.map((entry) => entry.resultId)).toEqual([
      "placement-b",
      "placement-c",
    ]);

    expect(result.entries.map((entry) => entry.rank)).toEqual([
      1,
      2,
    ]);

    expect(result.totalResultCount).toBe(3);
  });

  it("returns every entry when the limit exceeds the result count", () => {
    const engine = new RankingEngine();

    const result = engine.rank(
      [
        createResult("placement-a", {
          score: 1,
        }),
        createResult("placement-b", {
          score: 2,
        }),
      ],
      {
        criteria: [
          {
            metricId: "score",
            weight: 1,
            direction: "descending",
          },
        ],
        limit: 10,
      },
    );

    expect(result.entries).toHaveLength(2);
    expect(result.totalResultCount).toBe(2);
  });

  it("returns an empty ranking for empty input", () => {
    const engine = new RankingEngine();

    const configuration: RankingConfiguration = {
      criteria: [
        {
          metricId: "score",
          weight: 1,
          direction: "descending",
        },
      ],
    };

    const result = engine.rank([], configuration);

    expect(result).toEqual({
      entries: [],
      totalResultCount: 0,
      appliedCriteria: configuration.criteria,
    });
  });

  it("preserves the applied criteria in the ranking result", () => {
    const engine = new RankingEngine();

    const configuration: RankingConfiguration = {
      criteria: [
        {
          metricId: "score",
          weight: 2,
          direction: "descending",
        },
      ],
    };

    const result = engine.rank(
      [
        createResult("placement-a", {
          score: 10,
        }),
      ],
      configuration,
    );

    expect(result.appliedCriteria).toBe(configuration.criteria);
  });

  it("rejects an empty criteria collection", () => {
    const engine = new RankingEngine();

    expectRankingError(
      () =>
        engine.rank([], {
          criteria: [],
        }),
      "EMPTY_CRITERIA",
    );
  });

  it("rejects duplicate metric identifiers", () => {
    const engine = new RankingEngine();

    expectRankingError(
      () =>
        engine.rank([], {
          criteria: [
            {
              metricId: "score",
              weight: 1,
              direction: "descending",
            },
            {
              metricId: "score",
              weight: 2,
              direction: "ascending",
            },
          ],
        }),
      "DUPLICATE_METRIC",
    );
  });

  it.each([
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])("rejects invalid criterion weight %s", (weight) => {
    const engine = new RankingEngine();

    expectRankingError(
      () =>
        engine.rank([], {
          criteria: [
            {
              metricId: "score",
              weight,
              direction: "descending",
            },
          ],
        }),
      "INVALID_WEIGHT",
    );
  });

  it("rejects configurations whose total weight is zero", () => {
    const engine = new RankingEngine();

    expectRankingError(
      () =>
        engine.rank([], {
          criteria: [
            {
              metricId: "score",
              weight: 0,
              direction: "descending",
            },
            {
              metricId: "duration",
              weight: 0,
              direction: "ascending",
            },
          ],
        }),
      "ZERO_TOTAL_WEIGHT",
    );
  });

  it("rejects an unsupported ranking direction", () => {
    const engine = new RankingEngine();

    const configuration = {
      criteria: [
        {
          metricId: "score",
          weight: 1,
          direction: "sideways",
        },
      ],
    } as unknown as RankingConfiguration;

    expectRankingError(
      () => engine.rank([], configuration),
      "INVALID_DIRECTION",
    );
  });

  it.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])("rejects invalid result limit %s", (limit) => {
    const engine = new RankingEngine();

    expectRankingError(
      () =>
        engine.rank([], {
          criteria: [
            {
              metricId: "score",
              weight: 1,
              direction: "descending",
            },
          ],
          limit,
        }),
      "INVALID_LIMIT",
    );
  });

  it("rejects a result that does not contain a configured metric", () => {
    const engine = new RankingEngine();

    expectRankingError(
      () =>
        engine.rank(
          [
            createResult("placement-a", {
              "average-hit": 2,
            }),
          ],
          {
            criteria: [
              {
                metricId: "average-hit",
                weight: 1,
                direction: "descending",
              },
              {
                metricId: "max-hit",
                weight: 1,
                direction: "descending",
              },
            ],
          },
        ),
      "MISSING_METRIC_VALUE",
    );
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])("rejects invalid metric value %s", (metricValue) => {
    const engine = new RankingEngine();

    expectRankingError(
      () =>
        engine.rank(
          [
            createResult("placement-a", {
              score: metricValue,
            }),
          ],
          {
            criteria: [
              {
                metricId: "score",
                weight: 1,
                direction: "descending",
              },
            ],
          },
        ),
      "INVALID_METRIC_VALUE",
    );
  });

  it("identifies the affected result and metric in a missing-value error", () => {
    const engine = new RankingEngine();

    expect(() =>
      engine.rank(
        [
          createResult("placement-a", {
            score: 10,
          }),
        ],
        {
          criteria: [
            {
              metricId: "duration",
              weight: 1,
              direction: "ascending",
            },
          ],
        },
      ),
    ).toThrow(/placement-a.*duration|duration.*placement-a/i);
  });

  it("identifies the affected result and metric in an invalid-value error", () => {
    const engine = new RankingEngine();

    expect(() =>
      engine.rank(
        [
          createResult("placement-a", {
            score: Number.NaN,
          }),
        ],
        {
          criteria: [
            {
              metricId: "score",
              weight: 1,
              direction: "descending",
            },
          ],
        },
      ),
    ).toThrow(/placement-a.*score|score.*placement-a/i);
  });
});