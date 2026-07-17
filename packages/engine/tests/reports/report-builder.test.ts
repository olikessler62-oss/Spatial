import { describe, expect, it } from "vitest";

import { ReportBuilder } from "../../src/reports/report-builder.js";
import type {
  ExperimentReportConfiguration,
  ExperimentReportInput,
  ExperimentReportRanking,
} from "../../src/reports/report-types.js";

const configuration: ExperimentReportConfiguration = {
  layout: {
    type: "grid",
    rows: 3,
    columns: 3,
  },
  placementGenerator: {
    strategy: "cartesian",
  },
  metrics: [
    {
      metricId: "average-hit",
    },
    {
      metricId: "max-hit",
    },
  ],
  ranking: {
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
    limit: 10,
  },
};

const ranking: ExperimentReportRanking = {
  entries: [
    {
      rank: 1,
      resultId: "placement-b",
      score: 0.75,
      criteria: [
        {
          metricId: "average-hit",
          rawValue: 5,
          normalizedValue: 1,
          normalizedWeight: 0.75,
          contribution: 0.75,
        },
        {
          metricId: "max-hit",
          rawValue: 8,
          normalizedValue: 0,
          normalizedWeight: 0.25,
          contribution: 0,
        },
      ],
    },
    {
      rank: 2,
      resultId: "placement-a",
      score: 0.25,
      criteria: [
        {
          metricId: "average-hit",
          rawValue: 3,
          normalizedValue: 0,
          normalizedWeight: 0.75,
          contribution: 0,
        },
        {
          metricId: "max-hit",
          rawValue: 10,
          normalizedValue: 1,
          normalizedWeight: 0.25,
          contribution: 0.25,
        },
      ],
    },
  ],
  appliedCriteria: configuration.ranking.criteria,
  totalResultCount: 2,
};

const createInput = (
  overrides: Partial<ExperimentReportInput> = {},
): ExperimentReportInput => ({
  metadata: {
    experimentId: "experiment-001",
    createdAt: "2026-07-17T08:00:00.000Z",
    runtimeMs: 125,
    engineVersion: "1.0.0",
  },
  configuration,
  statistics: {
    totalPlacements: 3,
    evaluatedPlacements: 2,
    rejectedPlacements: 1,
  },
  ranking,
  generatedAt: "2026-07-17T08:00:01.000Z",
  ...overrides,
});

