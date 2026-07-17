import type { ExperimentReport } from "./report-types.js";
export interface JsonReportSerializerOptions {
    readonly pretty?: boolean;
}
export declare class JsonReportSerializer {
    serialize(report: ExperimentReport, options?: JsonReportSerializerOptions): string;
}
//# sourceMappingURL=json-report-serializer.d.ts.map