import type { ReactNode } from "react";
import type { IconType } from "@/lib/app-links";
import { cn } from "@/lib/utils";
import DarkBackdrop from "./dark-backdrop";
import IconChip from "./icon-chip";

type PageHeroProps = {
  /** Uppercase label above the title, e.g. "STAKEHOLDER", "Product Feature". */
  eyebrow: string;
  title: string;
  description: ReactNode;
  /** Optional yellow icon tile shown left of the title. */
  icon?: IconType;
  /** Extra content under the description (buttons, search, stats). */
  children?: ReactNode;
  className?: string;
  /** Overrides for the description paragraph (width, font size). */
  descriptionClassName?: string;
};

/**
 * Dark hero used by every inner page (stakeholders, roles, products, solutions, resources).
 * The white page body overlaps its bottom edge via <ContentSheet>.
 */
export default function PageHero({
  eyebrow,
  title,
  description,
  icon,
  children,
  className,
  descriptionClassName,
}: PageHeroProps) {
  return (
    <section className={cn(
      "relative overflow-hidden pt-[92px] pb-[118px]",
      className,
    )}
    >
      <DarkBackdrop
        glows={[
          { className: "-top-[414px] -left-[351px] h-[728px] w-[1254px]" },
          { className: "top-[82px] left-[772px] h-[659px] w-[884px]" },
        ]}
      />
      <div className="page-container relative">
        <p className="text-sm leading-[17px] font-medium text-on-ink uppercase">
          {eyebrow}
        </p>
        <div className="mt-[11px] flex items-center gap-[29px]">
          {icon && (
            <IconChip
              icon={icon}
              size="xl"
              tone="solid"
            />
          )}
          <h1 className="text-4xl max-md:leading-tight font-bold text-on-ink md:text-display">
            {title}
          </h1>
        </div>
        <p className={cn(
          "mt-[27px] max-w-[538px] text-lg leading-[25px] text-on-ink",
          descriptionClassName,
        )}
        >
          {description}
        </p>
        {children}
      </div>
    </section>
  );
}
