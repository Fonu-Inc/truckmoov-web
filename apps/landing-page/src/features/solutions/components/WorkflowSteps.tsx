import type { SolutionStep } from "@/features/solutions/utils/solutionTypes";
import { LineBreaks } from "@/features/solutions/components/LineBreaks";
import { BandSection } from "@/shared/components/sections/BandSection";

type WorkflowStepsProps = { steps: SolutionStep[] };

/**
 * "The workflow" band — Figma: 488px tall #FAFAFA band, heading at x=91 and 299x197 cards from
 * x=106 with 11px gaps (both nudged at 1440 only), 61px title→cards.
 */
export function WorkflowSteps({ steps }: WorkflowStepsProps) {
  return (
    <BandSection
      eyebrow="The workflow"
      title="A Seamless Flow From Action To Outcome."
      headingSize="lg"
      className="bg-surface pt-12 pb-12 lg:pt-11 lg:pb-[59px]"
      titleClassName="md:max-w-[600px]"
      containerClassName="min-[1440px]:-translate-x-[29px]"
      contentClassName="lg:mt-[61px] min-[1440px]:-mr-[44px] min-[1440px]:ml-[15px]"
    >
      <ol className="grid gap-[11px] sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex min-h-[197px] flex-col rounded-[25px] border border-border-soft bg-card pt-[22px] pr-[29px] pb-6 pl-5"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm leading-[17px] text-brand-deep uppercase">
                Step
                {" "}
                {index + 1}
              </p>
              <span
                aria-hidden="true"
                className="mt-px size-2.5 shrink-0 rounded-full bg-brand-bright"
              />
            </div>
            <div className="mt-[31px] pl-2.5">
              <h3 className="text-lg leading-[27px] font-medium text-heading">
                {step.title}
              </h3>
              <p className="mt-[5px] text-sm leading-[21px] text-muted-foreground">
                <LineBreaks text={step.description} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </BandSection>
  );
}
