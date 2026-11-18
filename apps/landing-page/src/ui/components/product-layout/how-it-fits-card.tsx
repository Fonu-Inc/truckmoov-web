import type { FigmaLines as FigmaLinesData } from "./product-types";
import { Sparkle } from "@phosphor-icons/react";
import SectionContainer from "../section-container";
import FigmaLines from "./figma-lines";

type HowItFitsCardProps = {
  lines: FigmaLinesData;
  className?: string;
};

/** Grey rounded "How it fits in your operations" card closing every product page (Figma "Frame 19_3"). */
export default function HowItFitsCard({
  lines,
  className,
}: HowItFitsCardProps) {
  return (
    <SectionContainer rootClassName={className}>
      <div className="rounded-[30px] border border-border-soft bg-surface p-6 lg:mr-[5px] lg:mb-px lg:ml-[7px] lg:rounded-[50px] lg:px-[39px] lg:pt-[27px] lg:pb-[63px]">
        <h2 className="flex items-center gap-3 text-lg leading-[22px] font-medium text-heading lg:-ml-1 lg:gap-[19px]">
          <Sparkle
            aria-hidden="true"
            className="size-[30px] shrink-0 text-brand"
          />
          How it fits in your operations
        </h2>
        <p className="mt-3 text-base leading-6 text-heading">
          <FigmaLines lines={lines} />
        </p>
      </div>
    </SectionContainer>
  );
}
