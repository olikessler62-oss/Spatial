const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Accept only canonical UUIDs from untrusted input (URL, forms, APIs). */
export function parseTrustedUuid(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const value = raw.trim();
  return UUID_RE.test(value) ? value.toLowerCase() : null;
}
