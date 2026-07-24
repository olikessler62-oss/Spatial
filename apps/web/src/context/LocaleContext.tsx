"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  parseLocale,
  type Locale,
} from "@/lib/i18n/locale";
import type { MessageKey } from "@/lib/i18n/messages/types";
import { translate } from "@/lib/i18n/translate";

type LocaleContextValue = {
  readonly locale: Locale;
  readonly setLocale: (locale: Locale) => void;
  readonly t: (
    key: MessageKey,
    vars?: Readonly<Record<string, string>>,
  ) => string;
  readonly hydrated: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    const stored = parseLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
    setLocaleState(stored);
    document.documentElement.lang = stored;
    setHydrated(true);
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Readonly<Record<string, string>>) =>
      translate(locale, key, vars),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, hydrated }),
    [hydrated, locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return value;
}
