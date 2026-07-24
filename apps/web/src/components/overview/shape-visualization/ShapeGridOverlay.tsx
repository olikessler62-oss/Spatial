"use client";

import { useMemo } from "react";

import {
  DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
  isRectangleGeometry,
  parseGridEdgeKey,
  renderGridEdges,
  resolveShapeCssColor,
  type VisibleShapeOccurrence,
} from "@spatial/engine";

import type { ShapeStreakLabel } from "./shapeStreakLabels";

const CELL_REM = 1.4;

export function ShapeGridOverlay({
  cardId,
  rowCount,
  columnCount,
  occurrences,
  streakLabelsByShapeId,
  showStreakLabels = false,
}: {
  readonly cardId: string;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly occurrences: readonly VisibleShapeOccurrence[];
  readonly streakLabelsByShapeId?: ReadonlyMap<string, ShapeStreakLabel>;
  /** Easy revert: pass false / omit (see SHAPE_STREAK_LABELS_ENABLED). */
  readonly showStreakLabels?: boolean;
}) {
  const edges = useMemo(
    () =>
      renderGridEdges(
        cardId,
        occurrences,
        DEFAULT_SHAPE_VISUALIZATION_CONFIGURATION,
      ),
    [cardId, occurrences],
  );

  const streakLabels = useMemo(() => {
    if (!showStreakLabels || !streakLabelsByShapeId) {
      return [];
    }

    const byShape = new Map<
      string,
      {
        readonly shapeId: string;
        readonly cx: number;
        readonly cy: number;
        readonly label: ShapeStreakLabel;
        readonly fill: string;
      }
    >();

    for (const occurrence of occurrences) {
      if (!occurrence.isVisible || occurrence.cardId !== cardId) {
        continue;
      }
      if (byShape.has(occurrence.shapeId)) {
        continue;
      }
      if (!isRectangleGeometry(occurrence.geometry)) {
        continue;
      }

      const streak = streakLabelsByShapeId.get(occurrence.shapeId);
      if (!streak) {
        continue;
      }

      const { originRow, originColumn, width, height } = occurrence.geometry;
      byShape.set(occurrence.shapeId, {
        shapeId: occurrence.shapeId,
        cx: originColumn + width / 2,
        cy: originRow + height / 2,
        label: streak,
        fill: resolveShapeCssColor(
          occurrence.color,
          occurrence.brightnessLevel,
        ),
      });
    }

    return [...byShape.values()];
  }, [cardId, occurrences, showStreakLabels, streakLabelsByShapeId]);

  if (edges.length === 0 || rowCount <= 0 || columnCount <= 0) {
    return null;
  }

  const width = columnCount * CELL_REM;
  const height = rowCount * CELL_REM;

  return (
    <svg
      className="overview1-shape-overlay"
      width={`${width}rem`}
      height={`${height}rem`}
      viewBox={`0 0 ${columnCount} ${rowCount}`}
      aria-hidden
    >
      {edges.map((edge) => {
        const key = parseGridEdgeKey(edge.edgeKey);

        if (key.orientation === "horizontal") {
          return (
            <line
              key={edge.edgeKey}
              x1={key.column}
              y1={key.row}
              x2={key.column + 1}
              y2={key.row}
              stroke={edge.color}
              strokeOpacity={edge.opacity}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          );
        }

        return (
          <line
            key={edge.edgeKey}
            x1={key.column}
            y1={key.row}
            x2={key.column}
            y2={key.row + 1}
            stroke={edge.color}
            strokeOpacity={edge.opacity}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {streakLabels.map((item) => (
        <text
          key={`streak-${item.shapeId}`}
          className="overview1-shape-overlay__streak"
          x={item.cx}
          y={item.cy}
          fill={item.fill}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={0.42}
          fontWeight={700}
        >
          {item.label.includingNewest}/{item.label.excludingNewest}
        </text>
      ))}
    </svg>
  );
}
