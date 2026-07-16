export class CsvImportError extends Error {
  public constructor(message: string, public readonly row?: number) {
    super(row === undefined ? message : `Row ${row}: ${message}`);
    this.name = "CsvImportError";
  }
}
