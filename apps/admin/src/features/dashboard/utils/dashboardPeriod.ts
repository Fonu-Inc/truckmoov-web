import type { DateInput } from "@truckmoov/app-core/utils/time-utils";
import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfYear,
  isWithinRange,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "@truckmoov/app-core/utils/time-utils";

/**
 * Report periods for dashboard KPI summaries — fleetflow's `lib/dashboardPeriod`.
 * Framework-free so it can be unit tested in isolation.
 */
export type DashboardPeriod
  = | "overall"
    | "today"
    | "yesterday"
    | "thisWeek"
    | "lastWeek"
    | "thisMonth"
    | "last6months"
    | "thisYear";

export const DASHBOARD_PERIOD_OPTIONS: {
  value: DashboardPeriod; label: string;
}[] = [
  {
    value: "overall", label: "Overall",
  },
  {
    value: "today", label: "Today",
  },
  {
    value: "yesterday", label: "Yesterday",
  },
  {
    value: "thisWeek", label: "This Week",
  },
  {
    value: "lastWeek", label: "Last Week",
  },
  {
    value: "thisMonth", label: "This Month",
  },
  {
    value: "last6months", label: "Last Six Months",
  },
  {
    value: "thisYear", label: "This Year",
  },
];

export const PERIOD_OPTIONS = DASHBOARD_PERIOD_OPTIONS;

/** Inclusive bounds of `period` relative to `now`; null for "overall". Weeks start Monday. */
export function periodRange(period: DashboardPeriod, now: Date = new Date()): {
  start: Date | null; end: Date | null;
} | null {
  switch (period) {
    case "overall":
      return null;
    case "today":
      return {
        start: startOfDay(now), end: endOfDay(now),
      };
    case "yesterday":
      return {
        start: startOfDay(subDays(
          now,
          1,
        )), end: endOfDay(subDays(
          now,
          1,
        )),
      };
    case "thisWeek":
      return {
        start: startOfWeek(now), end: endOfDay(addDays(
          startOfWeek(now),
          6,
        )),
      };
    case "lastWeek": {
      const start = subDays(
        startOfWeek(now),
        7,
      );
      return {
        start, end: endOfDay(addDays(
          start,
          6,
        )),
      };
    }
    case "thisMonth":
      return {
        start: startOfMonth(now), end: endOfMonth(now),
      };
    case "thisYear":
      return {
        start: startOfYear(now), end: endOfYear(now),
      };
    case "last6months":
      return {
        start: subMonths(
          now,
          6,
        ), end: endOfDay(now),
      };
  }
}

/**
 * Filters dates (or date-bearing items) to those inside the period, relative to
 * `now`. "overall" returns the input unchanged; unparseable dates are dropped.
 */
export function filterByPeriod<T>(
  items: T[],
  period: DashboardPeriod,
  now: Date = new Date(),
  getDate: (item: T) => DateInput = item => item as unknown as DateInput,
): T[] {
  const range = periodRange(
    period,
    now,
  );
  if (!range)
    return items;
  return items.filter(item => isWithinRange(
    getDate(item),
    range.start,
    range.end,
  ));
}

/** Whether a single timestamp falls inside the period. */
export function inPeriod(date: DateInput, period: DashboardPeriod, now: Date = new Date()): boolean {
  if (period === "overall")
    return true;
  return filterByPeriod(
    [date],
    period,
    now,
  ).length === 1;
}
