"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CurrentShapePersistenceEngine,
  DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
  DefaultShapeAnalyzerRegistry,
  RectangleShapeDetector,
  SequentialIdGenerator,
  applyVisualizationActions,
  buildShapeVisualizationPlan,
  createFinalVisibleOccurrences,
  playShapeVisualizationPlan,
  type ShapeVisualizationStatus,
  type VisibleShapeOccurrence,
} from "@spatial/engine";

import type { Overview1Move } from "@/lib/overview/overview1Moves";
import { toShapeAnalysisCards } from "@/lib/overview/toShapeAnalysisCards";

import type { ShapeStreakLabel } from "./shapeStreakLabels";
import { SHAPE_STREAK_LABELS_ENABLED } from "./shapeStreakLabels";

export type ShapeVisualizationUiStatus = ShapeVisualizationStatus;

export function useShapeVisualization(options: {
  readonly selectedCardKey: string | null;
  readonly chronologicalMoves: readonly (Overview1Move | null)[];
  readonly grid: readonly (readonly number[])[];
  readonly isGridLayout: boolean;
  readonly contextKey: string;
}) {
  const [status, setStatus] = useState<ShapeVisualizationUiStatus>("idle");
  const [visibleOccurrences, setVisibleOccurrences] = useState<
    ReadonlyMap<string, VisibleShapeOccurrence>
  >(() => new Map());
  const [streakLabelsByShapeId, setStreakLabelsByShapeId] = useState<
    ReadonlyMap<string, ShapeStreakLabel>
  >(() => new Map());
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [activeAnalysisCardId, setActiveAnalysisCardId] = useState<
    string | null
  >(null);
  const [endCardId, setEndCardId] = useState<string | null>(null);
  const [activeShapeCount, setActiveShapeCount] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);

  const cardKeys = useMemo(
    () =>
      options.chronologicalMoves.map((_, index) => `draw-${index}`),
    [options.chronologicalMoves],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    generationRef.current += 1;
    setVisibleOccurrences(new Map());
    setStreakLabelsByShapeId(new Map());
    setStatus("idle");
    setErrorCode(null);
    setActiveAnalysisCardId(null);
    setEndCardId(null);
    setActiveShapeCount(0);
  }, []);

  useEffect(() => {
    reset();
  }, [options.contextKey, reset]);

  const startOrToggle = useCallback(async () => {
    if (status === "analyzing" || status === "playing") {
      reset();
      return;
    }

    if (!options.isGridLayout) {
      setErrorCode("CARD_NOT_RENDERABLE");
      setStatus("error");
      return;
    }

    const { cards, moveIdByCardKey } = toShapeAnalysisCards({
      moves: options.chronologicalMoves,
      grid: options.grid,
      cardKeys,
    });

    // Selection / button target is always the newest (last) draw.
    const resolvedCardKey =
      [...cardKeys]
        .reverse()
        .find((key) => moveIdByCardKey.has(key))
      ?? options.selectedCardKey
      ?? null;

    if (!resolvedCardKey) {
      setErrorCode("NO_SELECTED_CARD");
      setStatus("error");
      return;
    }

    const selectedMoveId = moveIdByCardKey.get(resolvedCardKey);

    if (!selectedMoveId) {
      setErrorCode("NO_SELECTED_CARD");
      setStatus("error");
      return;
    }

    if (cards.length === 0) {
      setErrorCode("NO_ANALYSIS_CARDS");
      setStatus("error");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const generation = generationRef.current + 1;
    generationRef.current = generation;

    setErrorCode(null);
    setVisibleOccurrences(new Map());
    setStreakLabelsByShapeId(new Map());
    setActiveAnalysisCardId(selectedMoveId);
    setEndCardId(null);
    setActiveShapeCount(0);
    setStatus("analyzing");

    try {
      const registry = new DefaultShapeAnalyzerRegistry();
      registry.register(new RectangleShapeDetector());

      const engine = new CurrentShapePersistenceEngine({
        detectorRegistry: registry,
        idGenerator: new SequentialIdGenerator(),
      });

      const result = engine.analyze({
        selectedCardId: selectedMoveId,
        cards,
        enabledShapeTypes: ["rectangle"],
        minimumShapeCellCount: 4,
        executionOptions: { signal: controller.signal },
      });

      if (generation !== generationRef.current || controller.signal.aborted) {
        return;
      }

      const newestCardId =
        result.analyzedCardIds[result.analyzedCardIds.length - 1] ?? selectedMoveId;
      setEndCardId(newestCardId);
      setActiveShapeCount(
        result.shapes.filter((shape) => shape.status === "active").length,
      );

      if (result.shapes.length === 0) {
        setErrorCode("NO_SURVIVING_SHAPES");
        setVisibleOccurrences(new Map());
        setStreakLabelsByShapeId(new Map());
        setStatus("completed");
        return;
      }

      if (SHAPE_STREAK_LABELS_ENABLED) {
        setStreakLabelsByShapeId(
          new Map(
            result.shapes.map((shape) => [
              shape.shapeId,
              {
                includingNewest: shape.streakIncludingNewest,
                excludingNewest: shape.streakExcludingNewest,
              },
            ]),
          ),
        );
      } else {
        setStreakLabelsByShapeId(new Map());
      }

      const plan = buildShapeVisualizationPlan(
        result,
        DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
      );

      const catalog = new Map(
        plan.finalOccurrences.map((occurrence) => [
          occurrence.occurrenceKey,
          occurrence,
        ]),
      );

      setStatus("playing");

      let visible = new Map<string, VisibleShapeOccurrence>();

      await playShapeVisualizationPlan(plan, {
        signal: controller.signal,
        onStep: (step) => {
          if (generation !== generationRef.current) {
            return;
          }

          visible = applyVisualizationActions(
            visible,
            catalog,
            step.actions,
          );
          setVisibleOccurrences(new Map(visible));
        },
      });

      if (generation !== generationRef.current || controller.signal.aborted) {
        return;
      }

      setVisibleOccurrences(createFinalVisibleOccurrences(plan.finalOccurrences));
      setStatus("completed");
    } catch (error) {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
        if (generation === generationRef.current) {
          setStatus("cancelled");
          setVisibleOccurrences(new Map());
          setStreakLabelsByShapeId(new Map());
          setEndCardId(null);
          setActiveShapeCount(0);
        }
        return;
      }

      if (generation === generationRef.current) {
        setErrorCode("ANALYSIS_FAILED");
        setStatus("error");
        setVisibleOccurrences(new Map());
        setStreakLabelsByShapeId(new Map());
        setEndCardId(null);
        setActiveShapeCount(0);
      }
    }
  }, [
    status,
    reset,
    options.selectedCardKey,
    options.isGridLayout,
    options.chronologicalMoves,
    options.grid,
    cardKeys,
  ]);

  const occurrencesForCardKey = useCallback(
    (cardKey: string): VisibleShapeOccurrence[] => {
      const move = options.chronologicalMoves[
        Number(cardKey.replace("draw-", ""))
      ];

      if (!move) {
        return [];
      }

      return [...visibleOccurrences.values()].filter(
        (occurrence) =>
          occurrence.isVisible && occurrence.cardId === move.id,
      );
    },
    [options.chronologicalMoves, visibleOccurrences],
  );

  return {
    status,
    errorCode,
    activeAnalysisCardId,
    endCardId,
    activeShapeCount,
    startOrToggle,
    reset,
    occurrencesForCardKey,
    streakLabelsByShapeId,
    streakLabelsEnabled: SHAPE_STREAK_LABELS_ENABLED,
    isActive: status === "analyzing" || status === "playing" || status === "completed",
  };
}
