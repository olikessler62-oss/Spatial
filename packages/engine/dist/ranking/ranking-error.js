export class RankingError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "RankingError";
    }
}
//# sourceMappingURL=ranking-error.js.map