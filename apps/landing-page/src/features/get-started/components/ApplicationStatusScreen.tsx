"use client";

import {
  CheckCircle,
  Circle,
  Clock,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingApplicationStatusQueryOptions } from "@truckmoov/api/auth";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import {
  LoadingBlock,
  Notice,
  Spinner,
  StepLayout,
  SuccessMark,
} from "@/features/get-started/components/StepParts";
import { DOCUMENT_LABELS } from "@/features/get-started/utils/applyTypes";
import { CARD_CLASS } from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

/** Stages after a booked installation: the account exists from here on. */
const STAGES_AFTER_BOOKING = [
  "installation",
  "connectivity_verification",
  "fleet_ready",
];

/**
 * Post-submission view from `GET …/:id/status` (main app: ApplicationStatusScreen). Most
 * applications land in `under_review`. Refreshes when the tab regains focus; no polling.
 */
export function ApplicationStatusScreen({
  applicationId,
  onContinue,
  onEdit,
  onSignIn,
  onStartNew,
  onClose,
}: {
  applicationId: string;
  /** Only offered once the review team has approved the application. */
  onContinue: () => void;
  /** Shown when the application came back for changes. */
  onEdit: () => void;
  /** Installation booked: the account exists, so the draft is done with. */
  onSignIn: () => void;
  /** After a rejection: the same email can apply again from a clean form. */
  onStartNew: () => void;
  onClose: () => void;
}) {
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

  if (statusQuery.isLoading)
    return <StepLayout><LoadingBlock /></StepLayout>;

  const footer = booked
    ? (
        <DialogFooter
          continueLabel="Go to sign in"
          onContinue={onSignIn}
        />
      )
    : rejected
      ? (
          <DialogFooter
            onBack={onClose}
            backLabel="Close"
            continueLabel="Start a new application"
            onContinue={onStartNew}
          />
        )
      : changesRequested
        ? (
            <DialogFooter
              onBack={onClose}
              backLabel="Close"
              continueLabel="Update my application"
              onContinue={onEdit}
            />
          )
        : canPay
          ? (
              <DialogFooter
                onBack={onClose}
                backLabel="Close"
                continueLabel="Proceed to Payment"
                onContinue={onContinue}
              />
            )
          : (
              <DialogFooter
                onBack={onClose}
                backLabel="Close"
                continueLabel={statusQuery.isFetching ? "Refreshing…" : "Refresh status"}
                continueDisabled={statusQuery.isFetching}
                onContinue={() => void statusQuery.refetch()}
              />
            );

  return (
    <StepLayout footer={footer}>
      <div
        className="flex flex-col items-center pt-[50px] text-center"
        role="status"
      >
        {approved || booked
          ? <SuccessMark />
          : (
              <span className={cn(
                "flex size-[90px] items-center justify-center rounded-full",
                rejected ? "bg-destructive/10" : "bg-brand-tint",
              )}
              >
                {rejected
                  ? <XCircle className="size-10 text-destructive" />
                  : <Clock className="size-10 text-brand-deep" />}
              </span>
            )}

        <h2 className="mt-[21px] text-[20px] leading-[25px] font-semibold text-heading">
          {booked
            ? "Your installation is booked"
            : approved
              ? "Your application has been approved"
              : rejected
                ? "Your application was not approved"
                : changesRequested
                  ? "Your application needs changes"
                  : "Your application is under review"}
        </h2>
        {status?.reference && <p className="mt-1 text-xs text-muted-foreground">{`Reference ${status.reference}`}</p>}

        <p className="mt-3 max-w-[460px] text-sm leading-5 text-heading">
          {booked
            ? "Your account is ready. Sign in with the setup link we emailed you."
            : awaitingProvisioning
              ? "We're allocating your devices and SIMs. Payment opens as soon as that's done, and we'll email you."
              : approved
                ? "You can now make payment for your Fleet Pro package to continue."
                : rejected
                  ? `${status?.decisionReason ?? "We couldn't approve this application."} You can start a new application with the same email address.`
                  : changesRequested
                    ? (status?.decisionReason ?? "You may review the requirements and submit again.")
                    : "Thank you for your submission. We're reviewing the details you sent, and we'll email you once your application has been approved. You can close this window and come back with \"Apply as Returning Customer\"."}
        </p>
      </div>

      {statusQuery.isError && <Notice className="mt-4">We couldn't load the latest status.</Notice>}

      {(status?.timeline.length ?? 0) > 0 && (
        <ol className={cn(
          CARD_CLASS,
          "mt-[30px] space-y-[17px]",
        )}
        >
          {status?.timeline.map(entry => (
            <li
              key={entry.key}
              className="flex items-center gap-3 text-sm"
            >
              {entry.complete
                ? (
                    <CheckCircle
                      weight="fill"
                      className="size-[21px] shrink-0 text-success"
                    />
                  )
                : entry.inProgress
                  ? <Spinner className="size-[18px] shrink-0 border-2" />
                  : <Circle className="size-[21px] shrink-0 text-faint-foreground" />}
              <span className={cn(
                "text-heading",
                !entry.complete && !entry.inProgress && "text-muted-foreground",
              )}
              >
                {entry.label}
              </span>
            </li>
          ))}
        </ol>
      )}

      {rejectedDocuments.length > 0 && (
        <div className="mt-4 space-y-2 rounded-[20px] bg-destructive/5 p-5 text-sm">
          <p className="font-semibold text-heading">Documents that need attention</p>
          {rejectedDocuments.map(document => (
            <p
              key={document.documentType}
              className="text-muted-foreground"
            >
              <span className="font-medium text-heading">{DOCUMENT_LABELS[document.documentType] ?? document.documentType}</span>
              {document.rejectionReason ? `: ${document.rejectionReason}` : ""}
            </p>
          ))}
        </div>
      )}
    </StepLayout>
  );
}
