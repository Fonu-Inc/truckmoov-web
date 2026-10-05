import {
  describe, expect, it,
} from "vitest";
import {
  holdsPermission, permissionForPath,
} from "./routePermissions";

describe(
  "permissionForPath",
  () => {
    it(
      "maps dashboard root",
      () => {
        expect(permissionForPath("/")).toBe("admin.dashboard.read");
      },
    );

    it(
      "prefers onboarding over tenants prefix",
      () => {
        expect(permissionForPath("/tenants/onboarding/abc")).toBe("admin.onboarding_review.read");
        expect(permissionForPath("/tenants/abc")).toBe("admin.tenants.read");
      },
    );

    it(
      "maps messaging surfaces to admin.messaging.read",
      () => {
        for (const path of [
          "/messaging",
          "/inbox",
          "/campaigns",
          "/voice",
          "/sms-templates",
          "/whatsapp",
        ]) {
          expect(permissionForPath(path)).toBe("admin.messaging.read");
        }
      },
    );

    it(
      "maps security and settings children",
      () => {
        expect(permissionForPath("/security/payments-access")).toBe("admin.security.read");
        expect(permissionForPath("/settings/team")).toBe("admin.staff.read");
        expect(permissionForPath("/settings/ai-providers")).toBe("admin.ai.read");
        expect(permissionForPath("/settings")).toBe("admin.settings.read");
      },
    );

    it(
      "leaves own 2FA settings ungated",
      () => {
        expect(permissionForPath("/settings/security")).toBeNull();
      },
    );

    it(
      "maps simulator to devices.manage",
      () => {
        expect(permissionForPath("/simulator")).toBe("admin.devices.manage");
      },
    );
  },
);

describe(
  "holdsPermission",
  () => {
    it(
      "allows when required is null",
      () => {
        expect(holdsPermission(
          [],
          null,
        )).toBe(true);
      },
    );

    it(
      "requires the exact catalog key",
      () => {
        expect(holdsPermission(
          ["admin.messaging.read"],
          "admin.messaging.read",
        )).toBe(true);
        expect(holdsPermission(
          ["admin.tenants.read"],
          "admin.messaging.read",
        )).toBe(false);
        expect(holdsPermission(
          undefined,
          "admin.messaging.read",
        )).toBe(false);
      },
    );
  },
);
