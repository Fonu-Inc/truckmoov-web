import {
  productFeatures,
  productFeaturesCopy,
} from "@/features/home/utils/homeContent";
import { CardGrid } from "@/shared/components/CardGrid";
import { FeatureCard } from "@/shared/components/FeatureCard";
import { SectionContainer } from "@/shared/components/layout/SectionContainer";
import { SectionHeader } from "@/shared/components/layout/SectionHeader";

/** "Product features" band (Figma "Frame 1160464626", 744px tall at 1440). */
export function ProductFeaturesSection() {
  return (
    <SectionContainer rootClassName="py-16 lg:pt-[50px] lg:pb-20">
      <SectionHeader {...productFeaturesCopy} />
      <CardGrid className="mt-10 lg:mt-[51px]">
        {productFeatures.map(feature => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            href={feature.href}
            elevated
            className="lg:min-h-[198px]"
            descriptionClassName="lg:min-h-[50px]"
          />
        ))}
      </CardGrid>
    </SectionContainer>
  );
}
