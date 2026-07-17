# FR-008: Ranking Engine

## Status

Draft

## Context

The experiment engine produces metric results for generated shape placements.

Metrics such as average hit count, maximum hit count, and hit distributions describe the performance of a placement, but they do not yet provide a deterministic ordering of multiple experiment results.

The Ranking Engine transforms metric results into an ordered ranking that can be consumed by reports, exports, APIs, and user interfaces.

## Goal

Provide a deterministic and extensible mechanism for ranking experiment results by one or more weighted metrics.

## Functional Requirements

### FR-008-01: Rank experiment results

The system shall rank a collection of experiment results according to a ranking configuration.

The result shall be ordered from best to worst.

### FR-008-02: Support multiple metrics

A ranking configuration shall contain one or more metric criteria.

Each criterion shall reference a metric by its identifier.

Example:

ts
{
  criteria: [
    {
      metricId: "average-hit",
      weight: 0.7,
      direction: "descending",
    },
    {
      metricId: "max-hit",
      weight: 0.3,
      direction: "descending",
    },
  ],
}

### FR-008-03: Support metric weights

Each metric criterion shall define a numeric weight.

Weights shall:

be finite numbers
be greater than or equal to zero
contain at least one value greater than zero

The Ranking Engine shall normalize weights internally.

Therefore, the following configurations shall be equivalent:

[
  { metricId: "average-hit", weight: 7 },
  { metricId: "max-hit", weight: 3 },
]
[
  { metricId: "average-hit", weight: 0.7 },
  { metricId: "max-hit", weight: 0.3 },
]

### FR-008-04: Support ranking direction

Each metric criterion shall define whether higher or lower values are preferable.

Supported directions:

type RankingDirection =
  | "ascending"
  | "descending";

Examples:

average-hit: descending
max-hit: descending
execution duration: ascending

### FR-008-05: Normalize metric values

Metric values may use different numeric ranges.

The Ranking Engine shall normalize each metric across the ranked result set before applying weights.

Min-max normalization shall be used.

For descending criteria:

normalized = (value - minimum) / (maximum - minimum)

For ascending criteria:

normalized = (maximum - value) / (maximum - minimum)

The normalized value shall be between 0 and 1.

### FR-008-06: Handle equal metric values

When all results have the same value for a metric, the normalized score for that metric shall be 1 for every result.

The criterion shall therefore not influence the relative order of the results.

### FR-008-07: Calculate a composite score

The Ranking Engine shall calculate a composite score for every ranked result.

compositeScore =
  sum(normalizedMetricScore × normalizedWeight)

The composite score shall be between 0 and 1.

### FR-008-08: Deterministic ordering

Ranking results shall be deterministic.

Results shall first be ordered by composite score.

When two results have the same composite score, the Ranking Engine shall apply the configured metric criteria in their declared order as tie-breakers.

When the metric values are also equal, the engine shall use a stable identifier as the final tie-breaker.

Recommended stable identifier:

placementId

The final identifier comparison shall be ascending and locale-independent.

### FR-008-09: Assign ranks

Each result shall receive a one-based rank.

The best result shall have rank 1.

The Ranking Engine shall use ordinal ranking.

Example:

Score   Rank
0.90      1
0.90      2
0.80      3

Equal scores do not share the same rank because the deterministic tie-breaker produces a complete ordering.

### FR-008-10: Preserve source references

Each ranking result shall preserve the identifier of the source result or placement.

The ranking result shall not duplicate the complete experiment result unless explicitly requested by a higher-level report model.

### FR-008-11: Expose criterion scores

The ranking output shall include the normalized contribution of each criterion.

This supports auditability and report generation.

Example:

{
  metricId: "average-hit",
  rawValue: 2.4,
  normalizedValue: 0.8,
  weight: 0.7,
  contribution: 0.56,
}
### FR-008-12: Support result limits

The Ranking Engine shall optionally return only the first N ranked results.

The limit shall:

be a positive integer
be optional
not change rank calculation
return all results when omitted
return all available results when greater than the result count

### FR-008-13: Reject invalid configurations

The Ranking Engine shall reject configurations containing:

no criteria
duplicate metric identifiers
non-finite weights
negative weights
only zero weights
unsupported ranking directions
non-positive or non-integer limits

### FR-008-14: Reject missing metric values

Every ranked result shall contain a finite numeric value for every configured metric.

The Ranking Engine shall reject the operation when:

a configured metric is missing
a metric value is NaN
a metric value is infinite
a metric value is not numeric

The error shall identify the affected result and metric.

### FR-008-15: Handle empty input

Ranking an empty result collection shall return an empty ranking.

The ranking configuration shall still be validated.

### FR-008-16: Remain independent of persistence

The Ranking Engine shall be a pure domain service.

It shall not:

access Supabase
read files
write files
fetch experiment results
persist ranking results
depend on system time
generate random values