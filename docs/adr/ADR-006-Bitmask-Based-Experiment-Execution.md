\# ADR-006 — Bitmask-Based Experiment Execution



\*\*Status:\*\* Accepted  

\*\*Date:\*\* 2026-07-17  

\*\*Authors:\*\* Oliver Kessler, Project Spatial Architecture



\---



\## Context



Project Spatial compares many spatial Shape Placements against many historical Draws.



A coordinate-based comparison would repeatedly iterate over positions and values. With larger datasets, many Shapes and repeated Experiment Runs, this would create unnecessary computational overhead.



Layouts already assign every supported value a deterministic zero-based index.



This allows Draws and Placements to be represented as bitmasks.



\---



\## Decision



Project Spatial uses bitmasks as the primary internal representation for spatial hit detection.



Each Layout position corresponds to exactly one bit.



A Draw is represented by setting the bits of its drawn values.



A Shape Placement is represented by setting the bits of all positions covered by that placement.



Hit detection is calculated using a bitwise intersection:



```text

Placement Mask

AND

Draw Mask

=

Hit Mask

