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
    key: "contactRole",
    label: "Contact Role",
    reviewLabel: "Contact Role",
    placeholder: "Fleet Manager",
    type: "text",
  },
  {
    key: "address",
    label: "Organization Address",
    reviewLabel: "Organization Address",
    placeholder: "Mazi Fedelis Street, Abuja, FCT",
    type: "text",
  },
] as const;

export const DOCUMENTS = [
  {
    id: "customer-request-letter",
    title: "Customer Request Letter",
    description: "Must Bear The Full Business Name, Signed And In A Non-Editable Format (PDF).",
  },
  {
    id: "letter-of-authorization",
    title: "Letter of Authorization",
    description: "On Company Letterhead.",
  },
  {
    id: "signed-indemnity-form",
    title: "Signed Indemnity Form",
    description: "Signed By An Authorised Signatory.",
  },
  {
    id: "cac-document",
    title: "CAC Document",
    description: "Certificate Of Incorporation Or Business Registration.",
  },
  {
    id: "tax-certificate",
    title: "Tax Certificate or TIN",
    description: "Valid Tax Clearance Certificate Or TIN Slip.",
  },
  {
    id: "signature-card",
    title: "Signature Card",
    description: "Bearing Authorised Signatories And Their Specimen Signatures.",
  },
];

export const ORG_TYPES = [
  {
    id: "fleet_provider",
    title: "Fleet Provider",
    description: "Operates Vehicles & Drivers, Executes Transport Jobs.",
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
export type Uploads = Record<string, Upload>;
export type VerifyStatus = "idle" | "verifying" | "verified";

export const EMPTY_UPLOADS: Uploads = Object.fromEntries(DOCUMENTS.map(document => [
  document.id,
  {
    file: null,
    error: null,
  },
]));

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Format check only — the mockup's "Needs Attention" state. */
export function checkFile(file: File) {
  if (file.size > MAX_UPLOAD_BYTES)
    return "File Is Larger Than 10MB. Please Upload A Smaller File.";

  if (file.type !== "application/pdf")
    return "Please Upload A Non-Editable Version (PDF).";

  return null;
}

// Server validation contract (mirrored client-side so users don't wait on a
// round trip to see obvious mistakes). Server is authoritative — a 400 with
// `{ field, message }` will still land on the right input via setError.

// 36 Nigerian states + FCT.
const NIGERIAN_STATES = [
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
  contactRole: z.string().trim().min(
    2,
    "Contact role is required.",
  ),
  address: z.string().trim().min(
    5,
    "Enter your organization address.",
  ),
  // Client-only until the API exposes a `state` field. Kept optional so the
  // step doesn't break existing state; wire when the server accepts it.
  state: z.enum(
    NIGERIAN_STATES,
    { message: "Pick a state." },
  ).optional(),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

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
