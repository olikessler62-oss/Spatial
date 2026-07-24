import type { ShapeAnalysisCard } from "../domain/analysis-card.js";
import type { ShapeGeometry, ShapeType } from "../domain/geometry.js";
import { isRectangleGeometry } from "../domain/geometry.js";
import type { TrackedShape } from "../domain/tracked-shape.js";
import {
  createLayoutKey,
  createShapeStatisticsKey,
} from "../domain/shape-statistics-key.js";
import { createShapeGeometryKey } from "../geometry-key.js";
import { isGeometricallyValidRectangle } from "../detection/rectangle/rectangle-geometry.js";
import { validateChronology } from "../analysis-window.js";
import { validateShapeAnalysisCards } from "../validation/validate-shape-analysis-cards.js";
import { ShapeAnalysisError } from "../shape-analysis-error.js";
import type {
  HistoricalShapeRunAnalyzerDependencies,
  HistoricalShapeRunBatchRequest,
  HistoricalShapeRunRequest,
  HistoricalShapeTarget,
} from "./historical-shape-run-request.js";
import type {
  HistoricalShapeRunBatchResult,
  HistoricalShapeRunStatistics,
} from "./historical-shape-run-result.js";
import { detectShapeRuns } from "./run-detector.js";
import {
  buildFrequencyDistribution,
  buildSurvivalDistribution,
  computeAverageRunLength,
  computeMedianRunLength,
  computeRunLengthMode,
  computeRunLengthQuantiles,
  evaluateHistoricalDataQuality,
} from "./run-statistics.js";
import {
  DEFAULT_HISTORICAL_SHAPE_RUN_OPTIONS,
  type CensoredRunSummary,
  type HistoricalShapeRunOptions,
  type ShapeRun,
} from "./shape-run.js";

function stubTrackedShape(
  shapeType: ShapeType,
  geometry: ShapeGeometry,
  geometryKey: string,
): TrackedShape {
  return {
    id: "historical-probe",
    shapeType,
    geometry,
    geometryKey,
    discoveredAtCardId: "",
    discoveredAtSequenceIndex: 0,
    previousCardCount: 0,
    coveredCardCount: 1,
    status: "active",
    parentIds: [],
    childIds: [],
    lastUnchangedCardId: "",
    isCompleteRun: false,
  };
}

export class HistoricalShapeRunAnalyzer {
  public constructor(
    private readonly dependencies: HistoricalShapeRunAnalyzerDependencies,
  ) {}

  public analyze(
    request: HistoricalShapeRunRequest,
  ): HistoricalShapeRunStatistics {
    const options = this.resolveOptions(request.options);
    const cards = this.prepareCards(request.cards, request.layoutKey);
    const reference = cards[0];

    if (reference === undefined) {
      throw new ShapeAnalysisError(
        "EMPTY_CARD_SET",
        "Historical shape run analysis requires at least one card.",
      );
    }

    this.assertGeometry(request.shapeType, request.geometry, reference);
    this.assertDetector(request.shapeType);

    const geometryKey = createShapeGeometryKey(
      request.shapeType,
      request.geometry,
    );

    return this.buildStatistics({
      shapeType: request.shapeType,
      geometry: request.geometry,
      geometryKey,
      layoutKey: request.layoutKey,
      cards,
      options,
      presenceCache: new Map(),
    });
  }

  public analyzeBatch(
    request: HistoricalShapeRunBatchRequest,
  ): HistoricalShapeRunBatchResult {
    const options = this.resolveOptions(request.options);

    if (request.cards.length === 0) {
      throw new ShapeAnalysisError(
        "EMPTY_CARD_SET",
        "Historical shape run analysis requires at least one card.",
      );
    }

    const reference = request.cards[0]!;
    const layoutKey = createLayoutKey(
      reference.rowCount,
      reference.columnCount,
    );
    const cards = this.prepareCards(request.cards, layoutKey);

    if (request.shapes.length === 0) {
      return {
        results: [],
        metadata: {
          suppliedTargetCount: 0,
          uniqueTargetCount: 0,
          analyzedCardCount: cards.length,
        },
      };
    }

    const uniqueTargets = this.deduplicateTargets(request.shapes);
    const presenceCache = new Map<string, boolean>();
    const results: HistoricalShapeRunStatistics[] = [];

    for (const target of uniqueTargets) {
      if (target.layoutKey !== layoutKey) {
        throw new ShapeAnalysisError(
          "INCONSISTENT_GRID_LAYOUT",
          `Target layoutKey ${target.layoutKey} does not match cards ${layoutKey}.`,
          {
            expected: layoutKey,
            actual: target.layoutKey,
          },
        );
      }

      this.assertGeometry(target.shapeType, target.geometry, cards[0]!);
      this.assertDetector(target.shapeType);

      const geometryKey = createShapeGeometryKey(
        target.shapeType,
        target.geometry,
      );

      results.push(
        this.buildStatistics({
          shapeType: target.shapeType,
          geometry: target.geometry,
          geometryKey,
          layoutKey: target.layoutKey,
          cards,
          options,
          presenceCache,
        }),
      );
    }

    return {
      results,
      metadata: {
        suppliedTargetCount: request.shapes.length,
        uniqueTargetCount: uniqueTargets.length,
        analyzedCardCount: cards.length,
      },
    };
  }

