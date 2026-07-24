import {
  AverageHitMetric,
  CartesianShapeResolver,
  createMetricRankingAdapter,
  DrawIndexer,
  ExperimentOrchestrator,
  GridLayout,
  LayoutPositionIndex,
  MaxHitMetric,
  PlacementIndexer,
  ShapePlacementGenerator,
  type ExperimentReport,
  type ParsedDraw,
  type ShapeDefinition,
} from "@spatial/engine";

export interface GridLayoutParams {
  readonly id: string;
  readonly name: string;
  readonly minimumValue: number;
  readonly maximumValue: number;
  readonly columns: number;
  readonly valueMapping?: readonly number[];
}

export interface RunSpatialAnalysisInput {
  readonly experimentId: string;
  readonly layout: GridLayoutParams;
  readonly shape: ShapeDefinition;
  readonly draws: readonly ParsedDraw[];
  readonly engineVersion?: string;
  readonly rankingLimit?: number;
}

export function runSpatialAnalysis(
  input: RunSpatialAnalysisInput,
): ExperimentReport {
  if (input.draws.length === 0) {
    throw new Error("At least one draw is required to run an analysis.");
  }

  const layout = new GridLayout({
    id: input.layout.id,
    name: input.layout.name,
    type: "grid",
    minimumValue: input.layout.minimumValue,
    maximumValue: input.layout.maximumValue,
    columns: input.layout.columns,
    ...(input.layout.valueMapping
      ? { valueMapping: input.layout.valueMapping }
      : {}),
  });

  const layoutIndex = new LayoutPositionIndex(layout);
  const shapeResolver = new CartesianShapeResolver();
  const placementGenerator = new ShapePlacementGenerator(shapeResolver);
  const placementIndexer = new PlacementIndexer(layoutIndex);
  const drawIndexer = new DrawIndexer(layout);

  const placements = placementGenerator
    .generate(input.shape, layout)
    .filter((placement) => placement.isValid)
    .map((placement) => placementIndexer.index(placement));

  if (placements.length === 0) {
    throw new Error("No valid shape placements were generated for this layout.");
  }

  const indexedDraws = input.draws.map((draw) => drawIndexer.index(draw));

  const averageHitMetric = new AverageHitMetric();
  const maxHitMetric = new MaxHitMetric();

  const candidates = placements.map((placement) => ({
    resultId: `anchor-${placement.anchorValue}`,
    input: {
      experimentId: `${input.experimentId}:${placement.anchorValue}`,
      placements: [placement],
      draws: indexedDraws,
    },
  }));

  const createdAt = new Date().toISOString();

  return new ExperimentOrchestrator().run({
    metadata: {
      experimentId: input.experimentId,
      createdAt,
      ...(input.engineVersion
        ? { engineVersion: input.engineVersion }
        : {}),
    },
    candidates,
    metricAdapters: [
      createMetricRankingAdapter(
        averageHitMetric,
        (result) => result.averageHits,
      ),
      createMetricRankingAdapter(
        maxHitMetric,
        (result) => result.maximumHits,
      ),
    ],
    configuration: {
      layout: {
        id: input.layout.id,
        name: input.layout.name,
        type: "grid",
        minimumValue: input.layout.minimumValue,
        maximumValue: input.layout.maximumValue,
        columns: input.layout.columns,
      },
      placementGenerator: {
        shapeId: input.shape.id,
        shapeName: input.shape.name,
      },
      metrics: [
        { id: averageHitMetric.name },
        { id: maxHitMetric.name },
      ],
      ranking: {
        criteria: [
          {
            metricId: averageHitMetric.name,
            weight: 1,
            direction: "descending",
          },
          {
            metricId: maxHitMetric.name,
            weight: 0.25,
            direction: "descending",
          },
        ],
        ...(input.rankingLimit !== undefined
          ? { limit: input.rankingLimit }
          : { limit: 25 }),
      },
    },
  });
}

export function parseGridLayoutParams(
  layoutId: string,
  layoutName: string,
  parameters: Record<string, unknown>,
): GridLayoutParams {
  const minimumValue = parameters.minimumValue;
  const maximumValue = parameters.maximumValue;
  const columns = parameters.columns;
  const type = parameters.type;

  if (type === "circle") {
    throw new Error(
      "Ring-Layouts werden von der Engine noch nicht ausgewertet. Bitte ein Raster wählen.",
    );
  }

  if (
    typeof minimumValue !== "number" ||
    typeof maximumValue !== "number" ||
    typeof columns !== "number"
  ) {
    throw new Error("Layout parameters are incomplete for a grid analysis.");
  }

  return {
    id: layoutId,
    name: layoutName,
    minimumValue,
    maximumValue,
    columns,
    ...(Array.isArray(parameters.valueMapping)
      && parameters.valueMapping.every((value) => typeof value === "number")
      ? { valueMapping: parameters.valueMapping as number[] }
      : {}),
  };
}

export function parseShapeDefinition(
  shapeId: string,
  shapeName: string,
  definition: Record<string, unknown>,
  positions?: readonly {
    relative_x: number | null;
    relative_y: number | null;
  }[],
): ShapeDefinition {
  const fromDefinition = definition.positions;

  if (Array.isArray(fromDefinition) && fromDefinition.length > 0) {
    const parsed = fromDefinition.flatMap((entry) => {
      if (
        entry &&
        typeof entry === "object" &&
        "x" in entry &&
        "y" in entry &&
        typeof entry.x === "number" &&
        typeof entry.y === "number"
      ) {
        return [{ x: entry.x, y: entry.y }];
      }

      return [];
    });

    if (parsed.length > 0) {
      return {
        id: shapeId,
        name: shapeName,
        positions: parsed,
      };
    }
  }

  if (positions && positions.length > 0) {
    return {
      id: shapeId,
      name: shapeName,
      positions: positions.map((position) => ({
        x: position.relative_x ?? 0,
        y: position.relative_y ?? 0,
      })),
    };
  }

  throw new Error("Shape definition does not contain relative positions.");
}
