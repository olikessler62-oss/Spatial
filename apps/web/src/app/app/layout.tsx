import { AppShell } from "@/components/layout/AppShell";
import { buildLotteryCatalog } from "@/lib/analysis/catalog";
import { getViewer } from "@/lib/auth/get-viewer";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const viewer = await getViewer();

  const [lotteriesResult, ruleSetsResult, layoutsResult] = await Promise.all([
    supabase
      .schema("core")
      .from("lotteries")
      .select("id, name, country_code, is_active")
      .order("name"),
    supabase
      .schema("core")
      .from("lottery_rule_sets")
      .select(
        "id, lottery_id, valid_from, valid_to, main_value_min, main_value_max, main_value_count",
      )
      .order("valid_from", { ascending: false }),
    supabase
      .schema("analysis")
      .from("layouts")
      .select("id, name, lottery_id, layout_type, visibility, created_by")
      .order("created_at", { ascending: false }),
  ]);

  if (lotteriesResult.error) {
    throw new Error(lotteriesResult.error.message);
  }

  if (ruleSetsResult.error) {
    throw new Error(ruleSetsResult.error.message);
  }

  if (layoutsResult.error) {
    throw new Error(layoutsResult.error.message);
  }

  const catalog = buildLotteryCatalog(
    lotteriesResult.data ?? [],
    ruleSetsResult.data ?? [],
  );

  const layouts = (layoutsResult.data ?? [])
    .filter((layout) => {
      if (layout.visibility === "public") {
        return true;
      }

      return viewer !== null && layout.created_by === viewer.id;
    })
    .map((layout) => ({
      id: layout.id as string,
      lotteryId: layout.lottery_id as string,
      name: (layout.name as string) || "Unbenanntes Layout",
      layoutType: (layout.layout_type as string) || "grid",
    }));

  return (
    <AppShell
      catalog={catalog}
      viewer={viewer}
      layouts={layouts}
    >
      {children}
    </AppShell>
  );
}
