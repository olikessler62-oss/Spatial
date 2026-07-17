import { describe, expect, it, vi } from "vitest";
import { persistImportReport } from "../../src/import/persist-import-report.js";
import type { DatasetRepository } from "../../src/repositories/dataset-repository.js";

describe("persistImportReport", () => {
  it("persists a fully accepted report", async () => {
    const persistVersion = vi.fn().mockResolvedValue({
      datasetVersionId: "version-id",
      version: 1,
      eventCount: 1,
      dateFrom: "2026-07-15",
      dateTo: "2026-07-15",
      status: "validated",
    });

    const repository: DatasetRepository = { persistVersion };

    const result = await persistImportReport(repository, {
      datasetId: "dataset-id",
      ruleSetId: "rule-set-id",
      contentHash: "sha256:example",
      report: {
        receivedRows: 1,
        acceptedRows: 1,
        rejectedRows: 0,
        acceptedDraws: [{
          drawDate: "2026-07-15",
          mainNumbers: [1, 8, 17, 24, 33, 49],
          bonusNumbers: [7],
          sourceRow: 2,
        }],
        rejectedDraws: [],
      },
    });

    expect(result.datasetVersionId).toBe("version-id");
    expect(persistVersion).toHaveBeenCalledOnce();
  });

  it("does not persist a report containing rejected rows", async () => {
    const repository: DatasetRepository = {
      persistVersion: vi.fn(),
    };

    await expect(persistImportReport(repository, {
      datasetId: "dataset-id",
      ruleSetId: "rule-set-id",
      contentHash: "sha256:example",
      report: {
        receivedRows: 1,
        acceptedRows: 0,
        rejectedRows: 1,
        acceptedDraws: [],
        rejectedDraws: [{
          draw: {
            drawDate: "2026-07-15",
            mainNumbers: [1, 1, 17, 24, 33, 50],
            bonusNumbers: [7],
            sourceRow: 2,
          },
          issues: [{
            code: "MAIN_DUPLICATE",
            message: "main numbers must be unique.",
            sourceRow: 2,
          }],
        }],
      },
    })).rejects.toThrow("contains rejected rows");
  });
});

