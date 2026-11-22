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
      title: "Continue your application",
      icon: ArrowCounterClockwise,
      onSelect: onContinue,
    },
    {
      key: "new",
      title: "Start a new application",
      icon: Plus,
      onSelect: onStartNew,
    },
  ];

  return (
    <StepLayout
      footer={(
        <DialogFooter
          onBack={onClose}
        />
      )}
    >
      <StepHeading
        title="You have an application in progress"
        description="We saved your progress in this browser. Continue where you stopped or start a new application."
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
          </button>
        ))}
      </div>
    </StepLayout>
  );
}
