# FR-010 – Experiment Analysis Service



## Status



Proposed



---



# Purpose



The engine shall provide a single application service that coordinates metric

calculation, ranking and report generation for a completed experiment.



The service shall expose one stable entry point for the complete analysis

workflow.



---



# Goals



The Experiment Analysis Service shall



- provide one public API for experiment analysis,
- coordinate the Metric Engine, Ranking Engine and Report Builder,
- preserve deterministic processing,
- return a complete Experiment Report,
- validate workflow-level input,
- avoid duplicating domain logic already implemented by individual components,
- support future integration with CLI, API and user interfaces.



---



# Functional Requirements



## FR-010-01



The engine shall provide an `ExperimentAnalysisService`.



The service shall accept one analysis request and return one

`ExperimentReport`.


---


## FR-010-02



The service shall calculate configured metrics for every analysis candidate.



Metric calculation shall be delegated to the Metric Engine.



The service shall not reimplement metric calculation logic.



---



## FR-010-03



The service shall convert calculated metric results into rankable results.



Each rankable result shall contain



- a stable result identifier,

- all metric values required by the ranking configuration.



---



## FR-010-04



The service shall rank all successfully evaluated candidates.



Ranking shall be delegated to the Ranking Engine.



The service shall not reimplement normalization, weighting, sorting or

tie-breaking logic.



---



## FR-010-05



The service shall build an experiment report after ranking is complete.



Report creation shall be delegated to the Report Builder.



---



## FR-010-06



The returned report shall contain



- experiment metadata,

- experiment configuration,

- summary statistics,

- the complete ranking result,

- all ranking criterion details,

- the report generation timestamp.



---



## FR-010-07



The service shall preserve candidate identifiers across the complete workflow.



The identifier used during metric evaluation shall be the same identifier used

in



- the rankable result,

- the ranked result,

- the experiment report.



---



## FR-010-08



The service shall preserve the configured metric order.



The order supplied in the analysis request shall be used when



- executing metrics,

- storing metric configuration,

- creating ranking input.



---



## FR-010-09



The service shall preserve the Ranking Engine output without modifying its order

or score values.



---



## FR-010-10



The service shall calculate workflow statistics.



At minimum:



- total candidates,

- evaluated candidates,

- rejected candidates,

- ranked candidates.



---



## FR-010-11



The service shall support an empty candidate collection.



For an empty collection, the service shall return a valid report containing



- zero total candidates,

- zero evaluated candidates,

- zero rejected candidates,

- zero ranked candidates,

- an empty ranking.



---



## FR-010-12



The service shall measure the runtime of the complete analysis workflow.



The measured runtime shall include



- metric calculation,

- ranking,

- report construction preparation.



The runtime shall be stored in milliseconds.



---



## FR-010-13



The service shall accept an optional report generation timestamp.



When a timestamp is supplied, the service shall pass it to the Report Builder.



When no timestamp is supplied, the Report Builder shall generate one.



---



## FR-010-14



The service shall accept an optional engine version.



When supplied, the engine version shall be included in the generated report.



---



## FR-010-15



The service shall not mutate the analysis request, candidates, metric

configuration or ranking configuration.



---



## FR-010-16



The service shall produce deterministic results for identical inputs, excluding

automatically generated timestamps and measured runtime.



---



## FR-010-17



The service shall propagate domain errors from delegated components.



This includes errors produced by



- the Metric Engine,

- the Ranking Engine,

- the Report Builder.



The service shall not silently suppress domain errors.



---



## FR-010-18



The service shall reject duplicate candidate identifiers.



Duplicate identifiers would make ranking and report entries ambiguous.



---



## FR-010-19



The service shall reject an empty experiment identifier.



An identifier containing only whitespace shall also be considered empty.



---



## FR-010-20



The service shall reject an invalid experiment creation timestamp.



The timestamp shall be a valid ISO-compatible date-time string.



---



# Proposed Domain Model



## ExperimentAnalysisRequest



Contains



- metadata

- candidates

- metrics

- ranking configuration

- report configuration

- experiment configuration



---



## ExperimentAnalysisMetadata



Contains



- experimentId

- createdAt

- engineVersion



---



## ExperimentAnalysisCandidate



Contains



- resultId

- metric input



The metric input contains the domain data required by the configured metrics.



---



## ExperimentAnalysisConfiguration



Contains



- layout configuration

- placement generator configuration

- metric configuration

- ranking configuration



---



## ExperimentAnalysisResult



The service returns an `ExperimentReport` directly.



A separate result wrapper is not required for the first version.



---



# Proposed Service



```ts

export class ExperimentAnalysisService {

&#x20; public analyze(

&#x20;   request: ExperimentAnalysisRequest,

&#x20; ): ExperimentReport;

}

```



The concrete constructor dependencies shall be



- Metric Engine

- Ranking Engine

- Report Builder

- runtime clock or timing function, if required for deterministic testing.



---



# Processing Flow



