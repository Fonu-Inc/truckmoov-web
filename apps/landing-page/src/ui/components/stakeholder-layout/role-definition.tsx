import type {
  BandClassNames,
  StakeholderHeadingSize,
} from "./stakeholder-types";
import { cn } from "@/lib/utils";
import StakeholderSection from "./stakeholder-section";

type RoleDefinitionProps = {
  title: string;
  body: string;
  headingSize: StakeholderHeadingSize;
  classNames?: BandClassNames;
};

/**
 * "Role definition" band — Figma: 308px tall, 20/25 paragraph.
 * `lg` frames: eyebrow at +52, 27px title→paragraph, and the band sits at x=110 with a 1248px
 * paragraph (wider than the 1200 column, so its Figma line breaks hold) — applied at 1440+ only.
 */
export default function RoleDefinition({
  title,
  body,
  headingSize,
  classNames,
}: RoleDefinitionProps) {
  const lg = headingSize === "lg";

  return (
    <StakeholderSection
      eyebrow="Role definition"
      title={title}
      headingSize={headingSize}
      className={cn(
        "border-b border-border/50 pt-12 pb-11 lg:min-h-[308px] lg:pb-[45px]",
        lg ? "lg:pt-[52px] lg:pb-[44px]" : "lg:pt-[54px]",
        classNames?.section,
      )}
      titleClassName={cn(
        lg && "max-w-none lg:mt-0.5",
        classNames?.title,
      ) || undefined}
      containerClassName={cn(
        lg && "min-[1440px]:-translate-x-2.5",
        classNames?.container,
      ) || undefined}
      contentClassName={cn(
        lg ? "lg:mt-[27px] min-[1440px]:-mr-12" : "lg:mt-[42px]",
        classNames?.content,
      )}
    >
      <p className="text-lg leading-[25px] text-heading lg:text-[20px]">
        {body}
      </p>
    </StakeholderSection>
  );
}
