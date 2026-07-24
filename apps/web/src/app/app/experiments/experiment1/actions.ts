"use server";

import {
  runExperiment1MultiSeed,
  runExperiment1ShapeGapAnalysis,
  type Experiment1MultiSeedResult,
  type ShapeGapAnalysisReport,
} from "@spatial/engine";
import type { ParsedDraw } from "@spatial/engine";

import { requireAdmin } from "@/lib/auth/get-viewer";
import { createAdminClient } from "@/lib/supabase/admin";

const LOTTO_DATASET_ID = "33333333-3333-4333-8333-333333333333";

export interface Experiment1ActionState {
  readonly error?: string;
  readonly multi?: Experiment1MultiSeedResult;
  readonly gaps?: ShapeGapAnalysisReport;
}

async function loadLottoDraws(): Promise<
  { draws: ParsedDraw[]; label: string } | { error: string }
> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Nur Admins dürfen Experiment 1 starten." };
  }

  const admin = createAdminClient();

  const { data: versions, error: versionError } = await admin
    .schema("core")
    .from("dataset_versions")
    .select("id, version, event_count")
    .eq("dataset_id", LOTTO_DATASET_ID)
    .eq("status", "validated")
    .order("version", { ascending: false })
    .limit(1);

  if (versionError) {
    return { error: versionError.message };
  }

  const latest = versions?.[0];

  if (!latest) {
    return { error: "Keine validierte Lotto-Dataset-Version gefunden." };
  }

  const { data: drawRows, error: drawsError } = await admin
    .schema("core")
    .from("draws")
    .select(
      "id, draw_date, external_id, draw_main_values(ordinal, value)",
    )
    .eq("dataset_version_id", latest.id)
    .order("draw_date", { ascending: true });

  if (drawsError) {
    return { error: drawsError.message };
  }

  if (!drawRows || drawRows.length === 0) {
    return { error: "Die Dataset-Version enthält keine Ziehungen." };
  }

  const draws: ParsedDraw[] = drawRows.map((draw, index) => {
    const values = [...(draw.draw_main_values ?? [])].sort(
      (left, right) => left.ordinal - right.ordinal,
    );

    return {
      drawDate: draw.draw_date,
      mainNumbers: values.map((entry) => entry.value),
      bonusNumbers: [],
      ...(draw.external_id ? { externalId: draw.external_id } : {}),
      sourceRow: index + 1,
    };
  });

  return {
    draws,
    label: `Lotto 6aus49 · Dataset-Version ${latest.version} (${latest.event_count} Ziehungen)`,
  };
}

export async function runExperiment1Action(
  previous: Experiment1ActionState | null,
  formData: FormData,
): Promise<Experiment1ActionState> {
  const mode = formData.get("mode")?.toString() ?? "holdout";
  const loaded = await loadLottoDraws();

  if ("error" in loaded) {
    return { ...previous, error: loaded.error };
  }

  try {
    if (mode === "gaps") {
      const seedRaw = formData.get("seedIndex")?.toString() ?? "0";
      const seedIndex = Number(seedRaw);
      const gaps = runExperiment1ShapeGapAnalysis({
        draws: loaded.draws,
        seedIndex: Number.isInteger(seedIndex) ? seedIndex : 0,
      });

      return {
        multi: previous?.multi,
        gaps,
      };
    }

    const multi = runExperiment1MultiSeed({
      draws: loaded.draws,
      datasetLabel: loaded.label,
      seedCount: 10,
    });

    return {
      multi,
      gaps: previous?.gaps,
    };
  } catch (error) {
    console.error(error);

    return {
      ...previous,
      error:
        error instanceof Error
          ? error.message
          : "Experiment 1 ist fehlgeschlagen.",
    };
  }
}
