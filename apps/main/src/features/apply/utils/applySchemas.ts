/**
 * Validation for the apply flow.
 *
 * The organization/verification schemas mirror the server's own contract so the
 * applicant sees obvious mistakes without a round trip. The server stays
 * authoritative — a 400 carrying `{ field, message }` is still bound onto the
 * matching input via `setError`.
 *
 * Ported from apps/landing-page's get-started flow, which already tracks this
 * contract. Keep the two in step.
 */

import * as z from "zod";

import { MAX_DOCUMENT_BYTES } from "./applyTypes";

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
  state: z.enum(
    NIGERIAN_STATES,
    { message: "Pick a state." },
  ),
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
    return businessDetailsBase.extend({ contactName: personNameField });
  }
  return businessDetailsBase.extend({
    firstName: nameWordField,
    lastName: nameWordField,
  });
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
  state: undefined as unknown as BusinessDetailsValues["state"],
};

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
    otherVehicleType: z.string().trim().optional(),
    make: z.string().trim().min(
      1,
      "Vehicle make is required.",
    ),
    model: z.string().trim().min(
      1,
      "Vehicle model is required.",
    ),
    year: z.string().trim().optional(),
    engineNumber: z.string().trim().optional(),
    chassisNumber: z.string().trim().optional(),
    color: z.string().trim().optional(),
    engineCapacity: z.string().trim().optional(),
    odometer: z.string().trim().optional(),
    purchaseType: z.string().optional(),
    otherPurchaseType: z.string().trim().optional(),
  })
  .refine(
    values => values.vehicleType !== "Other" || Boolean(values.otherVehicleType?.trim()),
    {
      message: "Specify the vehicle type.",
      path: ["otherVehicleType"],
    },
  )
  .refine(
    values => values.purchaseType !== "Other" || Boolean(values.otherPurchaseType?.trim()),
    {
      message: "Specify the purchase type.",
      path: ["otherPurchaseType"],
    },
  );

export type VehicleValues = z.infer<typeof vehicleSchema>;

export const deviceRequestSchema = z.object({
  quantity: z.coerce.number().int().min(
    1,
    "Enter the number of devices you need.",
  ),
  manufacturer: z.string().min(
    1,
    "Select a manufacturer.",
  ),
  useCase: z.string().trim().min(
    1,
    "Please describe the intended use of the devices.",
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
  state: z.enum(
    NIGERIAN_STATES,
    { message: "Pick a state." },
  ),
  date: z.string().min(
    1,
    "Pick an installation date.",
  ),
  timeSlot: z.string().min(
    1,
    "Pick a time slot.",
  ),
  contactName: personNameField,
  contactPhone: phoneField,
  notes: z.string().trim().optional(),
});

export type InstallationValues = z.infer<typeof installationSchema>;

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

/** Returns an error message, or null when the file is acceptable. */
export function checkFile(file: File, pdfOnly = false): string | null {
  if (file.size > MAX_DOCUMENT_BYTES)
    return "This file is larger than 10 MB. Please upload a smaller PDF file.";

  if (pdfOnly) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))
      return "Only PDF files are accepted. Please upload your document in PDF format.";
    return null;
  }

  if (!ACCEPTED_MIME.has(file.type))
    return "Only PDF, JPG or PNG files are accepted.";

  return null;
}
