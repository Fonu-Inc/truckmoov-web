/**
 * Paths reachable without a session. Everything else requires one.
 *
 * Typed `readonly string[]` rather than `as const` so `.includes(pathname)`
 * accepts an arbitrary string. Kept in its own module so both AuthGuard and
 * the router can read it without an import cycle.
 */
export const PUBLIC_ROUTES: readonly string[] = [
  "/auth",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/invite",
  "/auth/verify-email",
  "/auth/complete-profile",
  "/apply",
];

/**
 * Public routes opened from an email link. They render even with a session in
 * the browser — the link belongs to whoever received it, not to whoever last
 * signed in on this machine — so AuthGuard doesn't bounce them to the dashboard.
 */
export const EMAIL_LINK_ROUTES: readonly string[] = [
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/invite",
];

/**
 * Open to everyone, signed in or not, and never redirected — e.g. the customer-facing
 * live tracking link (TRU-FE-6 §6). Matched by prefix because the token is in the path.
 */
export const OPEN_ROUTE_PREFIXES: readonly string[] = ["/track/", "/stock-offer/"];
