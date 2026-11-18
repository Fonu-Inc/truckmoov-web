import type { SolutionPageData } from "@/features/solutions/utils/solutionTypes";
import { LineBreaks } from "@/features/solutions/components/LineBreaks";
import { SolutionPremise } from "@/features/solutions/components/SolutionPremise";
import { WorkflowSteps } from "@/features/solutions/components/WorkflowSteps";
import { ContentSheet } from "@/shared/components/layout/ContentSheet";
import { PageHero } from "@/shared/components/layout/PageHero";
import { CheckList } from "@/shared/components/sections/CheckList";
import { NumberedCards } from "@/shared/components/sections/NumberedCards";

type SolutionLayoutProps = { data: SolutionPageData };

/**
 * Template for every solution page (/solutions/*). Pages pass one data object; a section
 * renders only when its data is present. The CTA band and footer come from the shared <Layout>.
 */
export function SolutionLayout({ data }: SolutionLayoutProps) {
  const {
    hero,
    premise,
    premiseClassName,
    useCases,
    workflow,
    intelligence,
  } = data;

  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title={hero.title}
        description={<LineBreaks text={hero.description} />}
        icon={hero.icon}
        // Figma: the sheet starts 350px below the nav whatever the description's line count.
        className="lg:min-h-[410px] lg:pb-[70px]"
        descriptionClassName="lg:max-w-none lg:text-[20px]"
      />
      <ContentSheet>
        {premise && (
          <SolutionPremise
            body={premise}
            className={premiseClassName}
          />
        )}
        {useCases?.length
          ? (
              <NumberedCards
                variant="useCases"
                items={useCases}
                headingSize="lg"
              />
            )
          : null}
        {workflow?.length ? <WorkflowSteps steps={workflow} /> : null}
        {intelligence?.length
          ? (
              <CheckList
                variant="intelligence"
                items={intelligence}
                headingSize="lg"
              />
            )
          : null}
      </ContentSheet>
    </>
  );
}
