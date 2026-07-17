import { describe, expect, it } from "vitest";

import { JsonReportSerializer } from "../../src/reports/json-report-serializer.js";
import type { ExperimentReport } from "../../src/reports/report-types.js";

const report: ExperimentReport = {
  metadata: {
    experimentId: "experiment-001",
    createdAt: "2026-07-17T08:00:00.000Z",
    generatedAt: "2026-07-17T08:00:01.000Z",
    runtimeMs: 125,
    engineVersion: "1.0.0",
  },
  configuration: {
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
  },
  statistics: {
    totalPlacements: 3,
    evaluatedPlacements: 2,
    rejectedPlacements: 1,
    rankedPlacements: 2,
  },
  ranking: {
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
    appliedCriteria: [
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
    totalResultCount: 2,
  },
};

describe("JsonReportSerializer", () => {
  it("serializes an experiment report as compact JSON", () => {
    const serializer = new JsonReportSerializer();

    const serialized = serializer.serialize(report);

    expect(serialized).toBe(JSON.stringify(report));
  });

  it("serializes an experiment report as pretty JSON", () => {
    const serializer = new JsonReportSerializer();

    const serialized = serializer.serialize(report, {
      pretty: true,
    });

    expect(serialized).toBe(JSON.stringify(report, null, 2));
  });

  it("defaults to compact JSON when pretty is false", () => {
    const serializer = new JsonReportSerializer();

    const serialized = serializer.serialize(report, {
      pretty: false,
    });

    expect(serialized).toBe(JSON.stringify(report));
  });

  it("produces valid JSON", () => {
    const serializer = new JsonReportSerializer();

    const serialized = serializer.serialize(report);
    const parsed = JSON.parse(serialized) as ExperimentReport;

    expect(parsed).toEqual(report);
  });

  it("preserves ranking entry order", () => {
    const serializer = new JsonReportSerializer();

    const serialized = serializer.serialize(report);
    const parsed = JSON.parse(serialized) as ExperimentReport;

    expect(
      parsed.ranking.entries.map((entry) => entry.resultId),
    ).toEqual([
      "placement-b",
      "placement-a",
    ]);
  });

  it("preserves ranking criterion details", () => {
    const serializer = new JsonReportSerializer();

    const serialized = serializer.serialize(report);
    const parsed = JSON.parse(serialized) as ExperimentReport;

    expect(parsed.ranking.entries[0]?.criteria[0]).toEqual({
      metricId: "average-hit",
      rawValue: 5,
      normalizedValue: 1,
      normalizedWeight: 0.75,
      contribution: 0.75,
    });
  });

  it("preserves report metadata", () => {
    const serializer = new JsonReportSerializer();

    const serialized = serializer.serialize(report);
    const parsed = JSON.parse(serialized) as ExperimentReport;

    expect(parsed.metadata).toEqual(report.metadata);
  });

  it("preserves experiment configuration", () => {
    const serializer = new JsonReportSerializer();

    const serialized = serializer.serialize(report);
    const parsed = JSON.parse(serialized) as ExperimentReport;

    expect(parsed.configuration).toEqual(report.configuration);
  });

  it("preserves report statistics", () => {
    const serializer = new JsonReportSerializer();

    const serialized = serializer.serialize(report);
    const parsed = JSON.parse(serialized) as ExperimentReport;

    expect(parsed.statistics).toEqual(report.statistics);
  });

  it("does not mutate the report", () => {
    const serializer = new JsonReportSerializer();
    const originalReport = structuredClone(report);

    serializer.serialize(report, {
      pretty: true,
    });

    expect(report).toEqual(originalReport);
  });

  it("serializes a report with an empty ranking", () => {
    const serializer = new JsonReportSerializer();

    const emptyReport: ExperimentReport = {
      ...report,
      statistics: {
        totalPlacements: 0,
        evaluatedPlacements: 0,
        rejectedPlacements: 0,
        rankedPlacements: 0,
      },
      ranking: {
        entries: [],
        appliedCriteria: report.ranking.appliedCriteria,
        totalResultCount: 0,
      },
    };

    const serialized = serializer.serialize(emptyReport);
    const parsed = JSON.parse(serialized) as ExperimentReport;

    expect(parsed.ranking.entries).toEqual([]);
    expect(parsed.ranking.totalResultCount).toBe(0);
  });

  it("omits optional engine version when it is absent", () => {
    const serializer = new JsonReportSerializer();

    const reportWithoutEngineVersion: ExperimentReport = {
      ...report,
      metadata: {
        experimentId: "experiment-001",
        createdAt: "2026-07-17T08:00:00.000Z",
        generatedAt: "2026-07-17T08:00:01.000Z",
        runtimeMs: 125,
      },
    };

    const serialized = serializer.serialize(
      reportWithoutEngineVersion,
    );
    const parsed = JSON.parse(serialized) as ExperimentReport;

    expect(parsed.metadata.engineVersion).toBeUndefined();
    expect(serialized).not.toContain("engineVersion");
  });
});