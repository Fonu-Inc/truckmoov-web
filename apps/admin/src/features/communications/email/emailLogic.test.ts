import { describe, expect, it } from "vitest";
import { formatBytes, parseAddresses, participantsLabel, replySubject, secureFor } from "./emailLogic";

describe("parseAddresses", () => {
  it("splits on commas, semicolons and spaces and reports what is not an address", () => {
    const { valid, invalid } = parseAddresses("A@x.com, b@y.org; nope  c@z.io");
    expect(valid.map(a => a.address)).toEqual(["a@x.com", "b@y.org", "c@z.io"]);
    expect(invalid).toEqual(["nope"]);
  });

  it("is empty for blank input", () => {
    expect(parseAddresses("  ")).toEqual({ valid: [], invalid: [] });
  });
});

describe("participantsLabel", () => {
  it("leaves out the mailbox owner and prefers names", () => {
    const people = [
      { address: "me@truckmoov.com", name: "Me" },
      { address: "ada@x.com", name: "Ada" },
      { address: "bob@y.com", name: null },
    ];
    expect(participantsLabel(people, "ME@truckmoov.com")).toBe("Ada, bob@y.com");
    expect(participantsLabel([people[0]], "me@truckmoov.com")).toBe("Me");
    expect(participantsLabel([], null)).toBe("No participants");
  });
});

describe("replySubject", () => {
  it("adds Re: once", () => {
    expect(replySubject("Invoice")).toBe("Re: Invoice");
    expect(replySubject("re: Invoice")).toBe("re: Invoice");
  });
});

describe("small helpers", () => {
  it("formats sizes and picks secure for implicit-TLS ports", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
    expect(secureFor(993)).toBe(true);
    expect(secureFor(587)).toBe(false);
  });
});
