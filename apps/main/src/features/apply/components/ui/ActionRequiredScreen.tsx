import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileWarning,
} from "lucide-react";

import { Button } from "@/components/shadcn/button";

export type ReviewFlag = {
  id: string;
  /** Internal step this flag belongs to. */
  step: number;
  /** Short area / field name the reviewer flagged. */
  area: string;
  /** Reviewer note shown to the applicant. */
  message: string;
};

type ActionRequiredScreenProps = {
  /** Reviewer note from the server; shown when no per-area flags exist. */
  reviewer?: string;
  openFlags: ReviewFlag[];
  resolvedFlags: ReviewFlag[];
  stepLabel: (step: number) => string;
  onGoToStep: (step: number) => void;
  onResubmit: () => void;
  submitting?: boolean;
};

/**
 * Shown when the review team sends an application back for corrections.
 *
 * ponytail: the status endpoint returns a single `decisionReason`, not a
 * per-area flag list, so the caller synthesises one flag from it. The shape here
 * already supports several — drop the synthesis once the server returns them.
 */
export function ActionRequiredScreen({
  reviewer,
  openFlags,
  resolvedFlags,
  stepLabel,
  onGoToStep,
  onResubmit,
  submitting,
}: ActionRequiredScreenProps) {
  const next = openFlags[0];
  const allDone = openFlags.length === 0;

  return (
    <div className="py-4">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-4 py-1.5 text-xs font-semibold text-warning">
        <AlertTriangle className="h-3.5 w-3.5" />
        More information needed
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Your application needs your attention
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Our team reviewed your application and needs a few things corrected before it can be
        approved. Update the areas below and resubmit. Everything else you already provided has
        been saved.
      </p>

      <div className="mt-8 space-y-4">
        {openFlags.map(flag => (
          <div
            key={flag.id}
            className="rounded-2xl border border-warning/30 bg-warning/5 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15">
                  <FileWarning className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {stepLabel(flag.step)}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{flag.area}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {flag.message}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => onGoToStep(flag.step)}
              >
                Fix this
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {resolvedFlags.map(flag => (
          <div
            key={flag.id}
            className="rounded-2xl border border-success/30 bg-success/5 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {stepLabel(flag.step)}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{flag.area}</p>
                  <p className="mt-1.5 text-sm text-success">Updated, ready to resubmit</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => onGoToStep(flag.step)}
              >
                Review again
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {allDone
          ? (
              <Button
                size="lg"
                loading={submitting}
                onClick={onResubmit}
              >
                Resubmit Application
              </Button>
            )
          : (
              <Button
                size="lg"
                onClick={() => onGoToStep(next.step)}
              >
                {`Fix ${stepLabel(next.step)}`}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {reviewer
          ? `Reviewed by ${reviewer}. If you believe this is a mistake, contact onboarding support.`
          : "If you believe this is a mistake, contact onboarding support."}
      </p>
    </div>
  );
}

/** The per-step warning banner shown above a flagged step's card. */
export function ReviewFlagBanner({ flags }: { flags: ReviewFlag[] }) {
  if (flags.length === 0)
    return null;

  return (
    <div className="mb-6 rounded-2xl border border-warning/40 bg-warning/10 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-warning">
        <AlertTriangle className="h-4 w-4" />
        Attention needed on this step
      </p>
      <ul className="mt-2 space-y-1.5 pl-6">
        {flags.map(flag => (
          <li
            key={flag.id}
            className="list-disc text-sm text-muted-foreground"
          >
            <span className="font-medium text-foreground">{`${flag.area}: `}</span>
            {flag.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
