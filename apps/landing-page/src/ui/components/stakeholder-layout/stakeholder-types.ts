import type {
  IconType,
  routes,
} from "@/lib/app-links";

/** A role page that a stakeholder can invite, keyed like `routes.roles`. */
export type RoleKey = keyof typeof routes.roles;

/**
 * Section heading scale.
 * `md` — 30px semibold titles, 18px hero copy (Figma Fleet Provider / Aggregator frames).
 * `lg` — 50px bold titles, 20px hero copy (Figma Enterprise / Owner Operator / role frames).
 */
export type StakeholderHeadingSize = "md" | "lg";

/**
 * Optional class overrides for one band, merged (tailwind-merge) after the band's own classes.
 * `section` = the full-width band, `container` = the centred column, `title` = the heading,
 * `content` = the wrapper under the heading, `grid` = the card list.
 */
export type BandClassNames = {
  section?: string;
  container?: string;
  title?: string;
  content?: string;
  grid?: string;
};

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
