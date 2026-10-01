import type { FleetProfitabilityVehicle } from "@truckmoov/api/fleet";
import type { PeriodValue } from "@/features/fleet/components/ui/PeriodFilter";
import {
  useEffect, useState,
} from "react";

export type ProfitabilityTierKey = "excellent" | "good" | "marginal" | "loss-making" | "unscored";

export const ORDERED_PROFITABILITY_TIERS: ProfitabilityTierKey[] = [
  "excellent",
  "good",
  "marginal",
  "loss-making",
  "unscored",
];

export const TIER_COLORS: Record<ProfitabilityTierKey, string> = {
  "excellent": "#22c55e",
  "good": "#3b82f6",
  "marginal": "#f59e0b",
  "loss-making": "#ef4444",
  "unscored": "#94a3b8",
};

export const TIER_LABELS: Record<ProfitabilityTierKey, string> = {
  "excellent": "Excellent",
  "good": "Good",
  "marginal": "Marginal",
  "loss-making": "Loss-Making",
  "unscored": "Unscored",
};

export type ProfitabilityAnalysisRow = {
  vehicle_id: string;
  plateNumber?: string;
  name?: string;
  make?: string | null;
  model?: string | null;
  period_start: string;
  period_end: string;
  revenue: {
    total: number;
    jobs_completed: number;
    total_km: number;
  };
  costs: {
    fuel: number;
    maintenance: number;
    wages: number;
    insurance: number;
    depreciation: number;
    other?: number;
    fixed?: number;
    total: number;
  };
  profitability: {
    net_profit: number;
    margin_percent: number;
    score: number | null;
    tier: string;
  };
};

export type VehicleLookup = {
  id: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
};

export function periodToMonths(period: PeriodValue) {
  const days = Number(period);
  if (days >= 365)
    return 12;
  if (days >= 180)
    return 6;
  if (days >= 90)
    return 3;
  return 1;
}

export function normalizeTier(tier: string | undefined): ProfitabilityTierKey {
  // API sends `loss_making`; the UI keys use `loss-making`.
  const normalized = tier?.toLowerCase().trim().replace(
    "_",
    "-",
  );
  if (normalized === "excellent" || normalized === "good" || normalized === "marginal" || normalized === "loss-making" || normalized === "unscored") {
    return normalized;
  }
  return "marginal";
}

export function formatPeriodLabel(period: PeriodValue) {
  if (period === "0")
    return "Today";
  if (period === "1")
    return "Yesterday";
  if (period === "180")
    return "Last 6 months";
  if (period === "365")
    return "Last year";
  return `Last ${period} days`;
}

export function optionalNumber(value: string) {
  if (value === "")
    return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

export function useDebouncedValue<T>(value: T, delay = 350) {
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

export function getFilenameFromDisposition(disposition: string | undefined, fallback: string) {
  const match = disposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  return match?.[1]
    ? decodeURIComponent(match[1].replace(
        /"/g,
        "",
      ))
    : fallback;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function normalizeProfitabilityRow(row: FleetProfitabilityVehicle): ProfitabilityAnalysisRow {
  return {
    vehicle_id: row.vehicleId,
    plateNumber: row.plateNumber,
    name: row.name,
    // The profitability payload carries only `name` — no separate make/model.
    make: undefined,
    model: undefined,
    period_start: "",
    period_end: "",
    revenue: {
      total: row.revenue ?? 0,
      jobs_completed: row.jobCount ?? 0,
      total_km: row.kmDriven ?? 0,
    },
    costs: {
      fuel: row.fuelCost ?? row.costBreakdown?.fuel ?? 0,
      maintenance: row.maintenanceCost ?? row.costBreakdown?.maintenance ?? 0,
      wages: row.costBreakdown?.wages ?? 0,
      insurance: row.costBreakdown?.insurance ?? 0,
      depreciation: row.costBreakdown?.depreciation ?? 0,
      other: row.costBreakdown?.other ?? 0,
      fixed: row.fixedCosts ?? 0,
      total: row.totalCost ?? 0,
    },
    profitability: {
      net_profit: row.profit ?? 0,
      margin_percent: row.marginPercent ?? 0,
      score: row.score ?? null,
      tier: normalizeTier(row.tier),
    },
  };
}
