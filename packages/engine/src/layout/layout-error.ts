export class LayoutError extends Error {
  public constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "LayoutError";
  }
}
