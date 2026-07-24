import type { ShapeAnalysisCard } from "../domain/analysis-card.js";
import type { ShapeAnalysisEvent } from "../domain/analysis-event.js";
import type { RectangleGeometry, ShapeType } from "../domain/geometry.js";
import type { TrackedShape } from "../domain/tracked-shape.js";
import { coveredCardCount } from "../domain/tracked-shape.js";
import { buildHitPrefixSum } from "../detection/rectangle/hit-prefix-sum.js";
import {
  MaximalEmptyRectangleFinder,
  fullGridSearchArea,
} from "../detection/rectangle/maximal-empty-rectangle-finder.js";
import {
  createRectangleGeometryKey,
  rectangleCellCount,
} from "../detection/rectangle/rectangle-geometry.js";
import {
  buildThroughSelectedSequence,
  countIgnoredNewerCards,
} from "../analysis-window.js";
import { buildIntersectionHitMatrix } from "../hit-matrix.js";
import { ShapeAnalysisError } from "../shape-analysis-error.js";
import type {
  CurrentShapePersistenceRequest,
  ShapePersistenceDependencies,
} from "./current-shape-persistence-request.js";
import type {
  CompletedRectangleRun,
  CurrentShapePersistenceEntry,
  CurrentShapePersistenceResult,
} from "./current-shape-persistence-result.js";
import { ShapeOccurrenceIndex } from "./shape-occurrence-index.js";

/** Minimum consecutive free cards (from newest) for a rectangle to be reported. */
export const BASIS_CARD_COUNT = 3;

interface StreakResult {
  readonly occurrenceCardIds: string[];
  readonly oldestFreeCardId: string;
  readonly oldestFreeCardIndex: number;
  readonly runLength: number;
  readonly terminationCardId?: string;
  readonly terminationCardIndex?: number;
}

/**
 * Rectangle persistence by backward free-streak length.
 *
 * 1. For each lookback L = {@link BASIS_CARD_COUNT} … window length, take the
 *    free-cell intersection of the newest L cards and collect maximal empty
 *    rectangles (≥ minimum cell count). Overlapping maximals are kept.
 * 2. For each unique geometry, measure how far left from newest it stays free.
 * 3. Keep only streaks of length ≥ {@link BASIS_CARD_COUNT} (or the full window
 *    when fewer than three cards are available).
 *
 * Nested blocks are independent: a 4-cell block inside a 6-cell block can have
 * a longer streak than its parent without any split/child logic.
 */
export class CurrentShapePersistenceEngine {
  private readonly maximalFinder = new MaximalEmptyRectangleFinder();

  public constructor(
    private readonly dependencies: ShapePersistenceDependencies,
  ) {}

