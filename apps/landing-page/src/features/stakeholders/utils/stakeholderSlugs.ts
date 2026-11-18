/**
 * Every `/stalkholder/<slug>` URL. Kept apart from the page copy so `src/proxy.ts` can import
 * it without pulling in content and icons. Must stay in sync with `routes.stakeholders`.
 */
export const STAKEHOLDER_SLUGS = [
  "enterprise-admin",
  "owner-operator",
  "fleet-provider",
  "aggregator-admin",
] as const;

export type StakeholderSlug = (typeof STAKEHOLDER_SLUGS)[number];
