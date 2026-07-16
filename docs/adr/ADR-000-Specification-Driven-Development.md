# ADR-000 — Specification-Driven Development

**Status:** Accepted

**Date:** 2026-07-16

**Authors:** Oliver Kessler, Project Spatial Architecture

---

# Context

Project Spatial is intended to become a long-lived platform.

The project is expected to evolve over many years, potentially involving multiple developers, AI-assisted implementation, and a growing community.

Without a strict engineering process, architectural consistency would degrade over time.

Therefore, the project requires a development model where architecture and specifications always precede implementation.

---

# Decision

Project Spatial follows a **Specification-Driven Development** approach.

No production code shall be implemented before an approved specification exists.

Every implementation must be traceable to a documented requirement or architectural decision.

Specifications become the single source of truth.

---

# Development Order

Every new feature follows the same lifecycle.

Idea

↓

Discussion

↓

Issue

↓

Specification

↓

Architecture Review

↓

Implementation

↓

Code Review

↓

Testing

↓

Release

---

# Specification Types

The following specification types are used throughout the project.

| Prefix | Description |
|---------|-------------|
| ADR | Architectural Decision Record |
| DOM | Domain Model |
| FR | Functional Requirement |
| NFR | Non-Functional Requirement |
| API | API Specification |
| DB | Database Specification |
| UI | User Interface Specification |
| ENG | Engineering Guideline |

---

# Rules

The following rules are mandatory.

1. No implementation without specification.

2. Every architectural change requires an ADR.

3. Domain objects must be defined before implementation.

4. Specifications have precedence over generated code.

5. AI assistants must follow the specifications.

6. Code reviews validate compliance with the specification.

---

# Consequences

## Positive

- Consistent architecture
- High maintainability
- AI-friendly development workflow
- Better onboarding
- Easier documentation
- Traceable decisions
- Reduced technical debt

## Negative

- Slightly slower initial development
- More documentation effort
- Higher discipline required

---

# Alternatives Considered

## Code First

Rejected.

Reason:

Leads to inconsistent architecture and undocumented design decisions.

---

## Agile without formal specifications

Rejected.

Reason:

Works well for small projects but becomes difficult to maintain over many years.

---

# Guiding Principle

> Specifications define intent.
>
> Architecture defines structure.
>
> Code is only the implementation of both.

---

# References

MANIFESTO.md

FOUNDING_PRINCIPLES.md

DOMAIN_LANGUAGE.md


## Impact

Affected Specifications

- DOM-001
- DOM-002

Affected Components

- Core
- UI
- API

Breaking Change

No