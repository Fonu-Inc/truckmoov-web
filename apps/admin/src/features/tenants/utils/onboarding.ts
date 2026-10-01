import type {
  OnboardingApplicantType,
  OnboardingApplicationStatus,
  SystemOnboardingDocument,
  SystemOnboardingStage,
  SystemOnboardingVerificationCheck,
  SystemOnboardingVerificationVerdict,
} from "@truckmoov/api/auth";

export const ONBOARDING_STATUS_LABELS: Record<OnboardingApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
  rejected: "Rejected",
};

export const ONBOARDING_STATUS_COLORS: Record<OnboardingApplicationStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  submitted: "bg-primary/10 text-primary border-primary/30",
  under_review: "bg-primary/10 text-primary border-primary/30",
  changes_requested: "bg-warning/10 text-warning border-warning/30",
  approved: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

// `stageStatus` is resolved server-side; colour by its text, neutral for anything new.
const STAGE_STATUS_COLORS: Record<string, string> = {
  "submitted": "bg-primary/10 text-primary border-primary/30",
  "attention needed": "bg-warning/10 text-warning border-warning/30",
  "awaiting payment": "bg-primary/10 text-primary border-primary/30",
  "awaiting scheduling": "bg-primary/10 text-primary border-primary/30",
  "in progress": "bg-primary/10 text-primary border-primary/30",
  "fleet ready": "bg-success/10 text-success border-success/30",
};

export function stageStatusColor(stageStatus: string) {
  return STAGE_STATUS_COLORS[stageStatus.trim().toLowerCase()] ?? "bg-muted text-muted-foreground border-border";
}

export const ONBOARDING_STAGE_LABELS: Record<SystemOnboardingStage, string> = {
  application: "Application",
  provisioning: "Provisioning",
  payment: "Payment",
  installation_scheduling: "Installation Scheduling",
  installation: "Installation",
  connectivity_verification: "Connectivity Verification",
  fleet_ready: "Fleet Ready",
};

export const APPLICANT_TYPE_LABELS: Record<OnboardingApplicantType, string> = {
  enterprise: "Enterprise",
  owner_operator: "Owner Operator",
};

export const DOCUMENT_TYPE_LABELS: Record<SystemOnboardingDocument["documentType"], string> = {
  customer_request_letter: "Customer Request Letter",
  cac_document: "CAC Document",
  tax_certificate_or_tin: "Tax Certificate / TIN",
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

export const VERIFICATION_CHECK_LABELS: Record<SystemOnboardingVerificationCheck, string> = {
  cac_registration: "CAC Registration",
  tax_identification: "Tax Identification",
  identity: "Identity",
  vehicle_registration: "Vehicle Registration",
};

export const VERDICT_LABELS: Record<SystemOnboardingVerificationVerdict, string> = {
  match: "Match",
  mismatch: "Mismatch",
  not_found: "Not Found",
  unavailable: "Unavailable",
};

export const VERDICT_COLORS: Record<SystemOnboardingVerificationVerdict, string> = {
  match: "bg-success/10 text-success border-success/30",
  mismatch: "bg-destructive/10 text-destructive border-destructive/30",
  not_found: "bg-warning/10 text-warning border-warning/30",
  unavailable: "bg-muted text-muted-foreground border-border",
};

/** Approve / reject / request changes (and document review) are only open while in review. */
export function canDecide(status: OnboardingApplicationStatus) {
  return status === "submitted" || status === "under_review";
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024)
    return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function errorMessage(error: unknown, fallback: string) {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && message ? message : fallback;
}
