import { createClient } from "@supabase/supabase-js";
import { SupabaseDatasetRepository } from "./supabase-dataset-repository.js";
export function createSupabaseDatasetRepository(config) {
    if (!config.url.trim()) {
        throw new Error("Supabase URL is required.");
    }
    if (!config.serviceRoleKey.trim()) {
        throw new Error("Supabase service-role key is required.");
    }
    const client = createClient(config.url, config.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
    return new SupabaseDatasetRepository(client);
}
//# sourceMappingURL=create-supabase-dataset-repository.js.map