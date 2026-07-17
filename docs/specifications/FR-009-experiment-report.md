\# FR-009 – Experiment Report



\## Status



Proposed



\---



\# Purpose



After an experiment has been executed and ranked, the engine shall generate a

structured report that completely describes the experiment, its configuration,

calculated metrics and final ranking.



The report becomes the primary artifact for later inspection, export and

comparison.



\---



\# Goals



The report shall



\- document the executed experiment,

\- preserve reproducibility,

\- expose all calculated metrics,

\- include the complete ranking,

\- support JSON and CSV export,

\- provide a stable interface for future UI integration.



\---



\# Functional Requirements



\## FR-009-01



The engine shall generate exactly one report for every completed experiment.



\---



\## FR-009-02



The report shall contain experiment metadata.



At minimum:



\- experiment identifier

\- creation timestamp

\- engine version (optional)

\- runtime duration



\---



\## FR-009-03



The report shall contain the experiment configuration.



Including:



\- layout configuration

\- placement generator configuration

\- ranking configuration

\- metric configuration



\---



\## FR-009-04



The report shall contain summary statistics.



Including:



\- total placements

\- evaluated placements

\- rejected placements (if available)

\- number of ranking entries



\---



\## FR-009-05



The report shall contain every ranked result.



Each entry shall include



\- rank

\- placement identifier

\- final score

\- individual criterion scores

\- normalized values

\- weighted contributions



\---



\## FR-009-06



The report shall preserve the complete ranking order.



Sorting inside the report shall exactly match the Ranking Engine output.



\---



\## FR-009-07



The report shall expose all calculated metric values.



Metric values shall be available before and after normalization whenever

applicable.



\---



\## FR-009-08



The report shall contain no derived values that cannot be reproduced from the

stored experiment data.



\---



\## FR-009-09



The report shall be immutable after creation.



\---



\## FR-009-10



The report shall support serialization.



At minimum



\- JSON

\- CSV (ranking section)



\---



\## FR-009-11



The report shall support limiting exported ranking entries without modifying the

stored report.



\---



\## FR-009-12



The report shall preserve deterministic ordering.



Repeated executions using identical experiment inputs shall generate equivalent

reports.



\---



\# Domain Model



ExperimentReport



contains



\- metadata

\- configuration

\- statistics

\- ranking

\- generated timestamp



\---



ExperimentMetadata



contains



\- experimentId

\- createdAt

\- runtimeMs

\- engineVersion



\---



ExperimentStatistics



contains



\- totalPlacements

\- evaluatedPlacements

\- rejectedPlacements

\- rankedPlacements



\---



RankingSection



contains



\- ranked entries

\- applied criteria



\---



\# Acceptance Criteria



\- report contains complete experiment information

\- report contains ranking

\- report is immutable

\- report can be serialized

\- report can be exported

\- report is deterministic



\---



\# Out of Scope



\- HTML rendering

\- PDF generation

\- visualization

\- charts

\- dashboards

