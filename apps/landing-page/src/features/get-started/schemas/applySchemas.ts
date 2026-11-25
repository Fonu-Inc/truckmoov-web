/**
 * Validation for the apply flow.
 *
 * The organization/verification schemas mirror the server's own contract so the
 * applicant sees obvious mistakes without a round trip. The server stays
 * authoritative — a 400 carrying `{ field, message }` is still bound onto the
 * matching input via `setError`.
 *
 * Copy of apps/main/src/features/apply/utils/applySchemas.ts — the landing "Apply" modal
 * runs the same flow as the main app's /apply. Keep the two in step.
 */

import type {
  OnboardingApplication,
  OnboardingApplicationDetails,
  OnboardingApplicationVehicle,
  OnboardingVehicleInput,
} from "@truckmoov/api/auth";
import type { ApplicantCustomerType } from "@truckmoov/app-core/apply/applyTypes";

import { MAX_DOCUMENT_BYTES } from "@truckmoov/app-core/apply/applyTypes";

import * as z from "zod";

export const IDENTIFICATION_TYPES = [
  {
    value: "nin", label: "National Identification Number (NIN)",
  },
  {
    value: "drivers_licence", label: "Driver's licence",
  },
  {
    value: "passport", label: "International passport",
  },
] as const;

/** 36 Nigerian states + FCT. */
export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

const NG_PHONE = /^(?:\+234|234|0)[789][01]\d{8}$/;

/** "lagos", "Lagos State" -> "Lagos". Null when it isn't a Nigerian state (or the FCT). */
export function normalizeState(value: string): (typeof NIGERIAN_STATES)[number] | null {
  const key = value.trim().replace(
    /\s+state$/i,
    "",
  ).toLowerCase();
  return NIGERIAN_STATES.find(state => state.toLowerCase() === key) ?? null;
}

/** A typed state (the design uses a plain input), saved as the canonical name. */
const stateField = z
  .string()
  .trim()
  .refine(
    value => normalizeState(value) !== null,
    "Enter a Nigerian state, e.g. Lagos.",
  )
  .transform(value => normalizeState(value) ?? value);

const phoneField = z
  .string()
  .trim()
  .refine(
    value => !/[a-z]/i.test(value),
    "Phone number can only contain digits.",
  )
  .refine(
    value => NG_PHONE.test(value.replace(
      /\s/g,
      "",
    )),
    "Enter a Nigerian mobile number (e.g. +2348012345678).",
  );

const personNameField = z
  .string()
  .trim()
  .refine(
    value => !/\d/.test(value),
    "Name can't contain digits.",
  )
  .refine(
    value => value.split(/\s+/).filter(Boolean).length >= 2,
    "Enter first and last name.",
  );

const nameWordField = z
  .string()
  .trim()
  .min(
    1,
    "Required.",
  )
  .refine(
    value => !/\d/.test(value),
    "Name can't contain digits.",
  );

/**
 * Business details.
 *
 * The design app splits the applicant's name into First/Last for owner-operators
 * and uses a single "Contact Person's Full Name" for enterprises. Both are kept
 * here; `contactFullName` is derived at the API boundary, since the server takes
 * one `contactFullName`. The unused branch is stripped before validation by
 * `businessDetailsSchemaFor`.
 */
const businessDetailsBase = z.object({
  organizationName: z.string().trim().min(
    2,
    "Organization name is required.",
  ),
  businessEmail: z.string().trim().email("Enter a valid business email."),
  phoneNumber: phoneField,
  /** Enterprise only. */
  contactName: z.string().trim().default(""),
  /** Owner-operator only. */
  firstName: z.string().trim().default(""),
  lastName: z.string().trim().default(""),
  streetAddress: z.string().trim().min(
    5,
    "Enter your organization address.",
  ),
  city: z.string().trim().min(
    2,
    "Enter your city.",
  ),
  state: stateField,
  /**
   * Optional server-side, but automated approval cannot run without them (TRU-FE-11):
   * RC number + TIN for enterprises, ID type + number for owner-operators.
   */
  rcNumber: z.string().trim().default(""),
  taxIdentificationNumber: z.string().trim().default(""),
  identificationType: z.enum([
    "nin",
    "drivers_licence",
    "passport",
    "",
  ]).default(""),
  identificationNumber: z.string().trim().default(""),
  /** Telecom Master (enterprise only, as in Settings). */
  telecomMasterNumberType: z.enum([
    "existing",
    "new",
    "",
  ]).default(""),
  telecomMasterMsisdn: z.string().trim().default(""),
  /** The number Verify last accepted (234XXXXXXXXXX); Continue needs it to match telecomMasterMsisdn. */
  telecomMasterVerifiedMsisdn: z.string().default(""),
});

