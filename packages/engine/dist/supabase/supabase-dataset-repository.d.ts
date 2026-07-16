import type { SupabaseClient } from "@supabase/supabase-js";
import type { DatasetRepository, PersistDatasetVersionCommand, PersistedDatasetVersion } from "../repositories/dataset-repository.js";
import type { Database } from "./database.types.js";
export declare class SupabaseDatasetRepository implements DatasetRepository {
    private readonly client;
    constructor(client: SupabaseClient<Database>);
    persistVersion(command: PersistDatasetVersionCommand): Promise<PersistedDatasetVersion>;
}
//# sourceMappingURL=supabase-dataset-repository.d.ts.map