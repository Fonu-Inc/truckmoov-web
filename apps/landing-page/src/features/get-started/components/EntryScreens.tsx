"use client";

import {
  ArrowCounterClockwise,
  Plus,
} from "@phosphor-icons/react/dist/ssr";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import {
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import { cn } from "@/shared/utils";

/** "Apply for Account Creation" while an application is saved in this browser. */
export function DraftChoiceScreen({
  onContinue,
  onStartNew,
  onClose,
}: {
  onContinue: () => void;
  onStartNew: () => void;
  onClose: () => void;
}) {
  const options = [
    {
      key: "continue",
      title: "Continue my application",
      description: "Pick up on the step you stopped at.",
      icon: ArrowCounterClockwise,
      onSelect: onContinue,
    },
    {
      key: "new",
      title: "Start a new application",
      description: "Discard the saved application in this browser and start again.",
      icon: Plus,
      onSelect: onStartNew,
    },
  ];

  return (
    <StepLayout
      footer={(
        <DialogFooter
          onBack={onClose}
          backLabel="Close"
        />
      )}
    >
      <StepHeading
        title="You have an application in progress"
        description="We Saved Your Progress In This Browser. Continue Where You Stopped, Or Start A New Application."
      />
      <div className="mt-[30px] grid gap-[9px] sm:grid-cols-2">
        {options.map(option => (
          <button
            key={option.key}
            type="button"
            onClick={option.onSelect}
            className={cn(
              "flex cursor-pointer flex-col items-start gap-3 rounded-[20px] border-[0.5px] border-border bg-background p-5 text-left transition-colors hover:border-brand-bright",
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-[12px] bg-brand-tint">
              <option.icon className="size-5 text-brand-deep" />
            </span>
            <span className="text-base leading-5 font-semibold text-heading">{option.title}</span>
            <span className="text-xs leading-[17px] text-muted-foreground">{option.description}</span>
          </button>
        ))}
      </div>
    </StepLayout>
  );
}