export const businessDetailsSchema = businessDetailsBase;

export type BusinessDetailsValues = z.infer<typeof businessDetailsBase>;

/**
 * Enterprise validates `contactName`; owner-operator validates `firstName` and
 * `lastName`. The licence/indemnity fields are validated separately so the
 * upgrade-style "details only" use keeps working.
 */
export function businessDetailsSchemaFor(customerType: "enterprise" | "owner_operator") {
  if (customerType === "enterprise") {
    return businessDetailsBase.extend({ contactName: personNameField }).superRefine(refineTelecomMaster);
  }
  return businessDetailsBase.extend({
    firstName: nameWordField,
    lastName: nameWordField,
  });
}

/** MTN Nigeria prefixes, the server's list (telecom-master.use-cases normalizeMtnNumber). */
const MTN_PREFIX = /^(?:703|704|706|707|803|806|810|813|814|816|903|906|913|916)/;

/** "0803 123 4567" -> "2348031234567", the form the server stores; null unless an MTN number. */
export function toMtnMsisdn(value: string) {
  const phone = normalizePhone(value);
  return NG_PHONE.test(phone) && MTN_PREFIX.test(phone.slice(4)) ? phone.slice(1) : null;
}

function refineTelecomMaster(values: BusinessDetailsValues, ctx: z.RefinementCtx) {
  if (!values.telecomMasterNumberType) {
    ctx.addIssue({
      code: "custom",
      path: ["telecomMasterNumberType"],
      message: "Choose a Telecom Master number option to continue.",
    });
    return;
  }
  if (values.telecomMasterNumberType !== "existing")
    return;
  const msisdn = toMtnMsisdn(values.telecomMasterMsisdn);
  const issue = !values.telecomMasterMsisdn
    ? "Enter your existing MTN number."
    : !msisdn
        ? "Enter a valid MTN mobile number."
        : values.telecomMasterVerifiedMsisdn !== msisdn
          ? "Verify your MTN number to continue."
          : null;
  if (issue) {
    ctx.addIssue({
      code: "custom",
      path: ["telecomMasterMsisdn"],
      message: issue,
    });
  }
}

export const EMPTY_BUSINESS_DETAILS: BusinessDetailsValues = {
  organizationName: "",
  businessEmail: "",
  phoneNumber: "",
  contactName: "",
  firstName: "",
  lastName: "",
  streetAddress: "",
  city: "",
  state: "",
  rcNumber: "",
  taxIdentificationNumber: "",
  identificationType: "",
  identificationNumber: "",
  telecomMasterNumberType: "",
  telecomMasterMsisdn: "",
  telecomMasterVerifiedMsisdn: "",
};

/** The whole details set — PATCH replaces, so create and update send the same body. */
export function detailsToPayload(
  values: BusinessDetailsValues,
  customerType: ApplicantCustomerType,
  m2mPlanCode: string,
  returningCustomer: boolean,
): OnboardingApplicationDetails {
  const enterprise = customerType === "enterprise";
  const optional = (value: string) => value.trim() || undefined;
  return {
    applicantType: customerType,
    returningCustomer,
    organizationName: values.organizationName.trim(),
    businessEmail: values.businessEmail.trim(),
    organizationPhone: normalizePhone(values.phoneNumber),
    contactFullName: toContactFullName(
      values,
      customerType,
    ),
    streetAddress: values.streetAddress.trim(),
    city: values.city.trim(),
    state: values.state,
    m2mPlanCode: optional(m2mPlanCode),
    rcNumber: enterprise ? optional(values.rcNumber) : undefined,
    taxIdentificationNumber: enterprise ? optional(values.taxIdentificationNumber) : undefined,
    identificationType: values.identificationType || undefined,
    identificationNumber: enterprise ? undefined : optional(values.identificationNumber),
    telecomMasterNumberType: enterprise ? values.telecomMasterNumberType || undefined : undefined,
    telecomMasterMsisdn: enterprise && values.telecomMasterNumberType === "existing" ? toMtnMsisdn(values.telecomMasterMsisdn) ?? undefined : undefined,
  };
}

