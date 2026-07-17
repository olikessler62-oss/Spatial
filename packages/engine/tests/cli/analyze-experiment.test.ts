import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(
    join(tmpdir(), "spatial-analysis-cli-"),
  );

  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(
      (directory) =>
        rm(directory, {
          recursive: true,
          force: true,
        }),
    ),
  );
});

describe("analyze-experiment CLI", () => {
  it("analyzes candidates from a JSON file", async () => {
    const directory = await createTemporaryDirectory();
    const inputFile = join(directory, "analysis.json");

    await writeFile(
  inputFile,
  JSON.stringify({
    metadata: {
      experimentId: "cli-test",
      createdAt: "2026-07-17T12:30:00.000Z",
      engineVersion: "0.5.0",
    },
    candidates: [
      {
        resultId: "candidate-a",
        experimentId: "candidate-a-run",
        placements: [
          {
            anchorValue: 1,
            indices: [1, 2, 3, 4, 5],
          },
        ],
        draws: [
          {
            drawDate: "2026-01-01",
            indices: [1, 20, 21, 22, 23],
          },
          {
            drawDate: "2026-01-02",
            indices: [1, 2, 20, 21, 22],
          },
        ],
      },
      {
        resultId: "candidate-b",
        experimentId: "candidate-b-run",
        placements: [
          {
            anchorValue: 2,
            indices: [10, 11, 12, 13, 14],
          },
        ],
        draws: [
          {
            drawDate: "2026-01-01",
            indices: [10, 11, 12, 20, 21],
          },
          {
            drawDate: "2026-01-02",
            indices: [10, 11, 12, 13, 20],
          },
        ],
      },
    ],
    configuration: {
      layout: {
        type: "test-layout",
      },
      placementGenerator: {
        type: "test-generator",
      },
      metrics: [
        {
          id: "average-hits",
        },
        {
          id: "maximum-hits",
        },
      ],
      ranking: {
        criteria: [
          {
            metricId: "average-hits",
            weight: 0.7,
            direction: "descending",
          },
          {
            metricId: "maximum-hits",
            weight: 0.3,
            direction: "descending",
          },
        ],
      },
    },
    generatedAt: "2026-07-17T12:35:00.000Z",
  }),
  "utf8",
);

    const cliFile = resolve(
      process.cwd(),
      "src/cli/analyze-experiment.ts",
    );

    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx",
        cliFile,
        "--file",
        inputFile,
      ],
      {
        cwd: process.cwd(),
      },
    );

    expect(stderr).toBe("");

    const report = JSON.parse(stdout) as {
      readonly metadata: {
        readonly experimentId: string;
      };
      readonly statistics: {
        readonly rankedPlacements: number;
      };
      readonly ranking: {
        readonly entries: readonly {
          readonly rank: number;
          readonly resultId: string;
          readonly score: number;
        }[];
      };
    };

    expect(report.metadata.experimentId).toBe("cli-test");
    expect(report.statistics.rankedPlacements).toBe(2);

    expect(report.ranking.entries).toEqual([
      expect.objectContaining({
        rank: 1,
        resultId: "candidate-b",
        score: 1,
      }),
      expect.objectContaining({
        rank: 2,
        resultId: "candidate-a",
        score: 0,
      }),
    ]);
  });

  it("fails when the file argument is missing", async () => {
    const cliFile = resolve(
      process.cwd(),
      "src/cli/analyze-experiment.ts",
    );

    await expect(
       execFileAsync(
       process.execPath,
       [
          "--import",
          "tsx",
          cliFile,
       ],
       {
         cwd: process.cwd(),
       },
       ),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining(
       "Experiment analysis failed: Missing --file.",
    ),
   });
  });

  it("fails for invalid JSON input", async () => {
    const directory = await createTemporaryDirectory();
    const inputFile = join(directory, "invalid.json");

    await writeFile(
      inputFile,
      "{ invalid json",
      "utf8",
    );

    const cliFile = resolve(
      process.cwd(),
      "src/cli/analyze-experiment.ts",
    );

    await expect(
      execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx",
          cliFile,
          "--file",
          inputFile,
        ],
        {
          cwd: process.cwd(),
        },
      ),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining(
        "Experiment analysis failed:",
      ),
    });
  });
});