  private buildStatistics(input: {
    readonly shapeType: ShapeType;
    readonly geometry: ShapeGeometry;
    readonly geometryKey: string;
    readonly layoutKey: string;
    readonly cards: readonly ShapeAnalysisCard[];
    readonly options: HistoricalShapeRunOptions;
    readonly presenceCache: Map<string, boolean>;
  }): HistoricalShapeRunStatistics {
    const presence = this.buildPresenceSequence(
      input.cards,
      input.shapeType,
      input.geometry,
      input.geometryKey,
      input.presenceCache,
    );

    const runs = detectShapeRuns({
      cards: input.cards,
      presence,
      nextId: () => this.dependencies.idGenerator.nextId("run"),
    });

    const completedRuns = runs.filter((run) => run.isComplete);
    const censoredRuns = runs.filter((run) => !run.isComplete);
    const hasLeft = censoredRuns.some(
      (run) =>
        run.boundaryStatus === "left-censored" ||
        run.boundaryStatus === "both-censored",
    );
    const hasRight = censoredRuns.some(
      (run) =>
        run.boundaryStatus === "right-censored" ||
        run.boundaryStatus === "both-censored",
    );

    const completedLengths = completedRuns.map((run) => run.length);
    const reference = input.cards[0]!;

    const statistics: HistoricalShapeRunStatistics = {
      key: createShapeStatisticsKey(
        reference.rowCount,
        reference.columnCount,
        input.shapeType,
        input.geometryKey,
      ),
      analyzedCardCount: input.cards.length,
      runs,
      completedRuns,
      censoredRuns,
      completedRunCount: completedRuns.length,
      censoredRunCount: censoredRuns.length,
      frequencyDistribution: buildFrequencyDistribution(completedRuns),
      survivalDistribution: buildSurvivalDistribution(completedRuns),
      mode: computeRunLengthMode(completedRuns),
      minimumRunLength:
        completedLengths.length === 0
          ? null
          : Math.min(...completedLengths),
      maximumRunLength:
        completedLengths.length === 0
          ? null
          : Math.max(...completedLengths),
      averageRunLength: computeAverageRunLength(completedRuns),
      medianRunLength: computeMedianRunLength(completedRuns),
      quantiles: computeRunLengthQuantiles(completedRuns),
      dataQuality: evaluateHistoricalDataQuality({
        completedRunCount: completedRuns.length,
        minimumRequiredRunCount: input.options.minimumCompletedRunCount,
        hasLeftCensoredRun: hasLeft,
        hasRightCensoredRun: hasRight,
      }),
    };

    if (input.options.openRunPolicy === "include-as-censored") {
      return {
        ...statistics,
        censoredSummary: this.buildCensoredSummary(censoredRuns),
      };
    }

    return statistics;
  }

  private buildCensoredSummary(
    censoredRuns: readonly ShapeRun[],
  ): CensoredRunSummary {
    if (censoredRuns.length === 0) {
      return {
        longestObservedCensoredRun: null,
        rightCensoredCurrentLength: null,
      };
    }

    const longest = Math.max(...censoredRuns.map((run) => run.length));
    const right = [...censoredRuns]
      .reverse()
      .find(
        (run) =>
          run.boundaryStatus === "right-censored" ||
          run.boundaryStatus === "both-censored",
      );

    return {
      longestObservedCensoredRun: longest,
      rightCensoredCurrentLength: right?.length ?? null,
    };
  }

  private buildPresenceSequence(
    cards: readonly ShapeAnalysisCard[],
    shapeType: ShapeType,
    geometry: ShapeGeometry,
    geometryKey: string,
    presenceCache: Map<string, boolean>,
  ): readonly boolean[] {
    const detector = this.dependencies.detectorRegistry.get(shapeType);
    const probe = stubTrackedShape(shapeType, geometry, geometryKey);
      const detectionContext = {
      rowCount: cards[0]!.rowCount,
      columnCount: cards[0]!.columnCount,
      minimumShapeCellCount: 4,
    };

    const detectionCache = new Map<string, ReadonlySet<string>>();
    let active = false;
    const presence: boolean[] = [];

    for (const card of cards) {
      const emptyKey = `${card.id}:${shapeType}:${geometryKey}:empty`;
      let empty = presenceCache.get(emptyKey);

      if (empty === undefined) {
        empty = detector.existsUnchanged(probe, card);
        presenceCache.set(emptyKey, empty);
      }

      let detectedKeys = detectionCache.get(card.id);

      if (detectedKeys === undefined) {
        const detected = detector.detectInitialShapes(card, {
          ...detectionContext,
          rowCount: card.rowCount,
          columnCount: card.columnCount,
        });
        detectedKeys = new Set(detected.map((shape) => shape.key));
        detectionCache.set(card.id, detectedKeys);
      }

      const isMaximal = detectedKeys.has(geometryKey);

      if (active) {
        if (empty) {
          presence.push(true);
        } else {
          presence.push(false);
          active = false;
        }
      } else if (isMaximal) {
        presence.push(true);
        active = true;
      } else {
        presence.push(false);
      }
    }

    return presence;
  }

