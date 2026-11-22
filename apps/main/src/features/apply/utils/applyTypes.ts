/**
 * Shared types + reference data for the public "Apply for Account Creation" flow. The
 * landing page's get-started copy calls the same endpoints; keep the two in step.
 */

import type {
  OnboardingApplicantType,
  OnboardingApplicationVehicle,
  OnboardingFulfilment,
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
};

/** Documents required from Enterprise customers, as the design lists them. */
export const ENTERPRISE_DOCUMENTS: RequiredDocument[] = [
  {
    type: "customer_request_letter",
    label: "Customer Request Letter",
    requirement: "Must bear the full business name and be submitted as a signed, non-editable PDF document.",
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
 * Documents required from Owner-Operator customers, as the design lists them. Vehicle
 * licences are attached per vehicle in Add Vehicle, not here.
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
 * them for the Customer Request Letter only — whatever their customer type. The flag is
 * saved on the application (`returningCustomer`), so the server asks for the same.
 */
export const RETURNING_DOCUMENTS: RequiredDocument[] = [ENTERPRISE_DOCUMENTS[0]];

export function documentsForApplicant(type: ApplicantCustomerType, returning: boolean): RequiredDocument[] {
  return returning ? RETURNING_DOCUMENTS : documentsForCustomerType(type);
}

/** `?returning=1` — the "Returning Customers" entry: an existing MTN customer. */
export function isReturningSearch(search: string) {
  return new URLSearchParams(search).get("returning") === "1";
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

/**
 * The server's vehicle types, in the design's order (TRU-FE-12 notes the list was inferred —
 * confirm with backend). The design also offers "Pickup" and "Other"; the API has no value
 * for either, and "Tricycle" is the API's own extra.
 */
export const VEHICLE_TYPE_LABELS: Record<OnboardingVehicleType, string> = {
  car: "Car",
  suv: "SUV",
  van: "Van",
  truck: "Truck",
  trailer: "Trailer",
  bus: "Bus",
  motorcycle: "Motorcycle",
  tricycle: "Tricycle",
};

/** In the design's order and wording. Its "Rental" option has no API value. */
export const PURCHASE_TYPE_LABELS: Record<OnboardingVehiclePurchaseType, string> = {
  outright: "Owned",
  lease: "Lease",
  financed: "Finance / Loan",
  hire_purchase: "Hire Purchase",
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

/** Onboarding fulfilment is pickup-only for both customer types: a chosen pickup point. */
export function fulfilmentComplete(value: DeviceFulfilment) {
  return Boolean(value.store);
}

/** The fulfilment as the API takes it. `store` holds the pickup location id. */
export function fulfilmentToPayload(value: DeviceFulfilment): OnboardingFulfilment {
  return {
    method: "pickup",
    pickupLocationId: value.store,
  };
}
