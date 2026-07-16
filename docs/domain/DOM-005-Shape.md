# DOM-005 — Shape

**Status:** Draft

**Version:** 1.0

**Owner:** Core Domain

---

# Purpose

A Shape defines a selectable spatial region within a Layout.

Shapes are the primary objects used to perform spatial experiments.

---

# Definition

A Shape is a collection of one or more positions inside a Layout.

Shapes are independent of the lottery numbers themselves.

They only define spatial relationships.

---

# Responsibilities

A Shape is responsible for:

- selecting positions
- defining spatial regions
- serving as the target of experiments
- supporting reusable analysis

---

# Does NOT

A Shape never

- stores draw data
- performs calculations
- contains metrics
- predicts results

---

# Properties

| Property | Description |
|----------|-------------|
| ShapeId | Unique identifier |
| Name | Shape name |
| ShapeType | Built-in or Custom |
| Positions | Referenced layout positions |
| Parameters | Shape-specific settings |
| Version | Shape version |

---

# Relationships

Layout

└── contains → Shape

Shape

├── used by → Experiment

└── evaluated by → Metric

---

# Constraints

- A Shape belongs to exactly one Layout.
- A Shape contains at least one position.
- Shapes are immutable once published.

---

# Built-in Shapes (v1)

- Single Cell
- Line
- Rectangle
- Square
- Triangle
- Circle
- Ring
- Cross
- L-Shape
- X-Shape
- Custom Selection

---

# Future Extensions

- Random Shape
- Moving Shape
- Recursive Shape
- Composite Shapes
- AI-generated Shapes

---

# Guiding Principle

A Shape represents an area of interest.

It never represents a prediction.

---

# Related Specifications

ADR-000

ADR-001

DOM-004 Layout

DOM-006 Experiment