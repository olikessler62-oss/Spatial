import type { ExperimentReport, ExperimentReportRanking } from "./report-types.js";
export interface CsvRankingExporterOptions {
    readonly limit?: number;
}
export declare class CsvRankingExporter {
    export(report: ExperimentReport, options?: CsvRankingExporterOptions): string;
    exportRanking(ranking: ExperimentReportRanking, options?: CsvRankingExporterOptions): string;
    private escapeCell;
}
//# sourceMappingURL=csv-ranking-exporter.d.ts.map