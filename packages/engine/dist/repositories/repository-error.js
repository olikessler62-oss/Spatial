export class RepositoryError extends Error {
    code;
    constructor(message, code, options) {
        super(message, options);
        this.code = code;
        this.name = "RepositoryError";
    }
}
//# sourceMappingURL=repository-error.js.map