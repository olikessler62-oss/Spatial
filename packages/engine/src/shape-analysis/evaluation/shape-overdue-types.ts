export type ShapeOverdueClassification =
  | "insufficient-data"
  | "typical"
  | "elevated"
  | "rare"
  | "extreme"
  | "historical-maximum-matched"
  | "historical-maximum-exceeded";

export interface ShapeOverdueEvaluationConfiguration {
  readonly minimumCompletedRunCount: number;
  /** Fraction 0–1 of historical runs shorter than current. */
  readonly elevatedPercentileThreshold: number;
  readonly rarePercentileThreshold: number;
  readonly extremePercentileThreshold: number;
  readonly compareAgainstMode: boolean;
  readonly compareAgainstMedian: boolean;
  readonly compareAgainstMaximum: boolean;
  readonly useCompletedRunsOnly: boolean;
}

export const DEFAULT_SHAPE_OVERDUE_EVALUATION_CONFIGURATION: ShapeOverdueEvaluationConfiguration =
  {
    minimumCompletedRunCount: 10,
    elevatedPercentileThreshold: 0.75,
    rarePercentileThreshold: 0.9,
    extremePercentileThreshold: 0.95,
    compareAgainstMode: true,
    compareAgainstMedian: true,
    compareAgainstMaximum: true,
    useCompletedRunsOnly: true,
  };

export type ModeRelation =
  | "below-all-modes"
  | "matches-mode"
  | "between-modes"
  | "above-all-modes";

export interface ModeComparison {
  readonly modeRunLengths: readonly number[];
  readonly modeFrequency: number;
  readonly relation: ModeRelation;
  readonly distanceToNearestMode: number | null;
}

export interface MedianComparison {
  readonly medianRunLength: number;
  readonly difference: number;
  readonly ratio: number;
}

export interface AverageComparison {
  readonly averageRunLength: number;
  readonly difference: number;
  readonly ratio: number;
}

export type MaximumRelation =
  | "below-maximum"
  | "matches-maximum"
  | "exceeds-maximum";

export interface MaximumComparison {
  readonly maximumRunLength: number;
  readonly difference: number;
  readonly relation: MaximumRelation;
}

export type ShapeOverdueReason =
  | {
      readonly code: "INSUFFICIENT_COMPLETED_RUNS";
      readonly actual: number;
      readonly required: number;
    }
  | {
      readonly code: "ABOVE_ALL_HISTORICAL_MODES";
      readonly current: number;
      readonly modes: readonly number[];
    }
  | {
      readonly code: "MATCHES_HISTORICAL_MODE";
      readonly current: number;
    }
  | {
      readonly code: "ABOVE_HISTORICAL_MEDIAN";
      readonly current: number;
      readonly median: number;
    }
  | {
      readonly code: "RARE_BY_PERCENTILE";
      readonly percentile: number;
    }
  | {
      readonly code: "MATCHES_HISTORICAL_MAXIMUM";
      readonly current: number;
    }
  | {
      readonly code: "EXCEEDS_HISTORICAL_MAXIMUM";
      readonly current: number;
      readonly maximum: number;
    }
  | {
      readonly code: "CURRENT_RUN_CENSORED";
      readonly observedLength: number;
    };

export const SHAPE_OVERDUE_DISCLAIMER_CODES = [
  "HISTORICAL_DESCRIPTION_ONLY",
  "NO_CHANGE_TO_DRAW_PROBABILITY",
] as const;
