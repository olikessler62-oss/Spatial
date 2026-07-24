import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth/get-viewer";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function ExperimentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
  }>;
}) {
  const { created } = await searchParams;
  const supabase = await createClient();
  const viewer = await getViewer();
  const isRegistered = viewer !== null;

  const { data: experiments, error } = await supabase
    .schema("analysis")
    .from("experiments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Experimente</p>
          <h1>Experimente</h1>
        </div>

        <div className="flex gap-3">
          {isRegistered ? (
            <Link
              className={cn(buttonVariants())}
              href="/app/experiments/new"
            >
              Analyse starten
            </Link>
          ) : (
            <Link
              className={cn(buttonVariants())}
              href="/register?next=%2Fapp%2Fexperiments%2Fnew"
            >
              Registrieren für Analysen
            </Link>
          )}

          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href="/app/experiments/experiment1"
          >
            Experiment 1
          </Link>

          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href="/app/experiments/corner-5x5"
          >
            Corner 5×5
          </Link>

          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href="/app/experiments/demo"
          >
            Demo
          </Link>
        </div>
      </header>

      {created === "1" && (
        <div className="success-message">
          Experiment erfolgreich erstellt.
        </div>
      )}

      {experiments && experiments.length > 0 ? (
        <div className="experiment-list">
          {experiments.map((experiment) => (
            <article
              className="experiment-list__item"
              key={experiment.id}
            >
              <div>
                <h2>{experiment.name}</h2>
                {experiment.description && <p>{experiment.description}</p>}
                <small>Sichtbarkeit: {experiment.visibility}</small>
              </div>
              <span>
                {new Date(experiment.created_at).toLocaleDateString("de-DE")}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>
            {isRegistered ? "Noch keine Experimente" : "Gastmodus"}
          </h2>
          <p>
            {isRegistered
              ? "Starte die erste Analyse oder öffne die Demo."
              : "Ohne Konto kannst du die Demo nutzen. Zum Speichern bitte registrieren."}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className={cn(buttonVariants())}
              href={
                isRegistered
                  ? "/app/experiments/new"
                  : "/register?next=%2Fapp%2Fexperiments%2Fnew"
              }
            >
              {isRegistered ? "Analyse starten" : "Registrieren"}
            </Link>
            <Link
              className={cn(buttonVariants({ variant: "outline" }))}
              href="/app/experiments/demo"
            >
              Demo öffnen
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
