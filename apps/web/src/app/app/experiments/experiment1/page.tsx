import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { cn } from "@/lib/utils";

import { Experiment1Form } from "./Experiment1Form";

export const maxDuration = 300;

export default async function Experiment1Page() {
  await requireAdminPage();

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Experimente</p>
          <h1>Experiment 1</h1>
          <p>
            10 Seeds: Auswahl auf Ziehungen 401–700 nach Top-1 mit ≥2 Treffern,
            Bestätigung nur auf Holdout ab Ziehung 701.
          </p>
        </div>

        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/app/experiments"
        >
          Zurück
        </Link>
      </header>

      <Experiment1Form />
    </section>
  );
}
