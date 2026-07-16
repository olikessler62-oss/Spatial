# ADR-001 — Domain-Driven Design

**Status:** Accepted

**Date:** 2026-07-16

**Authors:** Oliver Kessler, Project Spatial Architecture

---

# Context

Project Spatial models a complex domain centered around spatial pattern exploration,
reproducible experiments, and collaborative knowledge generation.

The complexity lies primarily in the domain, not in the technology.

To ensure long-term maintainability and conceptual integrity,
Project Spatial adopts Domain-Driven Design (DDD).

---

# Decision

The project follows Domain-Driven Design as its primary architectural approach.

The domain model is the central source of truth.

Technology, persistence, APIs and user interfaces serve the domain—not the other way around.

---

# Principles

The domain language is shared by:

- Developers
- Architects
- AI Assistants
- Documentation
- Specifications

Every important concept must exist as a domain object before implementation begins.

---

# Domain First

The following order applies:

Business Idea

↓

Domain Language

↓

Domain Model

↓

Architecture

↓

Implementation

---

# Consequences

## Positive

- Clear terminology
- Stable architecture
- Better AI collaboration
- Easier maintenance
- Easier onboarding

## Negative

- More modelling effort
- Slower project start

---

# Guiding Principle

> The domain defines the software.

The software must never define the domain.

---

# References

ADR-000

DOMAIN_LANGUAGE.md

DOM-001