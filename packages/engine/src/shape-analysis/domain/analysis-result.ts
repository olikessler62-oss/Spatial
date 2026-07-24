import type { ShapeAnalysisEvent } from "./analysis-event.js";
import type { ShapeEvolutionGraph } from "./evolution-graph.js";
import type { ShapeCardOccurrence } from "./tracked-shape.js";

export interface ShapeAnalysisMetadata {
  readonly rowCount: number;
  readonly columnCount: number;
  readonly requestedCardCount: number;
  readonly analyzedCardCount: number;
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly reachedAnalysisBoundary: boolean;
}

export interface ShapeAnalysisResult {
  readonly selectedCardId: string;
  readonly analyzedCardIds: readonly string[];
  readonly graph: ShapeEvolutionGraph;
  readonly occurrences: readonly ShapeCardOccurrence[];
  readonly events: readonly ShapeAnalysisEvent[];
  readonly metadata: ShapeAnalysisMetadata;
}
