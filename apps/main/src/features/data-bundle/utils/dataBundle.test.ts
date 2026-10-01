import {
  expect, it, vi,
} from "vitest";
import {
  spendingTrend, toAnalyticsRange,
} from "./dataBundle";

vi.mock(
  "@truckmoov/api/auth",
  () => ({ getDataBundleRatesQueryOptions: vi.fn() }),
);

it(
  "analytics uses the selected dates and preserves actual spend",
  () => {
    const now = new Date(
      2026,
      9,
      1,
      12,
    );
    expect(toAnalyticsRange(
      "today",
      now,
    ).params).toEqual({
      range: "custom", startDate: "2026-10-01", endDate: "2026-10-01",
    });
    expect(toAnalyticsRange(
      "yesterday",
      now,
    ).params).toEqual({
      range: "custom", startDate: "2026-09-30", endDate: "2026-09-30",
    });
    for (const days of [
      7,
      30,
      90,
    ]) {
      expect(toAnalyticsRange(
        `${days}d`,
        now,
      ).params).toEqual({ range: `${days}d` });
      expect(spendingTrend(
        [],
        `${days}d`,
        now,
      )).toHaveLength(days);
    }
    expect(spendingTrend(
      [],
      "yesterday",
      now,
    )).toEqual([
      {
        day: "09-30", spend: 0,
      },
    ]);
    expect(spendingTrend(
      [],
      "today",
      now,
    )).toEqual([
      {
        day: "10-01", spend: 0,
      },
    ]);
    expect(spendingTrend(
      [
        {
          date: "2026-09-30", amount: 1700,
        },
      ],
      "7d",
      now,
    )).toEqual([
      {
        day: "09-30", spend: 1700,
      },
    ]);
  },
);
