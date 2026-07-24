import { redirect } from "next/navigation";

import { getViewer } from "@/lib/auth/get-viewer";
import type { ViewerProfile } from "@/lib/auth/roles";

export async function requireAdminPage(): Promise<ViewerProfile> {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/login?next=/app/overview-1");
  }

  if (viewer.role !== "admin") {
    redirect("/app/overview-1");
  }

  return viewer;
}
