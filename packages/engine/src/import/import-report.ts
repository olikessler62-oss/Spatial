import type { ParsedDraw } from "../domain/parsed-draw.js";
import type { ValidationIssue } from "../validation/draw-validator.js";

export interface RejectedDraw {
  readonly draw: ParsedDraw;
  readonly issues: readonly ValidationIssue[];
}

export interface ImportReport {
  readonly receivedRows: number;
  readonly acceptedRows: number;
  readonly rejectedRows: number;
  readonly acceptedDraws: readonly ParsedDraw[];
  readonly rejectedDraws: readonly RejectedDraw[];
}
