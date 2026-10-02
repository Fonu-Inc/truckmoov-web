import { describe, expect, it } from "vitest";
import { renderSms, segmentCount, variablesOf } from "./smsTemplateText";

describe("variablesOf", () => {
  it("lists each placeholder once, in order, ignoring spaces inside the braces", () => {
    expect(variablesOf("Hi {{name}}, {{ date }}. Bye {{name}}.")).toEqual(["name", "date"]);
    expect(variablesOf("no placeholders")).toEqual([]);
  });
});

describe("renderSms", () => {
  it("fills what it has and leaves the rest visible", () => {
    expect(renderSms("Hi {{name}}, {{date}}", { name: " Ada " })).toBe("Hi Ada, {{date}}");
  });
});

describe("segmentCount", () => {
  it("splits at 160 characters", () => {
    expect(segmentCount("")).toBe(0);
    expect(segmentCount("a".repeat(160))).toBe(1);
    expect(segmentCount("a".repeat(161))).toBe(2);
  });
});
