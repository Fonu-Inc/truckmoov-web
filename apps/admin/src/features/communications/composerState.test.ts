import { describe, expect, it } from "vitest";
import { composerDisabledReason } from "./composerState";

describe("composerDisabledReason", () => {
  const open = { is_locked: false };
  it("explains each blocked state in order", () => {
    expect(composerDisabledReason(open, false, "connected")).toBe("You can read messages but not reply.");
    expect(composerDisabledReason({ is_locked: true }, true, "connected")).toContain("24-hour window");
    expect(composerDisabledReason(open, true, "offline")).toContain("connection");
    expect(composerDisabledReason(open, true, "connected")).toBeNull();
  });
});
