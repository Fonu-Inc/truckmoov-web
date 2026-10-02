import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import {
  useApproveSystemOnboardingApplication,
  useMarkSystemOnboardingApplicationProvisioned,
  useRefundSystemOnboardingPayment,
  useRejectSystemOnboardingApplication,
  useRequestChangesSystemOnboardingApplication,
  useResendSystemOnboardingApplicationPaymentLink,
  useResendSystemOnboardingApplicationSetupLink,
  useReviewSystemOnboardingPayment,
} from "@truckmoov/api/auth";
import { useState } from "react";
import { toast } from "sonner";
import { OnboardingReasonDialog } from "@/features/tenants/components/ui/OnboardingReasonDialog";
import { errorMessage } from "@/features/tenants/utils/onboarding";

type Target = {
  id: string;
  organizationName: string;
};

type ReasonKind = "reject" | "changes" | "provision" | "payment_resolved" | "payment_refund" | "payment_issue_refund";

const REASON_DIALOG: Record<ReasonKind, {
  title: string;
  submitLabel: string;
  fieldLabel: string;
  placeholder: string;
  describe: (name: string) => string;
}> = {
  reject: {
    title: "Reject application",
    submitLabel: "Reject",
    fieldLabel: "Reason",
    placeholder: "Shared with the applicant — write something they can act on.",
    describe: name => `${name} — this is final. No tenant is created and the applicant is emailed this reason.`,
  },
  changes: {
    title: "Request changes",
    submitLabel: "Request changes",
    fieldLabel: "Reason",
    placeholder: "Shared with the applicant — write something they can act on.",
    describe: name => `${name} — the application goes back to the applicant with this reason and a fresh resume link.`,
  },
  provision: {
    title: "Open payment without stock",
    submitLabel: "Open payment",
    fieldLabel: "Why is it safe to open payment?",
    placeholder: "For example: stock arrives Monday and the customer has been told.",
    describe: name => `${name} — device stock does not cover this order yet. Your reason is saved in the activity log.`,
  },
  payment_resolved: {
    title: "Mark payment resolved",
    submitLabel: "Mark resolved",
    fieldLabel: "Note",
    placeholder: "What was checked or done. Staff only.",
    describe: name => `${name} — records that the wrong-amount payment has been dealt with.`,
  },
  payment_refund: {
    title: "Refund needed",
    submitLabel: "Mark refund needed",
    fieldLabel: "Note",
    placeholder: "What was paid and what should be refunded. Staff only.",
    describe: name => `${name} — flags this payment so finance can refund it.`,
  },
  payment_issue_refund: {
    title: "Issue refund",
    submitLabel: "Refund the money",
    fieldLabel: "Note",
    placeholder: "Why this refund is being issued. Staff only.",
    describe: name => `${name} — the full amount goes back to the card it was paid with, and the applicant is emailed. This cannot be undone.`,
  },
};

