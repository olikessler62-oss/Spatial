import type { Layout, LayoutDefinition, ResolvedLayoutValue } from "../domain/layout.js";
import { LayoutError } from "./layout-error.js";

export abstract class AbstractLayout implements Layout {
  public constructor(public readonly definition: LayoutDefinition) {
    if (definition.minimumValue > definition.maximumValue) {
      throw new LayoutError("minimumValue must not be greater than maximumValue.", "INVALID_VALUE_RANGE");
    }
  }

  public resolve(value: number): ResolvedLayoutValue {
    if (!Number.isInteger(value)) {
      throw new LayoutError(`Layout values must be integers. Received ${value}.`, "NON_INTEGER_VALUE");
    }
    if (value < this.definition.minimumValue || value > this.definition.maximumValue) {
      throw new LayoutError(`Value ${value} is outside ${this.definition.minimumValue}-${this.definition.maximumValue}.`, "VALUE_OUT_OF_RANGE");
    }
    const index = value - this.definition.minimumValue;
    return { value, index, position: this.resolveIndex(index) };
  }

  public resolveAll(): readonly ResolvedLayoutValue[] {
    const result: ResolvedLayoutValue[] = [];
    for (let value = this.definition.minimumValue; value <= this.definition.maximumValue; value += 1) {
      result.push(this.resolve(value));
    }
    return result;
  }

  protected abstract resolveIndex(zeroBasedIndex: number): ResolvedLayoutValue["position"];
}
