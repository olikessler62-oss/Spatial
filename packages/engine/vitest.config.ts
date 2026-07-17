import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(
  new URL(".", import.meta.url),
);

export default defineConfig({
  root,

  test: {
    coverage: {
      provider: "v8",

      reporter: [
        "text",
        "html",
        "json-summary",
      ],

      reportsDirectory: "./coverage",

      include: [
        "src/**/*.ts",
      ],

      exclude: [
        "src/benchmark/**",
        "src/cli/**",
        "src/domain/**",
        "src/index.ts",
        "src/**/database.types.ts",
        "src/repositories/dataset-repository.ts",
        "src/analysis/metrics/metric.ts",
      ],
    },
  },
});