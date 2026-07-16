import type { ParsedDraw } from "../domain/parsed-draw.js";

export interface PersistDatasetVersionCommand {
  readonly datasetId: string;
  readonly ruleSetId: string;
  readonly contentHash: string;
  readonly draws: readonly ParsedDraw[];
}

export interface PersistedDatasetVersion {
  readonly datasetVersionId: string;
  readonly version: number;
  readonly eventCount: number;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly status: "validated";
}

export interface DatasetRepository {
  persistVersion(
    command: PersistDatasetVersionCommand,
  ): Promise<PersistedDatasetVersion>;
}
