import type { CurrentShapePersistenceEntry } from "../persistence/current-shape-persistence-result.js";
import type { HistoricalShapeRunStatistics } from "../statistics/historical-shape-run-result.js";
import type { ShapeOverdueEvaluationConfiguration } from "./shape-overdue-types.js";

export interface ShapeOverdueEvaluationRequest {
  readonly current: CurrentShapePersistenceEntry;
  readonly historical: HistoricalShapeRunStatistics;
  /** Layout context of the current persistence analysis. */
  readonly layoutKey: string;
  readonly configuration: ShapeOverdueEvaluationConfiguration;
}

export interface ShapeOverdueBatchEntry {
  readonly current: CurrentShapePersistenceEntry;
  readonly historical: HistoricalShapeRunStatistics;
  readonly layoutKey: string;
}

export interface ShapeOverdueBatchRequest {
  readonly entries: readonly ShapeOverdueBatchEntry[];
  readonly configuration: ShapeOverdueEvaluationConfiguration;
}
