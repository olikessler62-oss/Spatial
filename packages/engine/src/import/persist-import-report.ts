import type { ImportReport } from "./import-report.js";
import type {
  DatasetRepository,
  PersistedDatasetVersion,
} from "../repositories/dataset-repository.js";

export interface PersistImportReportCommand {
  readonly datasetId: string;
  readonly ruleSetId: string;
  readonly contentHash: string;
  readonly report: ImportReport;
}

export async function persistImportReport(
  repository: DatasetRepository,
  command: PersistImportReportCommand,
): Promise<PersistedDatasetVersion> {
  if (command.report.rejectedRows > 0) {
    throw new Error(
      "ImportReport contains rejected rows and cannot be persisted atomically.",
    );
  }

  return repository.persistVersion({
    datasetId: command.datasetId,
    ruleSetId: command.ruleSetId,
    contentHash: command.contentHash,
    draws: command.report.acceptedDraws,
  });
}
