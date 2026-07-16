import type { IndexedDraw } from "../indexing/draw-indexer.js";
import { BitMask } from "../indexing/bit-mask.js";

export interface SyntheticDrawGeneratorOptions {
  readonly drawCount: number;
  readonly layoutSize: number;
  readonly numbersPerDraw: number;
  readonly seed?: number;
}

export class SyntheticDrawGenerator {
  public generate(
    options: SyntheticDrawGeneratorOptions,
  ): readonly IndexedDraw[] {
    this.validateOptions(options);

    const random = this.createRandom(options.seed ?? 42);
    const draws: IndexedDraw[] = [];

    for (let drawIndex = 0; drawIndex < options.drawCount; drawIndex += 1) {
      const indices = new Set<number>();

      while (indices.size < options.numbersPerDraw) {
        indices.add(
          Math.floor(random() * options.layoutSize),
        );
      }

      draws.push({
        drawDate: this.createDate(drawIndex),
        externalId: `synthetic-${drawIndex + 1}`,
        mask: BitMask.fromIndices([...indices]),
        drawnValueCount: indices.size,
      });
    }

    return draws;
  }

  private validateOptions(
    options: SyntheticDrawGeneratorOptions,
  ): void {
    if (!Number.isInteger(options.drawCount) || options.drawCount < 0) {
      throw new Error("drawCount must be a non-negative integer.");
    }

    if (!Number.isInteger(options.layoutSize) || options.layoutSize <= 0) {
      throw new Error("layoutSize must be a positive integer.");
    }

    if (
      !Number.isInteger(options.numbersPerDraw)
      || options.numbersPerDraw <= 0
      || options.numbersPerDraw > options.layoutSize
    ) {
      throw new Error(
        "numbersPerDraw must be between 1 and layoutSize.",
      );
    }
  }

  private createRandom(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  private createDate(index: number): string {
    const date = new Date(
      Date.UTC(2000, 0, 1 + index),
    );

    return date.toISOString().slice(0, 10);
  }
}