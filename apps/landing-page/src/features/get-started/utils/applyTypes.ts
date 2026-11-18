/**
 * Shared types + reference data for the "Apply for Account Creation" modal.
 *
 * Copy of apps/main/src/features/apply/utils/applyTypes.ts (minus its sessionStorage
 * helpers — the landing draft lives in `utils/applyDraftStorage.ts`). Keep the two in step.
 */

import type {
  OnboardingApplicantType,
  OnboardingApplicationVehicle,
  OnboardingUploadableDocumentType,
  OnboardingVehiclePurchaseType,
  OnboardingVehicleType,
} from "@truckmoov/api/auth";

/** The choice the applicant makes on the first screen. */
export type ApplicantCustomerType = OnboardingApplicantType;

export type RequiredDocument = {
  type: OnboardingUploadableDocumentType;
  label: string;
  requirement?: string;
  /** Only the Customer Request Letter must be a PDF; the rest take PDF, JPG or PNG. */
  pdfOnly?: boolean;
};

/** Documents required from Enterprise customers. */
export const ENTERPRISE_DOCUMENTS: RequiredDocument[] = [
  {
    type: "customer_request_letter",
    label: "Customer Request Letter",
    requirement: "Must bear the full business name and be submitted as a signed, non-editable PDF document.",
    pdfOnly: true,
  },
  {
    type: "cac_document",
    label: "CAC Document",
    requirement: "Must reflect the business name shown on the company letterhead.",
  },
  {
    type: "tax_certificate_or_tin",
    label: "Tax Certificate or TIN Certificate",
    requirement: "Valid business tax documentation.",
  },
  {
    type: "signature_card",
    label: "Signature Card",
    requirement: "A signed copy is required.",
  },
  {
    type: "utility_bill",
    label: "Utility Bill",
    requirement: "A recent utility bill showing the registered business address.",
  },
  {
    type: "identification_card",
    label: "Identification Card",
    requirement: "A valid government-issued ID for the business representative.",
  },
  {
    type: "proof_of_ownership",
    label: "Proof of Ownership",
    requirement: "Documentation proving ownership of the business and its vehicles.",
  },
  {
    type: "vehicle_license",
    label: "Vehicle License",
    requirement: "Valid vehicle licence for each vehicle you are onboarding.",
  },
];

/** Documents required from Owner-Operator customers. */
export const OWNER_OPERATOR_DOCUMENTS: RequiredDocument[] = [
  {
    type: "proof_of_ownership",
    label: "Proof of Ownership",
    requirement: "Documentation proving ownership of the business and its vehicles.",
  },
  {
    type: "vehicle_license",
    label: "Vehicle License",
    requirement: "Valid vehicle licence for each vehicle you are onboarding.",
  },
];

export function documentsForCustomerType(type: ApplicantCustomerType): RequiredDocument[] {
  return type === "enterprise" ? ENTERPRISE_DOCUMENTS : OWNER_OPERATOR_DOCUMENTS;
}

/**
 * The plan choice and indemnity confirmation on the details step.
 *
 * `licensePlan` holds the server plan code (e.g. `m2m_standard`) once picked; it is
 * sent as `m2mPlanCode` with the details. Whether the form is signed comes from the
 * server (`signed_indemnity_form` in the application's documents) — this only keeps
 * the name typed on the pad and the "I have reviewed it" tick.
 */
export type LicenceAndIndemnity = {
  licensePlan: string;
  indemnitySignatureName: string;
  indemnityAccepted: boolean;
};

export const EMPTY_LICENCE_AND_INDEMNITY: LicenceAndIndemnity = {
  licensePlan: "",
  indemnitySignatureName: "",
  indemnityAccepted: false,
};

/** The only IoT carrier Fleet Pro provisions today. */
export const DEFAULT_SIM_CARRIER = "MTN Nigeria";

/** The server's vehicle types (TRU-FE-12 notes the list was inferred — confirm with backend). */
export const VEHICLE_TYPE_LABELS: Record<OnboardingVehicleType, string> = {
  truck: "Truck",
  van: "Van",
  bus: "Bus",
  car: "Car",
  suv: "SUV",
  trailer: "Trailer",
  motorcycle: "Motorcycle",
  tricycle: "Tricycle",
};

export const PURCHASE_TYPE_LABELS: Record<OnboardingVehiclePurchaseType, string> = {
  outright: "Outright purchase",
  lease: "Lease",
  hire_purchase: "Hire purchase",
  financed: "Finance / loan",
  other: "Other",
};

export function vehicleSummary(vehicle: OnboardingApplicationVehicle) {
  return [
    vehicle.make,
    vehicle.model,
    VEHICLE_TYPE_LABELS[vehicle.vehicleType] ?? vehicle.vehicleType,
  ].filter(Boolean).join(" · ");
}

export const SIM_CARRIERS = [DEFAULT_SIM_CARRIER];

export const TIME_SLOTS = [
  {
    value: "morning",
    label: "Morning (8:00 – 12:00)",
  },
  {
    value: "afternoon",
    label: "Afternoon (12:00 – 16:00)",
  },
] as const;

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export function uid() {
  return Math.random().toString(36).slice(
    2,
    10,
  );
}

export type ApplyStep = {
  id: number;
  label: string;
};

/**
 * Five visible steps. Email and phone verification are formalities that happen
 * between Customer Details and Fleet Requirements — they are never shown as
 * steps of their own, matching the design app.
 */
export const APPLY_STEPS: ApplyStep[] = [
  {
    id: 1,
    label: "Customer Details",
  },
  {
    id: 4,
    label: "Fleet Requirements",
  },
  {
    id: 5,
    label: "Required Documents",
  },
  {
    id: 6,
    label: "Payment",
  },
  {
    id: 7,
    label: "Schedule Installation",
  },
];

/** Internal step number -> visible step number (1..5). */
export function displayStep(step: number) {
  if (step <= 3)
    return 1;
  if (step === 4)
    return 2;
  if (step === 5 || step === 8)
    return 3;
  if (step === 6)
    return 4;
  return 5;
}

/** Every document type the server can return, for the status screen. */
export const DOCUMENT_LABELS: Record<string, string> = {
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