```text

ExperimentAnalysisRequest

&#x20;       │

&#x20;       ▼

Validate workflow input

&#x20;       │

&#x20;       ▼

Calculate metrics for every candidate

&#x20;       │

&#x20;       ▼

Create rankable results

&#x20;       │

&#x20;       ▼

Ranking Engine

&#x20;       │

&#x20;       ▼

Calculate workflow statistics

&#x20;       │

&#x20;       ▼

Report Builder

&#x20;       │

&#x20;       ▼

ExperimentReport

```



---



# Validation Rules



## Experiment Identifier



The experiment identifier



- shall be a string,

- shall not be empty,

- shall not contain only whitespace.



---



## Creation Timestamp



The creation timestamp



- shall be a string,

- shall represent a valid date-time value.



The service shall preserve the supplied timestamp and shall not normalize or

replace it.



---



## Candidate Identifiers



Every candidate identifier



- shall be non-empty,

- shall be unique within the request.



---



## Metric Results



Every metric required by the ranking configuration shall exist after metric

calculation.



Missing or invalid ranking metric values shall be handled by the Ranking Engine.



---



# Error Model



The service shall define workflow-specific errors only for validation that does

not belong to delegated components.



Proposed error codes:



```ts

export type ExperimentAnalysisErrorCode =

&#x20; | "EMPTY_EXPERIMENT_ID"

&#x20; | "INVALID_CREATED_AT"

&#x20; | "EMPTY_RESULT_ID"

&#x20; | "DUPLICATE_RESULT_ID";

```



The service shall preserve errors raised by the Metric Engine, Ranking Engine and

Report Builder.



---



# Runtime Measurement



The runtime shall be measured using a monotonic timing source where available.



The service shall calculate



```text

runtimeMs = endTime - startTime

```



Runtime values shall



- be finite,

- be non-negative,

- be stored in milliseconds.



For deterministic tests, the timing source should be injectable.



---



# Statistics



The report statistics shall be derived as follows:



```text

totalPlacements     = number of supplied candidates

evaluatedPlacements = number of successfully evaluated candidates

rejectedPlacements  = number of rejected candidates

rankedPlacements    = number of ranking entries included in the report

```



For the first version, metric evaluation failures shall abort the analysis.



Therefore, a successfully returned report will normally contain



```text

evaluatedPlacements = totalPlacements

rejectedPlacements  = 0

```



Support for partially successful analysis is outside the first version.



---



# Immutability



The service shall not modify input objects.



The generated report shall inherit the deep immutability guarantees of the

Report Builder.



---



# Determinism



For identical inputs and injected timing values, the service shall produce

equivalent reports.



Determinism includes



- metric execution order,

- metric value mapping,

- ranking order,

- ranking scores,

- report configuration,

- report statistics.



Automatically generated timestamps and real runtime measurements are excluded

unless deterministic values are injected.



---



# Example



```ts

const report = analysisService.analyze({

&#x20; metadata: {

&#x20;   experimentId: "experiment-001",

&#x20;   createdAt: "2026-07-17T08:00:00.000Z",

&#x20;   engineVersion: "1.0.0",

&#x20; },

&#x20; candidates: [

&#x20;   {

&#x20;     resultId: "placement-a",

&#x20;     metricInput: placementAResult,

&#x20;   },

&#x20;   {

&#x20;     resultId: "placement-b",

&#x20;     metricInput: placementBResult,

&#x20;   },

&#x20; ],

&#x20; configuration: {

&#x20;   layout: {

&#x20;     type: "grid",

&#x20;     rows: 3,

&#x20;     columns: 3,

&#x20;   },

&#x20;   placementGenerator: {

&#x20;     strategy: "cartesian",

&#x20;   },

&#x20;   metrics: [

&#x20;     {

&#x20;       metricId: "average-hit",

&#x20;     },

&#x20;     {

&#x20;       metricId: "max-hit",

&#x20;     },

&#x20;   ],

&#x20;   ranking: {

&#x20;     criteria: [

&#x20;       {

&#x20;         metricId: "average-hit",

&#x20;         weight: 0.75,

&#x20;         direction: "descending",

&#x20;       },

&#x20;       {

&#x20;         metricId: "max-hit",

&#x20;         weight: 0.25,

&#x20;         direction: "descending",

&#x20;       },

&#x20;     ],

&#x20;   },

&#x20; },

});

```



---



# Acceptance Criteria



- one service coordinates the complete analysis workflow,

- configured metrics are calculated for every candidate,

- calculated metric values are converted into ranking input,

- ranking is delegated to the Ranking Engine,

- report creation is delegated to the Report Builder,

- candidate identifiers remain stable,

- workflow statistics are correct,

- runtime is measured,

- empty candidate collections are supported,

- duplicate candidate identifiers are rejected,

- invalid experiment metadata is rejected,

- delegated domain errors are preserved,

- input objects are not mutated,

- identical deterministic inputs produce equivalent reports.



---



# Out of Scope



- persistence of reports,

- database access,

- asynchronous job execution,

- distributed execution,

- partial success after metric failures,

- retries,

- progress reporting,

- cancellation,

- streaming results,

- report comparison,

- JSON or CSV serialization,

- CLI integration,

- REST API integration,

- UI integration.

