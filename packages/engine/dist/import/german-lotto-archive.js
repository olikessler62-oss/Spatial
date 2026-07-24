import { CsvImportError } from "./csv-import-error.js";
/**
 * Detects German Lotto 6aus49 archive exports:
 * Datum;Gewinnzahl1;...;Gewinnzahl6;ZZ
 * (often with trailing empty columns and disclaimer blocks).
 */
export function looksLikeGermanLottoArchive(csv) {
    const firstLine = csv
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length > 0);
    if (!firstLine) {
        return false;
    }
    const header = firstLine.toLowerCase();
    return (header.includes("datum")
        && (header.includes("gewinnzahl") || header.includes("zz"))
        && firstLine.includes(";"));
}
function splitSemicolonRow(line) {
    return line.split(";").map((cell) => cell.trim());
}
function nonEmptyCells(cells) {
    return cells.filter((cell) => cell.length > 0);
}
function parseGermanDate(value, sourceRow) {
    const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!match) {
        throw new CsvImportError(`Invalid German date "${value}". Expected DD.MM.YYYY.`, sourceRow);
    }
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const date = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())
        || date.getUTCFullYear() !== year
        || date.getUTCMonth() + 1 !== month
        || date.getUTCDate() !== day) {
        throw new CsvImportError(`Invalid calendar date "${value}".`, sourceRow);
    }
    return iso;
}
function isNoiseRow(cells) {
    if (cells.length === 0) {
        return true;
    }
    const joined = cells.join(" ").toLowerCase();
    if (joined.includes("ohne gewähr")
        || joined.includes("spieleins")
        || joined.includes("quoten")
        || joined.includes("gewinnzahlen")
        || joined === "zz"
        || joined.startsWith("s ")
        || joined.includes("spiel77")
        || joined.includes("super6")) {
        return true;
    }
    // Repeated section headers like "Gewinnzahlen;ZZ;S;..."
    if (cells[0]?.toLowerCase() === "gewinnzahlen") {
        return true;
    }
    return false;
}
/**
 * Parses a German Lotto archive CSV into engine draws.
 * Uses the first 8 meaningful fields: date + 6 mains + Superzahl (ZZ).
 */
export function parseGermanLottoArchive(csv) {
    const lines = csv
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/);
    const draws = [];
    for (let index = 0; index < lines.length; index += 1) {
        const sourceRow = index + 1;
        const raw = lines[index] ?? "";
        if (!raw.trim()) {
            continue;
        }
        const cells = nonEmptyCells(splitSemicolonRow(raw));
        if (cells.length === 0 || isNoiseRow(cells)) {
            continue;
        }
        // Header
        if (/^datum$/i.test(cells[0] ?? "")) {
            continue;
        }
        if (cells.length < 8) {
            continue;
        }
        const dateRaw = cells[0];
        const numberParts = cells.slice(1, 8);
        if (numberParts.some((part) => !/^\d+$/.test(part))) {
            continue;
        }
        const numbers = numberParts.map(Number);
        const mainNumbers = numbers.slice(0, 6);
        const bonusNumbers = [numbers[6]];
        draws.push({
            drawDate: parseGermanDate(dateRaw, sourceRow),
            mainNumbers,
            bonusNumbers,
            externalId: parseGermanDate(dateRaw, sourceRow),
            sourceRow,
        });
    }
    if (draws.length === 0) {
        throw new CsvImportError("German Lotto archive contains no valid draw rows.");
    }
    return draws;
}
/** Converts archive CSV into the Spatial standard CSV format. */
export function germanLottoArchiveToStandardCsv(csv) {
    const draws = parseGermanLottoArchive(csv);
    const lines = [
        "draw_date,main_numbers,bonus_numbers,external_id",
        ...draws.map((draw) => {
            const main = draw.mainNumbers.join(" ");
            const bonus = draw.bonusNumbers.join(" ");
            const externalId = draw.externalId ?? draw.drawDate;
            return `${draw.drawDate},"${main}","${bonus}",${externalId}`;
        }),
    ];
    return `${lines.join("\n")}\n`;
}
//# sourceMappingURL=german-lotto-archive.js.map