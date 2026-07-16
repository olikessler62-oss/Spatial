import { SupabaseDatasetRepository } from "./supabase-dataset-repository.js";
export interface SupabaseRepositoryConfig {
    readonly url: string;
    readonly serviceRoleKey: string;
}
export declare function createSupabaseDatasetRepository(config: SupabaseRepositoryConfig): SupabaseDatasetRepository;
//# sourceMappingURL=create-supabase-dataset-repository.d.ts.map