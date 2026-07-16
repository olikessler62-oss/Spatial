import type {
  Layout,
  LayoutPosition,
  ResolvedLayoutValue,
} from "../domain/layout.js";

function positionKey(position: LayoutPosition): string {
  return `${position.x}:${position.y}`;
}

export class LayoutPositionIndex {
  private readonly indexByCoordinate: ReadonlyMap<string, number>;
  private readonly entryByCoordinate: ReadonlyMap<
    string,
    ResolvedLayoutValue
  >;

  public constructor(
    public readonly layout: Layout,
  ) {
    const entries = layout.resolveAll();
    const indexByCoordinate = new Map<string, number>();
    const entryByCoordinate = new Map<
      string,
      ResolvedLayoutValue
    >();

    for (const entry of entries) {
      const key = positionKey(entry.position);

      if (indexByCoordinate.has(key)) {
        throw new Error(
          `Layout contains duplicate coordinate ${key}.`,
        );
      }

      indexByCoordinate.set(key, entry.index);
      entryByCoordinate.set(key, entry);
    }

    this.indexByCoordinate = indexByCoordinate;
    this.entryByCoordinate = entryByCoordinate;
  }

  public getIndex(position: LayoutPosition): number | undefined {
    return this.indexByCoordinate.get(positionKey(position));
  }

  public getValue(position: LayoutPosition): number | undefined {
    return this.entryByCoordinate.get(
      positionKey(position),
    )?.value;
  }

  public get size(): number {
    return this.indexByCoordinate.size;
  }
}