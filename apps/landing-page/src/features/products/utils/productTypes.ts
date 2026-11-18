import type { IconType } from "@/shared/utils/routes";

/**
 * Copy split into the exact lines of the Figma text box. On large screens each
 * line ends in a hard break so the wrap matches the design; below `lg` the
 * text flows normally.
 */
export type FigmaLines = string[];

/** Everything a /products/* page renders through <ProductLayout>. */
export type ProductPageData = {
  hero: {
    /** The page h1, e.g. "Fleet Management". */
    title: string;
    icon: IconType;
    description: FigmaLines;
  };
  /** "What Is Included In This Feature" — ✓ cards in a two-column grid. */
  capabilities: string[];
  /** "How it fits in your operations" paragraph. */
  howItFits: FigmaLines;
  /** Per-frame nudge for the How-it-fits card (e.g. `lg:mt-0.5` where Figma sets it 75px below the cards). */
  howItFitsClassName?: string;
};
