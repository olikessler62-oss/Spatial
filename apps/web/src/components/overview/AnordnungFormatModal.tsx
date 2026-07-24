"use client";

import { useMemo, useState } from "react";

import { useLocale } from "@/context/LocaleContext";
import type { NumberSpace } from "@/lib/analysis/catalog";
import {
  anordnungEntriesForLottery,
  workshopRectangleOptionsForSize,
} from "@/lib/overview/anordnungOptions";
import { isAnordnungNameTaken } from "@/lib/overview/anordnungStorage";

export type FormatChoice =
  | {
      readonly kind: "rectangle";
      readonly rows: number;
      readonly columns: number;
      readonly name: string;
    }
  | { readonly kind: "circle"; readonly name: string };

type AnordnungFormatModalProps = {
  readonly numberSpace: NumberSpace;
  readonly lotteryId: string;
  readonly onCancel: () => void;
  readonly onConfirm: (choice: FormatChoice) => void;
};

export function AnordnungFormatModal({
  numberSpace,
  lotteryId,
  onCancel,
  onConfirm,
}: AnordnungFormatModalProps) {
  const { t } = useLocale();
  const options = useMemo(
    () => workshopRectangleOptionsForSize(numberSpace),
    [numberSpace],
  );
  const reservedNames = useMemo(
    () => [
      ...anordnungEntriesForLottery(numberSpace).map((entry) => entry.label),
      "Anpassen",
    ],
    [numberSpace],
  );
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [shapeKind, setShapeKind] = useState<"rectangle" | "circle">("rectangle");
  const [selectedId, setSelectedId] = useState(() => options[0]?.id ?? "");

  const selected = options.find((option) => option.id === selectedId) ?? null;
  const listDisabled = shapeKind === "circle";
  const formatReady =
    shapeKind === "circle" || (shapeKind === "rectangle" && Boolean(selected));
  const maxValue = numberSpace.minimumValue + numberSpace.size - 1;

  const handleContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t("pattern.nameRequired"));
      return;
    }
    if (isAnordnungNameTaken(lotteryId, trimmed, undefined, reservedNames)) {
      setNameError(t("pattern.nameTaken"));
      return;
    }
    if (!formatReady) {
      return;
    }
    setNameError(null);
    if (shapeKind === "circle") {
      onConfirm({ kind: "circle", name: trimmed });
      return;
    }
    if (!selected) {
      return;
    }
    onConfirm({
      kind: "rectangle",
      rows: selected.rows,
      columns: selected.columns,
      name: trimmed,
    });
  };

  return (
    <section className="overview1-anordnung-size">
      <header className="overview1-anordnung-size__topline">
        <span id="anordnung-size-title" className="overview1-anordnung-size__title">
          {t("pattern.formatTitle")}
        </span>
        <span className="overview1-anordnung-size__count">
          {t("pattern.formatCount", { count: String(maxValue) })}
        </span>
      </header>

      <div className="overview1-anordnung-size__name">
        <label
          className="overview1-anordnung-editor__label"
          htmlFor="anordnung-format-name"
        >
          {t("common.name")}
        </label>
        <input
          id="anordnung-format-name"
          type="text"
          className="overview1-anordnung-editor__input"
          autoFocus
          value={name}
          placeholder={t("pattern.namePlaceholder")}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) {
              setNameError(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleContinue();
            }
          }}
        />
        {nameError ? (
          <p className="overview1-anordnung-editor__error">{nameError}</p>
        ) : null}
      </div>

      <div
        className="overview1-anordnung-size__radios"
        role="radiogroup"
        aria-label={t("pattern.shape")}
      >
        <label className="overview1-anordnung-size__radio">
          <input
            type="radio"
            name="anordnung-format-kind"
            value="rectangle"
            checked={shapeKind === "rectangle"}
            onChange={() => setShapeKind("rectangle")}
          />
          <span>{t("pattern.rectangle")}</span>
        </label>
        <label className="overview1-anordnung-size__radio">
          <input
            type="radio"
            name="anordnung-format-kind"
            value="circle"
            checked={shapeKind === "circle"}
            onChange={() => setShapeKind("circle")}
          />
          <span>{t("pattern.circle")}</span>
        </label>
      </div>

      {shapeKind === "rectangle" && options.length === 0 ? (
        <p className="overview1-anordnung-editor__error">
          {t("pattern.noRectFormats")}
        </p>
      ) : (
        <div
          className={
            listDisabled
              ? "overview1-anordnung-size__list overview1-anordnung-size__list--disabled"
              : "overview1-anordnung-size__list"
          }
          role="listbox"
          aria-label={t("pattern.rectFormat")}
          aria-disabled={listDisabled}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === selectedId}
              disabled={listDisabled}
              className={
                option.id === selectedId && !listDisabled
                  ? "overview1-anordnung-size__option overview1-anordnung-size__option--active"
                  : "overview1-anordnung-size__option"
              }
              onClick={() => setSelectedId(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <footer className="overview1-anordnung-size__footer">
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
          disabled={!formatReady}
          onClick={handleContinue}
        >
          {t("common.continue")}
        </button>
      </footer>
    </section>
  );
}
