import type { Overview1Move } from "@/lib/overview/overview1Moves";
import { createClient } from "@/lib/supabase/server";

export async function loadOverview1Moves(
  lotteryId: string,
): Promise<Overview1Move[]> {
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
    .select("id, draw_date, draw_main_values(ordinal, value)")
    .in("dataset_version_id", latestVersionIds)
    .order("draw_date", { ascending: false })
    .limit(10);

  if (drawsError) {
    throw new Error(drawsError.message);
  }

  return (draws ?? []).map((draw) => {
    const mainValues = Array.isArray(draw.draw_main_values)
      ? draw.draw_main_values
      : draw.draw_main_values
        ? [draw.draw_main_values]
        : [];

    const values = [...mainValues]
      .sort((left, right) => left.ordinal - right.ordinal)
      .map((entry) => entry.value);

    return {
      id: draw.id as string,
      drawDate: draw.draw_date as string,
      values,
    };
  });
}
