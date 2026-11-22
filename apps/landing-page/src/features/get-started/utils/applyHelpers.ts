import type { OnboardingApplication } from "@truckmoov/api/auth";
import { documentsForApplicant } from "@/features/get-started/utils/applyTypes";

// Copy of the helpers at the bottom of apps/main/src/features/apply/hooks/useApplySession.ts.

export function isIndemnitySigned(application?: OnboardingApplication) {
  return Boolean(application?.documents.some(document => document.documentType === "signed_indemnity_form"));
}

export function requestedDeviceTotal(application?: OnboardingApplication) {
  return (application?.deviceRequests ?? []).reduce(
    (total, request) => total + request.quantity,
    0,
  );
}

/**
 * Whether every document the design asks for is uploaded (`documentsForApplicant`): a
 * returning customer owes only the Customer Request Letter. Matches the server's
 * `missingDocuments` once the application carries the returning flag.
 */
export function documentsComplete(application?: OnboardingApplication, returning = false) {
  if (!application)
    return false;
  return documentsForApplicant(
    application.applicantType,
    returning,
  ).every(required => application.documents.some(document => document.documentType === required.type));
}
