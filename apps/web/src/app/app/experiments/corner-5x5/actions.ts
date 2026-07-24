"use server";

import {
  analyzeCorner5x5LatestMisses,
  type Corner5x5MissReport,
} from "@spatial/engine";
import type { ParsedDraw } from "@spatial/engine";

import { requireAdmin } from "@/lib/auth/get-viewer";
import { createAdminClient } from "@/lib/supabase/admin";

const LOTTO_DATASET_ID = "33333333-3333-4333-8333-333333333333";

export interface Corner5x5ActionState {
  readonly error?: string;
  readonly report?: Corner5x5MissReport;
}

export async function runCorner5x5Action(
  _previous: Corner5x5ActionState | null,
  _formData: FormData,
): Promise<Corner5x5ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Nur Admins dürfen diese Analyse starten." };
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
    .select("id, draw_date, external_id, draw_main_values(ordinal, value)")
    .eq("dataset_version_id", latest.id)
    .order("draw_date", { ascending: true });

  if (drawsError) {
    return { error: drawsError.message };
  }

  if (!drawRows || drawRows.length === 0) {
    return { error: "Keine Ziehungen gefunden." };
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

  try {
    return { report: analyzeCorner5x5LatestMisses({ draws }) };
  } catch (error) {
    console.error(error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Corner-5×5-Analyse fehlgeschlagen.",
    };
  }
}
