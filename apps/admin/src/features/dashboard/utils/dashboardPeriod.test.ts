import {
  describe, expect, it,
} from "vitest";
import { filterByPeriod } from "@/features/dashboard/utils/dashboardPeriod";

describe(
  "filterByPeriod",
  () => {
    const overviewNow = new Date("2026-11-21T12:00:00");
    const overviewJobs = [
      {
        id: "current", created_at: "2026-11-16T00:00:00",
      },
      {
        id: "previous", created_at: "2026-11-15T23:59:59",
      },
      {
        id: "older", created_at: "2026-11-08T23:59:59",
      },
    ];

    it(
      "owner-Operator This Week counts only this week's jobs",
      () => {
        expect(filterByPeriod(
          overviewJobs,
          "thisWeek",
          overviewNow,
          j => j.created_at,
        ).map(j => j.id)).toEqual(["current"]);
      },
    );

    it(
      "owner-Operator Last Week counts only the previous week's jobs",
      () => {
        expect(filterByPeriod(
          overviewJobs,
          "lastWeek",
          overviewNow,
          j => j.created_at,
        ).map(j => j.id)).toEqual(["previous"]);
      },
    );

    it(
      "owner-Operator Overall restores all jobs",
      () => {
        expect(filterByPeriod(
          overviewJobs,
          "overall",
          overviewNow,
          j => j.created_at,
        )).toEqual(overviewJobs);
      },
    );

    const now = new Date("2024-06-15T12:00:00");

    it(
      "returns all items for 'overall'",
      () => {
        const items = [
          "2024-01-01",
          "2024-06-15",
          "2023-01-01",
        ];
        expect(filterByPeriod(
          items,
          "overall",
          now,
        )).toEqual(items);
      },
    );

    it(
      "filters to items occurring today",
      () => {
        const items = [
          new Date("2024-06-15T03:00:00"),
          new Date("2024-06-15T23:00:00"),
          new Date("2024-06-14T23:00:00"),
          new Date("2024-06-16T00:00:00"),
        ];
        const result = filterByPeriod(
          items,
          "today",
          now,
        );
        expect(result).toHaveLength(2);
      },
    );

    it(
      "filters to items occurring yesterday",
      () => {
        const items = [
          new Date("2024-06-14T05:00:00"),
          new Date("2024-06-14T23:59:00"),
          new Date("2024-06-15T00:00:01"),
          new Date("2024-06-13T23:59:59"),
        ];
        const result = filterByPeriod(
          items,
          "yesterday",
          now,
        );
        expect(result).toHaveLength(2);
      },
    );

    it(
      "filters to items within the last 6 months",
      () => {
        const items = [
          new Date("2024-06-01"),
          new Date("2024-01-01"),
          new Date("2023-11-01"),
          new Date("2022-01-01"),
        ];
        const result = filterByPeriod(
          items,
          "last6months",
          now,
        );
        expect(result).toEqual([
          new Date("2024-06-01"),
          new Date("2024-01-01"),
        ]);
      },
    );

    it(
      "filters to items within this week (Monday-start, full week)",
      () => {
        const items = [
          new Date("2024-06-10T00:00:00"), // Monday
          new Date("2024-06-16T12:00:00"), // Sunday
          new Date("2024-06-09T23:59:00"), // previous Sunday
          new Date("2024-06-17T00:00:00"), // next Monday
        ];
        expect(filterByPeriod(
          items,
          "thisWeek",
          now,
        )).toHaveLength(2);
      },
    );

    it(
      "filters to items within last week",
      () => {
        const items = [
          new Date("2024-06-03T06:00:00"), // Monday of last week
          new Date("2024-06-09T23:00:00"), // Sunday of last week
          new Date("2024-06-02T12:00:00"), // before last week
          new Date("2024-06-10T00:00:00"), // this week
        ];
        expect(filterByPeriod(
          items,
          "lastWeek",
          now,
        )).toHaveLength(2);
      },
    );

    it(
      "filters to items within this month (full month)",
      () => {
        const items = [
          new Date("2024-06-01T00:00:00"),
          new Date("2024-06-30T23:00:00"),
          new Date("2024-05-31T23:00:00"),
          new Date("2024-07-01T00:00:00"),
        ];
        expect(filterByPeriod(
          items,
          "thisMonth",
          now,
        )).toHaveLength(2);
      },
    );

    it(
      "filters to items within this year (full year)",
      () => {
        const items = [
          new Date("2024-01-01T00:00:00"),
          new Date("2024-12-31T23:00:00"),
          new Date("2023-12-31T23:00:00"),
          new Date("2025-01-01T00:00:00"),
        ];
        expect(filterByPeriod(
          items,
          "thisYear",
          now,
        )).toHaveLength(2);
      },
    );

    it(
      "supports a custom date accessor",
      () => {
        const items = [
          { occurredAt: "2024-06-15T08:00:00" },
          { occurredAt: "2024-01-01" },
        ];
        const result = filterByPeriod(
          items,
          "today",
          now,
          i => i.occurredAt,
        );
        expect(result).toHaveLength(1);
      },
    );

    it(
      "excludes invalid dates",
      () => {
        const items = [
          "not-a-date",
          "2024-06-15T08:00:00",
        ];
        const result = filterByPeriod(
          items,
          "today",
          now,
        );
        expect(result).toHaveLength(1);
      },
    );
  },
);
