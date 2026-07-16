import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CsvImportService } from "../import/csv-import-service.js";
import { DuplicateDetector } from "../import/duplicate-detector.js";
import { persistImportReport } from "../import/persist-import-report.js";
import type { LotteryRuleSet } from "../domain/lottery-rule-set.js";
import { createSupabaseDatasetRepository } from "../supabase/create-supabase-dataset-repository.js";

const SEEDED_DATASET_ID = "33333333-3333-4333-8333-333333333333";
const SEEDED_RULE_SET_ID = "22222222-2222-4222-8222-222222222222";

interface CliOptions {
  readonly file: string;
  readonly datasetId: string;
  readonly ruleSetId: string;
  readonly delimiter: string;
  readonly numberSeparator: string;
  readonly mainMinimum: number;
  readonly mainMaximum: number;
  readonly mainCount: number;
  readonly bonusMinimum: number;
  readonly bonusMaximum: number;
  readonly bonusCount: number;
}

function getArgument(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((argument) => argument.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) {
    return process.argv[index + 1];
  }

  return undefined;
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env and configure it.`,
    );
  }
  return value;
}

function integerArgument(name: string, fallback: number): number {
  const raw = getArgument(name);
  if (raw === undefined) {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error(`--${name} must be an integer.`);
  }
  return value;
}

function parseOptions(): CliOptions {
  const file = getArgument("file");
  if (!file) {
    throw new Error(
      "Missing --file. Example: npm run import:csv -- --file ../../datasets/samples/lotto-6aus49.csv",
    );
  }

  return {
    file,
    datasetId:
      getArgument("dataset-id")
      ?? process.env.SPATIAL_DATASET_ID
      ?? SEEDED_DATASET_ID,
    ruleSetId:
      getArgument("rule-set-id")
      ?? process.env.SPATIAL_RULE_SET_ID
      ?? SEEDED_RULE_SET_ID,
    delimiter: getArgument("delimiter") ?? ",",
    numberSeparator: getArgument("number-separator") ?? " ",
    mainMinimum: integerArgument("main-min", 1),
    mainMaximum: integerArgument("main-max", 49),
    mainCount: integerArgument("main-count", 6),
    bonusMinimum: integerArgument("bonus-min", 0),
    bonusMaximum: integerArgument("bonus-max", 9),
    bonusCount: integerArgument("bonus-count", 1),
  };
}

function printRejectedRows(
  rejectedDraws: readonly {
    readonly draw: { readonly sourceRow: number };
    readonly issues: readonly { readonly code: string; readonly message: string }[];
  }[],
): void {
  for (const rejected of rejectedDraws) {
    console.error(`Row ${rejected.draw.sourceRow}:`);
    for (const issue of rejected.issues) {
      console.error(`  - ${issue.code}: ${issue.message}`);
    }
  }
}

async function main(): Promise<void> {
  const options = parseOptions();
  const absoluteFile = resolve(process.cwd(), options.file);
  const csv = await readFile(absoluteFile, "utf8");
  const contentHash = `sha256:${createHash("sha256").update(csv).digest("hex")}`;

  const rules: LotteryRuleSet = {
    mainNumbers: {
      minimum: options.mainMinimum,
      maximum: options.mainMaximum,
      count: options.mainCount,
    },
    bonusNumbers: {
      minimum: options.bonusMinimum,
      maximum: options.bonusMaximum,
      count: options.bonusCount,
    },
  };

  const report = new CsvImportService().import(csv, rules, {
    externalIdColumn: "external_id",
    delimiter: options.delimiter,
    numberSeparator: options.numberSeparator,
  });

  const duplicates = new DuplicateDetector().find(report.acceptedDraws);
  if (duplicates.length > 0) {
    console.error("Duplicate accepted draws detected:");
    for (const duplicate of duplicates) {
      console.error(`  - rows ${duplicate.rows.join(", ")}: ${duplicate.key}`);
    }
    process.exitCode = 2;
    return;
  }

  if (report.rejectedRows > 0) {
    console.error(
      `Import rejected: ${report.rejectedRows} of ${report.receivedRows} rows are invalid.`,
    );
    printRejectedRows(report.rejectedDraws);
    process.exitCode = 2;
    return;
  }

  const repository = createSupabaseDatasetRepository({
    url: requiredEnvironment("SUPABASE_URL"),
    serviceRoleKey: requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
  });

  const persisted = await persistImportReport(repository, {
    datasetId: options.datasetId,
    ruleSetId: options.ruleSetId,
    contentHash,
    report,
  });

  console.log(JSON.stringify({
    file: absoluteFile,
    contentHash,
    receivedRows: report.receivedRows,
    datasetVersion: persisted,
  }, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Import failed: ${message}`);
  process.exitCode = 1;
});
