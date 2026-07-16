# ADR-005 — Immutable Domain Objects

**Status:** Accepted  
**Date:** 2026-07-16  
**Authors:** Oliver Kessler, Project Spatial Architecture

---

# Context

Project Spatial must produce reproducible and auditable experiments.

Experiments depend on specific versions of datasets, layouts, shapes, metrics, rules and engine implementations.

If referenced domain objects could be modified after an experiment was executed, its results could no longer be reproduced reliably.

Historical data, completed executions and published definitions must therefore remain stable.

---

# Decision

Project Spatial treats relevant domain records as immutable after they reach a protected lifecycle state.

Changes do not overwrite protected objects.

Instead, they create:

- a new domain version,
- a new import,
- a new experiment run,
- or a new publication snapshot.

Mutable metadata may be stored separately when it does not affect reproducibility.

---

# Immutable Objects

The following objects become immutable after publication, validation or completion:

- `LotteryRuleSet`
- `DatasetVersion`
- `Draw`
- `LayoutVersion`
- `ShapeVersion`
- `MetricVersion`
- `ExperimentVersion`
- `ExperimentRun`
- `ExperimentResult`
- `MetricValue`
- `PublicationSnapshot`

The logical parent objects may remain editable within defined limits.

Examples:

- A `Dataset` may receive a new `DatasetVersion`.
- A `Shape` may receive a new `ShapeVersion`.
- An `Experiment` may receive a new `ExperimentVersion`.

---

# Lifecycle

A typical versioned object follows this lifecycle:

```text
Draft
  ↓
Validated
  ↓
Published / Locked
  ↓
Immutable