/** Rehydrates the details form from a saved application. */
export function applicationToDetails(app: OnboardingApplication): BusinessDetailsValues {
  const [
    firstName = "",
    ...rest
  ] = app.contact.fullName.split(/\s+/);
  return {
    organizationName: app.organization.organizationName,
    businessEmail: app.organization.businessEmail,
    phoneNumber: app.organization.organizationPhone,
    contactName: app.contact.fullName,
    firstName,
    lastName: rest.join(" "),
    streetAddress: app.organization.streetAddress,
    city: app.organization.city,
    state: app.organization.state as BusinessDetailsValues["state"],
    rcNumber: app.registry.rcNumber ?? "",
    taxIdentificationNumber: app.registry.taxIdentificationNumber ?? "",
    identificationType: app.registry.identificationType ?? "",
    identificationNumber: app.registry.identificationNumber ?? "",
    telecomMasterNumberType: app.telecomMaster?.numberType ?? "",
    telecomMasterMsisdn: app.telecomMaster?.msisdn ?? "",
    // The server only stores a number that passed its MTN check.
    telecomMasterVerifiedMsisdn: app.telecomMaster?.msisdn ?? "",
  };
}

/** Server `field` on a 400 → the form input it belongs to. */
export const SERVER_FIELD_TO_FORM_FIELD: Record<string, keyof BusinessDetailsValues> = {
  organizationName: "organizationName",
  businessEmail: "businessEmail",
  organizationPhone: "phoneNumber",
  contactFullName: "contactName",
  streetAddress: "streetAddress",
  city: "city",
  state: "state",
  rcNumber: "rcNumber",
  taxIdentificationNumber: "taxIdentificationNumber",
  identificationType: "identificationType",
  identificationNumber: "identificationNumber",
  telecomMasterNumberType: "telecomMasterNumberType",
  telecomMasterMsisdn: "telecomMasterMsisdn",
};

/** Which detail clashes with another live application — never who holds it. */
export const CLAIM_TYPE_LABELS: Record<string, string> = {
  rc_number: "RC number",
  tax_identification_number: "Tax Identification Number",
  identification_number: "ID number",
  document_hash: "one of your uploaded files",
};

export function describeClaims(claimTypes?: string[]) {
  const labels = (claimTypes ?? []).map(type => CLAIM_TYPE_LABELS[type] ?? type);
  return labels.length
    ? `Your ${labels.join(" and ")} is already on another application. Check the details, or contact support if this is your business.`
    : null;
}

/** The full name the server stores, derived from whichever branch is in use. */
export function toContactFullName(
  values: BusinessDetailsValues,
  customerType: "enterprise" | "owner_operator",
) {
  if (customerType === "enterprise")
    return values.contactName.trim();
  return `${values.firstName} ${values.lastName}`.trim();
}

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(
      6,
      "Enter the 6-digit code.",
    )
    .regex(
      /^\d{6}$/,
      "Code must be 6 digits.",
    ),
});

export type VerifyCodeValues = z.infer<typeof verifyCodeSchema>;

export const vehicleSchema = z
  .object({
    registrationNumber: z.string().trim().min(
      1,
      "Registration number is required.",
    ),
    vehicleType: z.string().min(
      1,
      "Select a vehicle type.",
    ),
    make: z.string().trim().min(
      1,
      "Vehicle make is required.",
    ),
    model: z.string().trim().min(
      1,
      "Vehicle model is required.",
    ),
    year: z.string().trim().refine(
      value => !value || (/^\d{4}$/.test(value) && Number(value) >= 1950),
      "Four digits, 1950 or later.",
    ).optional(),
    engineNumber: z.string().trim().optional(),
    chassisNumber: z.string().trim().optional(),
    color: z.string().trim().optional(),
    engineCapacity: z.string().trim().optional(),
    odometer: z.string().trim().refine(
      value => !value || /^\d+$/.test(value),
      "Whole kilometres only.",
    ).optional(),
    purchaseType: z.string().optional(),
    otherPurchaseType: z.string().trim().optional(),
  })
  .refine(
    values => values.purchaseType !== "other" || Boolean(values.otherPurchaseType?.trim()),
    {
      message: "Specify the purchase type.",
      path: ["otherPurchaseType"],
    },
  );

export type VehicleValues = z.infer<typeof vehicleSchema>;

