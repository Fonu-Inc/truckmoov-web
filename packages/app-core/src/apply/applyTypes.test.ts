import {
  describe, expect, it,
} from "vitest";
import {
  documentFormatHint, ENTERPRISE_DOCUMENTS, pickupLocationLabel, verificationCodeError,
} from "./applyTypes";

describe(
  "pickupLocationLabel",
  () => {
    it(
      "shows (demo) once",
      () => {
        expect(pickupLocationLabel({
          name: "MTN Connect Store Ikeja (demo)", isDemo: true,
        })).toBe("MTN Connect Store Ikeja (demo)");
        expect(pickupLocationLabel({
          name: "MTN Connect Store Ikeja", isDemo: true,
        })).toBe("MTN Connect Store Ikeja (demo)");
        expect(pickupLocationLabel({
          name: "MTN Connect Store Ikeja", isDemo: false,
        })).toBe("MTN Connect Store Ikeja");
      },
    );
  },
);

describe(
  "verificationCodeError",
  () => {
    const invalid = {
      message: "The verification code is incorrect or has expired",
      statusCode: 400,
    };

    it(
      "names the channel and the real lifetime for the invalid-code answer",
      () => {
        const message = verificationCodeError(
          "phone",
          invalid,
          600,
        );
        expect(message).toContain("phone code");
        expect(message).toContain("10 minutes");
        expect(message).toContain("Resend code");
      },
    );

    it(
      "pluralises the lifetime and falls back to a few minutes",
      () => {
        expect(verificationCodeError("email", invalid, 60)).toContain("1 minute.");
        expect(verificationCodeError("email", invalid)).toContain("a few minutes");
      },
    );

    it(
      "keeps other messages the server sent on purpose",
      () => {
        expect(verificationCodeError("email", {
          message: "Too many incorrect attempts, request a new code",
          statusCode: 429,
        })).toBe("Too many incorrect attempts, request a new code");
      },
    );

    it(
      "does not call a network error or a 5xx an incorrect code",
      () => {
        const failed = "We couldn't check the code. Try again.";
        expect(verificationCodeError("email", {
          message: "Network Error", statusCode: 0,
        })).toBe(failed);
        expect(verificationCodeError("email", {
          message: "Request failed with status code 500", statusCode: 500,
        })).toBe(failed);
        expect(verificationCodeError("email", {})).toBe(failed);
      },
    );
  },
);

describe(
  "documentFormatHint",
  () => {
    it(
      "is PDF only just for the Customer Request Letter",
      () => {
        const [
          letter,
          ...others
        ] = ENTERPRISE_DOCUMENTS;
        expect(documentFormatHint(letter)).toContain("PDF only");
        for (const document of others)
          expect(documentFormatHint(document)).toContain("JPG");
      },
    );
  },
);
