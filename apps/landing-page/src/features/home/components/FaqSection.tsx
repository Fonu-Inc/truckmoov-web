import Link from "next/link";
import {
  faqCopy,
  faqMoreLink,
  homeFaqs,
} from "@/features/home/utils/homeContent";
import { SectionContainer } from "@/shared/components/layout/SectionContainer";
import { SectionHeader } from "@/shared/components/layout/SectionHeader";
import { FaqAccordion } from "@/shared/components/sections/FaqAccordion";

/** FAQ band (Figma "Frame 1160464630", 1100px accordion column at x=170). */
export function FaqSection() {
  return (
    <SectionContainer rootClassName="py-16 lg:pt-[55px] lg:pb-[55px]">
      <div className="mx-auto max-w-[1100px]">
        <SectionHeader
          {...faqCopy}
          titleClassName="max-w-[627px]"
        />
        <FaqAccordion
          items={homeFaqs}
          className="mt-10 lg:mt-16"
          answerClassName="lg:min-h-[129px]"
        />
        <p className="mt-5 text-right text-sm leading-[17px] text-heading uppercase">
          {faqMoreLink.prompt}
          {" "}
          <Link
            href={faqMoreLink.href}
            className="text-brand normal-case underline underline-offset-2 hover:text-brand-deep"
          >
            {faqMoreLink.label}
          </Link>
        </p>
      </div>
    </SectionContainer>
  );
}
