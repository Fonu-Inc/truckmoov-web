import type { OnboardingApplication } from "@truckmoov/api/auth";

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

/** Every non-vehicle document still missing, plus one row per vehicle short of a licence. */
export function documentsComplete(application?: OnboardingApplication) {
  if (!application)
    return false;
  const missing = application.missingDocuments.filter(type => type !== "signed_indemnity_form" && type !== "vehicle_license");
  return missing.length === 0 && application.vehiclesMissingDocuments.length === 0;
}
