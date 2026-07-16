/**
 * Minimal database types for Spatial Engine v0.4.
 *
 * Replace with generated types later:
 * npx supabase gen types typescript --linked --schema public,core,analysis,api
 */
export interface Database {
    public: {
        Tables: Record<string, never>;
        Views: Record<string, never>;
        Functions: {
            import_dataset_version: {
                Args: {
                    p_dataset_id: string;
                    p_rule_set_id: string;
                    p_content_hash: string;
                    p_draws: unknown;
                };
                Returns: {
                    dataset_version_id: string;
                    version: number;
                    event_count: number;
                    date_from: string | null;
                    date_to: string | null;
                    status: "validated";
                }[];
            };
        };
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}
//# sourceMappingURL=database.types.d.ts.map