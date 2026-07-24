import {
  AverageHitMetric,
  CartesianShapeResolver,
  createMetricRankingAdapter,
  DrawIndexer,
  ExperimentOrchestrator,
  ExperimentRunner,
  GridLayout,
  LayoutPositionIndex,
  PlacementIndexer,
  ShapePlacementGenerator,
  type ExperimentAnalysisConfiguration,
  type ShapeDefinition,
} from "@spatial/engine";


const demoLayout = new GridLayout({
  id: "demo-layout",
  name: "Demo Layout",
  type: "grid",
  minimumValue: 1,
  maximumValue: 16,
  columns: 4,
});

const demoshape: ShapeDefinition = {
  id: "demo-square",
  name: "Demo Square",
  positions: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
};

const demoDraws = [
 {
    drawDate: "2026-07-18",
    externalId: "test-draw-1",
    mainNumbers: [4, 8, 9, 16],
    bonusNumbers: [],
    sourceRow: 1,
  },
  {
    drawDate: "2026-07-19",
    externalId: "test-draw-2",
    mainNumbers: [2, 5, 10, 16],
    bonusNumbers: [],
    sourceRow: 2,
  },
];

const demoExperimentId = "test-experiment-1";

export default async function ExperimentDemoPage() {
  const layout = demoLayout;

  const layoutIndex = new LayoutPositionIndex(layout);

  const shapeResolver = new CartesianShapeResolver();
  const placementGenerator = new ShapePlacementGenerator(shapeResolver);
  const placementIndexer = new PlacementIndexer(layoutIndex);

  const placements = placementGenerator
    .generate(demoshape, layout)
    .map((placement) => placementIndexer.index(placement));

  const drawIndexer = new DrawIndexer(layout);

  const indexedDraws = demoDraws.map((draw) =>
    drawIndexer.index(draw),
  );

  const orchestratorCandidates = [
    {
      resultId: demoExperimentId,
      input: {
        experimentId: demoExperimentId,
        placements,
        draws: indexedDraws,
      },
    },
  ];

  const runner = new ExperimentRunner();

  const experiment = runner.run({
    experimentId: demoExperimentId,
    placements,
    draws: indexedDraws,
  });

  const averageHitMetric = new AverageHitMetric();

  const averageHitResult = averageHitMetric.calculate(experiment);

  const orchestrator = new ExperimentOrchestrator();

  const analysisCreatedAt = new Date().toISOString();

  const analysisMetadata = {
    experimentId: demoExperimentId,
    createdAt: analysisCreatedAt,
  };

  const analysisMetricAdapters = [
    createMetricRankingAdapter(
      averageHitMetric,
      (result) => result.averageHits,
    ),
  ];

  const analysisConfiguration: ExperimentAnalysisConfiguration = {
    layout: {},
    placementGenerator: {},
    metrics: [],
    ranking: {
      criteria: [
        {
          metricId: averageHitMetric.name,
          weight: 1,
          direction: "descending",
        },
      ],
    },
  };

  const orchestratorReport = orchestrator.run({
    metadata: analysisMetadata,
    candidates: orchestratorCandidates,
    metricAdapters: analysisMetricAdapters,
    configuration: analysisConfiguration,
  });

  return (
    <main>
      <h1>Spatial App</h1>
      <p>Du bist angemeldet.</p>

      <section>
        <h2>Experimentanalyse</h2>

        <p>Experiment-ID: {experiment.experimentId}</p>
        <p>Analysierte Ziehungen: {experiment.analyzedDraws}</p>
        <p>Analysierte Platzierungen: {experiment.analyzedPlacements}</p>
        <p>Vergleiche: {experiment.comparisons}</p>
        <p>Durchschnittliche Treffer: {averageHitResult.averageHits}</p>
        <p>Ranglisten-Einträge: {orchestratorReport.ranking.totalResultCount}</p>
        <p>
          Erstplatzierte Ergebnis-ID:{" "}
          {orchestratorReport.ranking.entries[0]?.resultId ?? "Kein Ergebnis"}
        </p>
        <p>
          Bewertete Platzierungen:{" "}
          {orchestratorReport.statistics.evaluatedPlacements}
        </p>

        <p>
          Gerankte Platzierungen:{" "}
          {orchestratorReport.statistics.rankedPlacements}
        </p>

        <h3>Erstes Ergebnis</h3>

        <p>Treffer: {experiment.results[0]?.hitCount ?? 0}</p>
        <p>Abdeckung: {experiment.results[0]?.coverage ?? 0}</p>

        <h3>Zusammenfassung</h3>

        {experiment.placementSummaries.map((summary) => (
          <article key={summary.anchorValue}>
            <h4>Ankerwert {summary.anchorValue}</h4>

            <p>Ziehungen mit Treffern: {summary.drawsWithHits}</p>
            <p>Gesamttreffer: {summary.totalHits}</p>
            <p>Maximale Treffer: {summary.maximumHits}</p>
            <p>Durchschnittliche Treffer: {summary.averageHits}</p>
          </article>
        ))}
      </section>
    </main>
  );
}