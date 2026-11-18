import type { ProductPageData } from "@/features/products/utils/productTypes";
import { FigmaLines } from "@/features/products/components/FigmaLines";
import { HowItFitsCard } from "@/features/products/components/HowItFitsCard";
import { ContentSheet } from "@/shared/components/layout/ContentSheet";
import { PageHero } from "@/shared/components/layout/PageHero";
import { CheckList } from "@/shared/components/sections/CheckList";

type ProductLayoutProps = { data: ProductPageData };

/**
 * Template for every product feature page (/products/*): dark hero, then a white
 * sheet with the capability ✓ cards and the "How it fits" card.
 * The CTA band and footer come from the shared <Layout>.
 */
export function ProductLayout({ data }: ProductLayoutProps) {
  const {
    hero,
    capabilities,
    howItFits,
    howItFitsClassName,
  } = data;

  return (
    <>
      <PageHero
        eyebrow="Product Feature"
        title={hero.title}
        description={<FigmaLines lines={hero.description} />}
        icon={hero.icon}
        // Figma: sheet starts 350px below the nav, 128px under the 3-line description.
        // Figma insets the hero copy 10px from the 1200px column (x=130).
        className="lg:pb-[128px] lg:[&_.page-container]:pl-[26px]"
        descriptionClassName="lg:max-w-none lg:text-lead"
      />
      <ContentSheet>
        <CheckList
          variant="capabilities"
          items={capabilities}
          headingSize="lg"
        />
        <HowItFitsCard
          lines={howItFits}
          className={howItFitsClassName}
        />
      </ContentSheet>
    </>
  );
}
