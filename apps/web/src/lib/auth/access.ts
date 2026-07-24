import { redirect } from "next/navigation";

import { getViewer } from "@/lib/auth/get-viewer";
import type { ViewerProfile } from "@/lib/auth/roles";

/** Free tier without account: browse overview, public layouts/shapes, demo. */
export const GUEST_ALLOWED_PREFIXES = [
  "/app",
  "/app/overview-2",
  "/app/layouts",
  "/app/shapes",
  "/app/experiments",
  "/app/experiments/demo",
] as const;

/** Requires a registered account (client or admin). */
export const REGISTERED_ONLY_PREFIXES = [
  "/app/overview-1",
  "/app/overview-3",
  "/app/account",
  "/app/analyses",
  "/app/layouts/new",
  "/app/shapes/new",
  "/app/experiments/new",
] as const;

export async function requireRegisteredPage(
  nextPath: string,
): Promise<ViewerProfile> {
  const viewer = await getViewer();

  if (!viewer) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return viewer;
}
