"use client";

import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/context/LocaleContext";
import type { NumberSpace } from "@/lib/analysis/catalog";
import {
  anordnungEntriesForLottery,
  buildEntryBelegung,
  findAnordnungEntry,
  guessAnordnungEntryId,
  type RasterCell,
} from "@/lib/overview/anordnungOptions";
import {
  deleteAnordnung,
  listSavedAnordnungen,
  type SavedAnordnung,
} from "@/lib/overview/anordnungStorage";
import {
  type AppliedRasterForm,
} from "@/lib/overview/rasterForm";

export type AnordnungDraft = {
  readonly selectionId: string;
  readonly form: AppliedRasterForm;
  readonly grid: number[][];
};

export type AnordnungEditTarget = {
  readonly mode: "circle" | "custom";
  readonly selectionId: string;
  readonly form: AppliedRasterForm;
  readonly grid: number[][] | null;
  /** Prefill name when creating a new own entry via Format wählen. */
  readonly draftName?: string;
};

type AnordnungPickerProps = {
  readonly numberSpace: NumberSpace;
  readonly lotteryId: string;
  readonly initialForm: AppliedRasterForm | null;
  readonly initialGrid: number[][] | null;
  readonly onCancel: () => void;
  readonly onApply: (draft: AnordnungDraft) => void;
  readonly onEdit: (target: AnordnungEditTarget) => void;
  readonly onRequestNewCustom: () => void;
};

function gridFromCells(
  raster: readonly (readonly RasterCell[])[],
): number[][] | null {
  const grid: number[][] = [];
  for (const row of raster) {
    const nextRow: number[] = [];
    for (const cell of row) {
      if (cell === null) {
        return null;
      }
      nextRow.push(cell);
    }
    grid.push(nextRow);
  }
  return grid;
}

function cloneGrid(grid: readonly (readonly number[])[]): number[][] {
  return grid.map((row) => [...row]);
}

