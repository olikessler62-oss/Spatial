import type { ShapeAnalysisEvent } from "../domain/analysis-event.js";
import type { ShapeEvolutionGraph } from "../domain/evolution-graph.js";
import type { ShapeGeometry, ShapeType } from "../domain/geometry.js";
import type {
  ShapeCardOccurrence,
  ShapeTerminationReason,
  TrackedShapeStatus,
} from "../domain/tracked-shape.js";

export interface CurrentShapePersistenceEntry {
  readonly shapeId: string;
  readonly shapeType: ShapeType;
  readonly geometry: ShapeGeometry;
  readonly geometryKey: string;
  readonly discoveredAtCardId: string;
  readonly discoveredAtSequenceIndex: number;
  readonly previousCardCount: number;
  readonly coveredCardCount: number;
  /** Free streak from newest leftward, including the newest card. */
  readonly streakIncludingNewest: number;
  /** Same streak without counting the newest card (usually A − 1). */
  readonly streakExcludingNewest: number;
  readonly status: TrackedShapeStatus;
  readonly isCompleteRun: boolean;
  readonly terminationReason?: ShapeTerminationReason;
  readonly parentIds: readonly string[];
  readonly childIds: readonly string[];
  readonly occurrenceCardIds: readonly string[];
}

export interface CurrentShapePersistenceMetadata {
  readonly rowCount: number;
  readonly columnCount: number;
  readonly suppliedCardCount: number;
  readonly analyzedCardCount: number;
  readonly ignoredNewerCardCount: number;
  readonly rootShapeCount: number;
  readonly totalShapeCount: number;
  readonly splitCount: number;
  readonly terminatedShapeCount: number;
  readonly boundaryShapeCount: number;
  readonly reachedAnalysisBoundary: boolean;
  readonly startedAt: Date;
  readonly completedAt: Date;
}

export interface CurrentShapePersistenceResult {
  readonly selectedCardId: string;
  /** Selected card (newest / last draw) → older cards ascending to that selection. */
  readonly analyzedCardIds: readonly string[];
  readonly graph: ShapeEvolutionGraph;
  /**
   * Unique maximal rectangles from lookback intersections (L ≥ 3), each with
   * its true free streak from newest leftward. Nested blocks are independent.
   */
  readonly shapes: readonly CurrentShapePersistenceEntry[];
  readonly occurrences: readonly ShapeCardOccurrence[];
  readonly events: readonly ShapeAnalysisEvent[];
  /**
   * Shapes whose free streak ended before the oldest analyzed card
   * (`startCardId` = oldest free, `endCardId` = newest / selected).
   */
  readonly completedRuns: readonly CompletedRectangleRun[];
  readonly metadata: CurrentShapePersistenceMetadata;
}

export interface CompletedRectangleRun {
  readonly shapeId: string;
  readonly shapeType: ShapeType;
  readonly geometry: ShapeGeometry;
  readonly geometryKey: string;
  /** Chronologically oldest free card in the series. */
  readonly startCardId: string;
  readonly startCardIndex: number;
  /** Newest card (end of streak). */
  readonly endCardId: string;
  readonly endCardIndex: number;
  readonly runLength: number;
  /** Free cards, chronological ascending. */
  readonly occurrenceCardIds: readonly string[];
  /** Older card that broke the streak. */
  readonly terminationCardId?: string;
  readonly terminationCardIndex?: number;
}
