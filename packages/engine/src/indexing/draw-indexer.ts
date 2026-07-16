import type { Layout } from "../domain/layout.js";
import type { ParsedDraw } from "../domain/parsed-draw.js";
import { BitMask } from "./bit-mask.js";

export interface IndexedDraw {
  readonly drawDate: string;
  readonly externalId?: string;
  readonly mask: BitMask;
  readonly drawnValueCount: number;
}

export class DrawIndexer {
  public constructor(
    private readonly layout: Layout,
  ) {}

  public index(draw: ParsedDraw): IndexedDraw {
    const indices = draw.mainNumbers.map(
      (value) => this.layout.resolve(value).index,
    );

    return {
      drawDate: draw.drawDate,
      ...(draw.externalId
        ? { externalId: draw.externalId }
        : {}),
      mask: BitMask.fromIndices(indices),
      drawnValueCount: indices.length,
    };
  }
}