# ADR-002 — Progressive Complexity

**Status:** Accepted

**Date:** 2026-07-16

**Authors:** Oliver Kessler, Project Spatial Architecture

---

# Context

Project Spatial addresses a broad range of users.

Some users simply want to explore historical lottery data.

Others want to build sophisticated spatial experiments, develop hypotheses, and publish research.

Providing every feature to every user from the beginning would create an unnecessarily complex user experience.

At the same time, limiting advanced users would reduce the platform's long-term value.

---

# Decision

Project Spatial follows the principle of **Progressive Complexity**.

The platform reveals functionality gradually, according to the user's experience, permissions and objectives.

Simple tasks remain simple.

Advanced capabilities become available as users grow.

---

# User Levels

## Explorer

Entry level.

Typical capabilities:

- Browse public datasets
- View layouts
- Run predefined experiments
- View results

---

## Analyst

Intermediate level.

Additional capabilities:

- Create custom layouts
- Create custom shapes
- Save experiments
- Compare results
- Use advanced metrics

---

## Researcher

Advanced level.

Additional capabilities:

- Design complex experiments
- Publish studies
- Create reusable templates
- Share hypotheses
- Contribute to community knowledge

---

## Administrator

Platform management.

Capabilities include:

- Manage datasets
- Approve publications
- Moderate community content
- Manage system configuration

---

# Design Principles

The interface must never overwhelm new users.

Advanced functionality should appear naturally as users gain experience.

Every screen should answer one simple question:

> What is the next logical step for this user?

---

# Consequences

## Advantages

- Lower learning curve
- Better usability
- Higher user retention
- Supports beginners and experts
- Scalable feature growth
- Easier onboarding

---

## Trade-offs

- More UI states
- More permission logic
- Additional UX design effort

---

# Examples

A new user may only see:

- Select Dataset
- Select Layout
- Start Experiment

An experienced researcher may additionally see:

- Shape Designer
- Metric Builder
- Batch Experiments
- Research Studies
- Community Publications
- AI-assisted Analysis

---

# Guiding Principle

Complexity is never removed.

It is revealed only when it becomes valuable.

---

# Related Specifications

ADR-000 — Specification-Driven Development

ADR-001 — Domain-Driven Design

ADR-003 — Centralized Authorization Engine

DOM-004 — Layout

DOM-005 — Shape

DOM-006 — Experiment