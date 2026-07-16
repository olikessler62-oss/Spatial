\# DOM-001 — Dataset



\*\*Status:\*\* Draft



\*\*Version:\*\* 1.0



\*\*Owner:\*\* Core Domain



\---



\# Purpose



A Dataset represents a complete historical collection of draws for a specific lottery or game.



It is the foundation of every analysis performed within Project Spatial.



Without a Dataset, no Experiment can exist.



\---



\# Definition



A Dataset is an immutable collection of Draws belonging to one lottery.



The Dataset itself never performs calculations.



It only provides historical data.



\---



\# Responsibilities



A Dataset is responsible for:



\- storing historical Draws

\- identifying the lottery

\- defining the number space

\- defining the drawing rules

\- providing ordered Draws



\---



\# Does NOT



A Dataset never



\- predicts numbers

\- calculates metrics

\- contains experiments

\- contains user data



\---



\# Relationships



Dataset



├── contains → Draw



├── belongs to → Lottery



└── used by → Experiment



\---



\# Properties



Identifier



Name



Lottery



Country



Number Space



Drawing Rules



Historical Draw Count



Import Source



Import Date



Version



\---



\# Constraints



A Dataset is immutable.



Imported Draws cannot be modified manually.



New Draws are appended.



\---



\# Examples



Dataset



EuroJackpot



contains



Draw



2026-07-14



↓



Draw



2026-07-11



↓



Draw



2026-07-08



...



\---



\# Future Extensions



Incremental Updates



Versioning



Multiple Import Sources



Validation Reports



Metadata



\---



\# Related Specifications



ADR-000



ADR-001



DOM-002 Draw



FR-001 Import Historical Data