export function AnordnungPicker({
  numberSpace,
  lotteryId,
  initialForm,
  initialGrid,
  onCancel,
  onApply,
  onEdit,
  onRequestNewCustom,
}: AnordnungPickerProps) {
  const { t } = useLocale();
  const size = numberSpace.size;
  const minimumValue = numberSpace.minimumValue;
  const entries = useMemo(
    () => anordnungEntriesForLottery(numberSpace),
    [numberSpace],
  );
  const [savedEntries, setSavedEntries] = useState<SavedAnordnung[]>(() =>
    listSavedAnordnungen(lotteryId),
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [selectionId, setSelectionId] = useState(() => {
    const saved = listSavedAnordnungen(lotteryId);
    if (saved.length > 0) {
      return saved[0]!.id;
    }
    return guessAnordnungEntryId(initialForm, entries);
  });

  /** Keeps an own entry selected for Ändern/Löschen even if a fixed entry is applied. */
  const [ownSelectionId, setOwnSelectionId] = useState<string | null>(() => {
    const saved = listSavedAnordnungen(lotteryId);
    return saved[0]?.id ?? null;
  });

  const [activePanel, setActivePanel] = useState<"fixed" | "own">(() => {
    const saved = listSavedAnordnungen(lotteryId);
    return saved.length > 0 ? "own" : "fixed";
  });

  useEffect(() => {
    const saved = listSavedAnordnungen(lotteryId);
    setSavedEntries(saved);
    if (saved.length === 0) {
      setOwnSelectionId(null);
      setActivePanel("fixed");
      return;
    }
    setOwnSelectionId((current) => {
      if (current && saved.some((entry) => entry.id === current)) {
        return current;
      }
      return saved[0]!.id;
    });
    setSelectionId((current) => {
      if (saved.some((entry) => entry.id === current)) {
        return current;
      }
      if (entries.some((entry) => entry.id === current)) {
        return current;
      }
      return saved[0]!.id;
    });
  }, [entries, lotteryId]);

  useEffect(() => {
    if (savedEntries.some((entry) => entry.id === selectionId)) {
      setActivePanel("own");
      return;
    }
    if (entries.some((entry) => entry.id === selectionId)) {
      setActivePanel("fixed");
    }
  }, [entries, savedEntries, selectionId]);

  const selectedEntry = findAnordnungEntry(entries, selectionId);
  const selectedSaved = savedEntries.find((entry) => entry.id === selectionId);
  const activeOwnEntry =
    savedEntries.find((entry) => entry.id === ownSelectionId)
    ?? savedEntries[0]
    ?? null;
  const canEditOrDelete = Boolean(activeOwnEntry);

  const selectFixed = (entryId: string) => {
    setActivePanel("fixed");
    setSelectionId(entryId);
  };

  const selectOwn = (entryId: string) => {
    setActivePanel("own");
    setSelectionId(entryId);
    setOwnSelectionId(entryId);
  };

  const draftForm = useMemo((): AppliedRasterForm | null => {
    if (selectedSaved) {
      return selectedSaved.form;
    }
    return selectedEntry?.resolveForm(size) ?? null;
  }, [selectedEntry, selectedSaved, size]);

  const fixedEntries = useMemo(
    () => entries.filter((entry) => !entry.editable),
    [entries],
  );

  const resolveDraft = (): AnordnungDraft | null => {
    if (!draftForm) {
      return null;
    }

    if (selectedSaved) {
      return {
        selectionId: selectedSaved.id,
        form: selectedSaved.form,
        grid: cloneGrid(selectedSaved.grid),
      };
    }

    if (selectedEntry) {
      const cells = buildEntryBelegung(selectedEntry, size, minimumValue);
      const grid = gridFromCells(cells);
      if (!grid) {
        return null;
      }
      return {
        selectionId: selectedEntry.id,
        form: draftForm,
        grid,
      };
    }

    if (
      initialForm
      && initialGrid
      && selectionId === guessAnordnungEntryId(initialForm, entries)
    ) {
      return {
        selectionId,
        form: initialForm,
        grid: cloneGrid(initialGrid),
      };
    }

    return null;
  };

  const handleApply = () => {
    const draft = resolveDraft();
    if (!draft) {
      return;
    }
    onApply(draft);
  };

  const handleEditSelected = () => {
    if (!activeOwnEntry) {
      return;
    }
    setOwnSelectionId(activeOwnEntry.id);
    setSelectionId(activeOwnEntry.id);
    onEdit({
      mode: activeOwnEntry.form.kind === "ring" ? "circle" : "custom",
      selectionId: activeOwnEntry.id,
      form: activeOwnEntry.form,
      grid: cloneGrid(activeOwnEntry.grid),
    });
  };

  const handleDeleteConfirmed = () => {
    if (!activeOwnEntry) {
      return;
    }
    const deletedId = activeOwnEntry.id;
    deleteAnordnung(lotteryId, deletedId);
    const next = listSavedAnordnungen(lotteryId);
    setSavedEntries(next);
    setDeleteConfirmOpen(false);
    const nextOwnId = next[0]?.id ?? null;
    setOwnSelectionId(nextOwnId);
    if (selectionId === deletedId) {
      setSelectionId(nextOwnId ?? entries[0]?.id ?? "");
    }
  };

  return (
    <section className="overview1-anordnung-picker">
      <header className="overview1-anordnung-picker__topline">
        <span className="overview1-anordnung-picker__title">{t("pattern.pickerTitle")}</span>
      </header>

      <div className="overview1-anordnung-picker__panels">
        <div
          className={[
            "overview1-anordnung-picker__panel",
            activePanel === "fixed"
              ? "overview1-anordnung-picker__panel--active"
              : "overview1-anordnung-picker__panel--inactive",
          ].join(" ")}
        >
          <span className="overview1-anordnung-editor__label">{t("pattern.fixed")}</span>
          <div
            className="overview1-anordnung-picker__list"
            role="listbox"
            aria-label={t("pattern.fixed")}
          >
            {fixedEntries.map((entry) => (
              <div
                key={entry.id}
                className={
                  activePanel === "fixed" && selectionId === entry.id
                    ? "overview1-anordnung-picker__row overview1-anordnung-picker__row--active"
                    : "overview1-anordnung-picker__row"
                }
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={activePanel === "fixed" && selectionId === entry.id}
                  className="overview1-anordnung-picker__entry"
                  onClick={() => selectFixed(entry.id)}
                >
                  <span>{entry.label}</span>
                </button>
              </div>
            ))}
            {fixedEntries.length === 0 ? (
              <p className="overview1-anordnung-picker__empty">{t("pattern.fixedEmpty")}</p>
            ) : null}
          </div>
        </div>

        <div
          className={[
            "overview1-anordnung-picker__panel",
            activePanel === "own"
              ? "overview1-anordnung-picker__panel--active"
              : "overview1-anordnung-picker__panel--inactive",
          ].join(" ")}
        >
          <span className="overview1-anordnung-editor__label">{t("pattern.own")}</span>
          <div
            className="overview1-anordnung-picker__list"
            role="listbox"
            aria-label={t("pattern.own")}
          >
            {savedEntries.map((entry) => (
              <div
                key={entry.id}
                className={
                  activePanel === "own" && ownSelectionId === entry.id
                    ? "overview1-anordnung-picker__row overview1-anordnung-picker__row--active"
                    : "overview1-anordnung-picker__row"
                }
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={activePanel === "own" && ownSelectionId === entry.id}
                  className="overview1-anordnung-picker__entry"
                  onClick={() => selectOwn(entry.id)}
                >
                  <span>{entry.name}</span>
                </button>
              </div>
            ))}

            {savedEntries.length === 0 ? (
              <p className="overview1-anordnung-picker__empty">{t("pattern.ownEmpty")}</p>
            ) : null}
          </div>

          <div className="overview1-anordnung-picker__own-actions">
            <button
              type="button"
              className="overview1-anordnung-editor__btn overview1-anordnung-picker__own-btn"
              onClick={() => {
                setActivePanel("own");
                onRequestNewCustom();
              }}
            >
              {t("common.new")}
            </button>
            <button
              type="button"
              className="overview1-anordnung-editor__btn overview1-anordnung-picker__own-btn"
              disabled={!canEditOrDelete || activePanel !== "own"}
              onClick={handleEditSelected}
            >
              {t("common.edit")}
            </button>
            <button
              type="button"
              className="overview1-anordnung-editor__btn overview1-anordnung-picker__own-btn"
              disabled={!canEditOrDelete || activePanel !== "own"}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              {t("common.delete")}
            </button>
          </div>
        </div>
      </div>

      <footer className="overview1-anordnung-picker__footer">
        <div className="overview1-anordnung-picker__actions">
          <button
            type="button"
            className="overview1-anordnung-editor__btn"
            onClick={onCancel}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="overview1-anordnung-editor__btn overview1-anordnung-editor__btn--primary"
            onClick={handleApply}
            disabled={!draftForm && !selectedSaved}
          >
            {t("common.apply")}
          </button>
        </div>
      </footer>

      {deleteConfirmOpen && activeOwnEntry ? (
        <div className="overview1-anordnung-confirm-layer" role="presentation">
          <button
            type="button"
            className="overview1-anordnung-confirm-layer__backdrop"
            aria-label={t("common.cancel")}
            onClick={() => setDeleteConfirmOpen(false)}
          />
          <div
            className="overview1-anordnung-confirm-layer__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="anordnung-delete-title"
          >
            <h3 id="anordnung-delete-title" className="overview1-anordnung-confirm__title">
              {t("pattern.deleteConfirmTitle")}
            </h3>
            <p className="overview1-anordnung-confirm__text">
              {t("pattern.deleteConfirmBody", { name: activeOwnEntry.name })}
            </p>
            <div className="overview1-anordnung-confirm__actions">
              <button
                type="button"
                className="overview1-anordnung-editor__btn"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="overview1-anordnung-editor__btn overview1-anordnung-picker__delete-confirm"
                onClick={handleDeleteConfirmed}
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
