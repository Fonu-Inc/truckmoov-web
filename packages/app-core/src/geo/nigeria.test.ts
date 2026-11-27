import { describe, expect, it } from "vitest";
import { isInsideNigeria } from "./nigeria";

describe("isInsideNigeria", () => {
  it("accepts Lagos and Abuja", () => {
    expect(isInsideNigeria(6.5244, 3.3792)).toBe(true);
    expect(isInsideNigeria(9.0765, 7.3986)).toBe(true);
  });

  it("rejects null island, other countries and non-finite values", () => {
    expect(isInsideNigeria(0, 0)).toBe(false);
    expect(isInsideNigeria(51.5, -0.12)).toBe(false);
    expect(isInsideNigeria(Number.NaN, 5)).toBe(false);
    expect(isInsideNigeria(6, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("includes the box edges", () => {
    expect(isInsideNigeria(4.2, 2.6)).toBe(true);
    expect(isInsideNigeria(13.9, 14.7)).toBe(true);
    expect(isInsideNigeria(13.91, 14.7)).toBe(false);
  });
});
