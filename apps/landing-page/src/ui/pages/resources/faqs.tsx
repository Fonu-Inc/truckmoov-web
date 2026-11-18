import FaqCategorySection from "@/ui/components/resources/faq-category-section";
import ResourcePage from "@/ui/components/resources/resource-page";
import {
  FAQ_CATEGORIES,
  FAQS_HERO,
} from "./resources-data";

/** Figma "Landing Page (FAQs)": grouped accordions, no search. */
export default function Faqs() {
  return (
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
  );
}