  public analyze(
    request: CurrentShapePersistenceRequest,
  ): CurrentShapePersistenceResult {
    const now = this.dependencies.now ?? (() => new Date());
    const startedAt = now();

    this.throwIfAborted(request);

    const analysisCards = buildThroughSelectedSequence(
      request.cards,
      request.selectedCardId,
    );
    const oldestCard = analysisCards[0];
    const newestCard = analysisCards[analysisCards.length - 1];

    if (oldestCard === undefined || newestCard === undefined) {
      throw new ShapeAnalysisError(
        "EMPTY_CARD_SET",
        "Shape analysis requires at least one card.",
      );
    }

    for (const shapeType of request.enabledShapeTypes) {
      if (!this.dependencies.detectorRegistry.has(shapeType)) {
        throw new ShapeAnalysisError(
          "UNSUPPORTED_SHAPE_TYPE",
          `No shape detector is registered for type "${shapeType}".`,
          { shapeType },
        );
      }
    }

    const analyzedCardIds = analysisCards.map((card) => card.id);
    const distanceFromSelectedByCardId = new Map(
      analysisCards.map((card, index) => [card.id, index] as const),
    );
    const minBasis = Math.min(BASIS_CARD_COUNT, analysisCards.length);

    const events: ShapeAnalysisEvent[] = [
      {
        type: "analysis-started",
        selectedCardId: request.selectedCardId,
        analyzedCardIds,
      },
      {
        type: "card-analysis-started",
        cardId: newestCard.id,
        sequenceIndex: 0,
        activeShapeCount: 0,
      },
    ];

    const candidates = new Map<string, RectangleGeometry>();

    if (request.enabledShapeTypes.includes("rectangle")) {
      const searchArea = fullGridSearchArea(
        newestCard.rowCount,
        newestCard.columnCount,
      );

      for (
        let lookback = minBasis;
        lookback <= analysisCards.length;
        lookback += 1
      ) {
        this.throwIfAborted(request);

        const basisCards = analysisCards.slice(
          analysisCards.length - lookback,
        );
        const intersection = buildIntersectionHitMatrix(basisCards);
        const prefixSum = buildHitPrefixSum(intersection);
        const geometries = this.maximalFinder.find(
          prefixSum,
          searchArea,
          request.minimumShapeCellCount,
        );

        for (const geometry of geometries) {
          // Include every sub-rectangle so nested lines (e.g. 22–25 inside a
          // wider maximal) get their own streak and can outrank the parent.
          for (const sub of enumerateSubRectangles(
            geometry,
            request.minimumShapeCellCount,
          )) {
            const key = createRectangleGeometryKey(sub);
            if (!candidates.has(key)) {
              candidates.set(key, sub);
            }
          }
        }
      }
    }

    events.push({
      type: "card-analysis-completed",
      cardId: newestCard.id,
      sequenceIndex: 0,
    });

    const emptyCache = new Map<string, boolean>();
    const shapeEntries: CurrentShapePersistenceEntry[] = [];
    const completedRuns: CompletedRectangleRun[] = [];
    const occurrences = new ShapeOccurrenceIndex();
    const nodes = new Map<string, TrackedShape>();

    const sortedKeys = [...candidates.keys()].sort((a, b) =>
      a.localeCompare(b),
    );

    for (const geometryKey of sortedKeys) {
      this.throwIfAborted(request);

      const geometry = candidates.get(geometryKey)!;
      const streak = this.measureStreak(
        geometry,
        geometryKey,
        analysisCards,
        emptyCache,
      );

      if (streak.runLength < minBasis) {
        continue;
      }

      const shapeId = this.dependencies.idGenerator.nextId("shape");
      const previous = streak.runLength - 1;
      const covered = coveredCardCount(previous);
      const streakIncludingNewest = covered;
      const streakExcludingNewest = Math.max(0, covered - 1);
      const reachesOldestBound =
        streak.oldestFreeCardId === oldestCard.id
        && streak.terminationCardId === undefined;
      const status = reachesOldestBound ? "active" : "terminated";

      shapeEntries.push({
        shapeId,
        shapeType: "rectangle",
        geometry,
        geometryKey,
        discoveredAtCardId: newestCard.id,
        discoveredAtSequenceIndex: 0,
        previousCardCount: previous,
        coveredCardCount: covered,
        streakIncludingNewest,
        streakExcludingNewest,
        status,
        isCompleteRun: status === "terminated",
        ...(status === "terminated"
          ? { terminationReason: "hit-inside-shape" as const }
          : {}),
        parentIds: [],
        childIds: [],
        occurrenceCardIds: [...streak.occurrenceCardIds],
      });

      nodes.set(shapeId, {
        id: shapeId,
        shapeType: "rectangle",
        geometry,
        geometryKey,
        discoveredAtCardId: newestCard.id,
        discoveredAtSequenceIndex: 0,
        previousCardCount: previous,
        coveredCardCount: covered,
        status,
        parentIds: [],
        childIds: [],
        lastUnchangedCardId: streak.oldestFreeCardId,
        ...(status === "terminated"
          ? { terminationReason: "hit-inside-shape" as const }
          : {}),
        isCompleteRun: status === "terminated",
      });

      if (status === "terminated") {
        completedRuns.push({
          shapeId,
          shapeType: "rectangle",
          geometry,
          geometryKey,
          startCardId: streak.oldestFreeCardId,
          startCardIndex: streak.oldestFreeCardIndex,
          endCardId: newestCard.id,
          endCardIndex: newestCard.chronologicalIndex,
          runLength: streak.runLength,
          occurrenceCardIds: [...streak.occurrenceCardIds],
          ...(streak.terminationCardId !== undefined
            ? {
                terminationCardId: streak.terminationCardId,
                terminationCardIndex: streak.terminationCardIndex,
              }
            : {}),
        });
      }

      // Playback: discover on newest, confirm older free cards.
      const newestFirst = [...streak.occurrenceCardIds].reverse();
      for (let i = 0; i < newestFirst.length; i += 1) {
        const cardId = newestFirst[i]!;
        occurrences.add({
          shapeId,
          cardId,
          sequenceIndex: i,
          occurrenceType: i === 0 ? "discovered" : "confirmed",
          distanceFromSelectedCard:
            distanceFromSelectedByCardId.get(cardId) ?? i,
        });

        if (i === 0) {
          events.push({
            type: "initial-shape-detected",
            shapeId,
            shapeType: "rectangle",
            geometryKey,
            cardId,
            sequenceIndex: 0,
          });
        } else {
          events.push({
            type: "shape-confirmed",
            shapeId,
            cardId,
            sequenceIndex: i,
            previousCardCount: i,
            coveredCardCount: i + 1,
          });
        }
      }
    }

    // Longer streaks first; among ties, smaller (more specific) geometry.
    shapeEntries.sort((a, b) => {
      if (b.coveredCardCount !== a.coveredCardCount) {
        return b.coveredCardCount - a.coveredCardCount;
      }
      const areaA = isRect(a.geometry) ? rectangleCellCount(a.geometry) : 0;
      const areaB = isRect(b.geometry) ? rectangleCellCount(b.geometry) : 0;
      if (areaA !== areaB) {
        return areaA - areaB;
      }
      return a.geometryKey.localeCompare(b.geometryKey);
    });

    events.push({
      type: "analysis-completed",
      selectedCardId: request.selectedCardId,
      analyzedCardIds,
    });

    const completedAt = now();

    return {
      selectedCardId: request.selectedCardId,
      analyzedCardIds,
      graph: {
        nodes,
        edges: [],
      },
      shapes: shapeEntries,
      occurrences: occurrences.list(),
      events,
      completedRuns,
      metadata: {
        rowCount: newestCard.rowCount,
        columnCount: newestCard.columnCount,
        suppliedCardCount: request.cards.length,
        analyzedCardCount: analysisCards.length,
        ignoredNewerCardCount: countIgnoredNewerCards(
          request.cards,
          request.selectedCardId,
        ),
        rootShapeCount: shapeEntries.length,
        totalShapeCount: shapeEntries.length,
        splitCount: 0,
        terminatedShapeCount: completedRuns.length,
        boundaryShapeCount: 0,
        reachedAnalysisBoundary: false,
        startedAt,
        completedAt,
      },
    };
  }

