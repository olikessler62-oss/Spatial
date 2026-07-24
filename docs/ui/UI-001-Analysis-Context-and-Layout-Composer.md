# UI-001 — Analysis Context and Layout Composer

**Status:** Draft  
**Version:** 0.1  
**Date:** 2026-07-19  
**Owner:** Product / Web  
**Related:** VIS-001, FR-003, FR-004, FR-005, DOM-004, DOM-005

---

## 1. Purpose

Define the primary application chrome and composition UI that lets users:

1. select an Analysis Domain and cascading Scope / Subject
2. compose a spatial Layout from the Subject’s Number Space
3. attach Patterns (Shapes) and run / save experiments

This UI sits on top of the existing Spatial web shell and engine scaffolding.

---

## 2. Shell: Analysis Context Controls

### 2.1 Placement

Cascading selectors appear in the **sidebar** (primary) and may be mirrored in a compact form in the **top bar** when a page needs local context.

### 2.2 Controls (dependent)

| Order | Control | Examples |
|------:|---------|----------|
| 1 | Analysis Domain | Lottozahlenanalyse, Geodatenanalyse, Wetterdatenanalyse |
| 2 | Scope | Deutschland, EU, … |
| 3 | Subject | 6 aus 49, EuroJackpot, Hessen, … |

Rules:

- Changing Domain clears and reloads Scope options.
- Changing Scope clears and reloads Subject options.
- Subject selection sets active Number Space, available Datasets, saved Layouts and Patterns.
- If a level has only one option, it may be auto-selected but must remain visible.

### 2.3 Empty / loading states

- No domains configured → explain setup / admin seed required
- Domain selected but no Scope → “Keine Bereiche verfügbar”
- Subject without datasets → CTA to import sequences

---

## 3. Information Architecture (MVP+)

```text
Übersicht
Ziehungen / Sequenzen (import + browse; label depends on Domain)
Layouts          ← Layout Composer + saved layouts
Formen / Pattern ← shape definitions
Experimente      ← configure + run
Analysen         ← results / rankings
(Community)      ← later: published patterns
Administration   ← later
```

Domain-specific wording should adapt (e.g. “Ziehungen” for Lottery, “Ereignisse” / “Messreihen” for other domains) without changing routes in the first iteration.

---

## 4. Layout Composer

### 4.1 Entry

Route: `/app/layouts/new` (create) and `/app/layouts/[id]` (edit / view saved)

Requires an active Subject from the Analysis Context. If missing, prompt to select Domain → Scope → Subject first.

### 4.2 Inputs

1. **Form type**
   - Grid / Rectangle (`rows` × `columns`)
   - Ring / Circle
   - Octagon
   - Star (`arms` count)
   - (Later) freeform
2. **Partition parameters** derived from Number Space size `N`
   - Grid: propose factor pairs of `N` (e.g. for 50 → 1×50, 2×25, 5×10, 10×5, 25×2, 50×1)
   - Invalid partitions (product ≠ `N`) must be rejected with an inline explanation
   - Ring: always `N` positions
   - Star / Octagon: map `N` positions onto the chosen geometry with documented packing rules
3. **Ordering mode**
   - Ordered — deterministic index → value mapping
   - Unordered / arbitrary — user-confirmed shuffle; stored immutably with the Layout Version
4. **Name + optional description**
5. **Preview canvas** — shows positions and mapped values (or placeholders while unordered shuffle is pending)

### 4.3 Validation copy (examples)

- “4×10 benötigt 40 Positionen, die Zahlenmenge hat 50 Werte.”
- “Für 1–49 sind 7×7 (49) und 1×49 gültige Raster.”

### 4.4 Save

Saving creates a Layout (+ Layout Version) bound to the Subject’s lottery/domain entity, including:

- geometry parameters
- ordering mode
- value→position mapping (especially required for unordered)
- content hash for reproducibility

---

## 5. Pattern (Shape) Selection

After a Layout exists (or is selected):

- User picks an existing Shape / Pattern (e.g. 2×2, Linie 3) or creates one
- Patterns are relative geometries evaluated across all valid placements on the Layout
- Saved Experiments reference Layout Version + Shape Version(s) + Sequence Set

---

## 6. Run and Reuse Flow

1. Context selected (Domain / Scope / Subject)
2. Layout selected or composed
3. Pattern selected
4. Dataset / Sequence Set selected
5. “Analyse starten” → engine run → Analysen detail (ranking, streaks later)
6. Configuration remains saved so the user can re-run after new sequences arrive

---

## 7. Publishing (later UI)

- Action “Pattern publizieren” on a saved Experiment or Layout/Shape bundle
- Visibility transitions to community/public
- Browse view for other users to clone / experiment

Out of scope for the first composer slice; reserve navigation placeholder only.

---

## 8. Acceptance Criteria

- [ ] Domain → Scope → Subject cascading selectors work and reset dependents
- [ ] Subject exposes Number Space used by Layout Composer
- [ ] Grid partitions only allow factorizations of `N`
- [ ] Ordered and unordered modes are selectable and persisted
- [ ] Ring layout uses exactly `N` positions
- [ ] Saved layout can be reselected for a later experiment on the same Subject
- [ ] German UI copy for the lottery path; domain labels extensible

---

## 9. Implementation Notes (non-normative)

- Current dashboard MVP already has lottery-centric experiment wizard and seeded grids; this spec generalizes that UX.
- Engine `GridLayout` covers rectangular cases; ring/star/octagon require layout strategy extensions before UI enables them.
- Cascading context should become shared app state (context provider) rather than page-local only.
