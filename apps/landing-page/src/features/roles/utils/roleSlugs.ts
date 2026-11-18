/**
 * Every `/roles/<slug>` URL. Kept apart from the page copy so `src/proxy.ts` can import it
 * without pulling in content and icons. Must stay in sync with `routes.roles`.
 */
export const ROLE_SLUGS = [
  "operations-manager",
  "dispatcher",
  "finance-officer",
  "maintenance-supervisor",
  "viewer",
  "driver",
  "analyst",
] as const;

export type RoleSlug = (typeof ROLE_SLUGS)[number];
