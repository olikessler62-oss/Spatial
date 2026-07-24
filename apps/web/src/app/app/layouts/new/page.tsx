import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireRegisteredPage } from "@/lib/auth/access";
import { cn } from "@/lib/utils";

import { LayoutComposerForm } from "./LayoutComposerForm";

export default async function NewLayoutPage() {
  await requireRegisteredPage("/app/layouts/new");

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Layouts</p>
          <h1>Layout komponieren</h1>
          <p>
            Zahlenraum des Analysekontexts in Raster oder Ring anordnen —
            geordnet oder ungeordnet.
          </p>
        </div>

        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/app/layouts"
        >
          Zurück
        </Link>
      </header>

      <LayoutComposerForm />
    </section>
  );
}
