import { RepositoryError } from "../repositories/repository-error.js";
export class SupabaseDatasetRepository {
    client;
    constructor(client) {
        this.client = client;
    }
    async persistVersion(command) {
        if (command.draws.length === 0) {
            throw new RepositoryError("A DatasetVersion cannot be persisted without accepted draws.", "EMPTY_DATASET_VERSION");
        }
        const payload = command.draws.map((draw) => ({
            draw_date: draw.drawDate,
            main_numbers: [...draw.mainNumbers],
            bonus_numbers: [...draw.bonusNumbers],
            external_id: draw.externalId ?? null,
            source_row: draw.sourceRow,
            ...(draw.ruleSetId ? { rule_set_id: draw.ruleSetId } : {}),
        }));
        const { data, error } = await this.client.rpc("import_dataset_version", {
            p_dataset_id: command.datasetId,
            p_rule_set_id: command.ruleSetId,
            p_content_hash: command.contentHash,
            p_draws: payload,
        });
        if (error) {
            throw new RepositoryError(`Supabase rejected the DatasetVersion: ${error.message}`, error.code, { cause: error });
        }
        const row = data?.[0];
        if (!row) {
            throw new RepositoryError("Supabase returned no DatasetVersion after import.", "EMPTY_RPC_RESULT");
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
//# sourceMappingURL=supabase-dataset-repository.js.map