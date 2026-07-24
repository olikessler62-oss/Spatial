import { LayoutError } from "./layout-error.js";
import { buildValueToIndexMap, validateValueMapping, } from "./value-mapping.js";
export class AbstractLayout {
    definition;
    valueToIndex;
    constructor(definition) {
        this.definition = definition;
        if (definition.minimumValue > definition.maximumValue) {
            throw new LayoutError("minimumValue must not be greater than maximumValue.", "INVALID_VALUE_RANGE");
        }
        if (definition.valueMapping !== undefined) {
            validateValueMapping(definition.valueMapping, definition.minimumValue, definition.maximumValue);
            this.valueToIndex = buildValueToIndexMap(definition.valueMapping);
        }
        else {
            this.valueToIndex = null;
        }
    }
    resolve(value) {
        if (!Number.isInteger(value)) {
            throw new LayoutError(`Layout values must be integers. Received ${value}.`, "NON_INTEGER_VALUE");
        }
        if (value < this.definition.minimumValue
            || value > this.definition.maximumValue) {
            throw new LayoutError(`Value ${value} is outside ${this.definition.minimumValue}-${this.definition.maximumValue}.`, "VALUE_OUT_OF_RANGE");
        }
        const index = this.valueToIndex
            ? this.valueToIndex.get(value)
            : value - this.definition.minimumValue;
        if (index === undefined) {
            throw new LayoutError(`Value ${value} is missing from valueMapping.`, "INVALID_VALUE_MAPPING");
        }
        return { value, index, position: this.resolveIndex(index) };
    }
    resolveAll() {
        if (this.definition.valueMapping) {
            return this.definition.valueMapping.map((value, index) => ({
                value,
                index,
                position: this.resolveIndex(index),
            }));
        }
        const result = [];
        for (let value = this.definition.minimumValue; value <= this.definition.maximumValue; value += 1) {
            result.push(this.resolve(value));
        }
        return result;
    }
}
//# sourceMappingURL=abstract-layout.js.map