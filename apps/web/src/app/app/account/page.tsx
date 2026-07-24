import Link from "next/link";
import { redirect } from "next/navigation";

import { deleteAccount, signOut } from "../actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth/get-viewer";
import { cn } from "@/lib/utils";

export default async function AccountPage() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/login");
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Konto</p>
          <h1>Mein Konto</h1>
          <p>
            Anmeldung über Magic Link. Rollen: Admin oder Client. Zahlpläne
            (free / pro / team) sind vorbereitet, aber noch nicht aktiv.
          </p>
        </div>
      </header>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h2>E-Mail</h2>
          <p>{viewer.email}</p>
        </article>
        <article className="dashboard-card">
          <h2>Rolle</h2>
          <p>{viewer.role}</p>
        </article>
        <article className="dashboard-card">
          <h2>Plan</h2>
          <p>{viewer.plan} (demnächst buchbar)</p>
        </article>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
          >
            Abmelden
          </Button>
        </form>

        <form action={deleteAccount}>
          <Button
            type="submit"
            variant="outline"
          >
            Konto löschen
          </Button>
        </form>

        <Link
          className={cn(buttonVariants())}
          href="/app/overview-1"
        >
          Zur Übersicht
        </Link>
      </div>
    </section>
  );
}
