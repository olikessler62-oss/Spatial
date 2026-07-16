import { createClient } from "@supabase/supabase-js";
import { SupabaseDatasetRepository } from "./supabase-dataset-repository.js";
import type { Database } from "./database.types.js";

export interface SupabaseRepositoryConfig {
  readonly url: string;
  readonly serviceRoleKey: string;
}

export function createSupabaseDatasetRepository(
  config: SupabaseRepositoryConfig,
): SupabaseDatasetRepository {
  if (!config.url.trim()) {
    throw new Error("Supabase URL is required.");
  }

  if (!config.serviceRoleKey.trim()) {
    throw new Error("Supabase service-role key is required.");
  }

  const client = createClient<Database>(
    config.url,
    config.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return new SupabaseDatasetRepository(client);
}
