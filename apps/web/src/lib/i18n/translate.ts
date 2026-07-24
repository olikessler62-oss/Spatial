import { de } from "@/lib/i18n/messages/de";
import { en } from "@/lib/i18n/messages/en";
import { es } from "@/lib/i18n/messages/es";
import { fr } from "@/lib/i18n/messages/fr";
import { it } from "@/lib/i18n/messages/it";
import { pl } from "@/lib/i18n/messages/pl";
import type { MessageKey, Messages } from "@/lib/i18n/messages/types";
import type { Locale } from "@/lib/i18n/locale";

const catalogs: Record<Locale, Messages> = { de, en, it, es, pl, fr };

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Readonly<Record<string, string>>,
): string {
  const template = catalogs[locale][key] ?? catalogs.de[key] ?? key;
  if (!vars) {
    return template;
  }
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}
