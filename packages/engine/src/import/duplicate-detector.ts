import type { ParsedDraw } from "../domain/parsed-draw.js";

export interface DuplicateGroup {
  readonly key: string;
  readonly rows: readonly number[];
}

export class DuplicateDetector {
  public find(draws: readonly ParsedDraw[]): readonly DuplicateGroup[] {
    const rowsByKey = new Map<string, number[]>();

    for (const draw of draws) {
      const key = this.createKey(draw);
      const rows = rowsByKey.get(key) ?? [];
      rows.push(draw.sourceRow);
      rowsByKey.set(key, rows);
    }

    return [...rowsByKey.entries()]
      .filter(([, rows]) => rows.length > 1)
      .map(([key, rows]) => ({ key, rows }));
  }

  public createKey(draw: ParsedDraw): string {
    const mainNumbers = [...draw.mainNumbers].sort((a, b) => a - b).join("-");
    const bonusNumbers = [...draw.bonusNumbers].sort((a, b) => a - b).join("-");

    return [
      draw.drawDate,
      mainNumbers,
      bonusNumbers,
      draw.externalId ?? "",
    ].join("|");
  }
}
