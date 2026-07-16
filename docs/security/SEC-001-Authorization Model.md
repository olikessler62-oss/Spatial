\# SEC-001 — Authorization Model



\*\*Status:\*\* Accepted



\*\*Date:\*\* 2026-07-16



\*\*Authors:\*\* Oliver Kessler, Project Spatial Architecture



\---



\# Purpose



Project Spatial uses Row-Level Security (RLS) together with a centralized authorization engine.



Authorization must be:



\- consistent

\- extensible

\- testable

\- domain-driven



Business rules shall never be duplicated across individual RLS policies.



\---



\# Guiding Principle



RLS policies enforce access.



The Security Engine decides access.



\---



\# Visibility Levels



Every shareable domain object supports one of the following visibility levels.



| Visibility | Description |

|------------|-------------|

| private | Only the owner |

| workspace | Members of the workspace |

| community | Visible to registered users |

| public | Visible to everyone |

| system | Managed by the platform |



\---



\# Ownership



Every mutable resource has an owner.



```text

created\_by → auth.users.id

```



Ownership grants full control unless restricted by immutable lifecycle rules.



\---



\# Security Engine



Every RLS policy delegates authorization to



```sql

security.can\_access(

&#x20;   resource\_type,

&#x20;   resource\_id,

&#x20;   auth.uid()

)

```



The function becomes the single source of truth.



\---



\# Authorization Order



Access is evaluated in the following order:



1\. Service Role

2\. System Resources

3\. Owner

4\. Workspace Membership

5\. Community Visibility

6\. Public Visibility

7\. Deny



\---



\# Future Extensions



The Security Engine is designed for future support of:



\- Teams

\- Organizations

\- Research Groups

\- Premium Features

\- API Keys

\- Invitations

\- Shared Links

\- Moderators

\- Administrators



without changing existing RLS policies.



\---



\# Design Rules



Policies should never contain business logic.



Policies should only delegate authorization.



\---



\# Example



Instead of



```sql

visibility='public'

OR created\_by=auth.uid()

```



the policy becomes



```sql

security.can\_access(

&#x20;   'dataset',

&#x20;   id,

&#x20;   auth.uid()

)

```



\---



\# Benefits



\- One authorization model

\- Easy maintenance

\- Consistent behavior

\- Testable

\- Extensible

\- Clean database policies



\---



\# Related Specifications



ADR-003 — Centralized Authorization Engine



ADR-004 — Modular Database Architecture



ADR-005 — Immutable Domain Objects

