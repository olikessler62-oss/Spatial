import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { requireRegisteredPage } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

interface AnalysisSummary {
  metadata?: {
    experimentId?: string;
    runtimeMs?: number;
    engineVersion?: string;
  };
  statistics?: {
    totalPlacements?: number;
    evaluatedPlacements?: number;
    rankedPlacements?: number;
  };
  ranking?: {
    totalResultCount?: number;
    entries?: readonly {
      rank: number;
      resultId: string;
      score: number;
      criteria?: readonly {
        metricId: string;
        rawValue: number;
      }[];
    }[];
  };
}

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  await requireRegisteredPage(`/app/analyses/${runId}`);
  const supabase = await createClient();

  const { data: run, error } = await supabase
    .schema("analysis")
    .from("experiment_runs")
    .select(
      "id, status, created_at, duration_ms, engine_version, experiment_results(summary), experiment_versions(version, experiments(name, description))",
    )
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!run) {
    notFound();
  }

  const result = Array.isArray(run.experiment_results)
    ? run.experiment_results[0]
    : run.experiment_results;
  const version = Array.isArray(run.experiment_versions)
    ? run.experiment_versions[0]
    : run.experiment_versions;
  const experiment = version
    ? Array.isArray(version.experiments)
      ? version.experiments[0]
      : version.experiments
    : null;

  const summary = (result?.summary ?? {}) as AnalysisSummary;
  const entries = summary.ranking?.entries ?? [];

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Analysen</p>
          <h1>{experiment?.name ?? "Analyse"}</h1>
          <p>
            {new Date(run.created_at).toLocaleString("de-DE")}
            {" · "}
            {run.status}
            {typeof run.duration_ms === "number"
              ? ` · ${run.duration_ms} ms`
              : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href="/app/analyses"
          >
            Alle Analysen
          </Link>
          <Link
            className={cn(buttonVariants())}
            href="/app/experiments/new"
          >
            Neue Analyse
          </Link>
        </div>
      </header>

      {experiment?.description && (
        <p>{experiment.description}</p>
      )}

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h2>Platzierungen</h2>
          <p>
            {summary.statistics?.evaluatedPlacements
              ?? summary.statistics?.totalPlacements
              ?? "–"}{" "}
            bewertet
          </p>
        </article>
        <article className="dashboard-card">
          <h2>Ranking</h2>
          <p>
            {summary.ranking?.totalResultCount ?? entries.length} Einträge
          </p>
        </article>
        <article className="dashboard-card">
          <h2>Engine</h2>
          <p>{run.engine_version}</p>
        </article>
      </div>

      <section style={{ marginTop: 32 }}>
        <h2>Rangliste</h2>

        {entries.length > 0 ? (
          <div className="experiment-list">
            {entries.map((entry) => {
              const average = entry.criteria?.find(
                (criterion) => criterion.metricId === "average-hits",
              )?.rawValue;
              const maximum = entry.criteria?.find(
                (criterion) => criterion.metricId === "maximum-hits",
              )?.rawValue;

              return (
                <article
                  className="experiment-list__item"
                  key={`${entry.rank}-${entry.resultId}`}
                >
                  <div>
                    <h2>
                      #{entry.rank} · {entry.resultId}
                    </h2>
                    <p>
                      Score {entry.score.toFixed(4)}
                      {typeof average === "number"
                        ? ` · Ø Treffer ${average.toFixed(3)}`
                        : ""}
                      {typeof maximum === "number"
                        ? ` · Max ${maximum}`
                        : ""}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Keine Ranking-Daten</h2>
            <p>Für diesen Lauf wurden keine Ranglisteneinträge gespeichert.</p>
          </div>
        )}
      </section>
    </section>
  );
}
