import { Check } from "lucide-react";

import { APPLY_STEPS } from "@/features/apply/utils/applyTypes";
import { cn } from "@/lib/utils";

/** The vertical rail rendered inside the dark branding panel. */
export function ApplyStepRailVertical({
  current,
  complete,
}: {
  current: number;
  complete?: boolean;
}) {
  return (
    <ol className="relative z-10 space-y-4">
      {APPLY_STEPS.map((step, index) => {
        const number = index + 1;
        const done = complete || number < current;
        const active = !complete && number === current;

        return (
          <li
            key={step.id}
            className="flex items-center gap-3"
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                done && "bg-primary text-primary-foreground",
                active && "bg-sidebar-foreground/10 text-sidebar-foreground ring-2 ring-primary",
                !done && !active && "bg-sidebar-foreground/5 text-sidebar-foreground/40",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : String(number).padStart(
                2,
                "0",
              )}
            </div>
            <span
              className={cn(
                "text-sm",
                active ? "font-semibold text-sidebar-foreground" : "text-sidebar-foreground/60",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The horizontal rail rendered above the step card on the content side. */
export function ApplyStepRailHorizontal({ current }: { current: number }) {
  return (
    <ol className="mt-8 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
      {APPLY_STEPS.map((step, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;

        return (
          <li
            key={step.id}
            className="flex min-w-0 flex-1 items-start gap-2 sm:items-center"
          >
            <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done && "bg-success text-success-foreground",
                  active && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : String(number).padStart(
                  2,
                  "0",
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight sm:text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < APPLY_STEPS.length - 1 && (
              <span
                className="hidden h-px flex-1 bg-border sm:block"
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
