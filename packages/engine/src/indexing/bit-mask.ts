export class BitMask {
  public constructor(
    public readonly value: bigint,
  ) {}

  public static empty(): BitMask {
    return new BitMask(0n);
  }

  public static fromIndices(
    indices: readonly number[],
  ): BitMask {
    let value = 0n;

    for (const index of indices) {
      if (!Number.isInteger(index) || index < 0) {
        throw new Error(
          `Bit index must be a non-negative integer. Received ${index}.`,
        );
      }

      value |= 1n << BigInt(index);
    }

    return new BitMask(value);
  }

  public has(index: number): boolean {
    if (!Number.isInteger(index) || index < 0) {
      return false;
    }

    return (this.value & (1n << BigInt(index))) !== 0n;
  }

  public intersects(other: BitMask): boolean {
    return (this.value & other.value) !== 0n;
  }

  public intersection(other: BitMask): BitMask {
    return new BitMask(this.value & other.value);
  }

  public union(other: BitMask): BitMask {
    return new BitMask(this.value | other.value);
  }

  public contains(other: BitMask): boolean {
    return (this.value & other.value) === other.value;
  }

  public count(): number {
    let remaining = this.value;
    let count = 0;

    while (remaining !== 0n) {
      remaining &= remaining - 1n;
      count += 1;
    }

    return count;
  }

  public equals(other: BitMask): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value.toString(16);
  }
}