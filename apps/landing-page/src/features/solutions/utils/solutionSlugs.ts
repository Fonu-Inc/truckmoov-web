/**
 * Every `/solutions/<slug>` URL. Kept apart from the page copy so `src/proxy.ts` can import it
 * without pulling in content and icons.
 */
export const SOLUTION_SLUGS = [
  "enterprise-logistics",
  "delivery-operations",
  "fleet-operations",
  "third-party-logistics",
  "smart-fleet-tracking",
  "ai-logistics-operations",
] as const;

export type SolutionSlug = (typeof SOLUTION_SLUGS)[number];
