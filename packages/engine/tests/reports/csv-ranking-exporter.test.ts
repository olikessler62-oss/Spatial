import { describe, expect, it } from "vitest";

import { CsvRankingExporter } from "../../src/reports/csv-ranking-exporter.js";
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
    },
  },
  statistics: {
    totalPlacements: 2,
    evaluatedPlacements: 2,
    rejectedPlacements: 0,
    rankedPlacements: 2,
  },
  ranking: {
    totalResultCount: 2,
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
  },
};

describe("CsvRankingExporter", () => {
  it("exports ranking as CSV", () => {
    const exporter = new CsvRankingExporter();

    const csv = exporter.export(report);

    expect(csv).toContain("rank,resultId,score");
    expect(csv).toContain("placement-b");
    expect(csv).toContain("placement-a");
  });

  it("exports exactly one header row", () => {
    const exporter = new CsvRankingExporter();

    const lines = exporter.export(report).split("\n");

    expect(lines[0]).toContain("rank");
    expect(lines).toHaveLength(3);
  });

  it("exports entries in ranking order", () => {
    const exporter = new CsvRankingExporter();

    const lines = exporter.export(report).split("\n");

    expect(lines[1]).toContain("placement-b");
    expect(lines[2]).toContain("placement-a");
  });

  it("exports every configured metric", () => {
    const exporter = new CsvRankingExporter();

    const csv = exporter.export(report);

    expect(csv).toContain("average-hit.rawValue");
    expect(csv).toContain("max-hit.rawValue");
    expect(csv).toContain("average-hit.contribution");
    expect(csv).toContain("max-hit.contribution");
  });

  it("exports raw metric values", () => {
    const exporter = new CsvRankingExporter();

    const lines = exporter.export(report).split("\n");

    expect(lines[1]).toBe(
      "1,placement-b,0.75,5,1,0.75,0.75,8,0,0.25,0",
    );
    expect(lines[2]).toBe(
      "2,placement-a,0.25,3,0,0.75,0,10,1,0.25,0.25",
    );
  });

  it("limits exported entries", () => {
    const exporter = new CsvRankingExporter();

    const csv = exporter.export(report, {
      limit: 1,
    });

    const lines = csv.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("placement-b");
  });

  it("exports all entries when no limit is specified", () => {
    const exporter = new CsvRankingExporter();

    const csv = exporter.export(report);

    expect(csv.split("\n")).toHaveLength(3);
  });

  it("exports an empty ranking", () => {
    const exporter = new CsvRankingExporter();

    const csv = exporter.export({
      ...report,
      ranking: {
        entries: [],
        appliedCriteria: report.ranking.appliedCriteria,
        totalResultCount: 0,
      },
    });

    expect(csv.split("\n")).toHaveLength(1);
  });

  it("escapes commas", () => {
    const exporter = new CsvRankingExporter();

    const csv = exporter.export({
      ...report,
      ranking: {
        ...report.ranking,
        entries: [
          {
            ...report.ranking.entries[0],
            resultId: "placement,1",
          },
        ],
      },
    });

    expect(csv).toContain("\"placement,1\"");
  });

  it("escapes quotes", () => {
    const exporter = new CsvRankingExporter();

    const csv = exporter.export({
      ...report,
      ranking: {
        ...report.ranking,
        entries: [
          {
            ...report.ranking.entries[0],
            resultId: "placement\"1",
          },
        ],
      },
    });

    expect(csv).toContain("\"placement\"\"1\"");
  });

  it("does not mutate the report", () => {
    const exporter = new CsvRankingExporter();

    const original = structuredClone(report);

    exporter.export(report);

    expect(report).toEqual(original);
  });

  it("exports directly from a ranking section", () => {
    const exporter = new CsvRankingExporter();

    const csv = exporter.exportRanking(report.ranking);

    expect(csv).toContain("placement-b");
    expect(csv).toContain("placement-a");
  });
});