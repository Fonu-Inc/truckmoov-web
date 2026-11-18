import CardGrid from "@/ui/components/card-grid";
import MediaCard from "@/ui/components/media-card";
import SectionContainer from "@/ui/components/section-container";
import SectionHeader from "@/ui/components/section-header";
import {
  industryUseCases,
  industryUseCasesCopy,
} from "./home-data";

/** "Industry use cases" band (Figma "Frame 1160464628", 1204px tall at 1440). */
export default function IndustryUseCasesSection() {
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
