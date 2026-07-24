import type { ShapeAnalysisCard } from "../domain/analysis-card.js";
import type {
  IdGenerator,
  ShapeAnalysisExecutionOptions,
} from "../domain/analysis-request.js";
import type { ShapeType } from "../domain/geometry.js";
import type { ShapeAnalyzerRegistry } from "../detection/shape-detector-registry.js";

export interface CurrentShapePersistenceRequest {
  readonly selectedCardId: string;
  /** Only currently loaded cards. */
  readonly cards: readonly ShapeAnalysisCard[];
  readonly enabledShapeTypes: readonly ShapeType[];
  readonly minimumShapeCellCount: number;
  readonly executionOptions?: ShapeAnalysisExecutionOptions;
}

export interface ShapePersistenceDependencies {
  readonly detectorRegistry: ShapeAnalyzerRegistry;
  readonly idGenerator: IdGenerator;
  readonly now?: () => Date;
}
