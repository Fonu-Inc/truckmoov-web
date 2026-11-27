import { Check } from "lucide-react";
import { cn } from "@/shared/utils";

// Progress wizard (Figma "Progress-wizard"): one grey track behind the
// dots, done = filled deep-yellow with a check, active = yellow ring.
export function Stepper({
  steps,
  current,
  submitted,
  afterReviewFrom,
}: {
  steps: readonly string[];
  current: number;
  submitted: boolean;
  /** Steps from this index on open only once the application is reviewed; they say so. */
  afterReviewFrom?: number;
}) {
  return (
    <ol className="relative flex shrink-0 border-b border-border px-[22px] pt-[14px] pb-[15px]">
      {steps.map((label, index) => {
        const done = submitted || index < current;
        const active = !submitted && index === current;

        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-3"
          >
            {index > 0 && (
              <span
                aria-hidden
                className="absolute top-2.5 right-1/2 h-px w-full bg-border-deep"
              />
            )}
            <span className={cn(
              "relative flex size-5 shrink-0 items-center justify-center rounded-full",
              done && "bg-brand-deep",
              active && "border-[1.5px] border-brand-bright bg-field",
              !done && !active && "border border-border-field bg-field",
            )}
            >
              {done && (
                <Check
                  className="size-2.5 text-field-soft"
                  strokeWidth={3}
                />
              )}
            </span>
            <span className={cn(
              "w-full max-w-28 truncate text-center text-xs leading-[15px]",
              done && "font-semibold text-heading",
              active && "font-medium text-heading",
              !done && !active && "text-faint-foreground",
            )}
            >
              {label}
            </span>
            {afterReviewFrom !== undefined && index >= afterReviewFrom && (
              <span className="-mt-2.5 text-2xs text-faint-foreground">After review</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
