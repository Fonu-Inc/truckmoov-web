import { env } from "@/shared/env";

/** Product name: page titles, Open Graph site name, structured data. */
export const SITE_NAME = "FleetPro Enterprise";

/** Public origin of this site, without a trailing slash. */
export const SITE_URL = env.NEXT_PUBLIC_SITE_URL.replace(
  /\/+$/,
  "",
);

/** Fallback description for pages that don't set their own. */
export const DEFAULT_DESCRIPTION
  = "Fleet Pro Enterprise helps organizations manage fleets, optimize logistics, monitor live operations, automate dispatch, and scale intelligently across regions and stakeholders.";

/** Brand yellow: browser UI colour and the manifest theme. */
export const THEME_COLOR = "#ffc105";

/** Absolute URL for a site path ("/product/live-tracking" -> "https://…/product/live-tracking"). */
export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
