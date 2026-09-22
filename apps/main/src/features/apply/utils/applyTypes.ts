/**
 * Shared types + reference data for the public "Apply for Account Creation" flow.
 *
 * The visible design comes from the FleetPro design app. This flow is UI-only
 * today — see the ponytail note in ApplyForAccount.tsx.
 */

/** The choice the applicant makes on the first screen. */
export type ApplicantCustomerType = "enterprise" | "owner_operator";

/** Remembers the customer type across reloads so step 1 is not re-asked. */
export const CUSTOMER_TYPE_STORAGE_KEY = "truckmoov_apply_customer_type";

export function readStoredCustomerType(): ApplicantCustomerType | null {
  if (typeof window === "undefined")
    return null;
  const stored = window.sessionStorage.getItem(CUSTOMER_TYPE_STORAGE_KEY);
  return stored === "enterprise" || stored === "owner_operator" ? stored : null;
}

export function writeStoredCustomerType(type: ApplicantCustomerType | null) {
  if (typeof window === "undefined")
    return;
  if (type) {
    window.sessionStorage.setItem(
      CUSTOMER_TYPE_STORAGE_KEY,
      type,
    );
  }
  else {
    window.sessionStorage.removeItem(CUSTOMER_TYPE_STORAGE_KEY);
  }
}

export type RequiredDocument = {
  /** The design app's identifier. Not necessarily a server document type. */
  type: string;
  label: string;
  requirement?: string;
  /** The design app demands PDF for every document in this flow. */
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
