import type { ReactNode } from "react";
import { SectionContainer } from "@/shared/components/layout/SectionContainer";
import { SectionHeader } from "@/shared/components/layout/SectionHeader";
import { cn } from "@/shared/utils";

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

type StakeholderSectionProps = {
  eyebrow: string;
  title: ReactNode;
  headingSize: StakeholderHeadingSize;
  /** Band padding, background and borders (Figma "Frame 11604646xx"). */
  className?: string;
  titleClassName?: string;
  /** Gap between the heading and the content (Figma "Frame 41" gap = 41). */
  contentClassName?: string;
  /** Extra classes for the centred `page-container` column (e.g. a Figma inset). */
  containerClassName?: string;
  children: ReactNode;
};

/** One full-width band of a stakeholder / role page: deep-yellow eyebrow, title, content. */
export function BandSection({
  eyebrow,
  title,
  headingSize,
  className,
  titleClassName,
  contentClassName,
  containerClassName,
  children,
}: StakeholderSectionProps) {
  return (
    <SectionContainer
      rootClassName={className}
      containerClassName={containerClassName}
    >
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        size={headingSize}
        eyebrowTone="deep"
        titleClassName={titleClassName}
      />
      <div className={cn(
        "mt-8 lg:mt-[41px]",
        contentClassName,
      )}
      >
        {children}
      </div>
    </SectionContainer>
  );
}
