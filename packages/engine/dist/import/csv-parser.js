import { CsvImportError } from "./csv-import-error.js";
const DEFAULT_OPTIONS = {
    delimiter: ",",
    dateColumn: "draw_date",
    mainNumbersColumn: "main_numbers",
    bonusNumbersColumn: "bonus_numbers",
    numberSeparator: " ",
};
export class CsvParser {
    parse(input, options = {}) {
        const config = { ...DEFAULT_OPTIONS, ...options };
        const rows = this.parseRows(input, config.delimiter);
        if (rows.length === 0)
            return [];
        const header = rows[0]?.map((value) => value.trim()) ?? [];
        const dateIndex = this.requiredColumn(header, config.dateColumn);
        const mainIndex = this.requiredColumn(header, config.mainNumbersColumn);
        const bonusIndex = header.indexOf(config.bonusNumbersColumn);
        const externalIdIndex = options.externalIdColumn ? header.indexOf(options.externalIdColumn) : -1;
        return rows.slice(1)
            .filter((row) => row.some((value) => value.trim() !== ""))
            .map((row, index) => {
            const sourceRow = index + 2;
            const drawDate = this.requiredValue(row, dateIndex, config.dateColumn, sourceRow);
            const mainRaw = this.requiredValue(row, mainIndex, config.mainNumbersColumn, sourceRow);
            return {
                drawDate: this.normalizeDate(drawDate, sourceRow),
                mainNumbers: this.parseNumbers(mainRaw, config.numberSeparator, sourceRow, config.mainNumbersColumn),
                bonusNumbers: bonusIndex >= 0 && row[bonusIndex]?.trim()
                    ? this.parseNumbers(row[bonusIndex] ?? "", config.numberSeparator, sourceRow, config.bonusNumbersColumn)
                    : [],
                sourceRow,
                ...(externalIdIndex >= 0 && row[externalIdIndex]?.trim()
                    ? { externalId: row[externalIdIndex].trim() }
                    : {}),
            };
        });
    }
    parseRows(input, delimiter) {
        if (delimiter.length !== 1)
            throw new CsvImportError("Delimiter must be exactly one character.");
        const normalized = input.replace(/^\uFEFF/, "");
        const rows = [];
        let row = [];
        let value = "";
        let quoted = false;
        for (let index = 0; index < normalized.length; index += 1) {
            const character = normalized[index];
            if (character === '"') {
                if (quoted && normalized[index + 1] === '"') {
                    value += '"';
                    index += 1;
                }
                else
                    quoted = !quoted;
                continue;
            }
            if (character === delimiter && !quoted) {
                row.push(value);
                value = "";
                continue;
            }
            if ((character === "\n" || character === "\r") && !quoted) {
                if (character === "\r" && normalized[index + 1] === "\n")
                    index += 1;
                row.push(value);
                rows.push(row);
                row = [];
                value = "";
                continue;
            }
            value += character;
        }
        if (quoted)
            throw new CsvImportError("CSV contains an unterminated quoted field.");
        if (value.length > 0 || row.length > 0) {
            row.push(value);
            rows.push(row);
        }
        return rows;
    }
    requiredColumn(header, column) {
        const index = header.indexOf(column);
        if (index < 0)
            throw new CsvImportError(`Required column "${column}" is missing.`);
        return index;
    }
    requiredValue(row, index, column, sourceRow) {
        const value = row[index]?.trim();
        if (!value)
            throw new CsvImportError(`Required value "${column}" is missing.`, sourceRow);
        return value;
    }
    normalizeDate(value, sourceRow) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            throw new CsvImportError(`Invalid date "${value}". Expected YYYY-MM-DD.`, sourceRow);
        }
        const date = new Date(`${value}T00:00:00.000Z`);
        if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
            throw new CsvImportError(`Invalid calendar date "${value}".`, sourceRow);
        }
        return value;
    }
    parseNumbers(value, separator, sourceRow, column) {
        const parts = value.split(separator).map((part) => part.trim()).filter(Boolean);
        if (parts.length === 0)
            throw new CsvImportError(`Column "${column}" contains no numbers.`, sourceRow);
        return parts.map((part) => {
            if (!/^\d+$/.test(part))
                throw new CsvImportError(`Column "${column}" contains invalid number "${part}".`, sourceRow);
            return Number(part);
        });
    }
}
//# sourceMappingURL=csv-parser.js.map