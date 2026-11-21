import type {
  OnboardingApplicantType,
  OnboardingApplicationStatus,
  SystemOnboardingDocument,
  SystemOnboardingStage,
} from "@truckmoov/api/auth";

export const ONBOARDING_STAGE_LABELS: Record<SystemOnboardingStage, string> = {
  application: "Application",
  provisioning: "Provisioning",
  payment: "Payment",
  installation_scheduling: "Installation Scheduling",
  installation: "Installation",
  connectivity_verification: "Connectivity Verification",
  fleet_ready: "Fleet Ready",
};

export const DOCUMENT_TYPE_LABELS: Record<SystemOnboardingDocument["documentType"], string> = {
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

export const DOCUMENT_STATUS_COLORS: Record<SystemOnboardingDocument["status"], string> = {
  pending: "bg-muted text-muted-foreground border-border",
  approved: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

/** Approve / reject / request changes (and document review) are only open while in review. */
export function canDecide(status: OnboardingApplicationStatus) {
  return status === "submitted" || status === "under_review";
}

export function errorMessage(error: unknown, fallback: string) {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && message ? message : fallback;
}

// ─── Fleetflow decision vocabulary (applicationReviewStore) ──────────────────

/** Fleetflow's four review decisions. The live status maps onto them for display. */
export type Decision = "pending" | "approved" | "rejected" | "more_info";

export const DECISIONS: Decision[] = [
  "pending",
  "approved",
  "more_info",
  "rejected",
];

export function decisionLabel(d: Decision) {
  return d === "approved"
    ? "Approved"
    : d === "rejected"
      ? "Rejected"
      : d === "more_info"
        ? "More information needed"
        : "Pending review";
}

/** draft / submitted / under_review are all still waiting on a reviewer. */
export function toDecision(status: OnboardingApplicationStatus): Decision {
  if (status === "approved")
    return "approved";
  if (status === "rejected")
    return "rejected";
  if (status === "changes_requested")
    return "more_info";
  return "pending";
}

export type SectionKey = "business" | "fleet" | "documents";

export const SECTION_LABEL: Record<SectionKey, string> = {
  business: "Business details",
  fleet: "Fleet requirements",
  documents: "Submitted documents",
};

/** Fleetflow's raw organisation type ("Enterprise" / "Owner Operator"). */
export function organizationTypeOf(applicantType: OnboardingApplicantType) {
  return applicantType === "owner_operator" ? "Owner Operator" : "Enterprise";
}

/**
 * Returning customers submit only the Customer Request Letter through the returning flow
 * (fleetflow's isReturningApplication, applied to the documents we have).
 */
export function isReturningApplication(documents: { documentType: string }[] | undefined): boolean {
  if (!documents)
    return false;
  return documents.length > 0 && documents.every(d => d.documentType === "customer_request_letter");
}

export function prettyDocumentType(t: string) {
  return (DOCUMENT_TYPE_LABELS as Record<string, string>)[t]
    || t.replace(
      /_/g,
      " ",
    ).replace(
      /\b\w/g,
      c => c.toUpperCase(),
    );
}

export function prettyFileSize(bytes: number | null) {
  return bytes ? `${(bytes / 1024).toFixed(0)} KB` : "—";
}
