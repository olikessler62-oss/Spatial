import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { createClient } from "@/lib/supabase/server";

import { ImportDrawsForm } from "./ImportDrawsForm";

export default async function ImportDrawsPage() {
  await requireAdminPage();
  const supabase = await createClient();

  const { data: datasets, error } = await supabase
    .schema("core")
    .from("datasets")
    .select("id, name, lotteries(name)")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const datasetOptions = (datasets ?? []).map((dataset) => {
    const lottery = Array.isArray(dataset.lotteries)
      ? dataset.lotteries[0]
      : dataset.lotteries;

    return {
      id: dataset.id,
      name: lottery?.name
        ? `${lottery.name} · ${dataset.name}`
        : dataset.name,
    };
  });

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Ziehungen</p>
          <h1>Ziehungen importieren</h1>
          <p>
            CSV hochladen. Unterstützt Spatial-Format und deutsche Lotto-Archive
            (Datum;Gewinnzahl1…6;ZZ).
          </p>
          <p>CSV in ein Lottery-Dataset laden — Regelwerke werden nach Ziehungdatum aufgelöst.</p>
        </div>
      </header>

      <ImportDrawsForm datasets={datasetOptions} />
    </section>
  );
}
