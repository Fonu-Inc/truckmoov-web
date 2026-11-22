import { CustomersSection } from "@/features/home/components/CustomersSection";
import { FaqSection } from "@/features/home/components/FaqSection";
import { HomeHero } from "@/features/home/components/HomeHero";
import { IndustryUseCasesSection } from "@/features/home/components/IndustryUseCasesSection";
import { IntegrationsSection } from "@/features/home/components/IntegrationsSection";
import { OperationsIntelligenceSection } from "@/features/home/components/OperationsIntelligenceSection";
import { ProductFeaturesSection } from "@/features/home/components/ProductFeaturesSection";
import { homeFaqs } from "@/features/home/utils/homeContent";
import { ContentSheet } from "@/shared/components/layout/ContentSheet";
import { JsonLd } from "@/shared/seo/JsonLd";
import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
} from "@/shared/seo/site";

/** The product itself, for rich results ("SoftwareApplication"). */
const SOFTWARE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": SITE_NAME,
  "url": absoluteUrl("/"),
  "description": DEFAULT_DESCRIPTION,
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, Android, iOS",
  "publisher": { "@id": absoluteUrl("/#organization") },
};

/** The home FAQ block as structured data; built from the same list the accordion renders. */
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": homeFaqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
};

/** Home page: dark hero, then the white sheet (Figma "Frame 9") of stacked sections, 10px apart. */
export async function HomePage() {
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
      <JsonLd data={SOFTWARE_JSON_LD} />
      <JsonLd data={FAQ_JSON_LD} />
    </>
  );
}
