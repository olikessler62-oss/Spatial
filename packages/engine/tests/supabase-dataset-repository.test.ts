import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseDatasetRepository } from "../src/supabase/supabase-dataset-repository.js";
import type { Database } from "../src/supabase/database.types.js";

describe("SupabaseDatasetRepository", () => {
  it("persists accepted draws through the public RPC wrapper", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{
        dataset_version_id: "version-id",
        version: 3,
        event_count: 1,
        date_from: "2026-07-15",
        date_to: "2026-07-15",
        status: "validated",
      }],
      error: null,
    });

    const client = { rpc } as unknown as SupabaseClient<Database>;
    const repository = new SupabaseDatasetRepository(client);

    const result = await repository.persistVersion({
      datasetId: "dataset-id",
      ruleSetId: "rule-set-id",
      contentHash: "sha256:example",
      draws: [{
        drawDate: "2026-07-15",
        mainNumbers: [1, 8, 17, 24, 33, 49],
        bonusNumbers: [7],
        externalId: "draw-001",
        sourceRow: 2,
      }],
    });

    expect(rpc).toHaveBeenCalledWith("import_dataset_version", {
      p_dataset_id: "dataset-id",
      p_rule_set_id: "rule-set-id",
      p_content_hash: "sha256:example",
      p_draws: [{
        draw_date: "2026-07-15",
        main_numbers: [1, 8, 17, 24, 33, 49],
        bonus_numbers: [7],
        external_id: "draw-001",
        source_row: 2,
      }],
    });
    expect(result.version).toBe(3);
  });

  it("rejects empty DatasetVersions before calling Supabase", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient<Database>;
    const repository = new SupabaseDatasetRepository(client);

    await expect(repository.persistVersion({
      datasetId: "dataset-id",
      ruleSetId: "rule-set-id",
      contentHash: "sha256:empty",
      draws: [],
    })).rejects.toMatchObject({
      code: "EMPTY_DATASET_VERSION",
    });

    expect(rpc).not.toHaveBeenCalled();
  });
});
