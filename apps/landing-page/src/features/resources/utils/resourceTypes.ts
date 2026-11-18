import type { ReactNode } from "react";
import type { FaqItem } from "@/shared/components/sections/FaqAccordion";
import type { IconType } from "@/shared/utils/routes";

/** Hero copy shared by every Resources page (eyebrow is always "Resources"). */
export type ResourceHero = {
  title: string;
  description: string;
  icon: IconType;
  /** Overrides for the description paragraph (e.g. the 20px Documentation copy). */
  descriptionClassName?: string;
};

/** One downloadable document row inside a documentation category card. */
export type ResourceDoc = {
  title: string;
  description: string;
  /** File URL. Omitted until the documents are published. */
  href?: string;
};

export type ResourceCategory = {
  title: string;
  icon: IconType;
  docs: ResourceDoc[];
  /** Bundle URL for "Download All". Omitted until published. */
  downloadAllHref?: string;
};

/**
 * A documentation category as handed to the client-side browser: the icon component is
 * swapped for its server-rendered chip, so only serialisable data crosses the boundary.
 */
export type ResourceCategoryView = Omit<ResourceCategory, "icon"> & { icon: ReactNode };

export type HelpArticle = {
  title: string;
  topic: string;
  readTime: string;
  updated: string;
  /** Body shown when the article row is expanded. */
  summary: string;
};

export type FaqCategory = {
  title: string;
  icon: IconType;
  items: FaqItem[];
};
