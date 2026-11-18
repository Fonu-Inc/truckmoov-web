import type {
  OnboardingApplicationDocumentType,
  OnboardingApplicationTimelineEntry,
} from "@truckmoov/api/auth";
import type { OrganizationFormValues } from "@/features/get-started/schemas/organizationSchema";

const mapIllustration = "/images/get-started/map.png";
const truckIllustration = "/images/get-started/truck.png";

export const STEPS = [
  "Organization",
  "Upload Documents",
  "Document Check",
  "Verify Email",
  "Verify Phone",
  "Review",
];

// The organisation form is grouped into the three Figma sections; `half` fields
// share a row (City sits beside the State select in the address section).
export const ORG_SECTIONS = [
  {
    id: "organization",
    title: "Organization Details",
  },
  {
    id: "contact",
    title: "Contact Person Details",
  },
  {
    id: "address",
    title: "Address Details",
  },
] as const;

export type OrgSectionId = typeof ORG_SECTIONS[number]["id"];

export const ORG_FIELDS = [
  {
    key: "organizationName",
    section: "organization",
    label: "Organization Name",
    placeholder: "Arne logistics Ltd",
    type: "text",
    half: false,
  },
  {
    key: "businessEmail",
    section: "organization",
    label: "Business Email",
    placeholder: "jane@arne.com",
    type: "email",
    half: false,
  },
  {
    key: "phone",
    section: "organization",
    label: "Organization Phone no.",
    placeholder: "+234 80 0000 0000",
    type: "tel",
    half: false,
  },
  {
    key: "contactName",
    section: "contact",
    label: "Full Name",
    placeholder: "Jane Doe",
    type: "text",
    half: false,
  },
  {
    key: "address",
    section: "address",
    label: "Street Address",
    placeholder: "Mazi Fedelis Street",
    type: "text",
    half: false,
  },
  {
    key: "city",
    section: "address",
    label: "City",
    placeholder: "Abuja",
    type: "text",
    half: true,
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
];

// `description` keeps the Figma line break (rendered with whitespace-pre-line).
export const ORG_TYPES = [
  {
    id: "enterprise",
    title: "Fleet Provider",
    description: "Operates Vehicles & Drivers,\nExecutes Transport Jobs.",
    illustration: mapIllustration,
    illustrationWidth: 100,
    illustrationHeight: 65,
    illustrationClassName: "top-[37px] -right-2.5 h-[65px] w-[100px] rotate-[8.25deg] drop-shadow-[0_4px_2px_rgb(0_0_0/0.25)]",
  },
  {
    id: "owner_operator",
    title: "Owner Operator",
    description: "Independent Operator With\nOwn Vehicle(S)",
    illustration: truckIllustration,
    illustrationWidth: 95,
    illustrationHeight: 68,
    illustrationClassName: "top-[50px] right-[3px] h-[68px] w-[95px]",
  },
] as const;

// contactRole is required by the server but the applicant never types it —
// it's implied by the Fleet Provider / Owner Operator card they pick.
export const APPLICANT_TYPE_TO_ROLE: Record<typeof ORG_TYPES[number]["id"], string> = {
  enterprise: "Enterprise Admin",
  owner_operator: "Owner Operator",
};

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

// Review step summary (Figma "Organization Details" card), in reading order.
export const REVIEW_ROWS: {
  label: string; value: (values: OrganizationFormValues) => string;
}[] = [
  {
    label: "Organisation Name",
    value: values => values.organizationName,
  },
  {
    label: "Business Email",
    value: values => values.businessEmail,
  },
  {
    label: "Phone Number",
    value: values => values.phone,
  },
  {
    label: "Contact Name",
    value: values => values.contactName,
  },
  {
    label: "Contact Role",
    value: values => (values.applicantType ? APPLICANT_TYPE_TO_ROLE[values.applicantType] : ""),
  },
  {
    label: "Organization Address",
    value: values => [
      values.address,
      values.city,
      values.state,
    ].filter(Boolean).join(", "),
  },
];

// Shown on the submitted screen until the status endpoint returns a timeline.
export const FALLBACK_TIMELINE: OnboardingApplicationTimelineEntry[] = [
  {
    key: "submitted", label: "Application submitted", complete: true, inProgress: false,
  },
  {
    key: "details", label: "Organization details received", complete: true, inProgress: false,
  },
  {
    key: "documents", label: "Documents received", complete: true, inProgress: false,
  },
  {
    key: "review", label: "Application Review", complete: false, inProgress: true,
  },
];
