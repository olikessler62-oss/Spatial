import type { AppliedRasterForm } from "@/lib/overview/rasterForm";

export type SavedAnordnung = {
  readonly id: string;
  readonly name: string;
  readonly lotteryId: string;
  readonly form: AppliedRasterForm;
  readonly grid: number[][];
  readonly createdAt: string;
};

const STORAGE_KEY = "spatial.anordnung.presets.v1";

type StoreShape = {
  readonly byLottery: Record<string, SavedAnordnung[]>;
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function listSavedAnordnungen(lotteryId: string): SavedAnordnung[] {
  const store = readStore();
  return [...(store.byLottery[lotteryId] ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "de"),
  );
}

export function isAnordnungNameTaken(
  lotteryId: string,
  name: string,
  exceptId?: string,
  reservedNames: readonly string[] = [],
): boolean {
  const normalized = name.trim().toLocaleLowerCase("de");
  if (!normalized) {
    return true;
  }
  if (
    reservedNames.some(
      (label) => label.trim().toLocaleLowerCase("de") === normalized,
    )
  ) {
    return true;
  }
  return listSavedAnordnungen(lotteryId).some(
    (entry) =>
      entry.id !== exceptId
      && entry.name.trim().toLocaleLowerCase("de") === normalized,
  );
}

export function saveAnordnung(input: {
  readonly lotteryId: string;
  readonly name: string;
  readonly form: AppliedRasterForm;
  readonly grid: number[][];
  readonly reservedNames?: readonly string[];
}): SavedAnordnung | { readonly error: string } {
  const name = input.name.trim();
  if (!name) {
    return { error: "Bitte einen Namen vergeben." };
  }
  if (
    isAnordnungNameTaken(
      input.lotteryId,
      name,
      undefined,
      input.reservedNames,
    )
  ) {
    return { error: "Dieser Name ist bereits vergeben." };
  }

  const entry: SavedAnordnung = {
    id: `saved-${crypto.randomUUID()}`,
    name,
    lotteryId: input.lotteryId,
    form: input.form,
    grid: input.grid.map((row) => [...row]),
    createdAt: new Date().toISOString(),
  };

  const store = readStore();
  const nextList = [...(store.byLottery[input.lotteryId] ?? []), entry];
  writeStore({
    byLottery: {
      ...store.byLottery,
      [input.lotteryId]: nextList,
    },
  });
  return entry;
}

export function updateAnordnung(input: {
  readonly lotteryId: string;
  readonly id: string;
  readonly name: string;
  readonly form: AppliedRasterForm;
  readonly grid: number[][];
  readonly reservedNames?: readonly string[];
}): SavedAnordnung | { readonly error: string } {
  const name = input.name.trim();
  if (!name) {
    return { error: "Bitte einen Namen vergeben." };
  }
  if (
    isAnordnungNameTaken(
      input.lotteryId,
      name,
      input.id,
      input.reservedNames,
    )
  ) {
    return { error: "Dieser Name ist bereits vergeben." };
  }

  const store = readStore();
  const current = store.byLottery[input.lotteryId] ?? [];
  const index = current.findIndex((entry) => entry.id === input.id);
  if (index < 0) {
    return { error: "Eintrag nicht gefunden." };
  }

  const previous = current[index]!;
  const entry: SavedAnordnung = {
    ...previous,
    name,
    form: input.form,
    grid: input.grid.map((row) => [...row]),
  };
  const nextList = [...current];
  nextList[index] = entry;
  writeStore({
    byLottery: {
      ...store.byLottery,
      [input.lotteryId]: nextList,
    },
  });
  return entry;
}

export function deleteAnordnung(
  lotteryId: string,
  id: string,
): boolean {
  const store = readStore();
  const current = store.byLottery[lotteryId] ?? [];
  const nextList = current.filter((entry) => entry.id !== id);
  if (nextList.length === current.length) {
    return false;
  }
  writeStore({
    byLottery: {
      ...store.byLottery,
      [lotteryId]: nextList,
    },
  });
  return true;
}
