/**
 * Shared types + reference data for the public "Apply for Account Creation" flow.
 *
 * The visible design comes from the FleetPro design app; the wire format comes
 * from `@truckmoov/api/auth`. Where the two disagree, DOC_TYPE_MAP below is the
 * seam between them.
 */

import type { OnboardingApplicationDocumentType } from "@truckmoov/api/auth";

/** The choice the applicant makes on the first screen. */
export type ApplicantCustomerType = "enterprise" | "owner_operator";

/**
 * The server enum uses `fleet_provider` where the UI says "Enterprise Customer".
 * Mapped at the API boundary only — the UI keeps the design app's vocabulary.
 */
export const CUSTOMER_TYPE_TO_APPLICANT_TYPE = {
  enterprise: "fleet_provider",
  owner_operator: "owner_operator",
} as const;

/** contactRole is required by the server but never typed by the applicant. */
export const CUSTOMER_TYPE_TO_ROLE: Record<ApplicantCustomerType, string> = {
  enterprise: "Enterprise Admin",
  owner_operator: "Owner Operator",
};

export type RequiredDocument = {
  /** The design app's identifier. Not necessarily a server document type. */
  type: string;
  label: string;
  requirement?: string;
  /** The design app demands PDF for every document in this flow. */
  pdfOnly?: boolean;
};

/**
 * Design-app document id -> server document type.
 *
 * ponytail: `proof_of_ownership` and `vehicle_license` have no counterpart in
 * `OnboardingApplicationDocumentType`, so they are absent here. Anything absent
 * is collected and held locally rather than uploaded — see `isUploadable`.
 * Delete this table once the server enum covers the full design list.
 */
export const DOC_TYPE_MAP: Record<string, OnboardingApplicationDocumentType> = {
  customer_request_letter: "customer_request_letter",
  letter_of_authorization: "letter_of_authorization",
  signed_indemnity_form: "signed_indemnity_form",
  cac_document: "cac_document",
  tax_certificate: "tax_certificate_or_tin",
  signature_card: "signature_card",
  utility_bill: "utility_bill",
  identification_card: "identification_card",
  form_c02_c07: "form_c02_c07",
  agreement_form: "agreement_form",
};

/** Whether this document can actually reach the server today. */
export function isUploadable(type: string): boolean {
  return type in DOC_TYPE_MAP;
}

export function toServerDocumentType(type: string): OnboardingApplicationDocumentType | null {
  return DOC_TYPE_MAP[type] ?? null;
}

/** Human labels for server document types the local list does not name. */
export const SERVER_DOCUMENT_LABELS: Record<OnboardingApplicationDocumentType, string> = {
  customer_request_letter: "Customer Request Letter",
  letter_of_authorization: "Letter of Authorization",
  signed_indemnity_form: "Signed Indemnity Form",
  cac_document: "CAC Document",
  tax_certificate_or_tin: "Tax Certificate or TIN",
  signature_card: "Signature Card",
  utility_bill: "Utility Bill",
  identification_card: "Identification Card",
  form_c02_c07: "Form C02 / C07",
  agreement_form: "Agreement Form",
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
    type: "tax_certificate",
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

/** A document held in the browser because the server has no type for it yet. */
export type HeldDocument = {
  type: string;
  fileName: string;
  size: number;
};

/**
 * The licence choice and indemnity signature collected on the details step.
 *
 * ponytail: the application payload has no field for either yet, so this is held
 * client-side. Move it into `detailsToPayload` once the server accepts it.
 */
export type LicenceAndIndemnity = {
  licensePlan: "standard" | "advance" | "";
  indemnitySigned: boolean;
  indemnitySignatureMode: "draw" | "upload" | "";
  indemnitySignatureName: string;
  indemnityAccepted: boolean;
};

export const EMPTY_LICENCE_AND_INDEMNITY: LicenceAndIndemnity = {
  licensePlan: "",
  indemnitySigned: false,
  indemnitySignatureMode: "",
  indemnitySignatureName: "",
  indemnityAccepted: false,
};

/** The only IoT carrier Fleet Pro provisions today. */
export const DEFAULT_SIM_CARRIER = "MTN Nigeria";

/** One installable unit per requested device, for the installation step. */
export type DeviceUnit = {
  id: string;
  label: string;
  manufacturer: string;
  model: string;
  imei: string;
  simCarrier: string;
};

/**
 * Expands device *requests* (quantities) into individual units so each can be
 * assigned to a vehicle. Mirrors the design app's `expandDeviceUnits`.
 */
export function expandDeviceUnits(requests: DeviceRequest[]): DeviceUnit[] {
  const units: DeviceUnit[] = [];
  requests.forEach((request) => {
    for (let index = 0; index < request.quantity; index += 1) {
      const n = units.length;
      units.push({
        id: `${request.id}-${index}`,
        label: `Device ${String(n + 1).padStart(
          2,
          "0",
        )}`,
        manufacturer: request.manufacturer,
        model: "FMB920",
        imei: `35789${410000 + n * 137}`,
        simCarrier: request.simCarrier ?? DEFAULT_SIM_CARRIER,
      });
    }
  });
  return units;
}

export type VehicleEntry = {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  otherVehicleType?: string;
  make: string;
  model: string;
  year: string;
  engineNumber: string;
  chassisNumber: string;
  color: string;
  engineCapacity: string;
  odometer: string;
  purchaseType: string;
  otherPurchaseType?: string;
};

export type DeviceRequest = {
  id: string;
  quantity: number;
  manufacturer: string;
  useCase: string;
  notes: string;
  includeSim?: boolean;
  simCarrier?: string;
};

export type FleetState = {
  vehicles: VehicleEntry[];
  deviceRequests: DeviceRequest[];
};

export const EMPTY_FLEET: FleetState = {
  vehicles: [],
  deviceRequests: [],
};

export const VEHICLE_TYPES = [
  "Car",
  "SUV",
  "Van",
  "Pickup",
  "Truck",
  "Trailer",
  "Bus",
  "Motorcycle",
  "Other",
];

export const PURCHASE_TYPES = [
  "Owned",
  "Lease",
  "Finance / Loan",
  "Hire Purchase",
  "Rental",
  "Other",
];

export const DEVICE_MANUFACTURERS = [
  "Teltonika",
  "Queclink",
  "Concox",
];

export const SIM_CARRIERS = [DEFAULT_SIM_CARRIER];

export const TIME_SLOTS = [
  "Morning (8:00 – 12:00)",
  "Afternoon (12:00 – 16:00)",
  "Evening (16:00 – 19:00)",
];

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
