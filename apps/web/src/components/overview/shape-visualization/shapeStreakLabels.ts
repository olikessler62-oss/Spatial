/**
 * Streak labels on the newest card: "A / B"
 * (A = including last draw, B = excluding last draw).
 *
 * Set to `false` to hide labels without removing engine fields or overlay code.
 */
export const SHAPE_STREAK_LABELS_ENABLED = false;

export type ShapeStreakLabel = {
  readonly includingNewest: number;
  readonly excludingNewest: number;
};
