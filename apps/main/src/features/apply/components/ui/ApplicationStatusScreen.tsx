import { useQuery } from "@tanstack/react-query";
import { getOnboardingApplicationStatusQueryOptions } from "@truckmoov/api/auth";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";

type ApplicationStatusScreenProps = {
  applicationId: string;
  /** Only offered once the review team has approved the application. */
  onContinue: () => void;
  /** Shown when the application came back for changes. */
  onEdit: () => void;
  /** Installation booked: the account exists, so the draft is done with. */
  onSignIn: () => void;
};

/** Stages after a booked installation — the account exists from here on. */
const STAGES_AFTER_BOOKING = [
  "installation",
  "connectivity_verification",
  "fleet_ready",
];

const DOCUMENT_LABELS: Record<string, string> = {
  customer_request_letter: "Customer Request Letter",
  cac_document: "CAC Document",
  tax_certificate_or_tin: "Tax Certificate or TIN",
  signature_card: "Signature Card",
  utility_bill: "Utility Bill",
  identification_card: "Identification Card",
  proof_of_ownership: "Proof of Ownership",
  vehicle_license: "Vehicle Licence",
  signed_indemnity_form: "Signed Indemnity Form",
};

/**
 * Post-submission view (TRU-FE-13), from `GET …/:id/status`. Most applications land in
 * `under_review` — the registry checks couldn't settle them automatically. Refreshes when
 * the tab regains focus; no polling.
 */
export function ApplicationStatusScreen({
  applicationId,
  onContinue,
  onEdit,
  onSignIn,
}: ApplicationStatusScreenProps) {
  const statusQuery = useQuery({
    ...getOnboardingApplicationStatusQueryOptions(applicationId),
    refetchOnWindowFocus: true,
  });
  const status = statusQuery.data?.data;
  const applicationStatus = status?.applicationStatus;
  const approved = applicationStatus === "approved";
  // Approval opens provisioning; payment only opens once the devices are allocated.
  const awaitingProvisioning = approved && status?.stage === "provisioning";
  const booked = STAGES_AFTER_BOOKING.includes(status?.stage ?? "");
  const canPay = approved && !awaitingProvisioning && !booked;
  const rejected = applicationStatus === "rejected";
  const changesRequested = applicationStatus === "changes_requested";
  const rejectedDocuments = (status?.documents ?? []).filter(document => document.status === "rejected");

  if (statusQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        {approved && <CheckCircle2 className="h-8 w-8 text-success" />}
        {rejected && <XCircle className="h-8 w-8 text-destructive" />}
        {!approved && !rejected && <Clock className="h-8 w-8 text-primary" />}
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {booked
          ? "Your installation is booked"
          : approved
            ? "Your application has been approved"
            : rejected
              ? "Your application was not approved"
              : changesRequested
                ? "Your application needs changes"
                : "Your application is under review"}
      </h1>
      {status?.reference && (
        <p className="mt-2 text-xs text-muted-foreground">{`Reference ${status.reference}`}</p>
      )}

      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {booked
          ? "Your account is ready. Sign in with the setup link we emailed you."
          : awaitingProvisioning
            ? "We're allocating your devices and SIMs. Payment opens as soon as that's done — we'll email you."
            : approved
              ? "You can now make payment for your Fleet Pro package to continue."
              : rejected || changesRequested
                ? (status?.decisionReason ?? "You may review the requirements and submit again.")
                : "Thank you for your submission. We're reviewing the details you sent, and we'll email you once your application has been approved."}
      </p>

      {statusQuery.isError && (
        <p className="mt-3 text-sm text-destructive">
          We couldn't load the latest status.
        </p>
      )}

      {(status?.timeline.length ?? 0) > 0 && (
        <ol className="mt-8 w-full max-w-md space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-5 text-left">
          {status!.timeline.map(entry => (
            <li
              key={entry.key}
              className="flex items-center gap-3 text-sm"
            >
              {entry.complete
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                : entry.inProgress
                  ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
              <span className={cn(!entry.complete && !entry.inProgress && "text-muted-foreground")}>
                {entry.label}
              </span>
            </li>
          ))}
        </ol>
      )}

      {rejectedDocuments.length > 0 && (
        <div className="mt-4 w-full max-w-md space-y-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-left text-sm">
          <p className="font-medium text-foreground">Documents that need attention</p>
          {rejectedDocuments.map(document => (
            <p
              key={document.documentType}
              className="text-muted-foreground"
            >
              <span className="font-medium text-foreground">{DOCUMENT_LABELS[document.documentType] ?? document.documentType}</span>
              {document.rejectionReason ? ` — ${document.rejectionReason}` : ""}
            </p>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {booked && (
          <Button
            size="lg"
            onClick={onSignIn}
          >
            Go to sign in
          </Button>
        )}
        {(!canPay && !rejected && !booked) && (
          <Button
            variant="outline"
            size="lg"
            loading={statusQuery.isFetching}
            onClick={() => statusQuery.refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh status
          </Button>
        )}
        {changesRequested && (
          <Button
            size="lg"
            onClick={onEdit}
          >
            Update my application
          </Button>
        )}
        {canPay && (
          <Button
            size="lg"
            className="min-w-56"
            onClick={onContinue}
          >
            Proceed to Payment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
