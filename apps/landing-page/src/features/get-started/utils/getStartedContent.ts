import type { ApplicantCustomerType } from "@truckmoov/app-core/apply/applyTypes";

// Copy and class recipes for the apply modal. The fields, steps and API calls follow the
// main app's /apply (see @truckmoov/app-core/apply/applyTypes); the look follows the Figma "Get Started" dialog.

const mapIllustration = "/images/get-started/map.png";
const truckIllustration = "/images/get-started/truck.png";

// `description` wraps inside the card (rendered with whitespace-pre-line).
export const CUSTOMER_TYPES: {
  id: ApplicantCustomerType;
  title: string;
  description: string;
  points: string[];
  illustration: string;
  illustrationWidth: number;
  illustrationHeight: number;
  illustrationClassName: string;
}[] = [
  {
    id: "enterprise",
    title: "Enterprise Customer",
    description: "For businesses and organizations managing a Large company fleet.",
    points: [
      "No limit on the number of vehicles",
      "Manage company vehicles",
      "Manage fleet devices",
      "Manage SIM cards and connectivity",
      "Request and purchase fleet services",
      "Track fleet activities, installations, and service status",
    ],
    illustration: mapIllustration,
    illustrationWidth: 100,
    illustrationHeight: 65,
    illustrationClassName: "top-[37px] -right-2.5 h-[65px] w-[100px] rotate-[8.25deg] drop-shadow-[0_4px_2px_rgb(0_0_0/0.25)]",
  },
  {
    id: "owner_operator",
    title: "Owner Operator / Individual Customer",
    description: "For individuals, companies and organisations with 10 vehicles or fewer.",
    points: [
      "Maximum of 10 vehicles",
      "Manage personal vehicles",
      "Manage fleet devices",
      "Manage SIM cards and connectivity",
      "Request and purchase fleet services",
      "Track vehicle, device, and installation status",
    ],
    illustration: truckIllustration,
    illustrationWidth: 95,
    illustrationHeight: 68,
    illustrationClassName: "top-[50px] right-[3px] h-[68px] w-[95px]",
  },
];

/** Inputs, selects and textareas (Figma field: 48px, 15px radius). */
export const FIELD_CLASS = "h-12 w-full rounded-[15px] border border-border-field bg-background px-3 text-sm text-heading shadow-none outline-none placeholder:text-faint-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";
export const TEXTAREA_CLASS = "min-h-24 w-full rounded-[15px] border border-border-field bg-background px-3 py-2.5 text-sm text-heading shadow-none outline-none placeholder:text-faint-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/50 aria-invalid:border-destructive";
export const LABEL_CLASS = "text-sm font-medium text-heading";

/** The yellow 12px-radius action button from the dialog footer. */
export const PRIMARY_BUTTON_CLASS = "flex h-[45px] cursor-pointer items-center justify-center gap-2 rounded-[12px] border-[0.2px] border-brand-deep/20 bg-primary px-6 text-sm font-medium text-heading shadow-button transition-[background-color,opacity] hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary";
/** The outlined "Upload Document" button style, for secondary actions inside a step. */
export const SECONDARY_BUTTON_CLASS = "flex h-[37.5px] cursor-pointer items-center justify-center gap-2 rounded-[12px] border-[0.5px] border-border bg-background px-4 text-xs font-medium text-heading transition-colors hover:border-border-deep hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50";
export const ICON_BUTTON_CLASS = "flex size-8 cursor-pointer items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-surface hover:text-heading disabled:cursor-not-allowed disabled:opacity-50";
export const LINK_CLASS = "cursor-pointer font-semibold text-brand-deep hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline";

/** White card with the soft border used across the steps. */
export const CARD_CLASS = "rounded-[20px] border-[0.5px] border-border bg-background p-5";
