import {
  integrations,
  integrationsCopy,
} from "@/features/home/utils/homeContent";
import { CardGrid } from "@/shared/components/CardGrid";
import { FeatureCard } from "@/shared/components/FeatureCard";
import { SectionContainer } from "@/shared/components/layout/SectionContainer";
import { SectionHeader } from "@/shared/components/layout/SectionHeader";

/** "Integrations & ecosystem" grey band (Figma "Frame 43", 692px tall, 1186px column at x=127). */
export function IntegrationsSection() {
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
