# VIS-001 — Universal Pattern Analysis Platform

**Status:** Draft  
**Version:** 0.1  
**Date:** 2026-07-19  
**Owner:** Product / Architecture  
**Related:** MANIFESTO, ADR-000, ADR-001, ADR-002, DOM-001–DOM-009, UI-001

---

## 1. Purpose

Project Spatial is a universal analysis tool for discovering structure in ordered or unordered number sequences by projecting them onto user-defined spatial patterns.

The analytical subject is **not the individual numbers**, but the **patterns** (regions, shapes, placements) through which sequences pass over time.

Users run historical sequences across a fixed spatial arrangement in order to detect irregularities, streaks, voids, recurrences and probabilistic signals — for example:

> In a 10×10 grid, how often was a particular 2×2 region missed for several consecutive sequences, and how likely is a hit in that region after two, three or four misses?

The first concrete domain is lottery analysis. The product architecture must also support Geo data, weather data and other sequence domains without changing the core pattern engine.

---

## 2. Product Thesis

1. Sequences contain spatial structure that becomes visible only when projected onto a layout.
2. Analysis compares **pattern hits over time**, not number frequencies in isolation.
3. The same engine (layouts, shapes, placements, hit evaluation, metrics, ranking) serves multiple analysis domains.
4. Reproducibility and saved patterns matter more than one-off curiosity.
5. Successful patterns may later be published for community reuse and further experimentation.

This aligns with the Manifesto: Spatial is not a prediction engine; it is a platform for discovering structure, testing ideas and building shared knowledge.

---

## 3. Core Concepts

| Concept | Meaning |
|---------|---------|
| Analysis Domain | Kind of analysis (e.g. Lottery, Geo, Weather) |
| Scope | First dependent filter (e.g. Country / Region) |
| Subject | Second dependent filter (e.g. Lottery product, City, State) |
| Number Space | Valid value range and cardinality for the subject (e.g. 1–49, count 6) |
| Layout | Spatial arrangement of the number space (grid, ring, star, octagon, custom rectangle) |
| Ordering Mode | Ordered (deterministic mapping) or unordered / arbitrary mapping of values onto positions |
| Shape / Pattern | Relative geometry tested against the layout (e.g. 2×2 block, line, custom) |
| Sequence Set | Historical draws / events / time series projected onto the layout |
| Experiment | Reproducible combination of Subject + Layout + Shape(s) + Metrics + Sequence Set |
| Pattern Insight | Observed streak, void, recurrence or probabilistic signal on placements |

---

## 4. Primary User Journey

```text
Select Analysis Domain
        ↓
Select Scope (e.g. Country)
        ↓
Select Subject (e.g. Lottery / City / Region)
        ↓
Define or load a Layout (form + ordered/unordered)
        ↓
Define or load Shape(s) / Patterns
        ↓
Attach Sequence Set (import or existing dataset)
        ↓
Run analysis (engine compares pattern hits over sequences)
        ↓
Inspect rankings, voids, streaks, probabilities
        ↓
Save pattern configuration for next draw / next experiment
        ↓
(Later) Publish pattern for other users
```

---

## 5. Analysis Context Selection

The application shell (sidebar and/or header) must expose a cascading analysis context:

1. **Analysis Domain** — e.g. Lottery analysis, Geo analysis, Weather analysis, custom domains later
2. **Scope** — depends on domain — e.g. Country
3. **Subject** — depends on Scope — e.g.
   - Lottery: `6 aus 49`, `EuroJackpot`
   - Geo/Weather: state / city / area (e.g. Germany → Hessen)

Selecting a Subject determines:

- available Number Space (min, max, optional pool rules / bonus pools)
- available Sequence Sets / datasets
- default or previously saved Layouts and Patterns for that Subject

UI details: see UI-001.

---

## 6. Layout Composer (Pattern Canvas)

Users must be able to arrange the Number Space into spatial forms, for example:

- ring / circle of N positions
- octagon
- star with K arms
- rectangle / grid: 2×25, 4×10, 5×10, 7×7, 10×10, etc.
- other custom arrangements later

### 6.1 Constraints

- The Number Space (min/max and value count) is the foundation of the layout.
- Example: values 1–50 → valid grids include 1×50, 2×25, 5×10; **4×10 is invalid** because 40 ≠ 50.
- A ring with Number Space size 50 has exactly 50 positions on the circumference.
- Users choose whether values are mapped **ordered** or **unordered/arbitrary** onto positions.
- Layout definitions must be savable and reloadable per Subject (and later publishable).

