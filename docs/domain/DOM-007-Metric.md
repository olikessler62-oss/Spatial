# DOM-007 — Metric

**Status:** Draft

**Version:** 1.0

---

# Purpose

A Metric defines how an Experiment is evaluated.

---

# Definition

A Metric is a measurable value calculated from one or more Experiments.

Metrics are objective and reproducible.

---

# Responsibilities

- define a measurement
- calculate a value
- compare experiments

---

# Does NOT

A Metric never

- modify data
- perform experiments
- make predictions

---

# Properties

| Property | Description |
|----------|-------------|
| MetricId | Unique identifier |
| Name | Metric name |
| Unit | Count, %, Score, Days... |
| Description | Metric definition |
| Parameters | Optional settings |

---

# Examples

- Hit Count
- Hit Density
- Gap Length
- Frequency
- Coverage
- Cluster Size
- Average Distance

---

# Relationships

Experiment

└── evaluates → Metric

Metric

└── produces → Experiment Result

---

# Guiding Principle

Metrics measure.

They never interpret.

---

# Related Specifications

DOM-006 Experiment

DOM-008 Experiment Result