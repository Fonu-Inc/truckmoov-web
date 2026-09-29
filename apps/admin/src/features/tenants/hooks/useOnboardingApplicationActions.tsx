import {
  useApproveSystemOnboardingApplication,
  useMarkSystemOnboardingApplicationProvisioned,
  useRejectSystemOnboardingApplication,
  useRequestChangesSystemOnboardingApplication,
  useResendSystemOnboardingApplicationSetupLink,
} from "@truckmoov/api/auth";
import { useState } from "react";
import { toast } from "sonner";
import { OnboardingReasonDialog } from "@/features/tenants/components/ui/OnboardingReasonDialog";
import { errorMessage } from "@/features/tenants/utils/onboarding";

type Target = {
  id: string;
  organizationName: string;
};

/** Application-level decisions + provisioning, shared by the queue and the detail page. */
export function useOnboardingApplicationActions() {
  const approveMutation = useApproveSystemOnboardingApplication();
  const rejectMutation = useRejectSystemOnboardingApplication();
  const changesMutation = useRequestChangesSystemOnboardingApplication();
  const resendMutation = useResendSystemOnboardingApplicationSetupLink();
  const provisionedMutation = useMarkSystemOnboardingApplicationProvisioned();
  const [
    reasonTarget,
    setReasonTarget,
  ] = useState<{
    kind: "reject" | "changes"; application: Target;
  } | null>(null);

  const approve = async (application: Target) => {
    try {
      await approveMutation.mutateAsync({ id: application.id });
      toast.success(`${application.organizationName} approved — the setup link has been emailed`);
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Approval failed",
      ));
    }
  };

  const markProvisioned = async (application: Target) => {
    try {
      await provisionedMutation.mutateAsync({ id: application.id });
      toast.success("Marked provisioned — the applicant can now pay");
    }
    catch (error) {
      toast.error(errorMessage(
        error,
        "Could not mark provisioned",
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

  const submitReason = async (reason: string) => {
    if (!reasonTarget)
      return;
    const {
      kind, application,
    } = reasonTarget;
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

  const reasonDialog = (
    <OnboardingReasonDialog
      open={!!reasonTarget}
      title={reasonTarget?.kind === "reject" ? "Reject application" : "Request changes"}
      description={reasonTarget?.kind === "reject"
        ? `${reasonTarget.application.organizationName} — this is final. No tenant is created and the applicant is emailed this reason.`
        : `${reasonTarget?.application.organizationName ?? ""} — the application goes back to the applicant with this reason and a fresh resume link.`}
      submitLabel={reasonTarget?.kind === "reject" ? "Reject" : "Request changes"}
      destructive={reasonTarget?.kind === "reject"}
      loading={rejectMutation.isPending || changesMutation.isPending}
      onOpenChange={open => !open && setReasonTarget(null)}
      onSubmit={submitReason}
    />
  );

  return {
    approve,
    markProvisioned,
    resendSetupLink,
    openReject: (application: Target) => setReasonTarget({
      kind: "reject",
      application,
    }),
    openRequestChanges: (application: Target) => setReasonTarget({
      kind: "changes",
      application,
    }),
    reasonDialog,
    isPending: approveMutation.isPending || provisionedMutation.isPending || resendMutation.isPending,
    approvePending: approveMutation.isPending,
    provisionedPending: provisionedMutation.isPending,
    resendPending: resendMutation.isPending,
  };
}
