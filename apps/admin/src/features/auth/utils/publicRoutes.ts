/**
 * Paths reachable without a session. Everything else requires one.
 *
 * Typed `readonly string[]` rather than `as const` so `.includes(pathname)`
 * accepts an arbitrary string. Kept in its own module so both AuthGuard and
 * the router can read it without an import cycle.
 */
export const PUBLIC_ROUTES: readonly string[] = [
  "/auth",
  "/auth/verify-email",
  "/auth/complete-profile",
];
