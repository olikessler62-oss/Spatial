import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth/get-viewer";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function Overview2Page() {
  const supabase = await createClient();
  const viewer = await getViewer();
  const isRegistered = viewer !== null;
  const showAdmin = isAdminRole(viewer?.role);

  const [
    drawsCount,
    datasetsCount,
    experimentsCount,
    runsCount,
  ] = await Promise.all([
    supabase.schema("core").from("draws").select("id", { count: "exact", head: true }),
    supabase.schema("core").from("datasets").select("id", { count: "exact", head: true }),
    supabase.schema("analysis").from("experiments").select("id", { count: "exact", head: true }),
    supabase.schema("analysis").from("experiment_runs").select("id", { count: "exact", head: true }),
  ]);

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Übersicht 2</p>
          <h1>Forschungs-Dashboard</h1>
          <p>
            {isRegistered
              ? "Willkommen zurück. Erweiterte Funktionen sind freigeschaltet."
              : "Kostenlose Basisversion ohne Registrierung. Mit Konto speicherst du Layouts, Experimente und Analysen."}
          </p>
        </div>

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
            Kostenlos registrieren
          </Link>
        )}
      </header>

      {!isRegistered && (
        <div className="empty-state mb-6">
          <h2>Gastmodus</h2>
          <p>
            Du kannst Übersicht, öffentliche Layouts/Formen und die Demo
            nutzen. Für Speichern, eigene Experimente und Analysen bitte
            registrieren.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              className={cn(buttonVariants())}
              href="/register?next=%2Fapp%2Foverview-1"
            >
              Registrieren
            </Link>
            <Link
              className={cn(buttonVariants({ variant: "outline" }))}
              href="/login?next=%2Fapp%2Foverview-1"
            >
              Anmelden
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

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h2>Ziehungen</h2>
          <p>{drawsCount.count ?? 0} gespeichert</p>
        </article>
        <article className="dashboard-card">
          <h2>Datasets</h2>
          <p>{datasetsCount.count ?? 0} verfügbar</p>
        </article>
        <article className="dashboard-card">
          <h2>Experimente</h2>
          <p>{experimentsCount.count ?? 0} angelegt</p>
        </article>
        <article className="dashboard-card">
          <h2>Analysen</h2>
          <p>{runsCount.count ?? 0} Läufe</p>
        </article>
      </div>

      <div className="dashboard-grid">
        <Link className="dashboard-card" href="/app/experiments/demo">
          <h2>Demo</h2>
          <p>Sofort ausprobieren — auch ohne Konto.</p>
        </Link>

        <Link className="dashboard-card" href="/app/layouts">
          <h2>Layouts</h2>
          <p>Zahlenräume und Raster ansehen.</p>
        </Link>

        <Link className="dashboard-card" href="/app/shapes">
          <h2>Formen</h2>
          <p>Räumliche Pattern ansehen.</p>
        </Link>

        {isRegistered ? (
          <>
            <Link className="dashboard-card" href="/app/experiments/new">
              <h2>Analyse starten</h2>
              <p>Eigenes Experiment konfigurieren und ausführen.</p>
            </Link>
            <Link className="dashboard-card" href="/app/analyses">
              <h2>Analysen</h2>
              <p>Rankings und gespeicherte Läufe.</p>
            </Link>
          </>
        ) : (
          <Link
            className="dashboard-card"
            href="/register?next=%2Fapp%2Fexperiments%2Fnew"
          >
            <h2>Erweiterte Funktionen</h2>
            <p>Mit Registrierung: speichern, analysieren, eigene Patterns.</p>
          </Link>
        )}

        {showAdmin && (
          <Link className="dashboard-card" href="/app/admin">
            <h2>Administration</h2>
            <p>Ziehungen und Systemverwaltung.</p>
          </Link>
        )}
      </div>
    </section>
  );
}
