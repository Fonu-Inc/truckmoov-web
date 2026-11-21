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
    requirement: "Only a National Identification Card or Driver's License is accepted. Any other card will be rejected.",
  },
];

/**
 * Documents required from Owner-Operator customers: the request letter and an ID card.
 *
 * ponytail: the design asks for no Proof of Ownership or per-vehicle licence. The API still
 * lists them in `missingDocuments`, so its submit gate may refuse until it catches up.
 */
export const OWNER_OPERATOR_DOCUMENTS: RequiredDocument[] = [
  ENTERPRISE_DOCUMENTS[0],
  ENTERPRISE_DOCUMENTS[5],
];

export function documentsForCustomerType(type: ApplicantCustomerType): RequiredDocument[] {
  return type === "enterprise" ? ENTERPRISE_DOCUMENTS : OWNER_OPERATOR_DOCUMENTS;
}

/**
 * A returning customer already has a relationship or account with MTN, so the design asks
 * them for the Customer Request Letter only — whatever their customer type.
 *
 * ponytail: client-side only. The API still reports its full list in `missingDocuments`
 * until it learns about returning customers.
 */
export const RETURNING_DOCUMENTS: RequiredDocument[] = [ENTERPRISE_DOCUMENTS[0]];

export function documentsForApplicant(type: ApplicantCustomerType, returning: boolean): RequiredDocument[] {
  return returning ? RETURNING_DOCUMENTS : documentsForCustomerType(type);
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
    label: "Installation Scheduling",
  },
];

/**
 * Internal step number -> visible step number (1..5). Review (8) sits between Required
 * Documents and Payment: 3.5 marks steps 1–3 done with none active, as the design does.
 */
export function displayStep(step: number) {
  if (step <= 3)
    return 1;
  if (step === 4)
    return 2;
  if (step === 5)
    return 3;
  if (step === 8)
    return 3.5;
  if (step === 6)
    return 4;
  return 5;
}

/** Owner Operator / Individual accounts are limited to this many vehicles. */
export const OWNER_OPERATOR_VEHICLE_LIMIT = 10;

export const OWNER_OPERATOR_VEHICLE_LIMIT_MESSAGE
  = "Owner Operator / Individual accounts can have a maximum of 10 vehicles. Change your customer type to Enterprise Customer to add more than 10 vehicles.";

/** How requested devices reach the applicant (Fleet Requirements → Device Fulfilment). */
export type DeviceFulfilment = {
  method: "pickup" | "delivery";
  state: string;
  area: string;
  store: string;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryState: string;
};

export const EMPTY_DEVICE_FULFILMENT: DeviceFulfilment = {
  method: "pickup",
  state: "",
  area: "",
  store: "",
  deliveryStreet: "",
  deliveryCity: "",
  deliveryState: "",
};

/**
 * Whether the Device Fulfilment details are filled in. Pickup can't be completed until the
 * store locations endpoint exists, so only delivery is checked for now (TODO(api)).
 */
export function fulfilmentComplete(value: DeviceFulfilment, isOwnerOperator: boolean) {
  const method = isOwnerOperator ? "pickup" : value.method;
  if (method === "delivery")
    return Boolean(value.deliveryStreet.trim() && value.deliveryCity.trim() && value.deliveryState);
  return true;
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
