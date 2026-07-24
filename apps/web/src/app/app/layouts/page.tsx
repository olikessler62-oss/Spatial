import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth/get-viewer";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function LayoutsPage() {
  const supabase = await createClient();
  const viewer = await getViewer();
  const isRegistered = viewer !== null;

  const { data: layouts, error } = await supabase
    .schema("analysis")
    .from("layouts")
    .select(
      "id, name, layout_type, visibility, created_at, lottery_id, layout_versions(version, status, parameters)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const lotteryIds = [
    ...new Set(
      (layouts ?? [])
        .map((layout) => layout.lottery_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const lotteryNameById = new Map<string, string>();

  if (lotteryIds.length > 0) {
    const { data: lotteries, error: lotteriesError } = await supabase
      .schema("core")
      .from("lotteries")
      .select("id, name")
      .in("id", lotteryIds);

    if (lotteriesError) {
      throw new Error(lotteriesError.message);
    }

    for (const lottery of lotteries ?? []) {
      lotteryNameById.set(lottery.id as string, lottery.name as string);
    }
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Layouts</p>
          <h1>Layouts verwalten</h1>
        </div>

        {isRegistered ? (
          <Link
            className={cn(buttonVariants())}
            href="/app/layouts/new"
          >
            Layout komponieren
          </Link>
        ) : (
          <Link
            className={cn(buttonVariants())}
            href="/register?next=%2Fapp%2Flayouts%2Fnew"
          >
            Registrieren zum Komponieren
          </Link>
        )}
      </header>

      {layouts && layouts.length > 0 ? (
        <div className="experiment-list">
          {layouts.map((layout) => {
            const versions = Array.isArray(layout.layout_versions)
              ? layout.layout_versions
              : layout.layout_versions
                ? [layout.layout_versions]
                : [];
            const latest = versions[0];
            const parameters = (latest?.parameters ?? {}) as {
              rows?: number;
              columns?: number;
              orderingMode?: string;
              type?: string;
            };

            const geometry =
              parameters.type === "circle"
                ? "Ring"
                : typeof parameters.rows === "number"
                  && typeof parameters.columns === "number"
                  ? `${parameters.rows}×${parameters.columns}`
                  : layout.layout_type;

            return (
              <article
                className="experiment-list__item"
                key={layout.id}
              >
                <div>
                  <h2>{layout.name}</h2>
                  <p>
                    {lotteryNameById.get(layout.lottery_id as string)
                      ?? "Unbekannte Lotterie"}
                    {" · "}
                    {geometry}
                    {parameters.orderingMode
                      ? ` · ${parameters.orderingMode === "unordered" ? "ungeordnet" : "geordnet"}`
                      : ""}
                    {latest ? ` · v${latest.version}` : ""}
                  </p>
                  <small>Sichtbarkeit: {layout.visibility}</small>
                </div>
                <span>
                  {new Date(layout.created_at).toLocaleDateString("de-DE")}
                </span>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Noch keine Layouts</h2>
          <p>Komponiere dein erstes Raster oder einen Ring.</p>
          <Link
            className={cn(buttonVariants())}
            href={
              isRegistered
                ? "/app/layouts/new"
                : "/register?next=%2Fapp%2Flayouts%2Fnew"
            }
          >
            {isRegistered
              ? "Layout komponieren"
              : "Registrieren zum Komponieren"}
          </Link>
        </div>
      )}
    </section>
  );
}
