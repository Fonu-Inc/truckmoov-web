import CardGrid from "@/ui/components/card-grid";
import FeatureCard from "@/ui/components/feature-card";
import SectionContainer from "@/ui/components/section-container";
import SectionHeader from "@/ui/components/section-header";
import {
  productFeatures,
  productFeaturesCopy,
} from "./home-data";

/** "Product features" band (Figma "Frame 1160464626", 744px tall at 1440). */
export default function ProductFeaturesSection() {
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
