import type { IconType } from "@/shared/utils/routes";

/**
 * Copy strings may contain "\n" to reproduce the Figma line breaks; the breaks only apply
 * on wide screens (see <LineBreaks>), narrow screens wrap naturally.
 */

/** One "STEP n" card of the workflow band. */
export type SolutionStep = {
  title: string;
  description: string;
};

/**
 * Everything a solution page (/solutions/*) renders. Section headings ("The premise",
 * "Use cases", …) are shared by every Figma frame and live in the section components;
 * a section renders only when its data is present.
 */
export type SolutionPageData = {
  hero: {
    /** The page h1. */
    title: string;
    description: string;
    /** Figma hero icon (same icon as the Solutions nav link). */
    icon: IconType;
  };
  /** "The premise" — paragraph right of "A Smarter Approach To Fleet Management." */
  premise?: string;
  /** Extra classes for the premise paragraph (e.g. Enterprise's x=623 instead of 613). */
  premiseClassName?: string;
  /** "Use cases" — numbered 01–03 cards. */
  useCases?: string[];
  /** "The workflow" — STEP 1–4 cards on the grey band. */
  workflow?: SolutionStep[];
  /** "Intelligence layer" — ✓ list. */
  intelligence?: string[];
};
