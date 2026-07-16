import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DatasetRepository,
  PersistDatasetVersionCommand,
  PersistedDatasetVersion,
} from "../repositories/dataset-repository.js";
import { RepositoryError } from "../repositories/repository-error.js";
import type { Database } from "./database.types.js";

interface ImportDatasetVersionRow {
  readonly dataset_version_id: string;
  readonly version: number;
  readonly event_count: number;
  readonly date_from: string | null;
  readonly date_to: string | null;
  readonly status: "validated";
}

export class SupabaseDatasetRepository implements DatasetRepository {
  public constructor(
    private readonly client: SupabaseClient<Database>,
  ) {}

  public async persistVersion(
    command: PersistDatasetVersionCommand,
  ): Promise<PersistedDatasetVersion> {
    if (command.draws.length === 0) {
      throw new RepositoryError(
        "A DatasetVersion cannot be persisted without accepted draws.",
        "EMPTY_DATASET_VERSION",
      );
    }

    const payload = command.draws.map((draw) => ({
      draw_date: draw.drawDate,
      main_numbers: [...draw.mainNumbers],
      bonus_numbers: [...draw.bonusNumbers],
      external_id: draw.externalId ?? null,
      source_row: draw.sourceRow,
    }));

    const { data, error } = await this.client.rpc(
      "import_dataset_version",
      {
        p_dataset_id: command.datasetId,
        p_rule_set_id: command.ruleSetId,
        p_content_hash: command.contentHash,
        p_draws: payload,
      },
    );

    if (error) {
      throw new RepositoryError(
        `Supabase rejected the DatasetVersion: ${error.message}`,
        error.code,
        { cause: error },
      );
    }

    const row = (data as ImportDatasetVersionRow[] | null)?.[0];
    if (!row) {
      throw new RepositoryError(
        "Supabase returned no DatasetVersion after import.",
        "EMPTY_RPC_RESULT",
      );
    }

    return {
      datasetVersionId: row.dataset_version_id,
      version: row.version,
      eventCount: row.event_count,
      dateFrom: row.date_from,
      dateTo: row.date_to,
      status: row.status,
    };
  }
}