### 6.2 Intent

Layouts exist so that sequences can be replayed across a stable geometry. Patterns (shapes/regions) are then evaluated for:

- long untouched regions
- frequently hit regions
- conditional probabilities after miss streaks (e.g. after 2 / 3 / 4 consecutive misses)

---

## 7. What the Engine Analyzes

The background engine (already scaffolding in `@spatial/engine`) performs geometric placement and hit comparison.

Analyses must answer pattern-level questions such as:

- Which placements were not hit for the longest consecutive sequence streak?
- After N consecutive misses on a placement, how often did a hit follow on the next sequence?
- How do average / maximum hits distribute across placements of a shape?
- Do certain regions systematically under- or over-appear relative to a chosen baseline?

Analyses do **not** primarily answer “which number is due?”, but “which spatial pattern behavior is unusual under repeated projection?”.

---

## 8. Persistence and Reuse

Users must be able to:

1. Save a Layout + Ordering Mode for a Subject
2. Save Shape / Pattern definitions
3. Save an Experiment configuration referencing Subject, Layout, Shape(s), Metrics and Sequence Set
4. Re-open the same pattern after a new sequence arrives (e.g. a new lottery draw) and re-run analysis
5. Create new patterns to continue experimentation

### 8.1 Later: Publishing

Users who discover useful patterns may publish them inside the application so others can:

- inspect them
- reuse them
- fork / continue experimenting

Publishing is a later milestone; the domain model and visibility fields should anticipate it (`private` → `shared` / `community` / `published`).

---

## 9. Domain Generality vs Lottery First

| Phase | Scope |
|-------|-------|
| Spatial 1.0 foundation | Lottery domain fully wired (import, layouts, shapes, experiments, ranking) |
| Near-term UX | Cascading Domain → Scope → Subject + Layout Composer |
| Expansion | Geo / Weather / custom sequence domains using the same Layout/Shape/Experiment abstractions |
| Community | Pattern publishing and discovery |

Lottery remains the reference domain because rule changes, datasets and the bitmask engine are already specified. Geo/Weather must plug into the same abstractions rather than fork the engine.

---

## 10. Non-Goals (this vision)

- Guaranteeing future outcomes or selling predictions
- Replacing domain-specific GIS / meteorological modeling tools
- Full visual CAD-level geometry editing in the first UI slice
- Bonus-pool spatial analysis before main-pool pattern analysis is solid

---

## 11. Relationship to Existing Specs

| Existing | Role under this vision |
|----------|------------------------|
| DOM-003 Lottery / DOM-001 Dataset | First Analysis Domain implementation |
| DOM-004 Layout / DOM-005 Shape | Pattern canvas building blocks |
| DOM-006–009 Experiment path | Reproducible pattern experiments |
| ADR-006 Bitmasks | Fast hit detection for placements vs sequences |
| FR-001–FR-010 | Import, manage, execute, rank, report |
| UI-001 | Shell selectors + layout composer IA |

Gaps to specify next (follow-up docs):

- DOM for Analysis Domain / Scope / Subject (domain-independent)
- FR for Layout Composer (ordered/unordered, partition validation)
- FR for streak / miss-probability metrics
- FR for pattern save / load / publish

---

## 12. Success Criteria

The product succeeds when a user can:

1. Choose Lottery → Country → specific lottery
2. Build a valid layout (e.g. 7×7 ordered, or ring) from the Number Space
3. Choose or define a pattern (e.g. 2×2)
4. Run historical sequences through it
5. See pattern-level anomalies (voids, streaks, conditional hit rates)
6. Save the configuration and reuse it after the next draw

---

## 13. Open Questions

1. Which Analysis Domains ship in the first public UI besides Lottery?
2. Should unordered layouts be user-shuffled once and frozen, or reshuffled per experiment version?
3. Which streak / conditional-probability metrics are first-class vs experimental?
4. What is the minimum publish workflow (visibility only vs review/moderation)?

---

## 14. Summary

Spatial is a **pattern laboratory for number sequences**.  
Users define how a number space is arranged in space, project sequences through that arrangement, and study the behavior of patterns over time — first for lotteries, then for any compatible sequence domain.
