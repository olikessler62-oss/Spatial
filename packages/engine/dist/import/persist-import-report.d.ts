import type { ImportReport } from "./import-report.js";
import type { DatasetRepository, PersistedDatasetVersion } from "../repositories/dataset-repository.js";
export interface PersistImportReportCommand {
    readonly datasetId: string;
    readonly ruleSetId: string;
    readonly contentHash: string;
    readonly report: ImportReport;
}
export declare function persistImportReport(repository: DatasetRepository, command: PersistImportReportCommand): Promise<PersistedDatasetVersion>;
//# sourceMappingURL=persist-import-report.d.ts.map