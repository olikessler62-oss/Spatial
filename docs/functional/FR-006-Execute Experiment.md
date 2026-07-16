\# FR-006 — Execute Experiment



\*\*Document ID:\*\* FR-006  

\*\*Status:\*\* Draft  

\*\*Version:\*\* 1.0  

\*\*Date:\*\* 2026-07-16  

\*\*Owner:\*\* Analysis Domain



\---



\# Purpose



The system shall execute a configured Experiment and produce reproducible analytical results.



Execution transforms historical events into spatial observations using the selected Dataset, Layout, Shapes and Metrics.



The execution itself shall never modify historical source data.



\---



\# Actors



\- Analyst

\- Researcher

\- Administrator

\- System Scheduler (future)



\---



\# Functional Requirements



\## FR-006.001 — Start Experiment



Authorized users shall be able to execute a published or validated Experiment Version.



Execution creates a new immutable Experiment Run.



\---



\## FR-006.002 — Create Experiment Run



Every execution shall create a new Experiment Run.



The Experiment Run records:



\- Experiment Version

\- Dataset Version

\- Layout Version

\- Engine Version

\- Configuration Hash

\- Dataset Hash

\- Execution Timestamp

\- User

\- Status



\---



\## FR-006.003 — Load Dataset



The engine shall load the referenced Dataset Version.



The Dataset shall remain read-only.



\---



\## FR-006.004 — Resolve Layout



The selected Layout Version shall be loaded.



Every dataset value shall resolve to one deterministic spatial position.



\---



\## FR-006.005 — Resolve Shapes



Every Shape Version shall be instantiated.



Runtime transformations shall be applied.



Examples:



\- Rotation

\- Reflection

\- Translation



\---



\## FR-006.006 — Generate Placements



The engine shall generate all placements defined by the Experiment.



Examples:



\- Fixed

\- Sliding

\- Random

\- Every possible placement



\---



\## FR-006.007 — Apply Event Filters



Configured filters shall reduce the event set before analysis.



Examples:



\- Date

\- Year

\- Weekday

\- Number range

\- Custom filters



\---



\## FR-006.008 — Detect Hits



For every placement the engine shall determine matching events.



Hit detection must be deterministic.



\---



\## FR-006.009 — Calculate Metrics



Every selected Metric shall be calculated.



Metric calculations must use the published Metric Version.



\---



\## FR-006.010 — Generate Result



Execution shall create exactly one Experiment Result.



The Result references:



\- Experiment Run

\- Metrics

\- Summary

\- Metadata



\---



\## FR-006.011 — Execution Status



Experiment Runs support:



\- queued

\- running

\- completed

\- failed

\- cancelled



\---



\## FR-006.012 — Logging



Execution shall record:



\- Start Time

\- End Time

\- Duration

\- Errors

\- Warnings



\---



\## FR-006.013 — Progress Reporting



Long-running executions should expose progress.



Examples:



\- Current event

\- Current placement

\- Percentage

\- Estimated remaining time



\---



\## FR-006.014 — Parallel Execution



The execution engine should support parallel processing.



Parallel execution must never change analytical results.



\---



\## FR-006.015 — Deterministic Execution



Given:



\- identical Dataset Version

\- identical Layout Version

\- identical Shape Versions

\- identical Metric Versions

\- identical parameters



the execution shall always produce identical results.



\---



\## FR-006.016 — Failure Handling



Execution failures shall never corrupt:



\- Datasets

\- Layouts

\- Shapes

\- Metrics

\- Previous Results



Failed runs remain visible for auditing.



\---



\## FR-006.017 — Repeat Execution



Users shall be able to repeat an Experiment.



The new execution creates a new Experiment Run.



Previous Runs remain unchanged.



\---



\## FR-006.018 — Cancel Execution



Authorized users may cancel running Experiments.



Completed Runs cannot be cancelled.



\---



\## FR-006.019 — Engine Version



Every Experiment Run records the exact Engine Version.



Engine upgrades shall never overwrite historical Runs.



\---



\## Constraints



\- Execution never modifies historical data.

\- Experiment Runs are immutable after completion.

\- Experiment Results are immutable.

\- Metrics never modify Draws.

\- Execution must be reproducible.



\---



\# Acceptance Criteria



✓ Experiment starts successfully.



✓ Experiment Run is created.



✓ Dataset is loaded.



✓ Layout resolves correctly.



✓ Shapes are instantiated.



✓ Placements are generated.



✓ Hits are detected.



✓ Metrics are calculated.



✓ Experiment Result is stored.



✓ Execution log is complete.



✓ Re-running the Experiment creates a new Run.



✓ Historical Runs remain unchanged.



\---



\# Related Specifications



ADR-005 — Immutable Domain Objects



DOM-006 — Experiment



DOM-008 — Experiment Result



DOM-009 — Experiment Run



DB-001 — Core Database



FR-005 — Create Experiment



SEC-001 — Authorization Model



\---



\# Open Questions



1\. Should executions support distributed processing?

2\. Should GPU acceleration be supported?

3\. Should cached placements be reused?

4\. Should executions be resumable after interruption?

5\. Which execution statistics should be retained permanently?

