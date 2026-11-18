import ContentSheet from "@/ui/components/content-sheet";
import CustomersSection from "@/ui/components/home/customers-section";
import FaqSection from "@/ui/components/home/faq-section";
import HomeHero from "@/ui/components/home/home-hero";
import IndustryUseCasesSection from "@/ui/components/home/industry-use-cases-section";
import IntegrationsSection from "@/ui/components/home/integrations-section";
import OperationsIntelligenceSection from "@/ui/components/home/operations-intelligence-section";
import ProductFeaturesSection from "@/ui/components/home/product-features-section";

/** Home page: dark hero, then the white sheet (Figma "Frame 9") of stacked sections, 10px apart. */
export default function Home() {
  return (
    <>
      <HomeHero />
      <ContentSheet className="flex flex-col gap-2.5">
        <CustomersSection />
        <ProductFeaturesSection />
        <OperationsIntelligenceSection />
        <IndustryUseCasesSection />
        <IntegrationsSection />
        <FaqSection />
      </ContentSheet>
    </>
  );
}
