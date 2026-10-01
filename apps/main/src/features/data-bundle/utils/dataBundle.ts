import type { DataBundleAnalyticsRangeQuery } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import { getDataBundleRatesQueryOptions } from "@truckmoov/api/auth";
import {
  subDays, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  useEffect, useMemo, useState,
} from "react";

export const formatBundleSize = (mb: number) => mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;

export function formatDataUsedGb(gb: number) {
  return `${Number(gb || 0).toLocaleString(
    undefined,
    { maximumFractionDigits: 1 },
  )} GB`;
}

export function useDebouncedValue<T>(value: T, delay = 400) {
  const [
    debouncedValue,
    setDebouncedValue,
  ] = useState(value);

  useEffect(
    () => {
      const timer = window.setTimeout(
        setDebouncedValue,
        delay,
        value,
      );
      return () => window.clearTimeout(timer);
    },
    [
      value,
      delay,
    ],
  );

  return debouncedValue;
}

export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
];

export const RANGE_OPTIONS = [
  {
    value: "today", label: "Today", days: 1,
  },
  {
    value: "yesterday", label: "Yesterday", days: 2,
  },
  {
    value: "7d", label: "Last 7 days", days: 7,
  },
  {
    value: "30d", label: "Last 30 days", days: 30,
  },
  {
    value: "90d", label: "Last 90 days", days: 90,
  },
];

export function toAnalyticsRange(rangeKey: string, now = new Date()): DataBundleAnalyticsRangeQuery {
  if (rangeKey === "today" || rangeKey === "yesterday") {
    const date = toDateParam(rangeKey === "yesterday" ? subDays(
      now,
      1,
    ) : now);
    return {
      params: {
        range: "custom", startDate: date, endDate: date,
      },
    };
  }
  return { params: { range: rangeKey === "7d" || rangeKey === "90d" ? rangeKey : "30d" } };
}

export function spendingTrend(trend: {
  date: string; amount: number;
}[], range: string, now = new Date()) {
  if (trend.length) {
    return trend.map(point => ({
      day: point.date.slice(5), spend: point.amount,
    }));
  }
  const days = range === "yesterday" ? 1 : (RANGE_OPTIONS.find(option => option.value === range)?.days ?? 30);
  return Array.from(
    { length: days },
    (_, index) => ({
      day: toDateParam(subDays(
        now,
        range === "yesterday" ? 1 : days - index - 1,
      )).slice(5),
      spend: 0,
    }),
  );
}

/* ── Format a Nigerian mobile number into a human-readable form ── */
export function formatMobile(raw: string) {
  if (!raw)
    return "";
  const digits = raw.replace(
    /\D/g,
    "",
  );
  // Normalize 234XXXXXXXXXX -> 0XXXXXXXXXX
  const local = digits.startsWith("234") ? `0${digits.slice(3)}` : digits.startsWith("0") ? digits : `0${digits}`;
  if (local.length !== 11)
    return raw;
  return `${local.slice(
    0,
    4,
  )} ${local.slice(
    4,
    7,
  )} ${local.slice(7)}`;
}

export type AllocationRow = {
  id: string;
  msisdn: string;
  bundle_code: string;
  bundle: any;
  data_mb_total: number;
  data_mb_used: number;
  usage_percentage: number;
  status: string;
  expires_at: string;
  created_at: string;
  days_left: number;
};

export type CatalogItem = {
  id: string;
  code: string;
  name: string;
  carrier: string;
  data_mb: number;
  validity_days: number;
  price_ngn: number;
  billing_cycle: string;
  is_active: boolean;
};

export function useDataBundleCatalog() {
  const catalogQuery = useQuery(getDataBundleRatesQueryOptions({
    params: {
      page: 1, limit: 100,
    },
  }));
  const catalog = useMemo<CatalogItem[]>(
    () => (catalogQuery.data?.data.items ?? []).map(rate => ({
      id: rate.id,
      code: rate.code,
      name: rate.name,
      carrier: rate.carrier,
      data_mb: rate.dataAmountGb * 1024,
      validity_days: rate.validityDays,
      price_ngn: rate.price,
      billing_cycle: rate.billingCycle,
      is_active: rate.active,
    })),
    [catalogQuery.data],
  );
  return {
    catalog, catalogQuery,
  };
}
