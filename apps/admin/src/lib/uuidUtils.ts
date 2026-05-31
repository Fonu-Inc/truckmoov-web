/** UUID v1-v5 pattern check (case-insensitive). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string | null | undefined): boolean {
  if (!id) return false;
  return UUID_RE.test(id);
}

/** Return only entries that look like real UUIDs (drops demo placeholders). */
export function filterValidUuids(ids: ReadonlyArray<string | null | undefined>): string[] {
  return ids.filter((id): id is string => isValidUuid(id));
}



