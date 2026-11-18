import type { ReactNode } from "react";
import type { ResourceHero } from "@/features/resources/utils/resourceTypes";
import { ContentSheet } from "@/shared/components/layout/ContentSheet";
import { PageHero } from "@/shared/components/layout/PageHero";
import { cn } from "@/shared/utils";

type ResourcePageProps = {
  hero: ResourceHero;
  children: ReactNode;
  /** Vertical spacing of the sheet (top/bottom padding differs per frame). */
  className?: string;
  /**
   * Classes for the content column. Defaults to Figma's 1134px column, which sits
   * at x=147 on the 1440 frame (6px left of centre).
   */
  columnClassName?: string;
};

/**
 * Template for the Resources pages (Documentation, Help Articles, FAQs):
 * dark hero + white sheet holding the content column.
 */
export function ResourcePage({
  hero,
  children,
  className,
  columnClassName,
}: ResourcePageProps) {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title={hero.title}
        description={hero.description}
        icon={hero.icon}
        // Figma: the sheet starts 350px below the nav whatever the description length.
        className="lg:min-h-[410px]"
        descriptionClassName={hero.descriptionClassName}
      />
      {/* Figma resource frames start the CTA band 109px below the body (shared gap is 119). */}
      <ContentSheet className="lg:-mb-2.5">
        <div className={cn(
          "px-4 pt-10 pb-12",
          className,
        )}
        >
          <div className={cn(
            "mx-auto w-full max-w-[1134px] lg:ml-[max(0px,calc(50%-573px))]",
            columnClassName,
          )}
          >
            {children}
          </div>
        </div>
      </ContentSheet>
    </>
  );
}
