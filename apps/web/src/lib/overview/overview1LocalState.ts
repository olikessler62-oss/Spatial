import { parseTrustedUuid } from "@/lib/security/trustedIds";

export type Overview1SelectionState = {
  readonly lotteryId: string | null;
  readonly layoutId: string | null;
};

const LAYOUT_STORAGE_KEY = "spatial.overview1.layout.v1";

export function readStoredOverview1LayoutId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return parseTrustedUuid(window.localStorage.getItem(LAYOUT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredOverview1LayoutId(layoutId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!layoutId) {
    window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
    return;
  }

  const trusted = parseTrustedUuid(layoutId);
  if (!trusted) {
    return;
  }

  window.localStorage.setItem(LAYOUT_STORAGE_KEY, trusted);
}
