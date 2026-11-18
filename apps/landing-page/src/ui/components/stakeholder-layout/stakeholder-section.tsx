import type { ReactNode } from "react";
import type { StakeholderHeadingSize } from "./stakeholder-types";
import { cn } from "@/lib/utils";
import SectionContainer from "../section-container";
import SectionHeader from "../section-header";

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
export default function StakeholderSection({
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
