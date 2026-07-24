import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { cn } from "@/lib/utils";

export default async function AdminPage() {
  const viewer = await requireAdminPage();

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Administration</p>
          <h1>Administration</h1>
          <p>
            Angemeldet als Admin ({viewer.email}). Verwaltungsfunktionen für
            die Plattform.
          </p>
        </div>

        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/app/overview-1"
        >
          Zur Übersicht
        </Link>
      </header>

      <div className="dashboard-grid">
        <Link
          className="dashboard-card"
          href="/app/admin/accounts"
        >
          <h2>Konten</h2>
          <p>Registrierte Konten einsehen, sperren oder freischalten.</p>
        </Link>

        <Link
          className="dashboard-card"
          href="/app/draws"
        >
          <h2>Ziehungen</h2>
          <p>Ziehungen verwalten und CSV-Importe durchführen.</p>
        </Link>

        <article className="dashboard-card">
          <h2>Rolle</h2>
          <p>admin</p>
        </article>

        <article className="dashboard-card">
          <h2>Plan</h2>
          <p>{viewer.plan}</p>
        </article>
      </div>
    </section>
  );
}
