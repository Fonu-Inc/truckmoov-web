/**
 * general-utils — small, domain-free helpers shared by both apps.
 *
 * Do not write a local copy of anything in here. If something does not fit, add
 * or widen a function here instead. Anything about dates or times belongs in
 * time-utils.ts instead. See docs/general-utils.md.
 */

/**
 * Initials for an avatar or fallback badge: the first letter of each of the
 * first two words, or "-" when there is no name. Reach for this instead of
 * hand-rolling `.split(" ")` — it tolerates missing, blank and multi-space
 * input, and every avatar in both apps reads the same.
 */
export function getInitials(name?: string | null): string {
  return (
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0]!.toUpperCase())
      .join('') || '-'
  )
}

/**
 * Debounce: return a wrapped version of `fn` that only fires after `wait` ms
 * of quiet. Reach for it whenever a change event (keystroke, resize, filter)
 * should not fan out to work like a request or a heavy re-render on every tick.
 *
 * The returned function has a `.cancel()` method — call it from `useEffect`
 * cleanup so a pending trailing call doesn't run after the component unmounts
 * or the value is superseded.
 *
 *   const debounced = debounce((v: string) => search(v), 300)
 *   input.oninput = e => debounced(e.target.value)
 *   // later: debounced.cancel()
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait: number,
): ((...args: Args) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = (...args: Args) => {
    if (timer)
      clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, wait)
  }
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  return debounced
}

/**
 * Save a Blob (an API export, a generated file) to the user's downloads under
 * `filename`. Browser-only; does nothing without a `document`.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined')
    return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * A byte count as B / KB / MB / GB (1024-based) for file and storage sizes.
 * Returns `"-"` for null/undefined, so an unknown size reads as unknown, not 0.
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes))
    return '-'
  if (bytes < 1024)
    return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024)
    return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024)
    return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}
