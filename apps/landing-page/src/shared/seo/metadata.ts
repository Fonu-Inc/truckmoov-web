import type { Metadata } from "next";
import { SITE_NAME } from "@/shared/seo/site";

/**
 * The share card from app/opengraph-image.tsx. Listed explicitly because a page's own
 * `openGraph` replaces (rather than merges) the image the root segment would add.
 */
const SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME}: modern fleet management built for Africa`,
};

type PageMetadataInput = {
  /** Page name; the layout's template appends " | FleetPro Enterprise". */
  title: string;
  description: string;
  /** Canonical path, e.g. "/product/live-tracking". */
  path: string;
  /** Use the title as-is, without the site-name suffix (home page). */
  absoluteTitle?: boolean;
  /** Keep the page out of search results (links are still followed). */
  noindex?: boolean;
};

/**
 * Title, description, canonical URL and social-card fields for one page. Next replaces (not
 * merges) a parent's `openGraph`, so every page sets the full object here.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle,
  noindex,
}: PageMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_NG",
      url: path,
      title: fullTitle,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [SHARE_IMAGE],
    },
    ...(noindex && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  };
}
