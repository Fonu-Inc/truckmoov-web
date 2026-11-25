import {
  describe, expect, it,
} from "vitest";
import {
  formatWorkingHours, parseWorkingHours,
} from "./workingHours";

describe(
  "working hours",
  () => {
    it(
      "formats 24-hour times as a 12-hour range",
      () => {
        expect(formatWorkingHours({
          start: "08:00", end: "18:00",
        })).toBe("8:00 AM - 6:00 PM");
        expect(formatWorkingHours({
          start: "00:30", end: "12:05",
        })).toBe("12:30 AM - 12:05 PM");
      },
    );

    it(
      "reads typed ranges back",
      () => {
        expect(parseWorkingHours("8:00 AM - 6:00 PM")).toEqual({
          start: "08:00", end: "18:00",
        });
        expect(parseWorkingHours("8am to 6:30pm")).toEqual({
          start: "08:00", end: "18:30",
        });
        expect(parseWorkingHours("12:15 AM – 12 PM")).toEqual({
          start: "00:15", end: "12:00",
        });
      },
    );

    it(
      "round-trips",
      () => {
        const hours = {
          start: "07:45", end: "16:15",
        };
        expect(parseWorkingHours(formatWorkingHours(hours))).toEqual(hours);
      },
    );

    it(
      "rejects text that isn't a range",
      () => {
        expect(parseWorkingHours("")).toBeNull();
        expect(parseWorkingHours("8:00 - 18:00")).toBeNull();
        expect(parseWorkingHours("13 PM - 2 PM")).toBeNull();
      },
    );
  },
);