/** Application-level decisions + provisioning, shared by the queue and the detail page. */
export function useOnboardingApplicationActions() {
  const approveMutation = useApproveSystemOnboardingApplication();
  const rejectMutation = useRejectSystemOnboardingApplication();
  const changesMutation = useRequestChangesSystemOnboardingApplication();
  const resendMutation = useResendSystemOnboardingApplicationSetupLink();
  const resendPaymentMutation = useResendSystemOnboardingApplicationPaymentLink();
  const provisionedMutation = useMarkSystemOnboardingApplicationProvisioned();
  const paymentReviewMutation = useReviewSystemOnboardingPayment();
  const refundMutation = useRefundSystemOnboardingPayment();
  const [
    reasonTarget,
    setReasonTarget,
  ] = useState<{
    kind: ReasonKind; application: Target; paymentId?: string;
  } | null>(null);

  const approve = async (application: Target) => {
    try {
      await approveMutation.mutateAsync({ id: application.id });
      toast.success("Approved. The applicant now moves to payment. The setup link is emailed when they book installation.");
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Approval failed",
      ));
    }
  };

  const markProvisioned = async (application: Target, reason?: string) => {
    try {
      await provisionedMutation.mutateAsync({
        id: application.id,
        data: reason ? { reason } : undefined,
      });
      toast.success("Marked provisioned — the applicant can now pay");
      setReasonTarget(null);
    }
    catch (error) {
      if (!reason && (error as ServerErrorResponse).statusCode === 400) {
        setReasonTarget({
          kind: "provision",
          application,
        });
        return;
      }
      toast.error(errorMessage(
        error,
        "Could not mark provisioned",
      ));
    }
  };

  const reviewPayment = async (
    application: Target,
    outcome: "resolved" | "refund_needed",
    note: string,
    paymentId?: string,
  ) => {
    try {
      await paymentReviewMutation.mutateAsync({
        id: application.id,
        paymentId,
        data: {
          outcome,
          note,
        },
      });
      toast.success(outcome === "resolved" ? "Payment marked resolved" : "Payment flagged for refund");
      setReasonTarget(null);
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Could not save the payment review",
      ));
    }
  };

  const issueRefund = async (application: Target, note: string, paymentId?: string) => {
    try {
      const res = await refundMutation.mutateAsync({
        id: application.id,
        paymentId,
        data: { note },
      });
      if (res.data.alreadyRefunded)
        toast.success("This payment was already refunded");
      else if (res.data.refundStatus === "processing")
        toast.success("Refund accepted by the payment provider. The applicant is emailed once it completes.");
      else
        toast.success("Refund issued. The applicant has been emailed.");
      setReasonTarget(null);
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "The refund could not be issued",
      ));
    }
  };

  const resendSetupLink = async (application: Target) => {
    try {
      const res = await resendMutation.mutateAsync({ id: application.id });
      // A failed send is still a 201 — the status says whether it went out.
      if (res.data.setupLinkStatus === "failed")
        toast.error(res.data.setupLinkError || res.message || "The setup link could not be delivered");
      else
        toast.success(`Setup link sent to ${res.data.setupLinkEmail}`);
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Resend failed",
      ));
    }
  };

  const resendPaymentLink = async (application: Target) => {
    try {
      const res = await resendPaymentMutation.mutateAsync({ id: application.id });
      if (res.data.delivered)
        toast.success("Payment link sent. The previous link no longer works.");
      else
        toast.error(res.message || "The payment link could not be delivered. The previous link still works.");
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Resend failed",
      ));
    }
  };

  const submitReason = async (reason: string) => {
    if (!reasonTarget)
      return;
    const {
      kind, application, paymentId,
    } = reasonTarget;
    if (kind === "provision") {
      return markProvisioned(
        application,
        reason,
      );
    }
    if (kind === "payment_resolved") {
      return reviewPayment(
        application,
        "resolved",
        reason,
        paymentId,
      );
    }
    if (kind === "payment_issue_refund")
      return issueRefund(application, reason, paymentId);
    if (kind === "payment_refund") {
      return reviewPayment(
        application,
        "refund_needed",
        reason,
        paymentId,
      );
    }
    try {
      if (kind === "reject") {
        await rejectMutation.mutateAsync({
          id: application.id,
          data: { reason },
        });
        toast.success("Application rejected");
      }
      else {
        await changesMutation.mutateAsync({
          id: application.id,
          data: { reason },
        });
        toast.success("Changes requested — the applicant has been emailed a resume link");
      }
      setReasonTarget(null);
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Action failed",
      ));
    }
  };

  const dialogCopy = REASON_DIALOG[reasonTarget?.kind ?? "reject"];
  const reasonDialog = (
    <OnboardingReasonDialog
      open={!!reasonTarget}
      title={dialogCopy.title}
      description={dialogCopy.describe(reasonTarget?.application.organizationName ?? "")}
      submitLabel={dialogCopy.submitLabel}
      fieldLabel={dialogCopy.fieldLabel}
      placeholder={dialogCopy.placeholder}
      destructive={reasonTarget?.kind === "reject"}
      loading={rejectMutation.isPending || changesMutation.isPending || provisionedMutation.isPending || paymentReviewMutation.isPending || refundMutation.isPending}
      onOpenChange={open => !open && setReasonTarget(null)}
      onSubmit={submitReason}
    />
  );

  return {
    approve,
    markProvisioned,
    resendSetupLink,
    resendPaymentLink,
    openReject: (application: Target) => setReasonTarget({
      kind: "reject",
      application,
    }),
    openRequestChanges: (application: Target) => setReasonTarget({
      kind: "changes",
      application,
    }),
    openPaymentResolved: (application: Target, paymentId?: string) => setReasonTarget({
      kind: "payment_resolved",
      application,
      paymentId,
    }),
    openPaymentRefund: (application: Target, paymentId?: string) => setReasonTarget({
      kind: "payment_refund",
      application,
      paymentId,
    }),
    openIssueRefund: (application: Target, paymentId?: string) => setReasonTarget({
      kind: "payment_issue_refund",
      application,
      paymentId,
    }),
    reasonDialog,
    isPending: approveMutation.isPending || provisionedMutation.isPending || resendMutation.isPending || resendPaymentMutation.isPending,
    approvePending: approveMutation.isPending,
    provisionedPending: provisionedMutation.isPending,
    resendPending: resendMutation.isPending,
    resendPaymentPending: resendPaymentMutation.isPending,
  };
}
