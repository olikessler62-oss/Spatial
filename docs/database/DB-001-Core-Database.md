# DB-001 — Core Database

**Status:** Draft  
**Version:** 0.1  
**Owner:** Data Platform  
**Database:** PostgreSQL / Supabase  
**Related:** ADR-000, ADR-001, DOM-001–DOM-009, FR-001

---

## 1. Purpose

This document defines the initial relational database model for the Project Spatial Core Domain.

The database shall persist:

- lotteries and their rule versions (with `valid_from` / `valid_to`),
- per-draw `rule_set_id` resolved from the draw date at import time,
- imported datasets and draws,
- layouts and spatial positions,
- shapes and shape definitions,
- experiments and experiment runs,
- metric definitions and experiment results,
- import history and validation errors.

The database supports persistence and retrieval. It must not define the domain model independently.

---

## 2. Design Principles

1. Domain objects are modelled before database tables.
2. Historical and published records are immutable.
3. Relevant domain objects are versioned.
4. Experiment executions must be reproducible.
5. Imported source data must remain auditable.
6. Calculated results are separated from interpretations.
7. Database identifiers use UUIDs.
8. Timestamps are stored in UTC.
9. Table and column names use `snake_case`.
10. Flexible configuration data may use `jsonb`, but core relationships remain relational.

---

## 3. Core Schema Overview

```text
lotteries
    └── lottery_rule_sets
            └── datasets
                    ├── dataset_versions
                    │       └── draws
                    │               ├── draw_main_values
                    │               └── draw_bonus_values
                    └── import_jobs
                            └── import_errors

lotteries
    └── layouts
            └── layout_versions
                    └── layout_positions

layout_versions
    └── shape_versions
            └── shape_positions

experiments
    └── experiment_versions
            ├── experiment_shapes
            ├── experiment_metrics
            └── experiment_runs
                    └── experiment_results
                            └── metric_values