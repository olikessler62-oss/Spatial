import { redirect } from "next/navigation";

import { getViewer } from "@/lib/auth/get-viewer";

/** Test phase: start directly on Übersicht 1 (skip landing / login screen). */
export default async function HomePage() {
  const viewer = await getViewer();

  if (viewer) {
    redirect("/app/overview-1");
  }

  redirect("/login?next=/app/overview-1");
}
