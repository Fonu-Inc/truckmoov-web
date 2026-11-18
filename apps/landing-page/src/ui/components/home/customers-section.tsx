import FeatureCard from "@/ui/components/feature-card";
import SectionContainer from "@/ui/components/section-container";
import SectionHeader from "@/ui/components/section-header";
import {
  customerCards,
  customersCopy,
} from "./home-data";

/** "Customers" band (Figma "Frame 1160464625", 514px tall at 1440). */
export default function CustomersSection() {
  return (
    <SectionContainer rootClassName="py-16 lg:pt-[94px] lg:pb-[117px]">
      <SectionHeader
        {...customersCopy}
        layout="split"
        className="lg:items-start"
        descriptionClassName="lg:mt-[51px] lg:-mr-[17px]"
      />
      <div className="mt-10 flex flex-wrap gap-5 lg:mt-[60px]">
        {customerCards.map(card => (
          <FeatureCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            href={card.href}
            layout="inline"
            iconSize="lg"
            titleSize="lg"
            className="w-full sm:w-[335px]"
          />
        ))}
      </div>
    </SectionContainer>
  );
}
