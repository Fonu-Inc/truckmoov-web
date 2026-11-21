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
];

/**
 * Open to everyone, signed in or not, and never redirected — e.g. the customer-facing
 * live tracking link (TRU-FE-6 §6). Matched by prefix because the token is in the path.
 */
export const OPEN_ROUTE_PREFIXES: readonly string[] = ["/track/"];
