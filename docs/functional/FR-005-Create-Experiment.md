\# FR-005 — Create Experiment



\*\*Document ID:\*\* FR-005  

\*\*Status:\*\* Draft  

\*\*Version:\*\* 1.0  

\*\*Date:\*\* 2026-07-16  

\*\*Owner:\*\* Analysis Domain



\---



\# Purpose



Users shall be able to create reproducible spatial experiments.



An Experiment defines \*what\* is analyzed, \*how\* it is analyzed and \*which analytical components\* are used.



An Experiment itself does not contain results.



\---



\# Actors



\- Analyst

\- Researcher

\- Administrator



\---



\# Functional Requirements



\## FR-005.001 — Create Experiment



Authorized users shall be able to create a new Experiment.



Required information:



\- Name

\- Dataset Version

\- Layout Version



\---



\## FR-005.002 — Configure Experiment



An Experiment may include:



\- one or more Shapes

\- one or more Metrics

\- placement configuration

\- event filters

\- hit rules

\- runtime parameters



\---



\## FR-005.003 — Select Dataset Version



The Experiment shall reference exactly one immutable Dataset Version.



Changing the Dataset requires a new Experiment Version.



\---



\## FR-005.004 — Select Layout Version



The Experiment shall reference exactly one immutable Layout Version.



\---



\## FR-005.005 — Select Shapes



Users shall be able to select one or more Shape Versions.



Each Shape may define:



\- role

\- priority

\- placement options

\- parameters



\---



\## FR-005.006 — Select Metrics



Users shall be able to select one or more Metric Versions.



Metric parameters shall be configurable.



\---



\## FR-005.007 — Configure Placement



The Experiment shall define how Shapes are placed.



Examples:



\- Fixed position

\- Sliding

\- Every possible position

\- Random placement

\- User-defined placement



\---



\## FR-005.008 — Configure Event Filters



Experiments may restrict the Dataset using filters.



Examples:



\- Date range

\- Number range

\- Weekday

\- Year

\- Even/Odd

\- Custom rules



\---



\## FR-005.009 — Validate Experiment



Before publication the system shall verify:



\- Dataset exists

\- Layout exists

\- Shape compatibility

\- Metric compatibility

\- Valid parameters

\- Valid placement

\- Complete configuration



\---



\## FR-005.010 — Version Experiment



Any analytical change creates a new Experiment Version.



Examples:



\- Dataset Version

\- Layout Version

\- Shape

\- Metric

\- Placement

\- Filters

\- Parameters



Published Experiment Versions are immutable.



\---



\## FR-005.011 — Edit Metadata



The following may be edited without creating a new version:



\- Name

\- Description

\- Tags



\---



\## FR-005.012 — Duplicate Experiment



Users shall be able to duplicate an existing Experiment.



The copy shall reference its source.



\---



\## FR-005.013 — Publish Experiment



Published Experiments become available according to their visibility.



\---



\## FR-005.014 — Archive Experiment



Archived Experiments remain available for historical Experiment Runs.



\---



\## FR-005.015 — Visibility



Experiments support:



\- private

\- workspace

\- community

\- public

\- published



\---



\## FR-005.016 — Ownership



Every Experiment shall record:



\- creator

\- creation date

\- last modification



\---



\## FR-005.017 — Configuration Hash



Every Experiment Version shall generate a deterministic configuration hash.



The hash shall include:



\- Dataset Version

\- Layout Version

\- Shape Versions

\- Metric Versions

\- Placement configuration

\- Filters

\- Parameters



\---



\## FR-005.018 — Reproducibility



Every Experiment Version shall be reproducible.



Running the same Experiment Version with the same Dataset Version shall produce identical analytical input.



\---



\## Constraints



\- Experiments never modify historical data.

\- Experiments reference immutable versions only.

\- Published Experiment Versions are immutable.

\- Experiment Results are stored separately.

\- Experiment Runs are stored separately.



\---



\# Acceptance Criteria



\- User creates an Experiment.

\- Dataset Version is selected.

\- Layout Version is selected.

\- Shapes are assigned.

\- Metrics are assigned.

\- Placement is configured.

\- Validation succeeds.

\- Configuration hash is generated.

\- Experiment Version is published.

\- Existing Experiment Versions remain unchanged.



\---



\# Related Specifications



\- ADR-005 — Immutable Domain Objects

\- DOM-006 — Experiment

\- DOM-007 — Metric

\- DOM-008 — Experiment Result

\- DB-001 — Core Database

\- FR-002 — Manage Datasets

\- FR-003 — Manage Layouts

\- FR-004 — Manage Shapes

\- SEC-001 — Authorization Model



\---



\# Open Questions



1\. Should Experiments support nested Experiment Groups?

2\. Can an Experiment reference multiple Dataset Versions?

3\. Should parameter presets be reusable?

4\. How are AI-generated configurations represented?

5\. Should Experiments support scheduled execution?

