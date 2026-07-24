import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireRegisteredPage } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function AnalysesPage() {
  await requireRegisteredPage("/app/analyses");
  const supabase = await createClient();

  const { data: runs, error } = await supabase
    .schema("analysis")
    .from("experiment_runs")
    .select(
      "id, status, created_at, duration_ms, experiment_versions(version, experiments(name))",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Analysen</p>
          <h1>Auswertungen</h1>
        </div>

        <Link
          className={cn(buttonVariants())}
          href="/app/experiments/new"
        >
          Analyse starten
        </Link>
      </header>

      {runs && runs.length > 0 ? (
        <div className="experiment-list">
          {runs.map((run) => {
            const version = Array.isArray(run.experiment_versions)
              ? run.experiment_versions[0]
              : run.experiment_versions;
            const experiment = version
              ? Array.isArray(version.experiments)
                ? version.experiments[0]
                : version.experiments
              : null;

            return (
              <Link
                className="experiment-list__item"
                href={`/app/analyses/${run.id}`}
                key={run.id}
              >
                <div>
                  <h2>{experiment?.name ?? "Unbenanntes Experiment"}</h2>
                  <p>
                    {new Date(run.created_at).toLocaleString("de-DE")}
                    {" · "}
                    {run.status}
                    {typeof run.duration_ms === "number"
                      ? ` · ${run.duration_ms} ms`
                      : ""}
                    {version ? ` · Config v${version.version}` : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Noch keine Analysen</h2>
          <p>
            Starte die erste Analyse mit importierten Ziehungen, einem Layout und
            einer Form.
          </p>
          <Link
            className={cn(buttonVariants())}
            href="/app/experiments/new"
          >
            Analyse starten
          </Link>
        </div>
      )}
    </section>
  );
}
