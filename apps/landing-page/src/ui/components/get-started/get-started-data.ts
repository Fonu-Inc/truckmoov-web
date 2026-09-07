import type { OnboardingApplicationDocumentType } from "@truckmoov/api/auth";
import * as z from "zod";
import mapIllustration from "@/ui/images/map.png";
import truckIllustration from "@/ui/images/truck.png";

export const STEPS = [
  "Organization Details",
  "Upload Documents",
  "Document Check",
  "Verify Email",
  "Verify Phone Number",
  "Review",
];

export const ORG_FIELDS = [
  {
    key: "organizationName",
    label: "Organization Name",
    reviewLabel: "Organization Name",
    placeholder: "Arne logistics Ltd",
    type: "text",
  },
  {
    key: "businessEmail",
    label: "Business Email",
    reviewLabel: "Business Email",
    placeholder: "jane@arne.com",
    type: "email",
  },
  {
    key: "phone",
    label: "Organization Phone no.",
    reviewLabel: "Phone Number",
    placeholder: "+234 80 0000 0000",
    type: "tel",
  },
  {
    key: "contactName",
    label: "Contact Name",
    reviewLabel: "Contact Name",
    placeholder: "Jane Doe",
    type: "text",
  },
  {
    key: "address",
    label: "Organization Address",
    reviewLabel: "Organization Address",
    placeholder: "Mazi Fedelis Street",
    type: "text",
  },
  {
    key: "city",
    label: "City",
    reviewLabel: "City",
    placeholder: "Abuja",
    type: "text",
  },
] as const;

export type DocumentEntry = {
  id: OnboardingApplicationDocumentType;
  title: string;
  description: string;
  pdfOnly?: boolean;
};

export const DOCUMENTS: DocumentEntry[] = [
  {
    id: "customer_request_letter",
    title: "Customer Request Letter",
    description: "Must Bear The Full Business Name, Signed And In A Non-Editable Format (PDF).",
    pdfOnly: true,
  },
  {
    id: "letter_of_authorization",
    title: "Letter of Authorization",
    description: "On Company Letterhead.",
  },
  {
    id: "signed_indemnity_form",
    title: "Signed Indemnity Form",
    description: "Signed By An Authorised Signatory.",
  },
  {
    id: "cac_document",
    title: "CAC Document",
    description: "Certificate Of Incorporation Or Business Registration.",
  },
  {
    id: "tax_certificate_or_tin",
    title: "Tax Certificate or TIN",
    description: "Valid Tax Clearance Certificate Or TIN Slip.",
  },
  {
    id: "signature_card",
    title: "Signature Card",
    description: "Bearing Authorised Signatories And Their Specimen Signatures.",
  },
  {
    id: "utility_bill",
    title: "Utility Bill",
    description: "A Recent Utility Bill Confirming The Business Address.",
  },
  {
    id: "identification_card",
    title: "Identification Card",
    description: "Government-Issued ID Of The Authorised Signatory.",
  },
  {
    id: "form_c02_c07",
    title: "Form C02 / C07",
    description: "CAC Form C02 (Allotment Of Shares) Or C07 (Particulars Of Directors).",
  },
  {
    id: "agreement_form",
    title: "Agreement Form",
    description: "Signed Service Agreement Or Terms Acceptance Form.",
  },
];

export const ORG_TYPES = [
  {
    id: "fleet_provider",
    title: "Enterprise Admin",
    description: "Operates An Internal Logistics Organisation With Full Authority Over Fleet, Depots, Drivers And Dispatch.",
    illustration: mapIllustration,
  },
  {
    id: "owner_operator",
    title: "Owner Operator",
    description: "Independent Operator With Own Vehicle(S)",
    illustration: truckIllustration,
  },
] as const;

export type FieldKey = typeof ORG_FIELDS[number]["key"];
export type Upload = {
  file: File | null; error: string | null;
};
export type Uploads = Record<OnboardingApplicationDocumentType, Upload>;
export type VerifyStatus = "idle" | "verifying" | "verified";

export const EMPTY_UPLOADS: Uploads = Object.fromEntries(DOCUMENTS.map(document => [
  document.id,
  {
    file: null,
    error: null,
  },
])) as Uploads;

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export function checkFile(file: File, pdfOnly = false) {
  if (file.size > MAX_UPLOAD_BYTES)
    return "File Is Larger Than 10MB. Please Upload A Smaller File.";

  if (pdfOnly) {
    if (file.type !== "application/pdf")
      return "Please Upload A Non-Editable Version (PDF).";
    return null;
  }

  if (!ACCEPTED_MIME.has(file.type))
    return "Only PDF, JPG or PNG files are accepted.";

  return null;
}

// Server validation contract (mirrored client-side so users don't wait on a
// round trip to see obvious mistakes). Server is authoritative — a 400 with
// `{ field, message }` will still land on the right input via setError.

// 36 Nigerian states + FCT.
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

export const organizationSchema = z.object({
  applicantType: z.enum(
    [
      "fleet_provider",
      "owner_operator",
    ],
    { message: "Please pick what best describes you." },
  ),
  organizationName: z.string().trim().min(
    2,
    "Organization name is required.",
  ),
  businessEmail: z.string().trim().email("Enter a valid business email."),
  phone: z
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
    ),
  contactName: z
    .string()
    .trim()
    .refine(
      value => !/\d/.test(value),
      "Contact name can't contain digits.",
    )
    .refine(
      value => value.split(/\s+/).filter(Boolean).length >= 2,
      "Enter first and last name.",
    ),
  address: z.string().trim().min(
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

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

// Normalise phone to the +234XXXXXXXXXX form the server returns after validation.
// Applied at submit time only — the raw input stays as the user typed it.
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
