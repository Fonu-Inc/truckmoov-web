import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/utils";

const buttonRecipe = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 px-4 py-2 cursor-pointer rounded-[15px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border-[0.2px] text-background border-background bg-inherit",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-foreground underline-offset-4 underline",
        // FleetPro pill buttons (Figma component "Button")
        brand: "rounded-full border border-brand/20 bg-primary text-primary-foreground shadow-button hover:bg-brand",
        onDark: "rounded-full border border-on-ink/20 bg-transparent text-on-ink hover:bg-on-ink/10",
        pill: "rounded-full border border-border-strong bg-background text-foreground-soft hover:bg-surface",
      },
      size: {
        "default": "has-[>svg]:px-3",
        "pill": "h-[46px] px-[15px] text-sm leading-[14px] font-medium [&_svg:not([class*='size-'])]:size-4",
        "icon": "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonRecipe>;

/**
 * Class recipe for <Button>, shared so other elements (e.g. dialog triggers) can match it.
 * Runs through `cn` (tailwind-merge) so variant, size and `className` classes override the base
 * ones, e.g. `rounded-full` beats `rounded-[15px]` and `px-[30px]` beats `px-4`. Without the
 * merge every conflicting class lands on the element and CSS order picks the winner.
 */
export function buttonVariants(props?: Parameters<typeof buttonRecipe>[0]) {
  return cn(buttonRecipe(props));
}
