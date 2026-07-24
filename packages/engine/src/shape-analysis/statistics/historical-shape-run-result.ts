import type { ShapeStatisticsKey } from "../domain/shape-statistics-key.js";
import type {
  CensoredRunSummary,
  HistoricalRunDataQuality,
  RunLengthFrequencyEntry,
  RunLengthMode,
  RunLengthQuantiles,
  RunLengthSurvivalEntry,
  ShapeRun,
} from "./shape-run.js";

export interface HistoricalShapeRunStatistics {
  readonly key: ShapeStatisticsKey;
  readonly analyzedCardCount: number;
  readonly runs: readonly ShapeRun[];
  readonly completedRuns: readonly ShapeRun[];
  readonly censoredRuns: readonly ShapeRun[];
  readonly completedRunCount: number;
  readonly censoredRunCount: number;
  readonly frequencyDistribution: readonly RunLengthFrequencyEntry[];
  readonly survivalDistribution: readonly RunLengthSurvivalEntry[];
  readonly mode: RunLengthMode | null;
  readonly minimumRunLength: number | null;
  readonly maximumRunLength: number | null;
  readonly averageRunLength: number | null;
  readonly medianRunLength: number | null;
  readonly quantiles: RunLengthQuantiles;
  readonly dataQuality: HistoricalRunDataQuality;
  readonly censoredSummary?: CensoredRunSummary;
}

export interface HistoricalShapeBatchMetadata {
  readonly suppliedTargetCount: number;
  readonly uniqueTargetCount: number;
  readonly analyzedCardCount: number;
}

export interface HistoricalShapeRunBatchResult {
  readonly results: readonly HistoricalShapeRunStatistics[];
  readonly metadata: HistoricalShapeBatchMetadata;
}
