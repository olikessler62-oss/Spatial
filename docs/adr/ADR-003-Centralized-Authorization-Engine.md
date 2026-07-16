\# ADR-003 — Centralized Authorization Engine



\*\*Status:\*\* Accepted



\*\*Date:\*\* 2026-07-16



\*\*Authors:\*\* Oliver Kessler, Project Spatial Architecture



\---



\# Context



Project Spatial contains different types of resources:



\- Datasets

\- Layouts

\- Shapes

\- Experiments

\- Studies

\- Community Content



Each resource has its own visibility and ownership rules.



Implementing authorization separately for every table would lead to duplicated logic, inconsistent policies and difficult maintenance.



\---



\# Decision



Project Spatial uses a centralized authorization engine.



All Row Level Security (RLS) policies delegate authorization decisions to reusable PostgreSQL functions.



Policies remain minimal.



Business rules are implemented inside the Security Engine.



\---



\# Example



Instead of:



```sql

using (

&#x20;   visibility = 'public'

&#x20;   OR created\_by = auth.uid()

)

```



the policy becomes:



```sql

using (

&#x20;   security.can\_access(

&#x20;       'experiment',

&#x20;       id,

&#x20;       auth.uid()

&#x20;   )

)

```



\---



\# Advantages



\- Single source of truth

\- Consistent authorization

\- Easy maintenance

\- Reusable policies

\- Supports future workspaces

\- Supports premium features

\- Supports community roles

\- Supports administrators

\- Supports API access



\---



\# Consequences



Every new resource must expose its authorization through the Security Engine.



RLS policies should never contain complex business logic.



\---



\# Future Extensions



\- Workspace memberships

\- Teams

\- Organizations

\- Premium subscriptions

\- Temporary access links

\- Shared experiments

\- Moderation roles



\---



\# Guiding Principle



Authorization rules belong to the Security Engine.



Policies only enforce them.



\---



\# Related Specifications



ADR-000



DB-001



Security Engine (planned)

