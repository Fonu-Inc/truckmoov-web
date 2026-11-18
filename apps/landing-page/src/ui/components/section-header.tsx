import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  /** Small uppercase label above the title (Figma: yellow 14px eyebrow). */
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  /**
   * `lg` — 50px bold marketing heading (home, solutions).
   * `md` — 30px semibold heading (stakeholder / role pages).
   */
  size?: "lg" | "md";
  /** `brand` = #FEB101 (home), `deep` = #E2AC07 (stakeholder pages). */
  eyebrowTone?: "brand" | "deep";
  /** `split` puts the description to the right of the title on wide screens. */
  layout?: "stack" | "split";
  /** `light` for use on dark backgrounds. */
  tone?: "dark" | "light";
  as?: "h1" | "h2" | "h3";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
  size = "lg",
  eyebrowTone = "brand",
  layout = "stack",
  tone = "dark",
  as: Title = "h2",
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col",
        layout === "split" && "lg:flex-row lg:items-center lg:justify-between lg:gap-10",
        className,
      )}
    >
      <div className={cn(
        "flex flex-col",
        size === "lg" ? "gap-5" : "gap-2.5",
      )}
      >
        <p className={cn(
          "text-sm leading-[17px] font-medium uppercase",
          eyebrowTone === "brand" ? "text-brand" : "text-brand-deep",
        )}
        >
          {eyebrow}
        </p>
        <Title className={cn(
          "capitalize",
          size === "lg"
            ? "max-w-178 text-4xl max-md:leading-tight font-bold md:text-section"
            : "max-w-146.5 text-2xl font-semibold md:text-title",
          tone === "dark" ? "text-heading" : "text-on-ink",
          titleClassName,
        )}
        >
          {title}
        </Title>
      </div>
      {description && (
        <p className={cn(
          "mt-4 max-w-128 text-lg leading-6 capitalize lg:mt-0 lg:text-lead lg:leading-6",
          tone === "dark" ? "text-heading" : "text-on-ink-muted",
          descriptionClassName,
        )}
        >
          {description}
        </p>
      )}
    </header>
  );
}
