import type { SolutionPageData } from "./solution-types";
import ContentSheet from "../content-sheet";
import PageHero from "../page-hero";
import CheckList from "../stakeholder-layout/check-list";
import NumberedCards from "../stakeholder-layout/numbered-cards";
import LineBreaks from "./line-breaks";
import SolutionPremise from "./solution-premise";
import WorkflowSteps from "./workflow-steps";

type SolutionLayoutProps = { data: SolutionPageData };

/**
 * Template for every solution page (/solutions/*). Pages pass one data object; a section
 * renders only when its data is present. The CTA band and footer come from the shared <Layout>.
 */
export default function SolutionLayout({ data }: SolutionLayoutProps) {
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
