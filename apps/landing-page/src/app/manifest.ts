import type { MetadataRoute } from "next";
import {
  DEFAULT_DESCRIPTION, SITE_NAME, THEME_COLOR,
} from "@/shared/seo/site";

// Static export has no server to render this metadata route on demand.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "FleetPro",
    description: DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: THEME_COLOR,
    icons: [
      {
        src: "/icon.jpg", sizes: "512x512", type: "image/jpeg",
      },
      {
        src: "/apple-icon", sizes: "180x180", type: "image/png",
      },
    ],
  };
}
