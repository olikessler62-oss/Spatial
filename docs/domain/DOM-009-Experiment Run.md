# DOM-009 — Experiment Run

**Status:** Draft

**Version:** 1.0

---

# Purpose

An Experiment Run represents one execution of an Experiment.

---

# Definition

The same Experiment may be executed multiple times.

Every execution creates exactly one Experiment Run.

---

# Responsibilities

- execute an Experiment
- record execution parameters
- create an Experiment Result

---

# Properties

| Property | Description |
|----------|-------------|
| RunId | Unique identifier |
| ExperimentId | Executed Experiment |
| StartedAt | Start timestamp |
| FinishedAt | End timestamp |
| Dataset Version | Dataset version |
| Status | Success / Failed |
| Duration | Execution time |

---

# Relationships

Experiment

└── executed as → Experiment Run

Experiment Run

└── produces → Experiment Result

---

# Constraints

Experiment Runs are immutable.

---

# Guiding Principle

An Experiment defines *what* should happen.

An Experiment Run records *when* it happened.

---

# Related Specifications

DOM-006 Experiment

DOM-008 Experiment Result