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
    id: "fleet-provider",
    title: "Fleet Provider",
    description: "Operates Vehicles & Drivers, Executes Transport Jobs.",
    illustration: mapIllustration,
  },
  {
    id: "owner-operator",
    title: "Owner Operator",
    description: "Independent Operator With Own Vehicle(S)",
    illustration: truckIllustration,
  },
];

export type FieldKey = typeof ORG_FIELDS[number]["key"];
export type Fields = Record<FieldKey, string>;
export type Upload = {
  file: File | null; error: string | null;
};
export type Uploads = Record<string, Upload>;
export type VerifyStatus = "idle" | "verifying" | "verified";

export const EMPTY_FIELDS: Fields = {
  organizationName: "",
  businessEmail: "",
  phone: "",
  contactName: "",
  contactRole: "",
  address: "",
};

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
