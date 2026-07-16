# DOM-002 — Draw

**Status:** Draft

**Version:** 1.0

**Owner:** Core Domain

---

# Purpose

A Draw represents one official lottery drawing at a specific point in time.

It is the smallest immutable unit of historical lottery data and the foundation for all analyses within Project Spatial.

---

# Definition

A Draw contains the officially published result of a single lottery event.

A Draw never changes after it has been imported.

---

# Responsibilities

A Draw is responsible for:

- storing the official drawn numbers
- storing the draw date
- storing optional bonus numbers
- providing immutable historical data for experiments

---

# Does NOT

A Draw never

- performs calculations
- contains metrics
- contains patterns
- contains user data
- predicts future draws

---

# Properties

| Property | Description |
|----------|-------------|
| DrawId | Unique identifier |
| LotteryId | Associated lottery |
| DrawDate | Official draw date |
| MainNumbers | Drawn main numbers |
| BonusNumbers | Optional bonus numbers |
| ImportTimestamp | Import date and time |
| Source | Data source |

---

# Relationships

Dataset

└── contains → Draw

Draw

└── used by → Experiment

Lottery

└── owns → Draw

---

# Constraints

- A Draw is immutable.
- Numbers must be unique within a draw.
- Numbers must comply with the lottery rules.
- A Draw belongs to exactly one Dataset.

---

# Future Extensions

- Validation status
- Import checksum
- Digital signature
- Multiple official sources

---

# Related Specifications

ADR-000

ADR-001

DOM-001 Dataset

DOM-003 Lottery