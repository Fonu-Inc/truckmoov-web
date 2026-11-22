import type { PeriodRange } from "@/features/analytics/utils/period";

/** The Fleet Utilization tab's period select (the design app's header control). */
export type UtilizationPeriod = "this-week" | "last-week" | "this-month" | "last-month";

export const UTILIZATION_PERIOD_OPTIONS: {
  value: UtilizationPeriod; label: string;
}[] = [
  {
    value: "this-week", label: "This Week",
  },
  {
    value: "last-week", label: "Last Week",
  },
  {
    value: "this-month", label: "This Month",
  },
  {
    value: "last-month", label: "Last Month",
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
  );
}

function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0",
  );
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "16 Nov 2026" — the design app's period line format. */
export function formatPeriodDay(date: Date): string {
  return date.toLocaleDateString(
    "en-GB",
    {
      day: "numeric", month: "short", year: "numeric",
    },
  );
}

/** "16 Nov" — the trend chart's x-axis format. */
export function formatChartDay(date: Date): string {
  return date.toLocaleDateString(
    "en-GB",
    {
      day: "numeric", month: "short",
    },
  );
}

export type UtilizationWindow = {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  range: PeriodRange;
  previousRange: PeriodRange;
  /** Every day in the selected period, for the trend chart's x-axis. */
  days: Date[];
};

/**
 * The selected period (weeks run Monday–Sunday) and the preceding period of the
 * same length, which the KPI deltas and the trend chart compare against.
 */
export function utilizationWindow(period: UtilizationPeriod, now = new Date()): UtilizationWindow {
  const today = startOfDay(now);
  const mondayOffset = (today.getDay() + 6) % 7;
  const thisMonday = addDays(
    today,
    -mondayOffset,
  );
  let from: Date;
  let to: Date;
  switch (period) {
    case "last-week":
      from = addDays(
        thisMonday,
        -7,
      );
      to = addDays(
        thisMonday,
        -1,
      );
      break;
    case "this-month":
      from = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      to = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      );
      break;
    case "last-month":
      from = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1,
      );
      to = new Date(
        today.getFullYear(),
        today.getMonth(),
        0,
      );
      break;
    default:
      from = thisMonday;
      to = addDays(
        thisMonday,
        6,
      );
  }
  const length = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
  const previousTo = addDays(
    from,
    -1,
  );
  const previousFrom = addDays(
    previousTo,
    -(length - 1),
  );
  return {
    from,
    to,
    previousFrom,
    previousTo,
    range: {
      from: toIsoDay(from), to: toIsoDay(to),
    },
    previousRange: {
      from: toIsoDay(previousFrom), to: toIsoDay(previousTo),
    },
    days: Array.from(
      { length },
      (_, i) => addDays(
        from,
        i,
      ),
    ),
  };
}
