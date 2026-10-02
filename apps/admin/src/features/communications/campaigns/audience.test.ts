import { describe, expect, it } from "vitest";
import type { AudienceTenant } from "./audience";
import { buildRecipients, isMessageable, normalizeEmail, normalizePhone } from "./audience";

const tenant = (over: Partial<AudienceTenant>): AudienceTenant => ({
  id: "t1",
  name: "Acme",
  email: "ops@acme.ng",
  phone: "08012345678",
  status: "active",
  ...over,
});

describe("normalizePhone", () => {
  it("widens a Nigerian local number and strips punctuation", () => {
    expect(normalizePhone("0801 234 5678")).toBe("2348012345678");
    expect(normalizePhone("+234 801 234 5678")).toBe("2348012345678");
  });

  it("refuses what cannot be a number", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("n/a")).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("lowercases and rejects a malformed address", () => {
    expect(normalizeEmail(" Ops@Acme.NG ")).toBe("ops@acme.ng");
    expect(normalizeEmail("not-an-email")).toBeNull();
  });
});

describe("buildRecipients", () => {
  it("builds one recipient per tenant per channel and counts the gaps", () => {
    const reach = buildRecipients(
      [tenant({}), tenant({ id: "t2", phone: null }), tenant({ id: "t3", email: "" })],
      ["whatsapp", "email"],
    );
    expect(reach.recipients).toHaveLength(4);
    expect(reach.reachable).toEqual({ whatsapp: 2, sms: 0, email: 2 });
    expect(reach.missing).toEqual({ whatsapp: 1, sms: 0, email: 1 });
    expect(reach.recipients[0]).toEqual({ audience_ref: "t1", channel: "whatsapp", destination: "2348012345678" });
  });
});

describe("isMessageable", () => {
  it("leaves out suspended and terminated tenants", () => {
    expect(isMessageable(tenant({ status: "trial" }))).toBe(true);
    expect(isMessageable(tenant({ status: "suspended" }))).toBe(false);
    expect(isMessageable(tenant({ status: "terminated" }))).toBe(false);
  });
});
