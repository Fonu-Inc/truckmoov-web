import {
  industryUseCases,
  industryUseCasesCopy,
} from "@/features/home/utils/homeContent";
import { CardGrid } from "@/shared/components/CardGrid";
import { SectionContainer } from "@/shared/components/layout/SectionContainer";
import { SectionHeader } from "@/shared/components/layout/SectionHeader";
import { MediaCard } from "@/shared/components/MediaCard";

/** "Industry use cases" band (Figma "Frame 1160464628", 1204px tall at 1440). */
export function IndustryUseCasesSection() {
  return (
    <SectionContainer rootClassName="py-16 lg:pt-[63px] lg:pb-9">
      <SectionHeader
        {...industryUseCasesCopy}
        titleClassName="max-w-[612px]"
      />
      <CardGrid className="mt-10 lg:mt-[71px] lg:gap-x-[38px] lg:gap-y-[55px]">
        {industryUseCases.map(industry => (
          <MediaCard
            key={industry.title}
            image={industry.image}
            imageAlt={industry.imageAlt}
            icon={industry.icon}
            title={industry.title}
            description={industry.description}
          />
        ))}
      </CardGrid>
    </SectionContainer>
  );
}
