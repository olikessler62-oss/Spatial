import type { LayoutDefinition, PolarPosition } from "../domain/layout.js";
import { AbstractLayout } from "./abstract-layout.js";
import { LayoutError } from "./layout-error.js";

export interface CircleLayoutDefinition extends LayoutDefinition {
  readonly type: "circle";
  readonly radius?: number;
  readonly startAngleRadians?: number;
  readonly clockwise?: boolean;
}

export class CircleLayout extends AbstractLayout {
  public constructor(public readonly circleDefinition: CircleLayoutDefinition) {
    super(circleDefinition);
    if (circleDefinition.radius !== undefined && circleDefinition.radius <= 0) {
      throw new LayoutError("Circle radius must be greater than zero.", "INVALID_CIRCLE_RADIUS");
    }
  }

  protected resolveIndex(index: number): PolarPosition {
    const count = this.circleDefinition.maximumValue - this.circleDefinition.minimumValue + 1;
    const direction = this.circleDefinition.clockwise === false ? -1 : 1;
    const start = this.circleDefinition.startAngleRadians ?? 0;
    const angleRadians = start + direction * ((Math.PI * 2 * index) / count);
    const radius = this.circleDefinition.radius ?? 1;
    return { kind: "polar", angleRadians, radius, x: Math.cos(angleRadians) * radius, y: Math.sin(angleRadians) * radius };
  }
}
