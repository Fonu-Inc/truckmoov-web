import CardGrid from "@/ui/components/card-grid";
import FeatureCard from "@/ui/components/feature-card";
import SectionContainer from "@/ui/components/section-container";
import SectionHeader from "@/ui/components/section-header";
import {
  integrations,
  integrationsCopy,
} from "./home-data";

/** "Integrations & ecosystem" grey band (Figma "Frame 43", 692px tall, 1186px column at x=127). */
export default function IntegrationsSection() {
  return (
    <SectionContainer rootClassName="bg-surface py-16 inset-ring inset-ring-border-faint lg:pt-11 lg:pb-[86px]">
      <div className="mx-auto max-w-[1186px]">
        <SectionHeader
          {...integrationsCopy}
          titleClassName="max-w-[673px]"
        />
        <CardGrid className="mt-10 lg:mt-[31px]">
          {integrations.map(integration => (
            <FeatureCard
              key={integration.title}
              icon={integration.icon}
              title={integration.title}
              description={integration.description}
              surface="solid"
              className="rounded-[25px] pb-5 lg:min-h-[182px]"
              descriptionClassName="lg:min-h-[50px]"
            />
          ))}
        </CardGrid>
      </div>
    </SectionContainer>
  );
}
