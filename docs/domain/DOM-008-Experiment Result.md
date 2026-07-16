# DOM-008 — Experiment Result

**Status:** Draft

**Version:** 1.0

---

# Purpose

An Experiment Result stores the outcome of a completed Experiment.

---

# Definition

A Result represents the measured output of one Experiment Run.

Results are immutable.

---

# Responsibilities

- store calculated values
- preserve reproducibility
- reference the originating Experiment

---

# Properties

| Property | Description |
|----------|-------------|
| ResultId | Unique identifier |
| ExperimentId | Source Experiment |
| Metric Values | Calculated metrics |
| Timestamp | Creation time |
| Dataset Version | Dataset used |

---

# Relationships

Experiment Run

└── produces → Experiment Result

Experiment Result

└── contains → Metrics

---

# Constraints

Results are immutable.

---

# Guiding Principle

Results contain evidence.

They do not contain conclusions.

---

# Related Specifications

DOM-006 Experiment

DOM-007 Metric

DOM-009 Experiment Run