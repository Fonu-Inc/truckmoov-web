import type { DateInput } from "@truckmoov/app-core/utils/time-utils";
import type { ReportJob } from "@/features/reports/hooks/useReportsData";
import {
  atHour, endOfDay, formatWithPattern, isWithinRange, startOfDay, startOfMonth, subDays, subMonths,
} from "@truckmoov/app-core/utils/time-utils";
import { exportToCSV as exportRows } from "@/lib/exportTable";

// ─── Shared date-range options for trend charts ─────────────────────────────
export const TREND_RANGES = [
  {
    value: "today", label: "Today",
  },
  {
    value: "yesterday", label: "Yesterday",
  },
  {
    value: "last_week", label: "Last week",
  },
  {
    value: "last_month", label: "Last month",
  },
  {
    value: "last_year", label: "Last year",
  },
] as const;

export type TrendRange = (typeof TREND_RANGES)[number]["value"];

/** Build a created-vs-completed trend series for the selected date range. */
export function buildTrend(jobs: ReportJob[], range: TrendRange) {
  const now = new Date();
  const countIn = (from: DateInput, to: DateInput) => ({
    created: jobs.filter(j => j.createdAt && isWithinRange(
      j.createdAt,
      from,
      to,
    )).length,
    completed: jobs.filter(j => [
      "completed",
      "delivered",
    ].includes(j.status) && j.updatedAt
    && isWithinRange(
      j.updatedAt,
      from,
      to,
    )).length,
  });

  if (range === "today" || range === "yesterday") {
    const day = range === "today" ? now : (subDays(
      now,
      1,
    ) ?? now);
    return Array.from(
      { length: 8 },
      (_, i) => {
        const hour = 8 + i * 2;
        const from = atHour(
          day,
          hour,
        );
        const to = atHour(
          day,
          hour + 2,
          true,
        );
        return {
          label: `${hour}:00`, ...countIn(
            from,
            to,
          ),
        };
      },
    );
  }
  if (range === "last_week") {
    return Array.from(
      { length: 7 },
      (_, i) => {
        const day = subDays(
          now,
          6 - i,
        );
        return {
          label: formatWithPattern(
            day,
            "EEE",
          ), ...countIn(
            startOfDay(day),
            endOfDay(day),
          ),
        };
      },
    );
  }
  if (range === "last_month") {
    return Array.from(
      { length: 4 },
      (_, i) => {
        const to = endOfDay(subDays(
          now,
          (3 - i) * 7,
        ));
        const from = startOfDay(subDays(
          to,
          6,
        ));
        return {
          label: `${formatWithPattern(
            from,
            "dd MMM",
          )}`, ...countIn(
            from,
            to,
          ),
        };
      },
    );
  }
  return Array.from(
    { length: 12 },
    (_, i) => {
      const month = subMonths(
        now,
        11 - i,
      );
      const from = startOfMonth(month);
      const to = endOfDay(subDays(
        startOfMonth(subMonths(
          month,
          -1,
        )),
        1,
      ));
      return {
        label: formatWithPattern(
          month,
          "MMM",
        ), ...countIn(
          from,
          to,
        ),
      };
    },
  );
}

// ─── CSV helper ─────────────────────────────────────────────────────────────
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  exportRows(
    rows,
    headers.map((header, index) => ({
      header, accessor: row => row[index],
    })),
    filename,
  );
}
