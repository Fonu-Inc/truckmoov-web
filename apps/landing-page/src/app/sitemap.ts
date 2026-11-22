import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/shared/seo/site";
import { routes } from "@/shared/utils/routes";

// Static export has no server to render this metadata route on demand.
export const dynamic = "force-static";

type Entry = MetadataRoute.Sitemap[number];

/** One sitemap entry per path in a `routes` group, so new pages are listed automatically. */
function group(paths: Record<string, string>, priority: number): Entry[] {
  return Object.values(paths).map(path => ({
    url: absoluteUrl(path),
    changeFrequency: "monthly",
    priority,
  }));
}

/** Every public page, derived from `routes` so it never drifts from the nav. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl(routes.home), changeFrequency: "weekly", priority: 1,
    },
    ...group(
      routes.products,
      0.8,
    ),
    ...group(
      routes.solutions,
      0.8,
    ),
    ...group(
      routes.stakeholders,
      0.7,
    ),
    ...group(
      routes.roles,
      0.7,
    ),
    ...group(
      routes.resources,
      0.6,
    ),
  ];
}
