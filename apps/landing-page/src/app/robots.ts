import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/shared/seo/site";

// Static export has no server to render this metadata route on demand.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*", allow: "/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
