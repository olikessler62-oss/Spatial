import type { LayoutDefinition, PolarPosition } from "../domain/layout.js";
import { AbstractLayout } from "./abstract-layout.js";
export interface CircleLayoutDefinition extends LayoutDefinition {
    readonly type: "circle";
    readonly radius?: number;
    readonly startAngleRadians?: number;
    readonly clockwise?: boolean;
}
export declare class CircleLayout extends AbstractLayout {
    readonly circleDefinition: CircleLayoutDefinition;
    constructor(circleDefinition: CircleLayoutDefinition);
    protected resolveIndex(index: number): PolarPosition;
}
//# sourceMappingURL=circle-layout.d.ts.map