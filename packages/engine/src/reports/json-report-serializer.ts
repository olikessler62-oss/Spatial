import type { ExperimentReport } from "./report-types.js";

export interface JsonReportSerializerOptions {
  readonly pretty?: boolean;
}

export class JsonReportSerializer {
  public serialize(
    report: ExperimentReport,
    options: JsonReportSerializerOptions = {},
  ): string {
    return JSON.stringify(
      report,
      null,
      options.pretty === true ? 2 : undefined,
    );
  }
}