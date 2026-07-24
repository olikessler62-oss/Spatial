import { Suspense } from "react";

import { Overview1TempBoards } from "@/components/overview/Overview1TempBoards";
import { requireRegisteredPage } from "@/lib/auth/access";

export default async function Overview1Page() {
  await requireRegisteredPage("/app/overview-1");

  return (
    <Suspense fallback={null}>
      <Overview1TempBoards />
    </Suspense>
  );
}
