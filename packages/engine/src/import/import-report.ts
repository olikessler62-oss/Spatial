import type { ParsedDraw } from "../domain/parsed-draw.js";
import type { ValidationIssue } from "../validation/draw-validator.js";

export interface AcceptedDraw extends ParsedDraw {
  readonly ruleSetId?: string;
}

export interface RejectedDraw {
  readonly draw: ParsedDraw;
  readonly issues: readonly ValidationIssue[];
}

export interface ImportReport {
  readonly receivedRows: number;
  readonly acceptedRows: number;
  readonly rejectedRows: number;
  readonly acceptedDraws: readonly AcceptedDraw[];
  readonly rejectedDraws: readonly RejectedDraw[];
}
