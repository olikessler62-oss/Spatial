export const LOCALES = ["de", "en", "it", "es", "pl", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_STORAGE_KEY = "spatial.locale.v1";

const LOCALE_BCP47: Record<Locale, string> = {
  de: "de-DE",
  en: "en-US",
  it: "it-IT",
  es: "es-ES",
  pl: "pl-PL",
  fr: "fr-FR",
};

export function isLocale(value: unknown): value is Locale {
  return (
    value === "de"
    || value === "en"
    || value === "it"
    || value === "es"
    || value === "pl"
    || value === "fr"
  );
}

export function parseLocale(raw: string | null | undefined): Locale {
  if (isLocale(raw)) {
    return raw;
  }
  return DEFAULT_LOCALE;
}

export function localeToBcp47(locale: Locale): string {
  return LOCALE_BCP47[locale];
}

export function languageMessageKey(
  locale: Locale,
): `language.${Locale}` {
  return `language.${locale}`;
}
