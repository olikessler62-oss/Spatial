export class CsvImportError extends Error {
    row;
    constructor(message, row) {
        super(row === undefined ? message : `Row ${row}: ${message}`);
        this.row = row;
        this.name = "CsvImportError";
    }
}
//# sourceMappingURL=csv-import-error.js.map