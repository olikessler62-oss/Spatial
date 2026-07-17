import { RankingError } from "./ranking-error.js";
import type {
  RankableResult,
  RankedResult,
  RankingConfiguration,
  RankingCriterion,
  RankingCriterionScore,
  RankingDirection,
  RankingResult,
} from "./ranking-types.js";

interface MetricRange {
  readonly minimum: number;
  readonly maximum: number;
}

interface PreparedCriterion {
  readonly criterion: RankingCriterion;
  readonly normalizedWeight: number;
  readonly range: MetricRange;
}

interface ScoredResult {
  readonly source: RankableResult;
  readonly score: number;
  readonly criteria: readonly RankingCriterionScore[];
}

export class RankingEngine {
  public rank(
    results: readonly RankableResult[],
    configuration: RankingConfiguration,
  ): RankingResult {
    this.validateConfiguration(configuration);
    this.validateResults(results, configuration.criteria);

    if (results.length === 0) {
      return {
        entries: [],
        totalResultCount: 0,
        appliedCriteria: configuration.criteria,
      };
    }

    const preparedCriteria = this.prepareCriteria(
      results,
      configuration.criteria,
    );

    const scoredResults = results.map((result) =>
      this.scoreResult(result, preparedCriteria),
    );

    const sortedResults = [...scoredResults].sort((left, right) =>
      this.compareResults(left, right, configuration.criteria),
    );

    const rankedResults: readonly RankedResult[] = sortedResults.map(
      (result, index) => ({
        rank: index + 1,
        resultId: result.source.resultId,
        score: result.score,
        criteria: result.criteria,
      }),
    );

    const entries =
      configuration.limit === undefined
        ? rankedResults
        : rankedResults.slice(0, configuration.limit);

    return {
      entries,
      totalResultCount: results.length,
      appliedCriteria: configuration.criteria,
    };
  }

  private validateConfiguration(
    configuration: RankingConfiguration,
  ): void {
    if (configuration.criteria.length === 0) {
      throw new RankingError(
        "A ranking configuration must contain at least one criterion.",
        "EMPTY_CRITERIA",
      );
    }

    const metricIds = new Set<string>();
    let totalWeight = 0;

    for (const criterion of configuration.criteria) {
      if (metricIds.has(criterion.metricId)) {
        throw new RankingError(
          `Metric "${criterion.metricId}" is configured more than once.`,
          "DUPLICATE_METRIC",
        );
      }

      metricIds.add(criterion.metricId);

      if (
        !Number.isFinite(criterion.weight) ||
        criterion.weight < 0
      ) {
        throw new RankingError(
          `Weight for metric "${criterion.metricId}" must be a finite, non-negative number.`,
          "INVALID_WEIGHT",
        );
      }

      if (!this.isRankingDirection(criterion.direction)) {
        throw new RankingError(
          `Direction "${String(
            criterion.direction,
          )}" for metric "${criterion.metricId}" is not supported.`,
          "INVALID_DIRECTION",
        );
      }

      totalWeight += criterion.weight;
    }

    if (totalWeight === 0) {
      throw new RankingError(
        "At least one ranking criterion must have a weight greater than zero.",
        "ZERO_TOTAL_WEIGHT",
      );
    }

    if (
      configuration.limit !== undefined &&
      (!Number.isFinite(configuration.limit) ||
        !Number.isInteger(configuration.limit) ||
        configuration.limit <= 0)
    ) {
      throw new RankingError(
        "Ranking limit must be a positive integer.",
        "INVALID_LIMIT",
      );
    }
  }

  private validateResults(
    results: readonly RankableResult[],
    criteria: readonly RankingCriterion[],
  ): void {
    for (const result of results) {
      for (const criterion of criteria) {
        if (
          !Object.prototype.hasOwnProperty.call(
            result.metricValues,
            criterion.metricId,
          )
        ) {
          throw new RankingError(
            `Result "${result.resultId}" is missing metric "${criterion.metricId}".`,
            "MISSING_METRIC_VALUE",
          );
        }

        const value = result.metricValues[criterion.metricId];

        if (typeof value !== "number" || !Number.isFinite(value)) {
          throw new RankingError(
            `Result "${result.resultId}" contains an invalid value for metric "${criterion.metricId}".`,
            "INVALID_METRIC_VALUE",
          );
        }
      }
    }
  }

  private prepareCriteria(
    results: readonly RankableResult[],
    criteria: readonly RankingCriterion[],
  ): readonly PreparedCriterion[] {
    const totalWeight = criteria.reduce(
      (sum, criterion) => sum + criterion.weight,
      0,
    );

    return criteria.map((criterion) => ({
      criterion,
      normalizedWeight: criterion.weight / totalWeight,
      range: this.calculateMetricRange(
        results,
        criterion.metricId,
      ),
    }));
  }

  private calculateMetricRange(
    results: readonly RankableResult[],
    metricId: string,
  ): MetricRange {
    let minimum = Number.POSITIVE_INFINITY;
    let maximum = Number.NEGATIVE_INFINITY;

    for (const result of results) {
      const value = result.metricValues[metricId]!;

      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }

    return {
      minimum,
      maximum,
    };
  }

  private scoreResult(
    result: RankableResult,
    preparedCriteria: readonly PreparedCriterion[],
  ): ScoredResult {
    const criterionScores = preparedCriteria.map(
      ({ criterion, normalizedWeight, range }) => {
        const rawValue = result.metricValues[
          criterion.metricId
        ]!;

        const normalizedValue = this.normalizeValue(
          rawValue,
          range,
          criterion.direction,
        );

        const contribution =
          normalizedValue * normalizedWeight;

        return {
          metricId: criterion.metricId,
          rawValue,
          normalizedValue,
          normalizedWeight,
          contribution,
        };
      },
    );

    const score = criterionScores.reduce(
      (sum, criterion) => sum + criterion.contribution,
      0,
    );

    return {
      source: result,
      score,
      criteria: criterionScores,
    };
  }

  private normalizeValue(
    value: number,
    range: MetricRange,
    direction: RankingDirection,
  ): number {
    if (range.minimum === range.maximum) {
      return 1;
    }

    if (direction === "descending") {
      return (
        (value - range.minimum) /
        (range.maximum - range.minimum)
      );
    }

    return (
      (range.maximum - value) /
      (range.maximum - range.minimum)
    );
  }

  private compareResults(
    left: ScoredResult,
    right: ScoredResult,
    criteria: readonly RankingCriterion[],
  ): number {
    if (left.score !== right.score) {
      return right.score - left.score;
    }

    for (const criterion of criteria) {
      const leftValue =
        left.source.metricValues[criterion.metricId]!;
      const rightValue =
        right.source.metricValues[criterion.metricId]!;

      if (leftValue === rightValue) {
        continue;
      }

      return criterion.direction === "descending"
        ? rightValue - leftValue
        : leftValue - rightValue;
    }

    return this.compareResultIds(
      left.source.resultId,
      right.source.resultId,
    );
  }

  private compareResultIds(left: string, right: string): number {
    if (left < right) {
      return -1;
    }

    if (left > right) {
      return 1;
    }

    return 0;
  }

  private isRankingDirection(
    value: unknown,
  ): value is RankingDirection {
    return value === "ascending" || value === "descending";
  }
}