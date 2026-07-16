\# DOM-003 — Lottery



\*\*Status:\*\* Draft



\*\*Version:\*\* 1.0



\*\*Owner:\*\* Core Domain



\---



\# Purpose



A Lottery defines the official rules of a lottery game.



It specifies how draws are performed, which numbers are valid, and which additional rules apply.



\---



\# Definition



A Lottery represents a specific lottery game, such as Lotto 6 aus 49, EuroJackpot or Powerball.



It defines the constraints that every Draw within the Dataset must follow.



\---



\# Responsibilities



A Lottery is responsible for:



\- defining the number space

\- defining the draw rules

\- defining bonus number rules

\- defining draw frequency

\- validating Draws



\---



\# Does NOT



A Lottery never



\- stores historical draws

\- performs experiments

\- calculates metrics

\- predicts future draws



\---



\# Properties



| Property | Description |

|----------|-------------|

| LotteryId | Unique identifier |

| Name | Official lottery name |

| Country | Country or region |

| NumberRange | Example: 1–49 |

| MainNumbersCount | Example: 6 |

| BonusNumberRange | Optional |

| BonusNumbersCount | Optional |

| DrawFrequency | Weekly, Daily, etc. |

| Operator | Lottery operator |

| Active | Active / Inactive |



\---



\# Relationships



Lottery



├── owns → Dataset



├── defines → Draw



└── defines → Drawing Rules



\---



\# Constraints



\- A Lottery has exactly one rule set.

\- Every Draw must comply with the Lottery rules.

\- Rule changes create a new Lottery Version.



\---



\# Examples



Lottery



Lotto 6 aus 49



\- Number Range: 1–49

\- Main Numbers: 6

\- Bonus Number: Superzahl



\---



Lottery



EuroJackpot



\- Number Range: 1–50

\- Main Numbers: 5

\- Euro Numbers: 2 from 12



\---



\# Future Extensions



\- Multiple prize classes

\- Multiple bonus number types

\- Regional variations

\- Historical rule versions



\---



\# Related Specifications



ADR-000



ADR-001



DOM-001 Dataset



DOM-002 Draw



DOM-004 Layout

