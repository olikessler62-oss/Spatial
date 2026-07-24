import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function formatNumbers(
  values: readonly { ordinal: number; value: number }[] | null | undefined,
): string {
  if (!values || values.length === 0) {
    return "—";
  }

  return [...values]
    .sort((left, right) => left.ordinal - right.ordinal)
    .map((entry) => entry.value)
    .join(" · ");
}

export default async function DrawsPage() {
  await requireAdminPage();
  const supabase = await createClient();

  const { data: versions, error: versionsError } = await supabase
    .schema("core")
    .from("dataset_versions")
    .select("id, dataset_id, version")
    .eq("status", "validated")
    .order("version", { ascending: false });

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const latestVersionByDataset = new Map<string, string>();

  for (const version of versions ?? []) {
    if (!latestVersionByDataset.has(version.dataset_id)) {
      latestVersionByDataset.set(version.dataset_id, version.id);
    }
  }

  const latestVersionIds = [...latestVersionByDataset.values()];

  const { data: draws, error } = latestVersionIds.length === 0
    ? { data: [], error: null }
    : await supabase
      .schema("core")
      .from("draws")
      .select(
        "id, external_id, draw_date, draw_main_values(ordinal, value), draw_bonus_values(bonus_type, ordinal, value), lottery_rule_sets(version)",
      )
      .in("dataset_version_id", latestVersionIds)
      .order("draw_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Ziehungen</p>
          <h1>Ziehungen verwalten</h1>
        </div>

        <Link
          className={cn(buttonVariants())}
          href="/app/draws/import"
        >
          Ziehungen importieren
        </Link>
      </header>

      {draws && draws.length > 0 ? (
        <div className="max-h-[calc(100vh-12rem)] overflow-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead className="w-28">Datum</TableHead>
                <TableHead>Gewinnzahlen</TableHead>
                <TableHead className="w-24">Superzahl</TableHead>
                <TableHead className="w-28">Regelwerk</TableHead>
                <TableHead className="w-36">Externe ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draws.map((draw) => {
                const ruleSet = Array.isArray(draw.lottery_rule_sets)
                  ? draw.lottery_rule_sets[0]
                  : draw.lottery_rule_sets;

                const mainValues = Array.isArray(draw.draw_main_values)
                  ? draw.draw_main_values
                  : draw.draw_main_values
                    ? [draw.draw_main_values]
                    : [];

                const bonusValues = Array.isArray(draw.draw_bonus_values)
                  ? draw.draw_bonus_values
                  : draw.draw_bonus_values
                    ? [draw.draw_bonus_values]
                    : [];

                return (
                  <TableRow key={draw.id}>
                    <TableCell className="font-medium tabular-nums">
                      {new Date(draw.draw_date).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatNumbers(mainValues)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatNumbers(bonusValues)}
                    </TableCell>
                    <TableCell>
                      {ruleSet ? `v${ruleSet.version}` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {draw.external_id ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="empty-state">
          <h2>Noch keine Ziehungen</h2>
          <p>Importiere den ersten Ziehungssatz.</p>
        </div>
      )}
    </section>
  );
}
