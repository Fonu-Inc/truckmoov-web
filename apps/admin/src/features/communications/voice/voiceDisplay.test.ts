import {
  describe, expect, it,
} from "vitest";
import {
  barShare, formatDuration, languageName,
} from "./voiceDisplay";

describe(
  "formatDuration",
  () => {
    it(
      "reads seconds, minutes and hours",
      () => {
        expect(formatDuration(0)).toBe("0s");
        expect(formatDuration(75)).toBe("1m 15s");
        expect(formatDuration(3660)).toBe("1h 1m");
      },
    );
  },
);

describe(
  "barShare",
  () => {
    it(
      "scales to the busiest day and keeps a visible sliver for small counts",
      () => {
        expect(barShare(
          0,
          10,
        )).toBe(0);
        expect(barShare(
          10,
          10,
        )).toBe(100);
        expect(barShare(
          1,
          100,
        )).toBe(4);
        expect(barShare(
          5,
          0,
        )).toBe(0);
      },
    );
  },
);

describe(
  "languageName",
  () => {
    it(
      "falls back to the code for an unknown language",
      () => {
        expect(languageName("ha")).toBe("Hausa");
        expect(languageName("zz")).toBe("zz");
      },
    );
  },
);
