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
