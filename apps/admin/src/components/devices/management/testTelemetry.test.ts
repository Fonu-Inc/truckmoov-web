import {
  describe, expect, it,
} from "vitest";
import {
  IMEI_PATTERN, parseCoordinate,
} from "./testTelemetry";

describe(
  "iMEI_PATTERN",
  () => {
    it(
      "accepts exactly 15 digits",
      () => {
        expect(IMEI_PATTERN.test("356938035643809")).toBe(true);
        expect(IMEI_PATTERN.test("35693803564380")).toBe(false);
        expect(IMEI_PATTERN.test("3569380356438091")).toBe(false);
        expect(IMEI_PATTERN.test("35693803564380a")).toBe(false);
      },
    );
  },
);

describe(
  "parseCoordinate",
  () => {
    it(
      "treats blank as default and enforces range",
      () => {
        expect(parseCoordinate(
          "  ",
          90,
        )).toEqual({ valid: true });
        expect(parseCoordinate(
          "6.5244",
          90,
        )).toEqual({
          value: 6.5244,
          valid: true,
        });
        expect(parseCoordinate(
          "91",
          90,
        ).valid).toBe(false);
        expect(parseCoordinate(
          "abc",
          180,
        ).valid).toBe(false);
      },
    );
  },
);