  private measureStreak(
    geometry: RectangleGeometry,
    geometryKey: string,
    cardsNewestLast: readonly ShapeAnalysisCard[],
    emptyCache: Map<string, boolean>,
  ): StreakResult {
    const newest = cardsNewestLast[cardsNewestLast.length - 1]!;
    const occurrenceCardIds: string[] = [];
    let oldestFree = newest;

    for (let i = cardsNewestLast.length - 1; i >= 0; i -= 1) {
      const card = cardsNewestLast[i]!;
      const empty = this.isGeometryEmpty(
        geometry,
        geometryKey,
        card,
        emptyCache,
      );

      if (!empty) {
        return {
          occurrenceCardIds,
          oldestFreeCardId: oldestFree.id,
          oldestFreeCardIndex: oldestFree.chronologicalIndex,
          runLength: occurrenceCardIds.length,
          terminationCardId: card.id,
          terminationCardIndex: card.chronologicalIndex,
        };
      }

      occurrenceCardIds.unshift(card.id);
      oldestFree = card;
    }

    return {
      occurrenceCardIds,
      oldestFreeCardId: oldestFree.id,
      oldestFreeCardIndex: oldestFree.chronologicalIndex,
      runLength: occurrenceCardIds.length,
    };
  }

  private isGeometryEmpty(
    geometry: RectangleGeometry,
    geometryKey: string,
    card: ShapeAnalysisCard,
    cache: Map<string, boolean>,
  ): boolean {
    const cacheKey = `${card.id}:rectangle:${geometryKey}`;
    const cached = cache.get(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const detector = this.dependencies.detectorRegistry.get("rectangle");
    const probe: TrackedShape = {
      id: "probe",
      shapeType: "rectangle",
      geometry,
      geometryKey,
      discoveredAtCardId: card.id,
      discoveredAtSequenceIndex: 0,
      previousCardCount: 0,
      coveredCardCount: 1,
      status: "active",
      parentIds: [],
      childIds: [],
      lastUnchangedCardId: card.id,
      isCompleteRun: false,
    };

    const empty = detector.existsUnchanged(probe, card);
    cache.set(cacheKey, empty);
    return empty;
  }

  private throwIfAborted(request: CurrentShapePersistenceRequest): void {
    if (request.executionOptions?.signal?.aborted) {
      throw new ShapeAnalysisError(
        "ANALYSIS_CANCELLED",
        "Shape persistence analysis was cancelled.",
      );
    }
  }
}

function isRect(
  geometry: CurrentShapePersistenceEntry["geometry"],
): geometry is RectangleGeometry {
  return (
    "originRow" in geometry
    && "originColumn" in geometry
    && "width" in geometry
    && "height" in geometry
  );
}

/** All axis-aligned sub-rectangles of `outer` with at least `minimumCellCount` cells. */
export function enumerateSubRectangles(
  outer: RectangleGeometry,
  minimumCellCount: number,
): RectangleGeometry[] {
  const result: RectangleGeometry[] = [];
  const { originRow, originColumn, width, height } = outer;

  for (let top = 0; top < height; top += 1) {
    for (let left = 0; left < width; left += 1) {
      for (let h = 1; h <= height - top; h += 1) {
        for (let w = 1; w <= width - left; w += 1) {
          if (w * h < minimumCellCount) {
            continue;
          }
          result.push({
            originRow: originRow + top,
            originColumn: originColumn + left,
            width: w,
            height: h,
          });
        }
      }
    }
  }

  return result;
}
