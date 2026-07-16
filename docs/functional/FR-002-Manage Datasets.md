\# FR-002 — Manage Datasets



\*\*Status:\*\* Draft



\*\*Version:\*\* 1.0



\*\*Date:\*\* 2026-07-16



\---



\# Purpose



Users shall be able to create, organize, version and manage datasets independently from the data import process.



A dataset represents a logical collection of historical events.



Individual imports create immutable dataset versions.



\---



\# Actors



\- Explorer (read only)

\- Analyst

\- Researcher

\- Administrator



\---



\# Functional Requirements



\## FR-002.001



The system shall allow users to create a new dataset.



\---



\## FR-002.002



The system shall allow users to edit dataset metadata.



Editable fields include:



\- Name

\- Description

\- Tags

\- Visibility



The historical data itself shall not be editable.



\---



\## FR-002.003



The system shall create a new DatasetVersion whenever imported data changes.



Dataset versions are immutable.



\---



\## FR-002.004



Users shall be able to browse all versions of a dataset.



\---



\## FR-002.005



Users shall be able to compare dataset versions.



\---



\## FR-002.006



Users shall be able to archive datasets.



Archived datasets remain available for reproducibility.



\---



\## FR-002.007



Datasets may define one default version.



Experiments automatically use the default version unless another version is explicitly selected.



\---



\## FR-002.008



Datasets shall support the following visibility levels:



\- private

\- workspace

\- community

\- public

\- system



\---



\## FR-002.009



Datasets shall record ownership.



Owner:



```text

created\_by

```



\---



\## FR-002.010



Every dataset shall maintain an audit history.



\---



\# Constraints



DatasetVersion objects are immutable.



Deleting published dataset versions is prohibited.



Historical references must remain valid.



\---



\# Acceptance Criteria



✓ Create dataset



✓ Edit metadata



✓ Import new version



✓ Browse version history



✓ Select default version



✓ Archive dataset



✓ Preserve reproducibility



\---



\# Related Specifications



DOM-001 — Dataset



DB-001 — Core Database



ADR-005 — Immutable Domain Objects



SEC-001 — Authorization Model

