"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";

import {
  CsvImportService,
  createSupabaseDatasetRepository,
  persistImportReport,
  type ParsedDraw,
  type VersionedLotteryRuleSet,
} from "@spatial/engine";

import { shuffleValues } from "@/lib/analysis/catalog";
import {
  parseGridLayoutParams,
  parseShapeDefinition,
  runSpatialAnalysis,
} from "@/lib/engine/run-spatial-analysis";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/get-viewer";

const ENGINE_VERSION = "0.5.0";
const AVERAGE_HIT_METRIC_VERSION_ID =
  "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1";
const MAXIMUM_HIT_METRIC_VERSION_ID =
  "ffffffff-ffff-4fff-8fff-fffffffffff1";

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}

export async function deleteAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.auth.signOut();
  redirect("/login");
}

export async function createAndRunExperiment(formData: FormData) {
  const name = formData.get("name")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const datasetVersionId =
    formData.get("datasetVersionId")?.toString() ?? "";
  const layoutVersionId =
    formData.get("layoutVersionId")?.toString() ?? "";
  const shapeVersionId =
    formData.get("shapeVersionId")?.toString() ?? "";

  if (!name) {
    throw new Error("Bitte einen Experimentnamen angeben.");
  }

  if (!datasetVersionId || !layoutVersionId || !shapeVersionId) {
    throw new Error(
      "Lottery-Daten, Layout und Form müssen ausgewählt werden.",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const {
    data: datasetVersion,
    error: datasetVersionError,
  } = await admin
    .schema("core")
    .from("dataset_versions")
    .select("id, content_hash, event_count, datasets(id, lottery_id, name)")
    .eq("id", datasetVersionId)
    .single();

  if (datasetVersionError || !datasetVersion) {
    throw new Error("Die Dataset-Version wurde nicht gefunden.");
  }

  if (!datasetVersion.event_count || datasetVersion.event_count < 1) {
    throw new Error(
      "Diese Dataset-Version enthält keine Ziehungen. Bitte zuerst importieren.",
    );
  }

  const {
    data: layoutVersion,
    error: layoutVersionError,
  } = await admin
    .schema("analysis")
    .from("layout_versions")
    .select("id, parameters, layouts(id, name, lottery_id)")
    .eq("id", layoutVersionId)
    .single();

  if (layoutVersionError || !layoutVersion) {
    throw new Error("Die Layout-Version wurde nicht gefunden.");
  }

  const layoutRow = Array.isArray(layoutVersion.layouts)
    ? layoutVersion.layouts[0]
    : layoutVersion.layouts;

  const datasetRow = Array.isArray(datasetVersion.datasets)
    ? datasetVersion.datasets[0]
    : datasetVersion.datasets;

  if (!layoutRow || !datasetRow) {
    throw new Error("Layout oder Dataset ist unvollständig.");
  }

  if (layoutRow.lottery_id !== datasetRow.lottery_id) {
    throw new Error(
      "Layout und Dataset gehören nicht zur gleichen Lottery.",
    );
  }

  const {
    data: shapeVersion,
    error: shapeVersionError,
  } = await admin
    .schema("analysis")
    .from("shape_versions")
    .select(
      "id, definition, shapes(id, name), shape_positions(ordinal, relative_x, relative_y)",
    )
    .eq("id", shapeVersionId)
    .single();

  if (shapeVersionError || !shapeVersion) {
    throw new Error("Die Form-Version wurde nicht gefunden.");
  }

  const shapeRow = Array.isArray(shapeVersion.shapes)
    ? shapeVersion.shapes[0]
    : shapeVersion.shapes;

  if (!shapeRow) {
    throw new Error("Die Form ist unvollständig.");
  }

  const {
    data: drawRows,
    error: drawsError,
  } = await admin
    .schema("core")
    .from("draws")
    .select(
      "id, draw_date, external_id, draw_main_values(ordinal, value)",
    )
    .eq("dataset_version_id", datasetVersionId)
    .order("draw_date", { ascending: true });

  if (drawsError || !drawRows || drawRows.length === 0) {
    throw new Error("Für diese Dataset-Version wurden keine Ziehungen gefunden.");
  }

  const draws: ParsedDraw[] = drawRows.map((draw, index) => {
    const values = [...(draw.draw_main_values ?? [])].sort(
      (left, right) => left.ordinal - right.ordinal,
    );

    return {
      drawDate: draw.draw_date,
      mainNumbers: values.map((value) => value.value),
      bonusNumbers: [],
      ...(draw.external_id ? { externalId: draw.external_id } : {}),
      sourceRow: index + 1,
    };
  });

  const layoutParams = parseGridLayoutParams(
    layoutRow.id,
    layoutRow.name,
    layoutVersion.parameters as Record<string, unknown>,
  );

  const shapeDefinition = parseShapeDefinition(
    shapeRow.id,
    shapeRow.name,
    shapeVersion.definition as Record<string, unknown>,
    [...(shapeVersion.shape_positions ?? [])].sort(
      (left, right) => left.ordinal - right.ordinal,
    ),
  );

  const {
    data: experiment,
    error: experimentError,
  } = await admin
    .schema("analysis")
    .from("experiments")
    .insert({
      name,
      description: description || null,
      created_by: user.id,
      visibility: "private",
    })
    .select("id")
    .single();

  if (experimentError || !experiment) {
    throw new Error(
      experimentError?.message ?? "Experiment konnte nicht angelegt werden.",
    );
  }

  const configurationPayload = {
    datasetVersionId,
    layoutVersionId,
    shapeVersionId,
    engineVersion: ENGINE_VERSION,
  };
  const configurationHash = `sha256:${createHash("sha256")
    .update(JSON.stringify(configurationPayload))
    .digest("hex")}`;

  const {
    data: experimentVersion,
    error: experimentVersionError,
  } = await admin
    .schema("analysis")
    .from("experiment_versions")
    .insert({
      experiment_id: experiment.id,
      version: 1,
      dataset_version_id: datasetVersionId,
      layout_version_id: layoutVersionId,
      event_filter: {},
      placement_configuration: {
        shapeVersionId,
      },
      hit_rule_configuration: {
        pool: "main",
      },
      engine_version: ENGINE_VERSION,
      configuration_hash: configurationHash,
      status: "configured",
    })
    .select("id")
    .single();

  if (experimentVersionError || !experimentVersion) {
    throw new Error(
      experimentVersionError?.message
      ?? "Experiment-Version konnte nicht angelegt werden.",
    );
  }

  const { error: experimentShapeError } = await admin
    .schema("analysis")
    .from("experiment_shapes")
    .insert({
      experiment_version_id: experimentVersion.id,
      shape_version_id: shapeVersionId,
      role: "primary",
      parameters: {},
    });

  if (experimentShapeError) {
    throw new Error(experimentShapeError.message);
  }

  const { error: experimentMetricsError } = await admin
    .schema("analysis")
    .from("experiment_metrics")
    .insert([
      {
        experiment_version_id: experimentVersion.id,
        metric_version_id: AVERAGE_HIT_METRIC_VERSION_ID,
        parameters: {},
      },
      {
        experiment_version_id: experimentVersion.id,
        metric_version_id: MAXIMUM_HIT_METRIC_VERSION_ID,
        parameters: {},
      },
    ]);

  if (experimentMetricsError) {
    throw new Error(experimentMetricsError.message);
  }

  const startedAt = new Date();
  let report;

  try {
    report = runSpatialAnalysis({
      experimentId: experiment.id,
      layout: layoutParams,
      shape: shapeDefinition,
      draws,
      engineVersion: ENGINE_VERSION,
    });
  } catch (error) {
    const failedAt = new Date();

    await admin.schema("analysis").from("experiment_runs").insert({
      experiment_version_id: experimentVersion.id,
      status: "failed",
      engine_version: ENGINE_VERSION,
      configuration_hash: configurationHash,
      dataset_hash: datasetVersion.content_hash,
      started_at: startedAt.toISOString(),
      completed_at: failedAt.toISOString(),
      duration_ms: failedAt.getTime() - startedAt.getTime(),
      error_details: {
        message:
          error instanceof Error ? error.message : "Analysis failed.",
      },
      created_by: user.id,
    });

    throw error instanceof Error
      ? error
      : new Error("Die Analyse ist fehlgeschlagen.");
  }

  const completedAt = new Date();
  const resultHash = `sha256:${createHash("sha256")
    .update(JSON.stringify(report))
    .digest("hex")}`;

  const {
    data: experimentRun,
    error: experimentRunError,
  } = await admin
    .schema("analysis")
    .from("experiment_runs")
    .insert({
      experiment_version_id: experimentVersion.id,
      status: "completed",
      engine_version: ENGINE_VERSION,
      configuration_hash: configurationHash,
      dataset_hash: datasetVersion.content_hash,
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      duration_ms: completedAt.getTime() - startedAt.getTime(),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (experimentRunError || !experimentRun) {
    throw new Error(
      experimentRunError?.message
      ?? "Experiment-Lauf konnte nicht gespeichert werden.",
    );
  }

  const { error: resultError } = await admin
    .schema("analysis")
    .from("experiment_results")
    .insert({
      experiment_run_id: experimentRun.id,
      result_hash: resultHash,
      summary: report,
    });

  if (resultError) {
    throw new Error(resultError.message);
  }

  redirect(`/app/analyses/${experimentRun.id}`);
}

export async function createLayout(formData: FormData) {
  const name = formData.get("name")?.toString().trim() ?? "";
  const lotteryId = formData.get("lotteryId")?.toString() ?? "";
  const layoutType = formData.get("layoutType")?.toString() ?? "";
  const orderingMode =
    formData.get("orderingMode")?.toString() === "unordered"
      ? "unordered"
      : "ordered";
  const minimumValue = Number(formData.get("minimumValue"));
  const maximumValue = Number(formData.get("maximumValue"));
  const rows = Number(formData.get("rows"));
  const columns = Number(formData.get("columns"));

  if (!name || !lotteryId || !layoutType) {
    throw new Error("Name, Lotterie und Layouttyp sind erforderlich.");
  }

  if (
    !Number.isInteger(minimumValue)
    || !Number.isInteger(maximumValue)
    || maximumValue < minimumValue
  ) {
    throw new Error("Der Zahlenraum ist ungültig.");
  }

  const size = maximumValue - minimumValue + 1;

  if (layoutType === "grid") {
    if (
      !Number.isInteger(rows)
      || !Number.isInteger(columns)
      || rows * columns !== size
    ) {
      throw new Error(
        `Ungültige Aufteilung: ${rows}×${columns} passt nicht auf ${size} Positionen.`,
      );
    }
  } else if (layoutType !== "circle") {
    throw new Error("Dieser Layouttyp wird noch nicht unterstützt.");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orderedValues = Array.from(
    { length: size },
    (_, index) => minimumValue + index,
  );

  const valueMapping =
    orderingMode === "unordered"
      ? shuffleValues(minimumValue, maximumValue, `${lotteryId}:${name}:${Date.now()}`)
      : orderedValues;

  const parameters =
    layoutType === "grid"
      ? {
          type: "grid",
          minimumValue,
          maximumValue,
          rows,
          columns,
          orderingMode,
          valueMapping,
        }
      : {
          type: "circle",
          minimumValue,
          maximumValue,
          positionCount: size,
          orderingMode,
          valueMapping,
        };

  const contentHash = `sha256:${createHash("sha256")
    .update(JSON.stringify(parameters))
    .digest("hex")}`;

  const admin = createAdminClient();

  const {
    data: layoutRow,
    error: layoutError,
  } = await admin
    .schema("analysis")
    .from("layouts")
    .insert({
      lottery_id: lotteryId,
      name,
      layout_type: layoutType,
      visibility: "private",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (layoutError || !layoutRow) {
    throw new Error(
      layoutError?.message ?? "Layout konnte nicht angelegt werden.",
    );
  }

  const { error: versionError } = await admin
    .schema("analysis")
    .from("layout_versions")
    .insert({
      layout_id: layoutRow.id,
      version: 1,
      coordinate_system: layoutType === "circle" ? "polar" : "cartesian",
      parameters,
      content_hash: contentHash,
      status: "published",
    });

  if (versionError) {
    throw new Error(versionError.message);
  }

  redirect("/app/layouts");
}

export async function createShape(formData: FormData) {
  const shape = {
    name: formData.get("name")?.toString() ?? "",
    shapeType:
      formData.get("shapeType")?.toString() ?? "",
  };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .schema("analysis")
    .from("shapes")
    .insert({
      name: shape.name,
      shape_type: shape.shapeType,
      created_by: user?.id ?? null,
    });

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  redirect("/app/shapes");
}

export interface ImportDrawsState {
  receivedRows: number;
  acceptedRows: number;
  rejectedRows: number;
  importedRows: number;
  skippedRows: number;
  datasetId?: string;
  error?: string;
}

function toVersionedRuleSet(row: {
  id: string;
  valid_from: string;
  valid_to: string | null;
  main_value_min: number;
  main_value_max: number;
  main_value_count: number;
  bonus_rules: {
    type?: unknown;
    minimum?: unknown;
    maximum?: unknown;
    count?: unknown;
  };
}): VersionedLotteryRuleSet | null {
  const bonusRules = row.bonus_rules;

  if (
    typeof bonusRules.type !== "string" ||
    typeof bonusRules.minimum !== "number" ||
    typeof bonusRules.maximum !== "number" ||
    typeof bonusRules.count !== "number"
  ) {
    return null;
  }

  return {
    id: row.id,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    bonusType: bonusRules.type,
    rules: {
      mainNumbers: {
        minimum: row.main_value_min,
        maximum: row.main_value_max,
        count: row.main_value_count,
      },
      bonusNumbers: {
        minimum: bonusRules.minimum,
        maximum: bonusRules.maximum,
        count: bonusRules.count,
      },
    },
  };
}

export async function importDraws(
  _previousState: ImportDrawsState | null,
  formData: FormData,
): Promise<ImportDrawsState> {
  const datasetId = formData.get("datasetId")?.toString() ?? "";
  const emptyState: ImportDrawsState = {
    receivedRows: 0,
    acceptedRows: 0,
    rejectedRows: 0,
    importedRows: 0,
    skippedRows: 0,
    datasetId: datasetId || undefined,
  };

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      ...emptyState,
      error: "Keine CSV-Datei hochgeladen.",
    };
  }

  if (!datasetId) {
    return {
      ...emptyState,
      error: "Kein Dataset ausgewählt.",
    };
  }

  try {
    await requireAdmin();
  } catch {
    return {
      ...emptyState,
      error: "Nur Admins dürfen Ziehungen importieren.",
    };
  }

  const admin = createAdminClient();

  const {
    data: dataset,
    error: datasetError,
  } = await admin
    .schema("core")
    .from("datasets")
    .select("id, lottery_id")
    .eq("id", datasetId)
    .single();

  if (datasetError || !dataset) {
    console.error(datasetError);

    return {
      ...emptyState,
      error: "Dataset wurde nicht gefunden.",
    };
  }

  const {
    data: ruleSetRows,
    error: ruleSetError,
  } = await admin
    .schema("core")
    .from("lottery_rule_sets")
    .select(
      "id, version, valid_from, valid_to, main_value_min, main_value_max, main_value_count, bonus_rules",
    )
    .eq("lottery_id", dataset.lottery_id)
    .order("version", { ascending: true });

  if (ruleSetError || !ruleSetRows || ruleSetRows.length === 0) {
    console.error(ruleSetError);

    return {
      ...emptyState,
      error: "Kein Regelwerk für dieses Dataset gefunden.",
    };
  }

  const periods = ruleSetRows
    .map((row) =>
      toVersionedRuleSet(
        row as {
          id: string;
          valid_from: string;
          valid_to: string | null;
          main_value_min: number;
          main_value_max: number;
          main_value_count: number;
          bonus_rules: {
            type?: unknown;
            minimum?: unknown;
            maximum?: unknown;
            count?: unknown;
          };
        },
      ),
    )
    .filter((period): period is VersionedLotteryRuleSet => period !== null);

  if (periods.length === 0) {
    return {
      ...emptyState,
      error: "Die Bonusregeln sind ungültig.",
    };
  }

  const csv = await file.text();
  const contentHash = `sha256:${createHash("sha256").update(csv).digest("hex")}`;

  let report;

  try {
    report = new CsvImportService().importWithTimeline(csv, periods, {
      externalIdColumn: "external_id",
    });
  } catch (error) {
    console.error(error);

    return {
      ...emptyState,
      error:
        error instanceof Error
          ? error.message
          : "Die CSV-Datei konnte nicht gelesen werden.",
    };
  }

  if (report.acceptedRows === 0) {
    return {
      receivedRows: report.receivedRows,
      acceptedRows: report.acceptedRows,
      rejectedRows: report.rejectedRows,
      importedRows: 0,
      skippedRows: 0,
      error: "Die CSV-Datei enthält keine gültigen Ziehungen.",
    };
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      receivedRows: report.receivedRows,
      acceptedRows: report.acceptedRows,
      rejectedRows: report.rejectedRows,
      importedRows: 0,
      skippedRows: 0,
      error: "Import-Persistenz ist nicht konfiguriert.",
    };
  }

  const primaryRuleSetId =
    [...periods].sort((left, right) =>
      right.validFrom.localeCompare(left.validFrom),
    )[0]?.id ?? periods[0].id;

  try {
    const repository = createSupabaseDatasetRepository({
      url: supabaseUrl,
      serviceRoleKey,
    });

    const persisted = await persistImportReport(repository, {
      datasetId: dataset.id,
      ruleSetId: primaryRuleSetId,
      contentHash,
      report,
    });

    return {
      receivedRows: report.receivedRows,
      acceptedRows: report.acceptedRows,
      rejectedRows: report.rejectedRows,
      importedRows: persisted.eventCount,
      skippedRows: 0,
    };
  } catch (error) {
    console.error(error);

    return {
      receivedRows: report.receivedRows,
      acceptedRows: report.acceptedRows,
      rejectedRows: report.rejectedRows,
      importedRows: 0,
      skippedRows: 0,
      error:
        error instanceof Error
          ? error.message
          : "Die Ziehungen konnten nicht gespeichert werden.",
    };
  }
}
