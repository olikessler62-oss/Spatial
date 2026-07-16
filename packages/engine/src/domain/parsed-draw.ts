export interface ParsedDraw {
  readonly drawDate: string;
  readonly mainNumbers: readonly number[];
  readonly bonusNumbers: readonly number[];
  readonly externalId?: string;
  readonly sourceRow: number;
}
