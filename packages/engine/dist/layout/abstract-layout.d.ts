import type { Layout, LayoutDefinition, ResolvedLayoutValue } from "../domain/layout.js";
export declare abstract class AbstractLayout implements Layout {
    readonly definition: LayoutDefinition;
    constructor(definition: LayoutDefinition);
    resolve(value: number): ResolvedLayoutValue;
    resolveAll(): readonly ResolvedLayoutValue[];
    protected abstract resolveIndex(zeroBasedIndex: number): ResolvedLayoutValue["position"];
}
//# sourceMappingURL=abstract-layout.d.ts.map