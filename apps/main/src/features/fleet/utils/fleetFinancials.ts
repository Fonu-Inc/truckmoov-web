import type { FleetProfitabilityVehicle } from "@truckmoov/api/fleet";
import type { PeriodValue } from "@/features/fleet/components/ui/PeriodFilter";
import {
  useEffect, useState,
} from "react";

export type ProfitabilityTierKey = "excellent" | "good" | "marginal" | "loss-making";

export const ORDERED_PROFITABILITY_TIERS: ProfitabilityTierKey[] = [
  "excellent",
  "good",
  "marginal",
  "loss-making",
];

export const TIER_COLORS: Record<ProfitabilityTierKey, string> = {
  "excellent": "#22c55e",
  "good": "#3b82f6",
  "marginal": "#f59e0b",
  "loss-making": "#ef4444",
};

export const TIER_LABELS: Record<ProfitabilityTierKey, string> = {
  "excellent": "Excellent",
  "good": "Good",
  "marginal": "Marginal",
  "loss-making": "Loss-Making",
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
    score: number;
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
  if (normalized === "excellent" || normalized === "good" || normalized === "marginal" || normalized === "loss-making") {
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
      score: row.score ?? 0,
      tier: normalizeTier(row.tier),
    },
  };
}

// ── Dummy P&L rows (used when no real config has been computed) ──
export const DEMO_PL: ProfitabilityAnalysisRow[] = [
  {
    vehicle_id: "demo-1", period_start: "", period_end: "", revenue: {
      total: 4_850_000, jobs_completed: 38, total_km: 9_420,
    }, costs: {
      fuel: 1_180_000, maintenance: 320_000, wages: 980_000, insurance: 120_000, depreciation: 240_000, total: 2_840_000,
    }, profitability: {
      net_profit: 2_010_000, margin_percent: 41.4, score: 92, tier: "excellent",
    },
  },
  {
    vehicle_id: "demo-2", period_start: "", period_end: "", revenue: {
      total: 3_620_000, jobs_completed: 29, total_km: 7_810,
    }, costs: {
      fuel: 940_000, maintenance: 410_000, wages: 880_000, insurance: 120_000, depreciation: 240_000, total: 2_590_000,
    }, profitability: {
      net_profit: 1_030_000, margin_percent: 28.5, score: 78, tier: "good",
    },
  },
  {
    vehicle_id: "demo-3", period_start: "", period_end: "", revenue: {
      total: 2_980_000, jobs_completed: 24, total_km: 6_540,
    }, costs: {
      fuel: 880_000, maintenance: 360_000, wages: 820_000, insurance: 120_000, depreciation: 240_000, total: 2_420_000,
    }, profitability: {
      net_profit: 560_000, margin_percent: 18.8, score: 71, tier: "good",
    },
  },
  {
    vehicle_id: "demo-4", period_start: "", period_end: "", revenue: {
      total: 2_140_000, jobs_completed: 18, total_km: 5_120,
    }, costs: {
      fuel: 760_000, maintenance: 280_000, wages: 760_000, insurance: 120_000, depreciation: 240_000, total: 2_160_000,
    }, profitability: {
      net_profit: -20_000, margin_percent: -0.9, score: 48, tier: "marginal",
    },
  },
  {
    vehicle_id: "demo-5", period_start: "", period_end: "", revenue: {
      total: 1_780_000, jobs_completed: 14, total_km: 4_310,
    }, costs: {
      fuel: 690_000, maintenance: 520_000, wages: 720_000, insurance: 120_000, depreciation: 240_000, total: 2_290_000,
    }, profitability: {
      net_profit: -510_000, margin_percent: -28.7, score: 32, tier: "loss-making",
    },
  },
  {
    vehicle_id: "demo-6", period_start: "", period_end: "", revenue: {
      total: 4_120_000, jobs_completed: 33, total_km: 8_640,
    }, costs: {
      fuel: 1_020_000, maintenance: 290_000, wages: 920_000, insurance: 120_000, depreciation: 240_000, total: 2_590_000,
    }, profitability: {
      net_profit: 1_530_000, margin_percent: 37.1, score: 88, tier: "excellent",
    },
  },
  {
    vehicle_id: "demo-7", period_start: "", period_end: "", revenue: {
      total: 3_240_000, jobs_completed: 26, total_km: 7_120,
    }, costs: {
      fuel: 910_000, maintenance: 380_000, wages: 860_000, insurance: 120_000, depreciation: 240_000, total: 2_510_000,
    }, profitability: {
      net_profit: 730_000, margin_percent: 22.5, score: 74, tier: "good",
    },
  },
  {
    vehicle_id: "demo-8", period_start: "", period_end: "", revenue: {
      total: 1_540_000, jobs_completed: 12, total_km: 3_980,
    }, costs: {
      fuel: 640_000, maintenance: 460_000, wages: 700_000, insurance: 120_000, depreciation: 240_000, total: 2_160_000,
    }, profitability: {
      net_profit: -620_000, margin_percent: -40.3, score: 28, tier: "loss-making",
    },
  },
];

export const DEMO_NAMES: Record<string, string> = {
  "demo-1": "LAG-014-AB", "demo-2": "LAG-227-CD", "demo-3": "ABJ-118-EF",
  "demo-4": "LAG-303-GH", "demo-5": "PHC-441-JK", "demo-6": "LAG-552-LM",
  "demo-7": "ABJ-660-NP", "demo-8": "PHC-771-QR",
};
