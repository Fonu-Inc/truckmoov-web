import type { OnboardingApplicationStatus } from "@truckmoov/api/auth";

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/shadcn/button";

type ApplicationStatusScreenProps = {
  status: OnboardingApplicationStatus | undefined;
  decisionReason?: string;
  /** Only offered once the review team has approved the application. */
  onContinue: () => void;
};

/**
 * Post-submission view. The state comes from
 * `/auth/onboarding/applications/:id/status`, polled every 5s — there is no
 * client-side approval timer.
 */
export function ApplicationStatusScreen({
  status,
  decisionReason,
  onContinue,
}: ApplicationStatusScreenProps) {
  const approved = status === "approved";
  const rejected = status === "rejected";

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        {approved && <CheckCircle2 className="h-8 w-8 text-success" />}
        {rejected && <XCircle className="h-8 w-8 text-destructive" />}
        {!approved && !rejected && <Clock className="h-8 w-8 text-primary" />}
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {approved
          ? "Your application has been approved"
          : rejected
            ? "Your application was not approved"
            : "Your application is under review"}
      </h1>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {approved
          ? "You can now make payment for your Fleet Pro package to continue."
          : rejected
            ? decisionReason
            ?? "You may review the requirements and submit a new application."
            : "Thank you for your submission. We are currently reviewing the details you sent. Once your application is approved, you will be able to proceed to payment."}
      </p>

      {!approved && !rejected && (
        <p className="mx-auto mt-3 flex max-w-xl items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          This review takes a little while — you don't need to stay on this page. We'll email you
          as soon as your application has been approved, and you can come back then to make your
          payment.
        </p>
      )}

      {!rejected && (
        <Button
          size="lg"
          className="mt-8 min-w-56"
          disabled={!approved}
          onClick={onContinue}
        >
          {approved ? "Proceed to Payment" : "Review in progress…"}
          {approved && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
