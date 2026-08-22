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