  private prepareCards(
    cards: readonly ShapeAnalysisCard[],
    layoutKey: string,
  ): readonly ShapeAnalysisCard[] {
    if (cards.length === 0) {
      throw new ShapeAnalysisError(
        "EMPTY_CARD_SET",
        "Historical shape run analysis requires at least one card.",
      );
    }

    validateShapeAnalysisCards(cards, cards[0]!.id);
    validateChronology(cards);

    const sorted = [...cards].sort(
      (a, b) => a.chronologicalIndex - b.chronologicalIndex,
    );

    const expectedLayout = createLayoutKey(
      sorted[0]!.rowCount,
      sorted[0]!.columnCount,
    );

    if (layoutKey !== expectedLayout) {
      throw new ShapeAnalysisError(
        "INCONSISTENT_GRID_LAYOUT",
        `layoutKey ${layoutKey} does not match card grid ${expectedLayout}.`,
        {
          expected: expectedLayout,
          actual: layoutKey,
        },
      );
    }

    return sorted;
  }

  private assertDetector(shapeType: ShapeType): void {
    if (!this.dependencies.detectorRegistry.has(shapeType)) {
      throw new ShapeAnalysisError(
        "UNSUPPORTED_SHAPE_TYPE",
        `No shape detector is registered for type "${shapeType}".`,
        { shapeType },
      );
    }
  }

  private assertGeometry(
    shapeType: ShapeType,
    geometry: ShapeGeometry,
    card: ShapeAnalysisCard,
  ): void {
    if (shapeType === "rectangle" && isRectangleGeometry(geometry)) {
      if (
        !isGeometricallyValidRectangle(
          geometry,
          card.rowCount,
          card.columnCount,
        )
      ) {
        throw new ShapeAnalysisError(
          "INVALID_SHAPE_GEOMETRY",
          `Rectangle geometry is invalid for grid ${card.rowCount}x${card.columnCount}.`,
          {
            expected: "geometry fully inside card grid",
            actual: `r=${geometry.originRow},c=${geometry.originColumn},w=${geometry.width},h=${geometry.height}`,
          },
        );
      }
      return;
    }

    throw new ShapeAnalysisError(
      "UNSUPPORTED_SHAPE_TYPE",
      `Historical analysis does not support shape type "${shapeType}" yet.`,
      { shapeType },
    );
  }

  private resolveOptions(
    options: HistoricalShapeRunOptions | undefined,
  ): HistoricalShapeRunOptions {
    const resolved: HistoricalShapeRunOptions = {
      openRunPolicy:
        options?.openRunPolicy ??
        DEFAULT_HISTORICAL_SHAPE_RUN_OPTIONS.openRunPolicy,
      minimumCompletedRunCount:
        options?.minimumCompletedRunCount ??
        DEFAULT_HISTORICAL_SHAPE_RUN_OPTIONS.minimumCompletedRunCount,
    };

    if (resolved.minimumCompletedRunCount < 0) {
      throw new ShapeAnalysisError(
        "INVALID_ANALYSIS_OPTIONS",
        "minimumCompletedRunCount must not be negative.",
      );
    }

    return resolved;
  }

  private deduplicateTargets(
    targets: readonly HistoricalShapeTarget[],
  ): readonly HistoricalShapeTarget[] {
    const seen = new Map<string, HistoricalShapeTarget>();

    for (const target of targets) {
      const geometryKey = createShapeGeometryKey(
        target.shapeType,
        target.geometry,
      );
      const key = `${target.layoutKey}|${target.shapeType}|${geometryKey}`;

      if (!seen.has(key)) {
        seen.set(key, target);
      }
    }

    return [...seen.values()].sort((a, b) => {
      const keyA = `${a.layoutKey}|${a.shapeType}|${createShapeGeometryKey(a.shapeType, a.geometry)}`;
      const keyB = `${b.layoutKey}|${b.shapeType}|${createShapeGeometryKey(b.shapeType, b.geometry)}`;
      return keyA.localeCompare(keyB);
    });
  }
}

export { calculateHistoricalRunPercentile } from "./run-statistics.js";
