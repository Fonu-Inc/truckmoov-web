import {
  describe, expect, it,
} from "vitest";
import {
  matchesTmFilter, normalizeMtnNumber, tmSimQuotationLine,
} from "@/features/tenants/utils/tmNumber";

describe(
  "telematics number rules",
  () => {
    it(
      "accepts local and international MTN formats",
      () => {
        expect(normalizeMtnNumber("0803 123 4567")).toBe("2348031234567");
        expect(normalizeMtnNumber("+234 803 123 4567")).toBe("2348031234567");
        expect(normalizeMtnNumber("2348031234567")).toBe("2348031234567");
      },
    );
    it(
      "rejects non-MTN prefixes and bad lengths",
      () => {
        expect(normalizeMtnNumber("08051234567")).toBeNull();
        expect(normalizeMtnNumber("080312345")).toBeNull();
      },
    );
    it(
      "adds the Telematics SIM charge only for a new telematics number",
      () => {
        expect(tmSimQuotationLine(
          "existing",
          5000,
        )).toBeNull();
        expect(tmSimQuotationLine(
          "new",
          5000,
        )).toEqual({
          label: "New Telematics SIM", amount: 5000, priced: true,
        });
        expect(tmSimQuotationLine(
          "new",
          null,
        )?.priced).toBe(false);
      },
    );
    it(
      "groups both failure statuses under Failed Requests",
      () => {
        expect(matchesTmFilter(
          {
            number_type: "new", status: "allocation_failed",
          },
          "failed",
        )).toBe(true);
        expect(matchesTmFilter(
          {
            number_type: "existing", status: "verification_failed",
          },
          "failed",
        )).toBe(true);
        expect(matchesTmFilter(
          {
            number_type: "new", status: "allocated",
          },
          "failed",
        )).toBe(false);
      },
    );
  },
);
