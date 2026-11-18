import type { ContactFormValues } from "@/features/contact/schemas/contactSchema";

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
