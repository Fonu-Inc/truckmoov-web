import { describe, expect, it } from "vitest";

import {
  MAX_ORGANIZATION_IMAGE_SIZE,
  isValidOrganizationImage,
  organizationSettingsSchema,
  organizationSettingsToFormValues,
  organizationSettingsToPayload,
} from "./organizationSettingsFormConfig";

describe("organization settings form", () => {
  it("maps the organization settings response to form values", () => {
    expect(organizationSettingsToFormValues({
      tenantId: "tenant-1",
      branding: {
        organizationName: "Truckmoov Logistics",
        contactEmail: "ops@truckmoov.test",
        phoneNumber: "+2348000000000",
        address: "Lagos",
        profilePictureUrl: "https://cdn.test/profile.png",
      },
      defaults: { timezone: "Africa/Nairobi", language: "ha" },
    })).toEqual({
      organizationName: "Truckmoov Logistics",
      contactEmail: "ops@truckmoov.test",
      phoneNumber: "+2348000000000",
      address: "Lagos",
      profilePictureUrl: "https://cdn.test/profile.png",
      timezone: "Africa/Nairobi",
      language: "ha",
    });
  });

  it("uses the existing timezone and language defaults for missing settings", () => {
    expect(organizationSettingsToFormValues()).toMatchObject({
      timezone: "Africa/Lagos",
      language: "en",
    });
  });

  it("requires an organization name and valid contact email", () => {
    const result = organizationSettingsSchema.safeParse({
      organizationName: " ",
      contactEmail: "not-an-email",
      phoneNumber: "",
      address: "",
      profilePictureUrl: "",
      timezone: "Africa/Lagos",
      language: "en",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.organizationName).toBeDefined();
      expect(result.error.flatten().fieldErrors.contactEmail).toBeDefined();
    }
  });

  it("accepts only PNG or JPEG images up to 2 MB", () => {
    expect(isValidOrganizationImage(new File(["image"], "logo.png", { type: "image/png" }))).toBe(true);
    expect(isValidOrganizationImage(new File(["image"], "logo.webp", { type: "image/webp" }))).toBe(false);
    expect(isValidOrganizationImage(new File(
      [new Uint8Array(MAX_ORGANIZATION_IMAGE_SIZE + 1)],
      "large.jpg",
      { type: "image/jpeg" },
    ))).toBe(false);
  });

  it("builds a supported PATCH payload without billing email", () => {
    const payload = organizationSettingsToPayload({
      organizationName: "Truckmoov Logistics",
      contactEmail: "ops@truckmoov.test",
      phoneNumber: "+2348000000000",
      address: "Lagos",
      profilePictureUrl: "https://cdn.test/profile.png",
      timezone: "Africa/Lagos",
      language: "en",
    });

    expect(payload).toEqual({
      data: {
        branding: {
          organizationName: "Truckmoov Logistics",
          contactEmail: "ops@truckmoov.test",
          phoneNumber: "+2348000000000",
          address: "Lagos",
          profilePictureUrl: "https://cdn.test/profile.png",
        },
        defaults: { timezone: "Africa/Lagos", language: "en" },
      },
    });
    expect(JSON.stringify(payload)).not.toContain("billing");
  });
});
