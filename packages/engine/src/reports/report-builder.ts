import type {
  ExperimentReport,
  ExperimentReportInput,
} from "./report-types.js";

export class ReportBuilder {
  public build(input: ExperimentReportInput): ExperimentReport {
    const report: ExperimentReport = {
      metadata: {
        experimentId: input.metadata.experimentId,
        createdAt: input.metadata.createdAt,
        generatedAt:
          input.generatedAt ?? new Date().toISOString(),
        runtimeMs: input.metadata.runtimeMs,
        ...(input.metadata.engineVersion === undefined
          ? {}
          : {
              engineVersion: input.metadata.engineVersion,
            }),
      },
      configuration: this.clone(input.configuration),
      statistics: {
        totalPlacements: input.statistics.totalPlacements,
        evaluatedPlacements: input.statistics.evaluatedPlacements,
        rejectedPlacements:
          input.statistics.rejectedPlacements ?? 0,
        rankedPlacements: input.ranking.entries.length,
      },
      ranking: this.clone(input.ranking),
    };

    return this.deepFreeze(report);
  }

  private clone<T>(value: T): T {
    return structuredClone(value);
  }

  private deepFreeze<T>(value: T): T {
    if (
      value === null ||
      typeof value !== "object" ||
      Object.isFrozen(value)
    ) {
      return value;
    }

    const record = value as Record<PropertyKey, unknown>;

    for (const key of Reflect.ownKeys(record)) {
      this.deepFreeze(record[key]);
    }

    return Object.freeze(value);
  }
}