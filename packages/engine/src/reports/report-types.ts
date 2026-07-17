import type {
  RankedResult,
  RankingCriterion,
} from "../ranking/ranking-types.js";

export interface ExperimentReportMetadata {
  readonly experimentId: string;
  readonly createdAt: string;
  readonly generatedAt: string;
  readonly runtimeMs: number;
  readonly engineVersion?: string;
}

export interface ExperimentReportConfiguration {
  readonly layout: Readonly<Record<string, unknown>>;
  readonly placementGenerator: Readonly<Record<string, unknown>>;
  readonly metrics: readonly Readonly<Record<string, unknown>>[];
  readonly ranking: {
    readonly criteria: readonly RankingCriterion[];
    readonly limit?: number;
  };
}

export interface ExperimentReportStatistics {
  readonly totalPlacements: number;
  readonly evaluatedPlacements: number;
  readonly rejectedPlacements: number;
  readonly rankedPlacements: number;
}

export interface ExperimentReportRanking {
  readonly entries: readonly RankedResult[];
  readonly appliedCriteria: readonly RankingCriterion[];
  readonly totalResultCount: number;
}

export interface ExperimentReport {
  readonly metadata: ExperimentReportMetadata;
  readonly configuration: ExperimentReportConfiguration;
  readonly statistics: ExperimentReportStatistics;
  readonly ranking: ExperimentReportRanking;
}

export interface ExperimentReportInput {
  readonly metadata: {
    readonly experimentId: string;
    readonly createdAt: string;
    readonly runtimeMs: number;
    readonly engineVersion?: string;
  };
  readonly configuration: ExperimentReportConfiguration;
  readonly statistics: {
    readonly totalPlacements: number;
    readonly evaluatedPlacements: number;
    readonly rejectedPlacements?: number;
  };
  readonly ranking: ExperimentReportRanking;
  readonly generatedAt?: string;
}