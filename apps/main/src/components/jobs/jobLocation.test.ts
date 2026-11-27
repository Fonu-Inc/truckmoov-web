import {
  describe, expect, it,
} from "vitest";
import {
  locationError, pickerValue,
} from "./jobLocation";

describe(
  "locationError",
  () => {
    it(
      "accepts a Nigerian pick and ignores empty addresses",
      () => {
        expect(locationError(
          "Apapa Port, Lagos",
          6.44,
          3.36,
        )).toBeUndefined();
        expect(locationError(
          "",
          0,
          0,
        )).toBeUndefined();
      },
    );

    it(
      "rejects typed text with no coordinates and addresses outside Nigeria",
      () => {
        expect(locationError(
          "Apapa",
          0,
          0,
        )).toMatch(/Nigeria/);
        expect(locationError(
          "London",
          51.5,
          -0.12,
        )).toMatch(/Nigeria/);
      },
    );
  },
);

describe(
  "pickerValue",
  () => {
    it(
      "keeps a valid pick and blanks stale or zero coordinates",
      () => {
        expect(pickerValue(
          "Apapa",
          6.44,
          3.36,
        )).toEqual({
          address: "Apapa", lat: 6.44, lng: 3.36,
        });
        expect(pickerValue(
          "Apa",
          0,
          0,
        )).toEqual({
          address: "", lat: 0, lng: 0,
        });
      },
    );
  },
);
