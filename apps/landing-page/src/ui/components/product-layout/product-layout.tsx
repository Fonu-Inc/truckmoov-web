import type { ProductPageData } from "./product-types";
import ContentSheet from "../content-sheet";
import PageHero from "../page-hero";
import CheckList from "../stakeholder-layout/check-list";
import FigmaLines from "./figma-lines";
import HowItFitsCard from "./how-it-fits-card";

type ProductLayoutProps = { data: ProductPageData };

/**
 * Template for every product feature page (/products/*): dark hero, then a white
 * sheet with the capability ✓ cards and the "How it fits" card.
 * The CTA band and footer come from the shared <Layout>.
 */
export default function ProductLayout({ data }: ProductLayoutProps) {
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