describe("ReportBuilder", () => {
  it("builds a complete experiment report", () => {
    const builder = new ReportBuilder();

    const report = builder.build(createInput());

    expect(report).toEqual({
      metadata: {
        experimentId: "experiment-001",
        createdAt: "2026-07-17T08:00:00.000Z",
        generatedAt: "2026-07-17T08:00:01.000Z",
        runtimeMs: 125,
        engineVersion: "1.0.0",
      },
      configuration,
      statistics: {
        totalPlacements: 3,
        evaluatedPlacements: 2,
        rejectedPlacements: 1,
        rankedPlacements: 2,
      },
      ranking,
    });
  });

  it("uses the supplied generated timestamp", () => {
    const builder = new ReportBuilder();

    const report = builder.build(
      createInput({
        generatedAt: "2026-07-17T09:30:00.000Z",
      }),
    );

    expect(report.metadata.generatedAt).toBe(
      "2026-07-17T09:30:00.000Z",
    );
  });

  it("generates a timestamp when none is supplied", () => {
    const builder = new ReportBuilder();

    const report = builder.build(
      createInput({
        generatedAt: undefined,
      }),
    );

    expect(Number.isNaN(Date.parse(report.metadata.generatedAt))).toBe(
      false,
    );
  });

  it("preserves optional engine version metadata", () => {
    const builder = new ReportBuilder();

    const report = builder.build(createInput());

    expect(report.metadata.engineVersion).toBe("1.0.0");
  });

  it("allows engine version metadata to be omitted", () => {
    const builder = new ReportBuilder();

    const report = builder.build(
      createInput({
        metadata: {
          experimentId: "experiment-001",
          createdAt: "2026-07-17T08:00:00.000Z",
          runtimeMs: 125,
        },
      }),
    );

    expect(report.metadata.engineVersion).toBeUndefined();
  });

  it("defaults rejected placements to zero", () => {
    const builder = new ReportBuilder();

    const report = builder.build(
      createInput({
        statistics: {
          totalPlacements: 2,
          evaluatedPlacements: 2,
        },
      }),
    );

    expect(report.statistics.rejectedPlacements).toBe(0);
  });

  it("derives ranked placements from the ranking entry count", () => {
    const builder = new ReportBuilder();

    const report = builder.build(createInput());

    expect(report.statistics.rankedPlacements).toBe(
      ranking.entries.length,
    );
  });

  it("preserves the complete ranking order", () => {
    const builder = new ReportBuilder();

    const report = builder.build(createInput());

    expect(report.ranking.entries.map((entry) => entry.resultId)).toEqual(
      ["placement-b", "placement-a"],
    );
  });

  it("preserves ranking criterion details", () => {
    const builder = new ReportBuilder();

    const report = builder.build(createInput());

    expect(report.ranking.entries[0]?.criteria).toEqual([
      {
        metricId: "average-hit",
        rawValue: 5,
        normalizedValue: 1,
        normalizedWeight: 0.75,
        contribution: 0.75,
      },
      {
        metricId: "max-hit",
        rawValue: 8,
        normalizedValue: 0,
        normalizedWeight: 0.25,
        contribution: 0,
      },
    ]);
  });

  it("preserves the ranking total result count", () => {
    const builder = new ReportBuilder();

    const report = builder.build(createInput());

    expect(report.ranking.totalResultCount).toBe(2);
  });

  it("preserves the applied ranking criteria", () => {
    const builder = new ReportBuilder();

    const report = builder.build(createInput());

    expect(report.ranking.appliedCriteria).toEqual(
      configuration.ranking.criteria,
    );
  });

  it("preserves experiment configuration values", () => {
    const builder = new ReportBuilder();

    const report = builder.build(createInput());

    expect(report.configuration).toEqual(configuration);
  });

  it("creates an immutable report", () => {
    const builder = new ReportBuilder();

    const report = builder.build(createInput());

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.metadata)).toBe(true);
    expect(Object.isFrozen(report.configuration)).toBe(true);
    expect(Object.isFrozen(report.statistics)).toBe(true);
    expect(Object.isFrozen(report.ranking)).toBe(true);
  });

  it("deeply freezes nested configuration values", () => {
    const builder = new ReportBuilder();

    const report = builder.build(createInput());

    expect(Object.isFrozen(report.configuration.layout)).toBe(true);
    expect(
      Object.isFrozen(report.configuration.placementGenerator),
    ).toBe(true);
    expect(Object.isFrozen(report.configuration.metrics)).toBe(true);
    expect(Object.isFrozen(report.configuration.metrics[0])).toBe(true);
    expect(Object.isFrozen(report.configuration.ranking)).toBe(true);
    expect(
      Object.isFrozen(report.configuration.ranking.criteria),
    ).toBe(true);
    expect(
      Object.isFrozen(report.configuration.ranking.criteria[0]),
    ).toBe(true);
  });

  it("deeply freezes ranking entries and criterion scores", () => {
    const builder = new ReportBuilder();

    const report = builder.build(createInput());

    expect(Object.isFrozen(report.ranking.entries)).toBe(true);
    expect(Object.isFrozen(report.ranking.entries[0])).toBe(true);
    expect(
      Object.isFrozen(report.ranking.entries[0]?.criteria),
    ).toBe(true);
    expect(
      Object.isFrozen(
        report.ranking.entries[0]?.criteria[0],
      ),
    ).toBe(true);
  });

  it("does not mutate the source input while building the report", () => {
    const builder = new ReportBuilder();
    const input = createInput();

    const originalInput = structuredClone(input);

    builder.build(input);

    expect(input).toEqual(originalInput);
  });

  it("creates report-owned copies of mutable input structures", () => {
    const builder = new ReportBuilder();

    const mutableConfiguration = {
      layout: {
        type: "grid",
      },
      placementGenerator: {
        strategy: "cartesian",
      },
      metrics: [
        {
          metricId: "average-hit",
        },
      ],
      ranking: {
        criteria: [
          {
            metricId: "average-hit",
            weight: 1,
            direction: "descending" as const,
          },
        ],
      },
    };

    const mutableRanking = {
      entries: [
        {
          rank: 1,
          resultId: "placement-a",
          score: 1,
          criteria: [
            {
              metricId: "average-hit",
              rawValue: 5,
              normalizedValue: 1,
              normalizedWeight: 1,
              contribution: 1,
            },
          ],
        },
      ],
      appliedCriteria: mutableConfiguration.ranking.criteria,
      totalResultCount: 1,
    };

    const report = builder.build({
      metadata: {
        experimentId: "experiment-001",
        createdAt: "2026-07-17T08:00:00.000Z",
        runtimeMs: 50,
      },
      configuration: mutableConfiguration,
      statistics: {
        totalPlacements: 1,
        evaluatedPlacements: 1,
      },
      ranking: mutableRanking,
      generatedAt: "2026-07-17T08:00:01.000Z",
    });

    mutableConfiguration.layout.type = "circle";
    mutableConfiguration.metrics[0]!.metricId = "max-hit";
    mutableRanking.entries[0]!.resultId = "changed-placement";
    mutableRanking.entries[0]!.criteria[0]!.rawValue = 999;

    expect(report.configuration.layout).toEqual({
      type: "grid",
    });
    expect(report.configuration.metrics[0]).toEqual({
      metricId: "average-hit",
    });
    expect(report.ranking.entries[0]?.resultId).toBe(
      "placement-a",
    );
    expect(
      report.ranking.entries[0]?.criteria[0]?.rawValue,
    ).toBe(5);
  });

  it("supports an empty ranking", () => {
    const builder = new ReportBuilder();

    const emptyRanking: ExperimentReportRanking = {
      entries: [],
      appliedCriteria: configuration.ranking.criteria,
      totalResultCount: 0,
    };

    const report = builder.build(
      createInput({
        statistics: {
          totalPlacements: 0,
          evaluatedPlacements: 0,
        },
        ranking: emptyRanking,
      }),
    );

    expect(report.ranking.entries).toEqual([]);
    expect(report.statistics.rankedPlacements).toBe(0);
  });
});