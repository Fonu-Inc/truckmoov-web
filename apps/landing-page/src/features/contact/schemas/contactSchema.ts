import * as z from "zod";

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
  businessEmail: z.string().trim().pipe(z.email("Enter a valid business email.")),
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
