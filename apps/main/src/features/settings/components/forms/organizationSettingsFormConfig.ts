import type {
  OrgSettingsData, UpdateOrgSettingsPayload,
} from "@truckmoov/api/auth";

import * as z from "zod";

export const ORGANIZATION_SETTINGS_FORM_ID = "organization-settings-form";
export const MAX_ORGANIZATION_IMAGE_SIZE = 2 * 1024 * 1024;
/** The organization logo ("PNG, JPG up to 2MB"). */
export const ORGANIZATION_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
] as const;
/** The profile image ("PNG, JPG, SVG or WebP. Max 2MB."). */
export const PROFILE_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
] as const;

export const organizationSettingsSchema = z.object({
  organizationName: z.string().trim().min(
    1,
    "Organization name is required.",
  ),
  contactEmail: z.string().trim().min(
    1,
    "Contact email is required.",
  ).email("Enter a valid email address."),
  phoneNumber: z.string().trim(),
  address: z.string().trim(),
  logoUrl: z.string().url().or(z.literal("")),
  profilePictureUrl: z.string().url().or(z.literal("")),
  timezone: z.string().min(
    1,
    "Select a timezone.",
  ),
  language: z.string().min(
    1,
    "Select a language.",
  ),
});

export type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsSchema>;

export const EMPTY_ORGANIZATION_SETTINGS: OrganizationSettingsFormValues = {
  organizationName: "",
  contactEmail: "",
  phoneNumber: "",
  address: "",
  logoUrl: "",
  profilePictureUrl: "",
  timezone: "Africa/Lagos",
  language: "en",
};

export function organizationSettingsToFormValues(settings?: OrgSettingsData): OrganizationSettingsFormValues {
  return {
    organizationName: settings?.branding?.organizationName ?? "",
    contactEmail: settings?.branding?.contactEmail ?? "",
    phoneNumber: settings?.branding?.phoneNumber ?? "",
    address: settings?.branding?.address ?? "",
    logoUrl: settings?.branding?.logoUrl ?? "",
    profilePictureUrl: settings?.branding?.profilePictureUrl ?? "",
    timezone: settings?.defaults?.timezone ?? "Africa/Lagos",
    language: settings?.defaults?.language ?? "en",
  };
}

export function organizationSettingsToPayload(values: OrganizationSettingsFormValues): UpdateOrgSettingsPayload {
  return {
    data: {
      branding: {
        organizationName: values.organizationName,
        contactEmail: values.contactEmail,
        phoneNumber: values.phoneNumber,
        address: values.address,
        logoUrl: values.logoUrl,
        profilePictureUrl: values.profilePictureUrl,
      },
      defaults: {
        timezone: values.timezone,
        language: values.language,
      },
    },
  };
}

export function isValidProfileImage(file: File) {
  return PROFILE_IMAGE_TYPES.includes(file.type as (typeof PROFILE_IMAGE_TYPES)[number])
    && file.size <= MAX_ORGANIZATION_IMAGE_SIZE;
}

export function isValidOrganizationImage(file: File) {
  return ORGANIZATION_IMAGE_TYPES.includes(file.type as (typeof ORGANIZATION_IMAGE_TYPES)[number])
    && file.size <= MAX_ORGANIZATION_IMAGE_SIZE;
}
