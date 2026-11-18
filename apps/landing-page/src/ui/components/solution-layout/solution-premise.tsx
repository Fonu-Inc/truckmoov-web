import { cn } from "@/lib/utils";
import SectionContainer from "../section-container";
import SectionHeader from "../section-header";
import LineBreaks from "./line-breaks";

type SolutionPremiseProps = {
  body: string;
  /** Extra classes for the paragraph (per-frame Figma offsets). */
  className?: string;
};

/**
 * "The premise" band — Figma: 278px tall, heading at x=110 (10px left of the column, nudged at
 * 1440 only), 10px eyebrow→title gap, paragraph at x=613 starting 75px below the eyebrow (baseline-matched) and
 * running up to 90px past the column's right edge.
 */
export default function SolutionPremise({
  body,
  className,
}: SolutionPremiseProps) {
  return (
    <SectionContainer
      rootClassName="pt-12 pb-12 lg:min-h-[278px] lg:pt-[54px] lg:pb-10"
      containerClassName="lg:flex lg:items-start min-[1440px]:-translate-x-2.5"
    >
      <SectionHeader
        eyebrow="The premise"
        eyebrowTone="deep"
        title={<LineBreaks text={"A Smarter\nApproach To Fleet\nManagement."} />}
        className="lg:w-[503px] lg:shrink-0"
        titleClassName="lg:-mt-2.5"
      />
      <p className={cn(
        "mt-6 text-lg leading-[25px] text-heading lg:mt-[75px] lg:flex-1 lg:text-[20px] min-[1440px]:-mr-[100px]",
        className,
      )}
      >
        <LineBreaks
          text={body}
          breakClassName="hidden min-[1440px]:block"
        />
      </p>
    </SectionContainer>
  );
}
