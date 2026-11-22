/**
 * Paths reachable without a session. Everything else requires one.
 *
 * Typed `readonly string[]` rather than `as const` so `.includes(pathname)`
 * accepts an arbitrary string. Kept in its own module so both AuthGuard and
 * the router can read it without an import cycle.
 */
export const PUBLIC_ROUTES: readonly string[] = [
  "/auth",
  "/auth/invite",
];

/**
 * Public routes opened from an email link. They render even with a session in
 * the browser — the link belongs to whoever received it, not to whoever last
 * signed in on this machine — so AuthGuard doesn't bounce them to the dashboard.
 */
export const EMAIL_LINK_ROUTES: readonly string[] = ["/auth/invite"];
