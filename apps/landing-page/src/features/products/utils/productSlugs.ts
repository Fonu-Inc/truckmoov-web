/**
 * Every `/product/<slug>` URL. Kept apart from the page copy so `src/proxy.ts` can import it
 * without pulling in content and icons. "ai-optimisation" keeps the published URL spelling.
 */
export const PRODUCT_SLUGS = [
  "fleet-management",
  "live-tracking",
  "dispatch-management",
  "ai-optimisation",
  "analytics-reporting",
  "iot-sims-devices",
] as const;

export type ProductSlug = (typeof PRODUCT_SLUGS)[number];
