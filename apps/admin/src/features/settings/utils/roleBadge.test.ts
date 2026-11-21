import { describe, expect, it } from "vitest";
import { humaniseRoleKey, roleIndicatorClasses } from "@/features/settings/utils/roleBadge";

describe("roleIndicatorClasses", () => {
  it("uses the fixed colour for known roles", () => {
    expect(roleIndicatorClasses("admin")).toBe("bg-primary/15 text-primary border-primary/30");
    expect(roleIndicatorClasses("viewer")).toBe("bg-muted text-muted-foreground border-border");
  });

  it("is stable for custom roles and never picks the muted slot", () => {
    const a = roleIndicatorClasses("platform_admin");
    expect(roleIndicatorClasses("platform_admin")).toBe(a);
    expect(a).not.toBe("bg-muted text-muted-foreground border-border");
  });
});

describe("humaniseRoleKey", () => {
  it("title-cases snake keys", () => {
    expect(humaniseRoleKey("billing_manager")).toBe("Billing Manager");
  });
});
