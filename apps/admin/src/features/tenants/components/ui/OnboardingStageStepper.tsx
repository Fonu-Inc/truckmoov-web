import type { SystemOnboardingApplicationDetail } from "@truckmoov/api/auth";
import {
  Check,
  Circle,
  Loader2,
} from "lucide-react";
import { ONBOARDING_STAGE_LABELS } from "@/features/tenants/utils/onboarding";
import { cn } from "@/lib/utils";

type OnboardingStageStepperProps = { progress: SystemOnboardingApplicationDetail["progress"] };

/** Vertical stepper over the seven onboarding stages, straight from the API's `progress`. */
export function OnboardingStageStepper({ progress }: OnboardingStageStepperProps) {
  return (
    <ol className="space-y-0">
      {progress.map((step, index) => {
        const isLast = index === progress.length - 1;
        return (
          <li
            key={step.stage}
            className="relative flex gap-3 pb-5 last:pb-0"
          >
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-px",
                  step.complete ? "bg-success/50" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                step.complete && "border-success bg-success text-success-foreground",
                step.current && !step.complete && "border-primary bg-primary/10 text-primary",
                !step.complete && !step.current && "border-border bg-muted text-muted-foreground",
              )}
            >
              {step.complete
                ? <Check className="h-3.5 w-3.5" />
                : step.current
                  ? <Loader2 className="h-3.5 w-3.5" />
                  : <Circle className="h-2.5 w-2.5" />}
            </span>
            <div className="pt-0.5">
              <p className={cn(
                "text-sm font-medium",
                !step.complete && !step.current && "text-muted-foreground",
              )}
              >
                {ONBOARDING_STAGE_LABELS[step.stage] ?? step.stage}
              </p>
              <p className="text-xs text-muted-foreground">
                {step.complete ? "Complete" : step.current ? "Current stage" : "Not started"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
