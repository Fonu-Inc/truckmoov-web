import { z } from "zod";

/** Copy for the "Contact Us" dialog (Figma frame 234:4615). */
export const CONTACT_COPY = {
  title: "Contact Us",
  description: "Start Your Fleet Journey With Us By Following These Simple Steps.",
  submit: "Send Message",
  submitting: "Sending…",
  successTitle: "Message sent",
  successDescription: "Thanks for reaching out. A member of the FleetPro team will get back to you at your business email within one business day.",
  successAction: "Done",
} as const;

export const contactSchema = z.object({
  companyName: z.string().trim().min(
    2,
    "Enter your company name.",
  ).max(
    120,
    "Keep it under 120 characters.",
  ),
  contactName: z.string().trim().min(
    2,
    "Enter your full name.",
  ).max(
    120,
    "Keep it under 120 characters.",
  ),
  businessEmail: z.string().trim().email("Enter a valid business email."),
  message: z.string().trim().min(
    10,
    "Tell us a little more (at least 10 characters).",
  ).max(
    2000,
    "Keep your message under 2,000 characters.",
  ),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export const CONTACT_DEFAULTS: ContactFormValues = {
  companyName: "",
  contactName: "",
  businessEmail: "",
  message: "",
};

export type ContactField = {
  name: keyof ContactFormValues;
  label: string;
  placeholder: string;
  /** "textarea" renders the multi-line message box. */
  kind: "input" | "textarea";
  type?: "text" | "email";
  autoComplete?: string;
};

/** Form fields in display order. */
export const CONTACT_FIELDS: ContactField[] = [
  {
    name: "companyName",
    label: "Company Name",
    placeholder: "Enter your company name",
    kind: "input",
    type: "text",
    autoComplete: "organization",
  },
  {
    name: "contactName",
    label: "Contact Name",
    placeholder: "Enter your full name",
    kind: "input",
    type: "text",
    autoComplete: "name",
  },
  {
    name: "businessEmail",
    label: "Business Email",
    placeholder: "Enter your business email",
    kind: "input",
    type: "email",
    autoComplete: "email",
  },
  {
    name: "message",
    label: "Message",
    placeholder: "Describe what happened...",
    kind: "textarea",
  },
];
