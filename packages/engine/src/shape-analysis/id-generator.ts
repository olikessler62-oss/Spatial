import type { IdGenerator } from "./domain/analysis-request.js";

/**
 * Deterministic sequential id generator for tests and reproducible runs.
 */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  public constructor(private readonly padWidth = 3) {}

  public nextId(prefix: string): string {
    this.counter += 1;
    const suffix = String(this.counter).padStart(this.padWidth, "0");
    return `${prefix}-${suffix}`;
  }
}
