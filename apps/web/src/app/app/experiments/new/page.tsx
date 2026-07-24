import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireRegisteredPage } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

import { RunExperimentForm } from "./RunExperimentForm";

export default async function NewExperimentPage() {
  await requireRegisteredPage("/app/experiments/new");
  const supabase = await createClient();

  const [
    lotteriesResult,
    datasetsResult,
    datasetVersionsResult,
    layoutsResult,
    shapesResult,
  ] = await Promise.all([
    supabase
      .schema("core")
      .from("lotteries")
      .select("id, name")
      .order("name"),
    supabase
      .schema("core")
      .from("datasets")
      .select("id, name, lottery_id")
      .order("name"),
    supabase
      .schema("core")
      .from("dataset_versions")
      .select("id, dataset_id, version, event_count, status, date_from, date_to")
      .order("version", { ascending: false }),
    supabase
      .schema("analysis")
      .from("layouts")
      .select("id, name, lottery_id, layout_versions(id, version, status)")
      .order("name"),
    supabase
      .schema("analysis")
      .from("shapes")
      .select("id, name, shape_versions(id, version, status)")
      .order("name"),
  ]);

  const firstError =
    lotteriesResult.error
    ?? datasetsResult.error
    ?? datasetVersionsResult.error
    ?? layoutsResult.error
    ?? shapesResult.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  const datasetsById = new Map(
    (datasetsResult.data ?? []).map((dataset) => [dataset.id, dataset]),
  );

  const datasetVersions = (datasetVersionsResult.data ?? [])
    .map((version) => {
      const dataset = datasetsById.get(version.dataset_id);

      if (!dataset) {
        return null;
      }

      const range =
        version.date_from && version.date_to
          ? ` · ${version.date_from} – ${version.date_to}`
          : "";

      return {
        id: version.id,
        lotteryId: dataset.lottery_id,
        eventCount: version.event_count ?? 0,
        label: `${dataset.name} · v${version.version} · ${version.event_count ?? 0} Ziehungen${range}`,
      };
    })
    .filter((version): version is NonNullable<typeof version> => version !== null);

  const lotteryNameById = new Map(
    (lotteriesResult.data ?? []).map((lottery) => [
      lottery.id as string,
      lottery.name as string,
    ]),
  );

  const layoutVersions = (layoutsResult.data ?? []).flatMap((layout) => {
    const versions = Array.isArray(layout.layout_versions)
      ? layout.layout_versions
      : layout.layout_versions
        ? [layout.layout_versions]
        : [];

    const lotteryName =
      lotteryNameById.get(layout.lottery_id as string) ?? "Lotterie";

    return versions
      .filter((version) => version.status === "published" || version.status === "validated")
      .map((version) => ({
        id: version.id,
        lotteryId: layout.lottery_id,
        label: `${lotteryName} · ${layout.name} · v${version.version}`,
      }));
  });

  const shapeVersions = (shapesResult.data ?? []).flatMap((shape) => {
    const versions = Array.isArray(shape.shape_versions)
      ? shape.shape_versions
      : shape.shape_versions
        ? [shape.shape_versions]
        : [];

    return versions
      .filter((version) => version.status === "published" || version.status === "validated")
      .map((version) => ({
        id: version.id,
        label: `${shape.name} · v${version.version}`,
      }));
  });

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Experimente</p>
          <h1>Analyse starten</h1>
          <p>
            Lottery, Ziehungsdaten, Layout und Form wählen — dann führt die Engine
            den Vergleich aus.
          </p>
        </div>

        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/app/experiments"
        >
          Zurück
        </Link>
      </header>

      <RunExperimentForm
        lotteries={lotteriesResult.data ?? []}
        datasetVersions={datasetVersions}
        layoutVersions={layoutVersions}
        shapeVersions={shapeVersions}
      />
    </section>
  );
}
