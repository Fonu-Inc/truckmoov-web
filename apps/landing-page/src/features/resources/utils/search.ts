/** Lower-cased, trimmed search query. */
export function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

/** True when any field contains the (already normalized) query. An empty query matches everything. */
export function matchesQuery(query: string, ...fields: string[]) {
  return !query || fields.some(field => field.toLowerCase().includes(query));
}
