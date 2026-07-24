import type { ParsedDraw } from "../domain/parsed-draw.js";
/**
 * Detects German Lotto 6aus49 archive exports:
 * Datum;Gewinnzahl1;...;Gewinnzahl6;ZZ
 * (often with trailing empty columns and disclaimer blocks).
 */
export declare function looksLikeGermanLottoArchive(csv: string): boolean;
/**
 * Parses a German Lotto archive CSV into engine draws.
 * Uses the first 8 meaningful fields: date + 6 mains + Superzahl (ZZ).
 */
export declare function parseGermanLottoArchive(csv: string): readonly ParsedDraw[];
/** Converts archive CSV into the Spatial standard CSV format. */
export declare function germanLottoArchiveToStandardCsv(csv: string): string;
//# sourceMappingURL=german-lotto-archive.d.ts.map