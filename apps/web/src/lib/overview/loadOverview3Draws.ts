import type { ParsedDraw } from "@spatial/engine";

import { createClient } from "@/lib/supabase/server";

/**
 * Loads all validated draws for a lottery, oldest → newest by draw_date.
 */
export async function loadOverview3Draws(
  lotteryId: string,
): Promise<ParsedDraw[]> {
  const supabase = await createClient();

  const { data: datasets, error: datasetsError } = await supabase
    .schema("core")
    .from("datasets")
    .select("id")
    .eq("lottery_id", lotteryId);

  if (datasetsError) {
    throw new Error(datasetsError.message);
  }

  const datasetIds = (datasets ?? []).map((dataset) => dataset.id);

  if (datasetIds.length === 0) {
    return [];
  }

  const { data: versions, error: versionsError } = await supabase
    .schema("core")
    .from("dataset_versions")
    .select("id, dataset_id, version")
    .in("dataset_id", datasetIds)
    .eq("status", "validated")
    .order("version", { ascending: false });

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const latestVersionByDataset = new Map<string, string>();

  for (const version of versions ?? []) {
    if (!latestVersionByDataset.has(version.dataset_id)) {
      latestVersionByDataset.set(version.dataset_id, version.id);
    }
  }

  const latestVersionIds = [...latestVersionByDataset.values()];

  if (latestVersionIds.length === 0) {
    return [];
  }

  const { data: draws, error: drawsError } = await supabase
    .schema("core")
    .from("draws")
    .select("id, draw_date, external_id, draw_main_values(ordinal, value)")
    .in("dataset_version_id", latestVersionIds)
    .order("draw_date", { ascending: true });

  if (drawsError) {
    throw new Error(drawsError.message);
  }

  return (draws ?? []).map((draw, index) => {
    const mainValues = Array.isArray(draw.draw_main_values)
      ? draw.draw_main_values
      : draw.draw_main_values
        ? [draw.draw_main_values]
        : [];

    const values = [...mainValues]
      .sort((left, right) => left.ordinal - right.ordinal)
      .map((entry) => entry.value);

    return {
      drawDate: draw.draw_date as string,
      mainNumbers: values,
      bonusNumbers: [],
      ...(typeof draw.external_id === "string" && draw.external_id.length > 0
        ? { externalId: draw.external_id }
        : {}),
      sourceRow: index + 1,
    };
  });
}
