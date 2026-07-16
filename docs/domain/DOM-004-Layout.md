\# DOM-004 — Layout



\*\*Status:\*\* Draft



\*\*Version:\*\* 1.0



\*\*Owner:\*\* Core Domain



\---



\# Purpose



A Layout defines the spatial arrangement of numbers.



It transforms a linear number space into a reproducible spatial representation used for visualization and experiments.



\---



\# Definition



A Layout maps every number of a Lottery to a unique spatial position.



Different Layouts may represent the same Dataset without changing the underlying data.



\---



\# Responsibilities



A Layout is responsible for:



\- mapping numbers to positions

\- defining the spatial structure

\- supporting visualization

\- providing coordinates for experiments



\---



\# Does NOT



A Layout never



\- stores draw data

\- performs calculations

\- contains metrics

\- predicts results



\---



\# Properties



| Property | Description |

|----------|-------------|

| LayoutId | Unique identifier |

| Name | Layout name |

| Type | Grid, Circle, Polygon, Spiral, Custom |

| Coordinate System | Cartesian, Polar, Hexagonal, ... |

| Number Mapping | Number → Position |

| Parameters | Layout-specific settings |

| Version | Layout version |



\---



\# Relationships



Lottery



└── supports → Layout



Layout



├── contains → Positions



├── contains → Shapes



└── used by → Experiment



\---



\# Constraints



\- Every number has exactly one position.

\- A Layout is deterministic.

\- Multiple Layouts may exist for the same Lottery.

\- Layouts are immutable once published.



\---



\# Supported Layout Types (v1)



\- Grid

\- Circle

\- Polygon

\- Spiral

\- Custom



\---



\# Future Extensions



\- Hexagonal Grid

\- Honeycomb

\- Radial Grid

\- Tree Layout

\- User-defined Layouts

\- AI-generated Layouts



\---



\# Guiding Principle



The same data may reveal different patterns when viewed through different spatial layouts.



Layouts never change data.



They only change perspective.



\---



\# Related Specifications



ADR-000



ADR-001



DOM-002 Draw



DOM-003 Lottery



DOM-005 Shape

