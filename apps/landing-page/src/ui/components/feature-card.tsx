import type { ReactNode } from "react";
import type { IconType } from "@/lib/app-links";
import { cn } from "@/lib/utils";
import ExploreLink from "./explore-link";
import IconChip from "./icon-chip";

type FeatureCardProps = {
  icon?: IconType;
  title: ReactNode;
  description?: ReactNode;
  /** Adds an "Explore more" link; the whole card becomes clickable. */
  href?: string;
  /**
   * `stacked` — icon above text (product features, integrations, capabilities).
   * `inline`  — icon left of the title (customer cards, role cards).
   */
  layout?: "stacked" | "inline";
  /** `ghost` = translucent with border (default), `solid` = white with border. */
  surface?: "ghost" | "solid";
  elevated?: boolean;
  iconSize?: "md" | "lg";
  iconTone?: "soft" | "tint" | "tintDeep";
  /** Title size: `md` 16px (default) or `lg` 20px. */
  titleSize?: "md" | "lg";
  className?: string;
  descriptionClassName?: string;
};

/** The bordered card with icon, title, description and optional link used across every page. */
export default function FeatureCard({
  icon,
  title,
  description,
  href,
  layout = "stacked",
  surface = "ghost",
  elevated = false,
  iconSize = "md",
  iconTone = "soft",
  titleSize = "md",
  className,
  descriptionClassName,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "relative flex border border-border-soft",
        surface === "ghost" ? "bg-card-ghost" : "bg-card",
        elevated && "shadow-card",
        layout === "stacked"
          ? "flex-col gap-[15px] rounded-[30px] px-[30px] pt-5 pb-4"
          : "items-center gap-[11px] rounded-[25px] px-[29px] py-[29px]",
        href && "transition-shadow hover:shadow-card",
        className,
      )}
    >
      {icon && (
        <IconChip
          icon={icon}
          size={iconSize}
          tone={iconTone}
        />
      )}
      <div className="flex min-w-0 flex-col">
        <h3 className={cn(
          "font-medium text-heading",
          titleSize === "lg" ? "text-xl leading-[30px]" : "text-base leading-6",
          layout === "stacked" && "min-h-[27px]",
        )}
        >
          {title}
        </h3>
        {description && (
          <p className={cn(
            "mt-[5px] text-xs leading-[18px] text-heading",
            descriptionClassName,
          )}
          >
            {description}
          </p>
        )}
        {href && (
          <ExploreLink
            to={href}
            size={layout === "stacked" ? "sm" : "md"}
            className={layout === "stacked" ? "mt-1" : "mt-[5px]"}
          />
        )}
      </div>
    </article>
  );
}
