\# Contributing to Spatial



Welcome to \*\*Project Spatial\*\*.



Thank you for contributing.



Spatial is built with a simple philosophy:



> \*\*Build it right. Then build it fast.\*\*



\---



\# Core Principles



Every contribution should improve one or more of the following:



\- Clarity

\- Simplicity

\- Reproducibility

\- Maintainability

\- Performance



\---



\# Development Philosophy



Spatial follows \*\*Specification-Driven Development\*\*.



Implementation never starts with code.



Instead, every significant change follows this process:



```

Idea

&#x20;   ↓

Discussion

&#x20;   ↓

Architecture Decision (ADR)

&#x20;   ↓

Domain Model

&#x20;   ↓

Functional Requirement

&#x20;   ↓

Database / API

&#x20;   ↓

Implementation

&#x20;   ↓

Tests

&#x20;   ↓

Release

```



\---



\# Architecture



Before implementing new functionality, please read:



\- ADR-000

\- ADR-001

\- ADR-002

\- ADR-003

\- ADR-004

\- ADR-005



These documents define the architectural principles of the project.



\---



\# Coding Guidelines



We value:



\- readable code

\- small functions

\- descriptive names

\- deterministic behavior

\- immutability where possible



Avoid unnecessary complexity.



\---



\# Database



The database is managed through versioned Supabase migrations.



Never modify existing migrations that have already been applied.



Create a new migration instead.



\---



\# Security



All authorization is handled through the centralized Security Engine.



Business logic should never be duplicated inside Row-Level Security policies.



\---



\# Commits



Prefer small, focused commits.



Examples:



```

feat(dataset): add dataset version validation



fix(import): reject duplicate draws



docs(adr): add immutable domain objects



refactor(engine): simplify placement resolver

```



\---



\# Pull Requests



A Pull Request should answer three questions:



1\. What problem does it solve?

2\. Why is this solution appropriate?

3\. How was it tested?



\---



\# Documentation



Documentation is part of the product.



Every significant architectural or functional change should be reflected in the specifications.



\---



\# Testing



Every new feature should include appropriate tests.



Reproducibility is one of Spatial's core principles.



\---



\# Community



Be respectful.



Be constructive.



Be curious.



Assume good intentions.



\---



\# Vision



Spatial exists to help people discover meaningful spatial patterns in historical data.



The project values scientific reproducibility, thoughtful engineering and open collaboration.



\---



\*\*Let's build Spatial. 🚀\*\*

