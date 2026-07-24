import type { MessageKey } from "@/lib/i18n/messages/types";

type Translate = (
  key: MessageKey,
  vars?: Readonly<Record<string, string>>,
) => string;

const DOMAIN_KEYS: Record<string, MessageKey> = {
  lottery: "catalog.domain.lottery",
  geo: "catalog.domain.geo",
  weather: "catalog.domain.weather",
};

const COUNTRY_KEYS: Record<string, MessageKey> = {
  DE: "catalog.country.DE",
  EU: "catalog.country.EU",
  AT: "catalog.country.AT",
  CH: "catalog.country.CH",
  INT: "catalog.country.INT",
};

export function localizedDomainLabel(
  domainId: string | null | undefined,
  fallbackLabel: string | null | undefined,
  t: Translate,
): string {
  if (!domainId) {
    return fallbackLabel ?? "";
  }
  const key = DOMAIN_KEYS[domainId];
  return key ? t(key) : (fallbackLabel ?? domainId);
}

export function localizedCountryLabel(
  countryCode: string | null | undefined,
  t: Translate,
): string {
  const code = countryCode || "INT";
  const key = COUNTRY_KEYS[code];
  return key ? t(key) : code;
}

/** Scope id is the country code (or INT). */
export function localizedScopeLabel(
  scopeId: string | null | undefined,
  fallbackLabel: string | null | undefined,
  t: Translate,
): string {
  if (!scopeId) {
    return fallbackLabel ?? "";
  }
  if (COUNTRY_KEYS[scopeId]) {
    return localizedCountryLabel(scopeId, t);
  }
  return fallbackLabel ?? scopeId;
}
