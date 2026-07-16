\# FR-003 — Manage Layouts



\*\*Document ID:\*\* FR-003  

\*\*Status:\*\* Draft  

\*\*Version:\*\* 1.0  

\*\*Date:\*\* 2026-07-16  

\*\*Owner:\*\* Analysis Domain



\---



\## Purpose



Users shall be able to create, configure, version, inspect and manage spatial layouts.



A Layout defines how values from a Lottery or Dataset are mapped to spatial positions.



Layouts change the analytical perspective, but never the underlying data.



\---



\## Actors



\- Explorer

\- Analyst

\- Researcher

\- Administrator



\---



\## Functional Requirements



\### FR-003.001 — Browse Layouts



The system shall allow users to browse all layouts they are authorized to access.



Layouts may be filtered by:



\- Lottery

\- Layout type

\- Owner

\- Visibility

\- Publication status



\---



\### FR-003.002 — View Layout



The system shall display:



\- Layout name

\- Layout type

\- Coordinate system

\- Version

\- Owner

\- Visibility

\- Position count

\- Number mapping

\- Status



\---



\### FR-003.003 — Create Layout



Authorized users shall be able to create a new Layout.



Required information:



\- Name

\- Lottery

\- Layout type

\- Coordinate system

\- Visibility



\---



\### FR-003.004 — Configure Positions



Users shall be able to assign each supported value to one spatial position.



A position may contain:



\- Cartesian coordinates

\- Polar coordinates

\- Logical coordinates

\- Metadata



\---



\### FR-003.005 — Validate Layout



Before publication, the system shall validate that:



\- every required value is mapped,

\- no value is mapped more than once,

\- all positions are valid,

\- the mapping matches the Lottery rules,

\- the coordinate configuration is complete.



\---



\### FR-003.006 — Version Layout



A change affecting spatial mapping or analytical behavior shall create a new `LayoutVersion`.



Published Layout Versions are immutable.



\---



\### FR-003.007 — Edit Metadata



Users may edit non-analytical metadata without creating a new version.



Examples:



\- Display name

\- Description

\- Tags



Changes to coordinates, mappings or parameters require a new version.



\---



\### FR-003.008 — Duplicate Layout



Users shall be able to create an editable copy of an existing Layout or Layout Version.



The copy shall reference its source.



\---



\### FR-003.009 — Publish Layout



Authorized users shall be able to publish a validated Layout Version.



Published versions may be used by experiments and shared with other users according to their visibility.



\---



\### FR-003.010 — Archive Layout



Users shall be able to archive a Layout.



Archived Layouts remain available to existing Experiments and Experiment Runs.



\---



\### FR-003.011 — Built-in Layout Types



The MVP shall support:



\- Grid

\- Circle

\- Polygon

\- Spiral

\- Custom



\---



\### FR-003.012 — Preview Layout



The system shall provide a visual preview before validation or publication.



The preview shall show:



\- positions,

\- mapped values,

\- coordinate structure,

\- unmapped or invalid positions.



\---



\### FR-003.013 — Visibility



Layouts shall support:



\- private

\- workspace

\- community

\- public

\- system



\---



\### FR-003.014 — Ownership



Every user-created Layout shall record its owner through `created\_by`.



\---



\## Constraints



\- A Layout belongs to one Lottery.

\- A Layout Version is deterministic.

\- Each supported value has exactly one position.

\- Published Layout Versions are immutable.

\- Existing Experiments retain references to their original Layout Version.

\- A Layout does not contain Draws, Metrics or Results.



\---



\## Acceptance Criteria



\- A user can create a Grid Layout.

\- Every required Lottery value can be mapped to a position.

\- Duplicate mappings are rejected.

\- Missing mappings are reported.

\- A valid Layout can be published.

\- Editing a published mapping creates a new version.

\- Existing Experiments continue using the original version.

\- A Layout can be previewed before publication.

\- Unauthorized users cannot modify private Layouts.



\---



\## Related Specifications



\- ADR-001 — Domain-Driven Design

\- ADR-002 — Progressive Complexity

\- ADR-005 — Immutable Domain Objects

\- DOM-003 — Lottery

\- DOM-004 — Layout

\- SEC-001 — Authorization Model

\- DB-001 — Core Database



\---



\## Open Questions



1\. Must every Layout map the complete Lottery number space?

2\. May Custom Layouts contain intentionally empty positions?

3\. Should rotations and reflections create new versions or runtime transformations?

4\. Are Layouts always Lottery-specific, or may generic reusable Layout templates exist?

5\. Which Layout types belong to the free plan?