export function vehicleToPayload(values: VehicleValues): OnboardingVehicleInput {
  const optional = (value?: string) => value?.trim() || undefined;
  return {
    registrationNumber: values.registrationNumber.trim(),
    vehicleType: values.vehicleType as OnboardingVehicleInput["vehicleType"],
    make: values.make.trim(),
    model: values.model.trim(),
    year: values.year ? Number(values.year) : undefined,
    engineNumber: optional(values.engineNumber),
    chassisNumber: optional(values.chassisNumber),
    color: optional(values.color),
    engineCapacity: optional(values.engineCapacity),
    odometerReading: values.odometer ? Number(values.odometer) : undefined,
    purchaseType: (values.purchaseType || undefined) as OnboardingVehicleInput["purchaseType"],
    purchaseTypeOther: values.purchaseType === "other" ? optional(values.otherPurchaseType) : undefined,
  };
}

export function vehicleToValues(vehicle: OnboardingApplicationVehicle): VehicleValues {
  return {
    registrationNumber: vehicle.registrationNumber,
    vehicleType: vehicle.vehicleType,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year ? String(vehicle.year) : "",
    engineNumber: vehicle.engineNumber ?? "",
    chassisNumber: vehicle.chassisNumber ?? "",
    color: vehicle.color ?? "",
    engineCapacity: vehicle.engineCapacity ?? "",
    odometer: vehicle.odometerReading != null ? String(vehicle.odometerReading) : "",
    purchaseType: vehicle.purchaseType ?? "",
    otherPurchaseType: vehicle.purchaseTypeOther ?? "",
  };
}

/** Server `field` on a vehicle 400 → the modal input it belongs to. */
export const SERVER_VEHICLE_FIELD: Record<string, keyof VehicleValues> = {
  registrationNumber: "registrationNumber",
  vehicleType: "vehicleType",
  make: "make",
  model: "model",
  year: "year",
  engineNumber: "engineNumber",
  chassisNumber: "chassisNumber",
  color: "color",
  engineCapacity: "engineCapacity",
  odometerReading: "odometer",
  purchaseType: "purchaseType",
  purchaseTypeOther: "otherPurchaseType",
};

export const deviceRequestSchema = z.object({
  quantity: z.coerce.number().int().min(
    1,
    "Enter the number of devices you need.",
  ),
  useCase: z.string().trim().min(
    1,
    "Select a use case.",
  ),
  notes: z.string().trim().optional(),
});

export type DeviceRequestValues = z.infer<typeof deviceRequestSchema>;

export const installationSchema = z.object({
  streetAddress: z.string().trim().min(
    5,
    "Enter the installation address.",
  ),
  city: z.string().trim().min(
    2,
    "Enter the city.",
  ),
  state: stateField,
  date: z.string()
    .min(
      1,
      "Pick an installation date.",
    )
    .refine(
      date => date >= installationDateLimit(1),
      "Pick a date from tomorrow onwards.",
    )
    .refine(
      date => date <= installationDateLimit(90),
      "Pick a date within the next 90 days.",
    ),
  timeSlot: z.enum(
    [
      "morning",
      "afternoon",
    ],
    { message: "Pick a time slot." },
  ),
  contactName: personNameField,
  contactPhone: phoneField,
  notes: z.string().trim().optional(),
});

export type InstallationValues = z.infer<typeof installationSchema>;

/** Today plus `days`, as the YYYY-MM-DD an `<input type="date">` uses (local time). */
export function installationDateLimit(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA");
}

/**
 * Normalise a phone number to the `+234XXXXXXXXXX` form the server returns.
 * Applied at submit time only — the raw input stays as the user typed it.
 */
export function normalizePhone(input: string) {
  const digits = input.replace(
    /\s/g,
    "",
  );
  if (digits.startsWith("+234"))
    return digits;
  if (digits.startsWith("234"))
    return `+${digits}`;
  if (digits.startsWith("0"))
    return `+234${digits.slice(1)}`;
  return digits;
}

const ACCEPTED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

/**
 * Returns an error message, or null when the file is acceptable. A pre-check only —
 * the server decides the format from the file contents, not the declared type.
 */
export function checkFile(file: File, pdfOnly = false): string | null {
  if (file.size > MAX_DOCUMENT_BYTES) {
    return pdfOnly
      ? "This file is larger than 10 MB. Please upload a smaller PDF file."
      : "This file is larger than 10 MB. Please upload a smaller file.";
  }

  if (pdfOnly) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))
      return "Only PDF files are accepted. Please upload your document in PDF format.";
    return null;
  }

  if (!ACCEPTED_MIME.has(file.type))
    return "Only PDF, JPG or PNG files are accepted.";

  return null;
}

export { companyNameMatches } from "@truckmoov/app-core/apply/companyName";
