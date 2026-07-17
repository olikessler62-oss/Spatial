import type {
  ExperimentReport,
  ExperimentReportRanking,
} from "./report-types.js";

export interface CsvRankingExporterOptions {
  readonly limit?: number;
}

export class CsvRankingExporter {
  public export(
    report: ExperimentReport,
    options: CsvRankingExporterOptions = {},
  ): string {
    return this.exportRanking(report.ranking, options);
  }

  public exportRanking(
    ranking: ExperimentReportRanking,
    options: CsvRankingExporterOptions = {},
  ): string {
    const entries =
      options.limit === undefined
        ? ranking.entries
        : ranking.entries.slice(0, options.limit);

    const metricIds = ranking.appliedCriteria.map(
      (criterion) => criterion.metricId,
    );

    const header = [
      "rank",
      "resultId",
      "score",
      ...metricIds.flatMap((metricId) => [
        `${metricId}.rawValue`,
        `${metricId}.normalizedValue`,
        `${metricId}.normalizedWeight`,
        `${metricId}.contribution`,
      ]),
    ];

    const rows = entries.map((entry) => {
      const criterionByMetricId = new Map(
        entry.criteria.map((criterion) => [
          criterion.metricId,
          criterion,
        ]),
      );

      return [
        String(entry.rank),
        entry.resultId,
        String(entry.score),
        ...metricIds.flatMap((metricId) => {
          const criterion = criterionByMetricId.get(metricId);

          return [
            criterion === undefined
              ? ""
              : String(criterion.rawValue),
            criterion === undefined
              ? ""
              : String(criterion.normalizedValue),
            criterion === undefined
              ? ""
              : String(criterion.normalizedWeight),
            criterion === undefined
              ? ""
              : String(criterion.contribution),
          ];
        }),
      ];
    });

    return [header, ...rows]
      .map((row) =>
        row.map((value) => this.escapeCell(value)).join(","),
      )
      .join("\n");
  }

  private escapeCell(value: string): string {
    if (
      value.includes(",") ||
      value.includes('"') ||
      value.includes("\n") ||
      value.includes("\r")
    ) {
      return `"${value.replaceAll('"', '""')}"`;
    }

    return value;
  }
}