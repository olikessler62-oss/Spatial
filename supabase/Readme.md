\# Project Spatial - Row Level Security



Every domain object has its own policy file.



Rules:



\- Never define RLS inside migrations.

\- Every table owns exactly one policy file.

\- Policies must be idempotent.

\- Policies may safely be executed multiple times.

\- Policies evolve independently from the database schema.

