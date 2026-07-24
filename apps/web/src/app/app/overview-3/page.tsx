import { requireRegisteredPage } from "@/lib/auth/access";

import { Overview3PhaseBoard } from "./Overview3PhaseBoard";

export default async function Overview3Page() {
  await requireRegisteredPage("/app/overview-3");

  return <Overview3PhaseBoard />;
}
