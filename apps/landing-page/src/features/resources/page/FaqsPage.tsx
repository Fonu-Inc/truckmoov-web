import { FaqCategorySection } from "@/features/resources/components/FaqCategorySection";
import { ResourcePage } from "@/features/resources/components/ResourcePage";
import {
  FAQ_CATEGORIES,
  FAQS_HERO,
} from "@/features/resources/utils/resourceContent";
import { JsonLd } from "@/shared/seo/JsonLd";

/** Every FAQ on the page as structured data; built from the same list the accordions render. */
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQ_CATEGORIES.flatMap(category => category.items).map(item => ({
    "@type": "Question",
    "name": item.question.trim(),
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer,
    },
  })),
};

/** Figma "Landing Page (FAQs)": grouped accordions, no search. */
export async function FaqsPage() {
  return (
    <>
      <ResourcePage
        hero={FAQS_HERO}
        className="pt-[60px] pb-[59px]"
        columnClassName="flex max-w-[1100px] flex-col gap-[50px] lg:ml-[max(0px,calc(50%-549px))]"
      >
        {FAQ_CATEGORIES.map(category => (
          <FaqCategorySection
            key={category.title}
            category={category}
          />
        ))}
      </ResourcePage>
      <JsonLd data={FAQ_JSON_LD} />
    </>
  );
}
