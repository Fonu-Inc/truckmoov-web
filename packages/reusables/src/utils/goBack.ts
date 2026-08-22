/**
 * True when there is an earlier entry *in this app* to go back to.
 *
 * `history.length` is no help — it counts the whole tab session, so it is > 1
 * even on a link opened in a fresh tab. React Router keeps its own stack index
 * in `history.state.idx`, and 0 means this is the first entry it pushed.
 *
 * ponytail: reads a React Router-owned field. If a future version stops
 * writing `idx`, this reads as "no history" and every status screen sends the
 * user home instead of back — degraded, not broken. Swap in a public
 * `canGoBack` if React Router ever ships one.
 */
export function canGoBack(): boolean {
  return ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;
}
