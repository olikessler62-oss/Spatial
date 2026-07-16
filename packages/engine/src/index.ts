export type { ParsedDraw } from "./domain/parsed-draw.js";
export type {
  LotteryRuleSet,
  NumberPoolRule,
} from "./domain/lottery-rule-set.js";

export { CsvImportError } from "./import/csv-import-error.js";
export {
  CsvParser,
  type CsvParserOptions,
} from "./import/csv-parser.js";
export {
  CsvImportService,
  type CsvImportServiceDependencies,
} from "./import/csv-import-service.js";
export type {
  ImportReport,
  RejectedDraw,
} from "./import/import-report.js";
export {
  DuplicateDetector,
  type DuplicateGroup,
} from "./import/duplicate-detector.js";
export {
  persistImportReport,
  type PersistImportReportCommand,
} from "./import/persist-import-report.js";

export {
  DrawValidator,
  type ValidationIssue,
} from "./validation/draw-validator.js";

export type {
  DatasetRepository,
  PersistDatasetVersionCommand,
  PersistedDatasetVersion,
} from "./repositories/dataset-repository.js";
export { RepositoryError } from "./repositories/repository-error.js";

export { SupabaseDatasetRepository } from "./supabase/supabase-dataset-repository.js";
export {
  createSupabaseDatasetRepository,
  type SupabaseRepositoryConfig,
} from "./supabase/create-supabase-dataset-repository.js";
export type { Database } from "./supabase/database.types.js";

export type {
  RelativePosition,
  ShapeDefinition,
  ResolvedShapePosition,
  ShapePlacement,
  ShapeResolver,
} from "./domain/shape.js";

export { ShapeError } from "./shape/shape-error.js";
export { CartesianShapeResolver } from "./shape/cartesian-shape-resolver.js";
export { ShapePlacementGenerator } from "./shape/shape-placement-generator.js";

export { BitMask } from "./indexing/bit-mask.js";

export { LayoutPositionIndex } from "./indexing/layout-position-index.js";

export {
  PlacementIndexer,
  type IndexedPlacement,
} from "./indexing/placement-indexer.js";

export {
  DrawIndexer,
  type IndexedDraw,
} from "./indexing/draw-indexer.js";

export type {
  ExperimentInput,
  ExperimentExecutionResult,
  PlacementDrawResult,
  PlacementExperimentSummary,
} from "./domain/experiment.js";

export { HitEvaluator } from "./experiment/hit-evaluator.js";

export {
  ExperimentRunner,
  type ExperimentRunnerDependencies,
} from "./experiment/experiment-runner.js";

export {
  SyntheticDrawGenerator,
  type SyntheticDrawGeneratorOptions,
} from "./benchmark/synthetic-draw-generator.js";

export {
  ExperimentBenchmark,
  type ExperimentBenchmarkInput,
  type ExperimentBenchmarkResult,
} from "./benchmark/experiment-benchmark.js";
