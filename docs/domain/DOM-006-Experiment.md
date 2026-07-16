\# DOM-006 — Experiment



\*\*Status:\*\* Draft



\*\*Version:\*\* 1.0



\*\*Owner:\*\* Core Domain



\---



\# Purpose



An Experiment defines a reproducible analysis performed on one or more historical lottery datasets.



Experiments are the central element of Project Spatial.



\---



\# Definition



An Experiment combines a Dataset, one or more Layouts, one or more Shapes and one or more Metrics to answer a specific research question.



Every Experiment must be reproducible.



\---



\# Responsibilities



An Experiment is responsible for:



\- defining the research objective

\- selecting the Dataset

\- selecting the Layout

\- selecting one or more Shapes

\- selecting Metrics

\- executing the analysis

\- producing reproducible results



\---



\# Does NOT



An Experiment never



\- modify historical data

\- predict future draws

\- change Layouts or Shapes

\- alter Metrics



\---



\# Properties



| Property | Description |

|----------|-------------|

| ExperimentId | Unique identifier |

| Name | Experiment name |

| Description | Research objective |

| Dataset | Target dataset |

| Layout | Selected layout |

| Shapes | Selected shapes |

| Metrics | Selected metrics |

| Parameters | Experiment settings |

| CreatedBy | Author |

| CreatedAt | Creation timestamp |

| Version | Experiment version |



\---



\# Relationships



Experiment



├── uses → Dataset



├── uses → Layout



├── uses → Shape(s)



├── evaluates → Metric(s)



└── produces → Result



\---



\# Constraints



\- Every Experiment must reference exactly one Dataset.

\- Every Experiment must use at least one Layout.

\- Every Experiment must use at least one Shape.

\- Every Experiment must define at least one Metric.

\- Experiments are reproducible.



\---



\# Example



Research Question



"How often does a 2×2 Shape remain without a hit for more than 20 consecutive draws?"



Dataset



EuroJackpot



Layout



7×7 Grid



Shape



2×2 Block



Metric



Gap Length



\---



\# Future Extensions



\- Batch Experiments

\- Parameter Sweeps

\- AI-assisted Experiments

\- Scheduled Experiments

\- Comparative Experiments



\---



\# Guiding Principle



An Experiment answers a question.



It never makes a promise.



\---



\# Related Specifications



ADR-000



ADR-001



DOM-001 Dataset



DOM-004 Layout



DOM-005 Shape



DOM-007 Metric



DOM-008 Result

