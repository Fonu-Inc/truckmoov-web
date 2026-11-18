import * as z from "zod";
import { NIGERIAN_STATES } from "@/features/get-started/utils/getStartedContent";

// Server validation contract, mirrored client-side so users don't wait on a round trip to
// see obvious mistakes. The server is authoritative: a 400 with `{ field, message }` still
// lands on the right input via setError.

const NG_PHONE = /^(?:\+234|234|0)[789][01]\d{8}$/;

export const organizationSchema = z.object({
  applicantType: z.enum(
    [
      "enterprise",
      "owner_operator",
    ],
    { error: "Please pick what best describes you." },
  ),
  organizationName: z.string().trim().min(
    2,
    "Organization name is required.",
  ),
  businessEmail: z.string().trim().pipe(z.email("Enter a valid business email.")),
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
    { error: "Pick a state." },
  ),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;
