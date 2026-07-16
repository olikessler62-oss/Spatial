import { AbstractLayout } from "./abstract-layout.js";
import { LayoutError } from "./layout-error.js";
export class CircleLayout extends AbstractLayout {
    circleDefinition;
    constructor(circleDefinition) {
        super(circleDefinition);
        this.circleDefinition = circleDefinition;
        if (circleDefinition.radius !== undefined && circleDefinition.radius <= 0) {
            throw new LayoutError("Circle radius must be greater than zero.", "INVALID_CIRCLE_RADIUS");
        }
    }
    resolveIndex(index) {
        const count = this.circleDefinition.maximumValue - this.circleDefinition.minimumValue + 1;
        const direction = this.circleDefinition.clockwise === false ? -1 : 1;
        const start = this.circleDefinition.startAngleRadians ?? 0;
        const angleRadians = start + direction * ((Math.PI * 2 * index) / count);
        const radius = this.circleDefinition.radius ?? 1;
        return { kind: "polar", angleRadians, radius, x: Math.cos(angleRadians) * radius, y: Math.sin(angleRadians) * radius };
    }
}
//# sourceMappingURL=circle-layout.js.map