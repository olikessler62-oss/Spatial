import type { Layout, ResolvedLayoutValue } from "../domain/layout.js";
export interface SerializedLayout {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly minimumValue: number;
    readonly maximumValue: number;
    readonly positions: readonly ResolvedLayoutValue[];
}
export declare function serializeLayout(layout: Layout): SerializedLayout;
//# sourceMappingURL=layout-serializer.d.ts.map