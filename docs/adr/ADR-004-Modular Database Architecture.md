\# ADR-004 — Modular Database Architecture



\*\*Status:\*\* Accepted



\*\*Date:\*\* 2026-07-16



\*\*Authors:\*\* Oliver Kessler, Project Spatial Architecture



\---



\# Context



Project Spatial is designed as a long-term platform that will evolve over many years.



The platform will eventually include:



\- Core domain objects

\- Spatial analysis

\- Community features

\- Authentication \& Authorization

\- AI services

\- System configuration

\- Auditing

\- Reporting



Keeping all database objects inside the default `public` schema would reduce maintainability and increase coupling.



A modular database architecture provides clear boundaries between domains while remaining a single PostgreSQL database.



\---



\# Decision



Project Spatial organizes its database into multiple PostgreSQL schemas.



Each schema represents a bounded context of the domain.



Schemas define ownership and responsibility.



\---



\# Database Schemas



\## core



Contains fundamental business entities.



Examples:



\- lotteries

\- lottery\_rule\_sets

\- datasets

\- dataset\_versions

\- draws

\- draw\_values



\---



\## analysis



Contains spatial analysis components.



Examples:



\- layouts

\- layout\_versions

\- layout\_positions

\- shapes

\- shape\_versions

\- metrics

\- experiments

\- experiment\_runs

\- experiment\_results



\---



\## community



Contains collaborative features.



Examples:



\- studies

\- hypotheses

\- publications

\- comments

\- ratings

\- reputation



\---



\## security



Contains authorization infrastructure.



Examples:



\- roles

\- permissions

\- security functions

\- access helpers



\---



\## system



Contains technical platform information.



Examples:



\- settings

\- audit\_log

\- background\_jobs

\- notifications

\- migrations



\---



\## api



Optional schema for API helper functions and views.



\---



\# Design Principles



Every schema has a clear responsibility.



Cross-schema dependencies should be minimized.



Domain ownership is more important than technical convenience.



\---



\# Advantages



\- Clear separation of concerns

\- Better maintainability

\- Easier navigation

\- Simplified security

\- Independent evolution

\- Better scalability

\- Supports future microservices



\---



\# Consequences



New tables must be assigned to the correct schema.



Schemas should never become "miscellaneous" containers.



If responsibility is unclear, the domain model should be reviewed before implementation.



\---



\# Future Extensions



Potential future schemas:



\- ai

\- reporting

\- analytics

\- billing

\- integrations



Only create new schemas when they represent a stable domain boundary.



\---



\# Recommended Structure



```text

core

analysis

community

security

system

api

```



\---



\# Guiding Principle



Modules organize responsibility.



Schemas organize modules.



The domain organizes everything.



\---



\# Related Specifications



ADR-000 — Specification-Driven Development



ADR-001 — Domain-Driven Design



ADR-003 — Centralized Authorization Engine



DB-001 — Core Database

