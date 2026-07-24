import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { cn } from "@/lib/utils";

import { Corner5x5Form } from "./Corner5x5Form";

export const maxDuration = 120;

export default async function Corner5x5Page() {
  await requireAdminPage();

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Experimente</p>
          <h1>Corner 5×5</h1>
          <p>
            Ein festes willkürliches 7×7-Layout. Im linken oberen 5×5 werden
            neun 5er-Muster geprüft: welche die letzte Ziehung verfehlt haben,
            und wie häufig Nicht-Treffer in der Vergangenheit waren.
          </p>
        </div>
        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/app/experiments"
        >
          Zurück
        </Link>
      </header>

      <Corner5x5Form />
    </section>
  );
}
