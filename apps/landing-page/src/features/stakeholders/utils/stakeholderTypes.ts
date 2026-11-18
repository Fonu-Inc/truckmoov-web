import type {
  BandClassNames,
  StakeholderHeadingSize,
} from "@/shared/components/sections/BandSection";
import type {
  IconType,
  routes,
} from "@/shared/utils/routes";

export type {
  BandClassNames,
  StakeholderHeadingSize,
};

/** A role page that a stakeholder can invite, keyed like `routes.roles`. */
export type RoleKey = keyof typeof routes.roles;

/** The bands a stakeholder / role page can render, in page order. */
export type StakeholderBand = "definition" | "responsibilities" | "permissions" | "limitations" | "invites";

/**
 * Everything a stakeholder or role page renders. Every section is optional:
 * the layout only renders the sections whose data is present.
 */
export type StakeholderPageData = {
  headingSize?: StakeholderHeadingSize;
  hero: {
    /** "Stakeholder", "Customer Type" or "Other roles" — rendered uppercase. */
    eyebrow: string;
    /** The page h1. */
    title: string;
    description: string;
    icon: IconType;
    /** Tailwind classes for the hero description (e.g. its Figma width). */
    descriptionClassName?: string;
  };
  /** "Role definition" — "Who is a …?" plus a paragraph. */
  definition?: {
    title: string;
    body: string;
  };
  /** "Key responsibilities" — numbered 01, 02 … cards. */
  responsibilities?: string[];
  /** "Role permissions" — ✓ list on the grey band. */
  permissions?: string[];
  /** "Role limitations" — ✗ list. */
  limitations?: string[];
  /** "Roles this stakeholder can invite" — cards linking to the role pages. */
  invites?: RoleKey[];
  /**
   * Frame-specific band tweaks (usually the Figma band's bottom padding, which differs per frame).
   * Prefer the template defaults; only add what a frame measurably needs.
   */
  bands?: Partial<Record<StakeholderBand, BandClassNames>>;
};
