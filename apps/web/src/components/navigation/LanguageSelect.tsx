"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/context/LocaleContext";
import {
  languageMessageKey,
  LOCALES,
  localeToBcp47,
  type Locale,
} from "@/lib/i18n/locale";

export function LanguageSelect() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);

  const sortedLocales = useMemo(
    () =>
      [...LOCALES].sort((left, right) =>
        t(languageMessageKey(left)).localeCompare(
          t(languageMessageKey(right)),
          localeToBcp47(locale),
          { sensitivity: "base" },
        ),
      ),
    [locale, t],
  );

  return (
    <div className="app-topbar__language">
      <span className="sr-only" id="app-language-label">
        {t("language")}
      </span>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="app-topbar__language-backdrop" aria-hidden />,
            document.body,
          )
        : null}
      <Select
        value={locale}
        open={open}
        onOpenChange={setOpen}
        onValueChange={(value) => {
          if (value) {
            setLocale(value as Locale);
          }
        }}
      >
        <SelectTrigger
          size="sm"
          aria-labelledby="app-language-label"
          className="app-topbar__language-select"
        >
          <SelectValue>{t(languageMessageKey(locale))}</SelectValue>
        </SelectTrigger>
        <SelectContent
          align="end"
          alignItemWithTrigger={false}
          className="app-topbar__language-menu"
        >
          {sortedLocales.map((code) => (
            <SelectItem
              key={code}
              value={code}
              className="app-topbar__language-item"
            >
              {t(languageMessageKey(code))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
