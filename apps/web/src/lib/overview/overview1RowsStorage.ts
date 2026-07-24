import type { AppliedRasterForm } from "@/lib/overview/rasterForm";

/**
 * Persisted Overview-1 map rows (panels) per lottery. Each row keeps the
 * chosen pattern and grid so the exact layout is restored on next start.
 */
export type StoredOverview1Row = {
  readonly id: string;
  readonly form: AppliedRasterForm | null;
  readonly grid: number[][] | null;
};

const STORAGE_KEY = "spatial.overview1.rows.v1";

type StoreShape = {
  readonly byLottery: Record<string, StoredOverview1Row[]>;
};

function readStore(): StoreShape {
  if (typeof window === "undefined") {
    return { byLottery: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { byLottery: {} };
    }
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || typeof parsed !== "object" || !parsed.byLottery) {
      return { byLottery: {} };
    }
    return parsed;
  } catch {
    return { byLottery: {} };
  }
}

function writeStore(store: StoreShape): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota / serialization errors — persistence is best-effort.
  }
}

function isValidRow(value: unknown): value is StoredOverview1Row {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return typeof row.id === "string";
}

export function readStoredOverview1Rows(
  lotteryId: string,
): StoredOverview1Row[] {
  const store = readStore();
  const rows = store.byLottery[lotteryId];
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.filter(isValidRow);
}

export function writeStoredOverview1Rows(
  lotteryId: string,
  rows: readonly StoredOverview1Row[],
): void {
  const store = readStore();
  writeStore({
    byLottery: {
      ...store.byLottery,
      [lotteryId]: rows.map((row) => ({
        id: row.id,
        form: row.form,
        grid: row.grid ? row.grid.map((line) => [...line]) : null,
      })),
    },
  });
}
