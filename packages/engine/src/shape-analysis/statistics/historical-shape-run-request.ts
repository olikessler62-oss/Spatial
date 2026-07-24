import type { ShapeAnalysisCard } from "../domain/analysis-card.js";
import type { ShapeGeometry, ShapeType } from "../domain/geometry.js";
import type { ShapeAnalyzerRegistry } from "../detection/shape-detector-registry.js";
import type { IdGenerator } from "../domain/analysis-request.js";
import type { HistoricalShapeRunOptions } from "./shape-run.js";

export interface HistoricalShapeRunRequest<
  TGeometry extends ShapeGeometry = ShapeGeometry,
> {
  readonly shapeType: ShapeType;
  readonly geometry: TGeometry;
  /** Historical cards in any order; engine sorts ascending. */
  readonly cards: readonly ShapeAnalysisCard[];
  readonly layoutKey: string;
  readonly options?: HistoricalShapeRunOptions;
}

export interface HistoricalShapeTarget {
  readonly shapeType: ShapeType;
  readonly geometry: ShapeGeometry;
  readonly layoutKey: string;
}

export interface HistoricalShapeRunBatchRequest {
  readonly shapes: readonly HistoricalShapeTarget[];
  readonly cards: readonly ShapeAnalysisCard[];
  readonly options?: HistoricalShapeRunOptions;
}

export interface HistoricalShapeRunAnalyzerDependencies {
  readonly detectorRegistry: ShapeAnalyzerRegistry;
  readonly idGenerator: IdGenerator;
}
