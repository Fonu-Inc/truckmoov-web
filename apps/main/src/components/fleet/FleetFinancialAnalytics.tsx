import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Progress } from "@/components/shadcn/progress";
import { Input } from "@/components/shadcn/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Label } from "@/components/shadcn/label";
import { Checkbox } from "@/components/shadcn/checkbox";
import { ExportButton } from "@/components/shadcn/export-button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Fuel, 
  Wrench, 
  Users, 
  Shield,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Search,
  SlidersHorizontal,
  FileText,
  Truck,
  Download,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  exportFleetCostBreakdown,
  useFleetFinancialSummary,
  useFleetProfitability,
  type FleetProfitabilityVehicle,
} from "@truckmoov/api/fleet";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/shadcn/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { VehicleFinancialConfigDialog } from "./VehicleFinancialConfigDialog";
import { VehiclePLStatementBuilder } from "./VehiclePLStatementBuilder";
import { PeriodFilter, PeriodValue } from "./PeriodFilter";

type ProfitabilityTierKey = "excellent" | "good" | "marginal" | "loss-making";

const ORDERED_PROFITABILITY_TIERS: ProfitabilityTierKey[] = ["excellent", "good", "marginal", "loss-making"];

const TIER_COLORS: Record<ProfitabilityTierKey, string> = {
  excellent: "#22c55e",
  good: "#3b82f6",
  marginal: "#f59e0b",
  "loss-making": "#ef4444",
};

const TIER_LABELS: Record<ProfitabilityTierKey, string> = {
  excellent: "Excellent",
  good: "Good",
  marginal: "Marginal",
  "loss-making": "Loss-Making",
};

type ProfitabilityAnalysisRow = {
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

type VehicleLookup = {
  id: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
};

function periodToMonths(period: PeriodValue) {
  const days = Number(period);
  if (days >= 365) return 12;
  if (days >= 180) return 6;
  if (days >= 90) return 3;
  return 1;
}

function normalizeTier(tier: string | undefined): ProfitabilityTierKey {
  const normalized = tier?.toLowerCase().trim();
  if (normalized === "excellent" || normalized === "good" || normalized === "marginal" || normalized === "loss-making") {
    return normalized;
  }
  return "marginal";
}

function formatPeriodLabel(period: PeriodValue) {
  if (period === "0") return "Today";
  if (period === "1") return "Yesterday";
  if (period === "180") return "Last 6 months";
  if (period === "365") return "Last year";
  return `Last ${period} days`;
}

function optionalNumber(value: string) {
  if (value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function getFilenameFromDisposition(disposition: string | undefined, fallback: string) {
  const match = disposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  return match?.[1] ? decodeURIComponent(match[1].replace(/"/g, "")) : fallback;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeProfitabilityRow(row: FleetProfitabilityVehicle): ProfitabilityAnalysisRow {
  return {
    vehicle_id: row.vehicleId,
    plateNumber: row.plateNumber,
    name: row.name,
    make: row.make,
    model: row.model,
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
      tier: row.tier ?? "marginal",
    },
  };
}

export function FleetFinancialAnalytics() {
  const vehicles: VehicleLookup[] = [];
  const { format } = useCurrency();
  const { data: financialSummaryResp } = useFleetFinancialSummary();
  
  const [period, setPeriod] = useState<PeriodValue>("30");
  const [profitabilityPeriod, setProfitabilityPeriod] = useState<PeriodValue>("30");
  const [costBreakdownPeriod, setCostBreakdownPeriod] = useState<PeriodValue>("30");
  const [underperformingPeriod, setUnderperformingPeriod] = useState<PeriodValue>("30");
  const profitabilityPayload = useMemo(() => ({
    data: {
      periodMonths: periodToMonths(profitabilityPeriod),
    },
  }), [profitabilityPeriod]);
  const {
    data: profitabilityResp,
    isFetching: isProfitabilityFetching,
  } = useFleetProfitability(profitabilityPayload);
  const profitabilityData = useMemo(
    () => (profitabilityResp?.data ?? []).map(normalizeProfitabilityRow),
    [profitabilityResp?.data],
  );
  const costBreakdownPayload = useMemo(() => ({
    data: {
      periodMonths: periodToMonths(costBreakdownPeriod),
    },
  }), [costBreakdownPeriod]);
  const {
    data: costBreakdownResp,
    isFetching: isCostBreakdownFetching,
  } = useFleetProfitability(costBreakdownPayload);
  const costBreakdownData = useMemo(
    () => (costBreakdownResp?.data ?? []).map(normalizeProfitabilityRow),
    [costBreakdownResp?.data],
  );
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [statementBuilderOpen, setStatementBuilderOpen] = useState(false);
  const [isExportingCostBreakdown, setIsExportingCostBreakdown] = useState(false);

  // Vehicle P&L filters
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string>("all");
  const [vehicleFilterOpen, setVehicleFilterOpen] = useState(false);
  const [marginFilterEnabled, setMarginFilterEnabled] = useState(false);
  const [draftMarginFilterEnabled, setDraftMarginFilterEnabled] = useState(false);
  const [marginMin, setMarginMin] = useState("");
  const [marginMax, setMarginMax] = useState("");
  const [draftMarginMin, setDraftMarginMin] = useState("");
  const [draftMarginMax, setDraftMarginMax] = useState("");
  const [revenueFilterEnabled, setRevenueFilterEnabled] = useState(false);
  const [draftRevenueFilterEnabled, setDraftRevenueFilterEnabled] = useState(false);
  const [revenueMin, setRevenueMin] = useState("");
  const [revenueMax, setRevenueMax] = useState("");
  const [draftRevenueMin, setDraftRevenueMin] = useState("");
  const [draftRevenueMax, setDraftRevenueMax] = useState("");
  const [profitFilterEnabled, setProfitFilterEnabled] = useState(false);
  const [draftProfitFilterEnabled, setDraftProfitFilterEnabled] = useState(false);
  const [profitMin, setProfitMin] = useState("");
  const [profitMax, setProfitMax] = useState("");
  const [draftProfitMin, setDraftProfitMin] = useState("");
  const [draftProfitMax, setDraftProfitMax] = useState("");
  const [scoreFilterEnabled, setScoreFilterEnabled] = useState(false);
  const [draftScoreFilterEnabled, setDraftScoreFilterEnabled] = useState(false);
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [draftScoreMin, setDraftScoreMin] = useState("");
  const [draftScoreMax, setDraftScoreMax] = useState("");
  const debouncedVehicleSearch = useDebouncedValue(vehicleSearch.trim());
  const debouncedVehicleFilters = useDebouncedValue({
    status: vehicleStatusFilter,
    marginFilterEnabled,
    marginMin,
    marginMax,
    revenueFilterEnabled,
    revenueMin,
    revenueMax,
    profitFilterEnabled,
    profitMin,
    profitMax,
    scoreFilterEnabled,
    scoreMin,
    scoreMax,
  });
  const vehicleProfitabilityPayload = useMemo(() => ({
    data: {
      periodMonths: periodToMonths(profitabilityPeriod),
      search: debouncedVehicleSearch || undefined,
      status: debouncedVehicleFilters.status === "all" ? undefined : debouncedVehicleFilters.status,
      marginFrom: debouncedVehicleFilters.marginFilterEnabled ? optionalNumber(debouncedVehicleFilters.marginMin) : undefined,
      marginTo: debouncedVehicleFilters.marginFilterEnabled ? optionalNumber(debouncedVehicleFilters.marginMax) : undefined,
      revenueFrom: debouncedVehicleFilters.revenueFilterEnabled ? optionalNumber(debouncedVehicleFilters.revenueMin) : undefined,
      revenueTo: debouncedVehicleFilters.revenueFilterEnabled ? optionalNumber(debouncedVehicleFilters.revenueMax) : undefined,
      netProfitFrom: debouncedVehicleFilters.profitFilterEnabled ? optionalNumber(debouncedVehicleFilters.profitMin) : undefined,
      netProfitTo: debouncedVehicleFilters.profitFilterEnabled ? optionalNumber(debouncedVehicleFilters.profitMax) : undefined,
      scoreFrom: debouncedVehicleFilters.scoreFilterEnabled ? optionalNumber(debouncedVehicleFilters.scoreMin) : undefined,
      scoreTo: debouncedVehicleFilters.scoreFilterEnabled ? optionalNumber(debouncedVehicleFilters.scoreMax) : undefined,
    },
  }), [
    profitabilityPeriod,
    debouncedVehicleSearch,
    debouncedVehicleFilters,
  ]);
  const {
    data: vehicleProfitabilityResp,
    isFetching: isVehicleProfitabilityFetching,
  } = useFleetProfitability(vehicleProfitabilityPayload);
  const vehicleProfitabilityData = useMemo(
    () => (vehicleProfitabilityResp?.data ?? []).map(normalizeProfitabilityRow),
    [vehicleProfitabilityResp?.data],
  );
  const underperformingPayload = useMemo(() => ({
    data: {
      periodMonths: periodToMonths(underperformingPeriod),
    },
  }), [underperformingPeriod]);
  const {
    data: underperformingResp,
    isFetching: isUnderperformingFetching,
  } = useFleetProfitability(underperformingPayload);
  const underperformingData = useMemo(
    () => (underperformingResp?.data ?? []).map(normalizeProfitabilityRow),
    [underperformingResp?.data],
  );
  const isCalculating = isProfitabilityFetching || isVehicleProfitabilityFetching || isCostBreakdownFetching || isUnderperformingFetching;

  // Detailed Cost Analysis filters
  const [costSearch, setCostSearch] = useState("");
  
  const [costFilterOpen, setCostFilterOpen] = useState(false);
  const [costTotalEnabled, setCostTotalEnabled] = useState(false);
  const [costTotalMin, setCostTotalMin] = useState("");
  const [costTotalMax, setCostTotalMax] = useState("");
  const [draftCostTotalEnabled, setDraftCostTotalEnabled] = useState(false);
  const [draftCostTotalMin, setDraftCostTotalMin] = useState("");
  const [draftCostTotalMax, setDraftCostTotalMax] = useState("");
  const [costFuelEnabled, setCostFuelEnabled] = useState(false);
  const [costFuelMin, setCostFuelMin] = useState("");
  const [costFuelMax, setCostFuelMax] = useState("");
  const [draftCostFuelEnabled, setDraftCostFuelEnabled] = useState(false);
  const [draftCostFuelMin, setDraftCostFuelMin] = useState("");
  const [draftCostFuelMax, setDraftCostFuelMax] = useState("");
  const [costWagesEnabled, setCostWagesEnabled] = useState(false);
  const [costWagesMin, setCostWagesMin] = useState("");
  const [costWagesMax, setCostWagesMax] = useState("");
  const [draftCostWagesEnabled, setDraftCostWagesEnabled] = useState(false);
  const [draftCostWagesMin, setDraftCostWagesMin] = useState("");
  const [draftCostWagesMax, setDraftCostWagesMax] = useState("");
  const [costMaintEnabled, setCostMaintEnabled] = useState(false);
  const [costMaintMin, setCostMaintMin] = useState("");
  const [costMaintMax, setCostMaintMax] = useState("");
  const [draftCostMaintEnabled, setDraftCostMaintEnabled] = useState(false);
  const [draftCostMaintMin, setDraftCostMaintMin] = useState("");
  const [draftCostMaintMax, setDraftCostMaintMax] = useState("");

  // Calculate fleet totals
  const fleetTotals = profitabilityData.reduce((acc, v) => ({
    totalRevenue: acc.totalRevenue + (v.revenue?.total || 0),
    totalCosts: acc.totalCosts + (v.costs?.total || 0),
    totalProfit: acc.totalProfit + (v.profitability?.net_profit || 0),
    jobsCompleted: acc.jobsCompleted + (v.revenue?.jobs_completed || 0),
    totalKm: acc.totalKm + (v.revenue?.total_km || 0),
  }), { totalRevenue: 0, totalCosts: 0, totalProfit: 0, jobsCompleted: 0, totalKm: 0 });

  const fleetMargin = fleetTotals.totalRevenue > 0 
    ? (fleetTotals.totalProfit / fleetTotals.totalRevenue) * 100 
    : 0;
  const tierDistribution = profitabilityData.reduce((acc, v) => {
    const tier = normalizeTier(v.profitability?.tier);
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<ProfitabilityTierKey, number>);

  const profitabilityDistributionData = ORDERED_PROFITABILITY_TIERS.map((tier) => ({
    tier,
    name: TIER_LABELS[tier],
    label: `${TIER_LABELS[tier]}: ${tierDistribution[tier] ?? 0}`,
    value: tierDistribution[tier] ?? 0,
    fill: TIER_COLORS[tier],
  })).filter((entry) => entry.value > 0);

  const profitabilityDistributionTotal = profitabilityDistributionData.reduce((total, item) => total + item.value, 0);
  const hasProfitabilityDistribution = profitabilityDistributionTotal > 0;

  const profitabilityDistributionLegend = ORDERED_PROFITABILITY_TIERS.map((tier) => ({
    tier,
    name: TIER_LABELS[tier],
    value: tierDistribution[tier] ?? 0,
    fill: TIER_COLORS[tier],
  }));

  // Cost breakdown for bar chart
  const costBreakdown = costBreakdownData.reduce((acc, v) => {
    acc.fuel += v.costs?.fuel || 0;
    acc.maintenance += v.costs?.maintenance || 0;
    acc.wages += v.costs?.wages || 0;
    acc.insurance += v.costs?.insurance || 0;
    acc.depreciation += v.costs?.depreciation || 0;
    return acc;
  }, { fuel: 0, maintenance: 0, wages: 0, insurance: 0, depreciation: 0 });

  const costChartData = [
    { name: "Fuel", value: costBreakdown.fuel, fill: "#f59e0b" },
    { name: "Maintenance", value: costBreakdown.maintenance, fill: "#3b82f6" },
    { name: "Wages", value: costBreakdown.wages, fill: "#8b5cf6" },
    { name: "Insurance", value: costBreakdown.insurance, fill: "#22c55e" },
    { name: "Depreciation", value: costBreakdown.depreciation, fill: "#64748b" },
  ];

  const costChartDataVisible = costChartData.filter((item) => item.value > 0);
  const hasCostBreakdownData = costChartDataVisible.length > 0;

  const chartConfig = {
    fuel: { label: "Fuel", color: "#f59e0b" },
    maintenance: { label: "Maintenance", color: "#3b82f6" },
    wages: { label: "Wages", color: "#8b5cf6" },
    insurance: { label: "Insurance", color: "#22c55e" },
    depreciation: { label: "Depreciation", color: "#64748b" },
  };

  // ── Dummy P&L rows (used when no real config has been computed) ──
  const DEMO_PL: ProfitabilityAnalysisRow[] = [
    { vehicle_id: "demo-1", period_start: "", period_end: "", revenue: { total: 4_850_000, jobs_completed: 38, total_km: 9_420 }, costs: { fuel: 1_180_000, maintenance: 320_000, wages: 980_000, insurance: 120_000, depreciation: 240_000, total: 2_840_000 }, profitability: { net_profit: 2_010_000, margin_percent: 41.4, score: 92, tier: "excellent" } },
    { vehicle_id: "demo-2", period_start: "", period_end: "", revenue: { total: 3_620_000, jobs_completed: 29, total_km: 7_810 }, costs: { fuel: 940_000, maintenance: 410_000, wages: 880_000, insurance: 120_000, depreciation: 240_000, total: 2_590_000 }, profitability: { net_profit: 1_030_000, margin_percent: 28.5, score: 78, tier: "good" } },
    { vehicle_id: "demo-3", period_start: "", period_end: "", revenue: { total: 2_980_000, jobs_completed: 24, total_km: 6_540 }, costs: { fuel: 880_000, maintenance: 360_000, wages: 820_000, insurance: 120_000, depreciation: 240_000, total: 2_420_000 }, profitability: { net_profit: 560_000, margin_percent: 18.8, score: 71, tier: "good" } },
    { vehicle_id: "demo-4", period_start: "", period_end: "", revenue: { total: 2_140_000, jobs_completed: 18, total_km: 5_120 }, costs: { fuel: 760_000, maintenance: 280_000, wages: 760_000, insurance: 120_000, depreciation: 240_000, total: 2_160_000 }, profitability: { net_profit: -20_000, margin_percent: -0.9, score: 48, tier: "marginal" } },
    { vehicle_id: "demo-5", period_start: "", period_end: "", revenue: { total: 1_780_000, jobs_completed: 14, total_km: 4_310 }, costs: { fuel: 690_000, maintenance: 520_000, wages: 720_000, insurance: 120_000, depreciation: 240_000, total: 2_290_000 }, profitability: { net_profit: -510_000, margin_percent: -28.7, score: 32, tier: "loss-making" } },
    { vehicle_id: "demo-6", period_start: "", period_end: "", revenue: { total: 4_120_000, jobs_completed: 33, total_km: 8_640 }, costs: { fuel: 1_020_000, maintenance: 290_000, wages: 920_000, insurance: 120_000, depreciation: 240_000, total: 2_590_000 }, profitability: { net_profit: 1_530_000, margin_percent: 37.1, score: 88, tier: "excellent" } },
    { vehicle_id: "demo-7", period_start: "", period_end: "", revenue: { total: 3_240_000, jobs_completed: 26, total_km: 7_120 }, costs: { fuel: 910_000, maintenance: 380_000, wages: 860_000, insurance: 120_000, depreciation: 240_000, total: 2_510_000 }, profitability: { net_profit: 730_000, margin_percent: 22.5, score: 74, tier: "good" } },
    { vehicle_id: "demo-8", period_start: "", period_end: "", revenue: { total: 1_540_000, jobs_completed: 12, total_km: 3_980 }, costs: { fuel: 640_000, maintenance: 460_000, wages: 700_000, insurance: 120_000, depreciation: 240_000, total: 2_160_000 }, profitability: { net_profit: -620_000, margin_percent: -40.3, score: 28, tier: "loss-making" } },
  ];
  const DEMO_NAMES: Record<string, string> = {
    "demo-1": "LAG-014-AB", "demo-2": "LAG-227-CD", "demo-3": "ABJ-118-EF",
    "demo-4": "LAG-303-GH", "demo-5": "PHC-441-JK", "demo-6": "LAG-552-LM",
    "demo-7": "ABJ-660-NP", "demo-8": "PHC-771-QR",
  };
  const displayData: ProfitabilityAnalysisRow[] = profitabilityData.length > 0 ? profitabilityData : DEMO_PL;
  const vehicleTableData: ProfitabilityAnalysisRow[] = vehicleProfitabilityData;
  const displayTotals = displayData.reduce((acc, v) => ({
    totalRevenue: acc.totalRevenue + (v.revenue?.total || 0),
    totalCosts: acc.totalCosts + (v.costs?.total || 0),
    totalProfit: acc.totalProfit + (v.profitability?.net_profit || 0),
  }), { totalRevenue: 0, totalCosts: 0, totalProfit: 0 });
  const displayMargin = displayTotals.totalRevenue > 0
    ? (displayTotals.totalProfit / displayTotals.totalRevenue) * 100
    : 0;
  const financialSummary = financialSummaryResp?.data;
  const profitabilityVehicleNames = useMemo(
    () => Object.fromEntries(
      [...profitabilityData, ...vehicleProfitabilityData, ...underperformingData].map((item) => [
        item.vehicle_id,
        item.name || item.plateNumber,
      ]),
    ),
    [profitabilityData, vehicleProfitabilityData, underperformingData],
  );
  const hasFinancialSummaryValues = Boolean(
    financialSummary &&
    (
      financialSummary.totalRevenue !== 0 ||
      financialSummary.totalCost !== 0 ||
      financialSummary.totalProfit !== 0 ||
      financialSummary.avgMarginPercent !== 0
    )
  );
  const summaryStats = hasFinancialSummaryValues ? {
    totalRevenue: financialSummary!.totalRevenue,
    totalCost: financialSummary!.totalCost,
    totalProfit: financialSummary!.totalProfit,
    avgMarginPercent: financialSummary!.avgMarginPercent,
    vehicleCount: financialSummary!.vehicleCount,
  } : {
    totalRevenue: displayTotals.totalRevenue || fleetTotals.totalRevenue,
    totalCost: displayTotals.totalCosts || fleetTotals.totalCosts,
    totalProfit: displayTotals.totalProfit || fleetTotals.totalProfit,
    avgMarginPercent: displayMargin || fleetMargin,
    vehicleCount: financialSummary?.vehicleCount ?? displayData.length,
  };

  // Identify underperforming vehicles
  const underperformingSource = underperformingResp ? underperformingData : displayData;
  const underperformingVehicles = underperformingSource
    .filter(v => v.profitability?.tier === 'loss-making' || v.profitability?.tier === 'marginal')
    .sort((a, b) => (a.profitability?.net_profit || 0) - (b.profitability?.net_profit || 0));

  const getVehicleName = (vehicleId: string) => {
    if (DEMO_NAMES[vehicleId]) return DEMO_NAMES[vehicleId];
    if (profitabilityVehicleNames[vehicleId]) return profitabilityVehicleNames[vehicleId];
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.registrationNumber || vehicleId.slice(0, 8);
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      excellent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      good: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      marginal: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "loss-making": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <Badge className={colors[tier] || colors.marginal}>
        {TIER_LABELS[normalizeTier(tier)] || tier}
      </Badge>
    );
  };

  const handleExportCostBreakdown = async () => {
    setIsExportingCostBreakdown(true);
    try {
      const result = await exportFleetCostBreakdown();
      const filename = getFilenameFromDisposition(result.contentDisposition, "vehicle-cost-analysis.csv");
      downloadBlob(new Blob([result.blob], { type: result.contentType || "text/csv" }), filename);
    } finally {
      setIsExportingCostBreakdown(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{format(summaryStats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Total Revenue · {summaryStats.vehicleCount} vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{format(summaryStats.totalCost)}</p>
                <p className="text-xs text-muted-foreground">Total Costs · Fleet total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${summaryStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {format(summaryStats.totalProfit)}
                </p>
                <p className="text-xs text-muted-foreground">Net Profit · {summaryStats.avgMarginPercent.toFixed(1)}% avg margin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Truck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {summaryStats.vehicleCount}
                </p>
                <p className="text-xs text-muted-foreground">Vehicles · In summary</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="inline-flex w-auto justify-start gap-1 p-1">
          <TabsTrigger value="overview" className="px-3">Overview</TabsTrigger>
          <TabsTrigger value="vehicles" className="px-3">Vehicle P&L</TabsTrigger>
          <TabsTrigger value="costs" className="px-3">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="underperforming" className="px-3">Underperforming</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profitability Distribution */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-lg">Profitability Distribution</CardTitle>
                  <CardDescription>
                    Vehicle count by profitability tier · {formatPeriodLabel(profitabilityPeriod)}
                  </CardDescription>
                </div>
                <PeriodFilter value={profitabilityPeriod} onChange={setProfitabilityPeriod} variant="short" className="w-[150px]" />
              </CardHeader>
              <CardContent>
                {isProfitabilityFetching ? (
                  <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                    Calculating profitability distribution...
                  </div>
                ) : hasProfitabilityDistribution ? (
                  <div className="space-y-3">
                    <ChartContainer config={chartConfig} className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={profitabilityDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={86}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                            label={({ payload }) => payload.label}
                          >
                            {profitabilityDistributionData.map((entry) => (
                              <Cell key={entry.tier} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
                      {profitabilityDistributionLegend.map((entry) => (
                        <div key={entry.tier} className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: entry.fill }} />
                          <span>{entry.name}</span>
                          <span className="text-muted-foreground">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[250px] flex-col items-center justify-center text-center">
                    <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No profitability data</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      No vehicles were returned for {formatPeriodLabel(profitabilityPeriod).toLowerCase()}.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                  <CardDescription>
                    Total costs by category · {formatPeriodLabel(costBreakdownPeriod)}
                  </CardDescription>
                </div>
                <PeriodFilter value={costBreakdownPeriod} onChange={setCostBreakdownPeriod} variant="short" className="w-[150px]" />
              </CardHeader>
              <CardContent>
                {isCostBreakdownFetching ? (
                  <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                    Calculating cost breakdown...
                  </div>
                ) : hasCostBreakdownData ? (
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costChartDataVisible} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" width={80} />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value) => format(Number(value))}
                        />
                        <Bar dataKey="value" radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[250px] flex-col items-center justify-center text-center">
                    <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No cost data</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      No vehicle costs were returned for {formatPeriodLabel(costBreakdownPeriod).toLowerCase()}.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Fuel className="h-4 w-4" /> Fuel
              </div>
              <div className="font-semibold">{format(costBreakdown.fuel)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Wrench className="h-4 w-4" /> Maintenance
              </div>
              <div className="font-semibold">{format(costBreakdown.maintenance)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="h-4 w-4" /> Wages
              </div>
              <div className="font-semibold">{format(costBreakdown.wages)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Shield className="h-4 w-4" /> Insurance
              </div>
              <div className="font-semibold">{format(costBreakdown.insurance)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" /> Depreciation
              </div>
              <div className="font-semibold">{format(costBreakdown.depreciation)}</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          {/* Action buttons — outside the table card, top-right */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStatementBuilderOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Statement
            </Button>
            <Button onClick={() => setConfigDialogOpen(true)}>
              Configure Costs
            </Button>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Vehicle Profit & Loss</CardTitle>
                  <CardDescription>Individual vehicle financial performance</CardDescription>
                </div>
                <ExportButton
                  rows={vehicleTableData}
                  columns={[
                    { header: "Vehicle", accessor: (r) => getVehicleName(r.vehicle_id) },
                    { header: "Revenue", accessor: (r) => r.revenue?.total ?? 0 },
                    { header: "Costs", accessor: (r) => r.costs?.total ?? 0 },
                    { header: "Net Profit", accessor: (r) => r.profitability?.net_profit ?? 0 },
                    { header: "Margin %", accessor: (r) => (r.profitability?.margin_percent ?? 0).toFixed(1) },
                    { header: "Status", accessor: (r) => r.profitability?.tier ?? "marginal" },
                    { header: "Score", accessor: (r) => r.profitability?.score ?? 0 },
                  ]}
                  filename="vehicle-profit-and-loss"
                />
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by vehicle..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={vehicleStatusFilter} onValueChange={setVehicleStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="marginal">Marginal</SelectItem>
                    <SelectItem value="loss-making">Loss-Making</SelectItem>
                  </SelectContent>
                </Select>
                <Popover
                  open={vehicleFilterOpen}
                  onOpenChange={(open) => {
                    if (open) {
                      setDraftMarginFilterEnabled(marginFilterEnabled);
                      setDraftMarginMin(marginMin);
                      setDraftMarginMax(marginMax);
                      setDraftRevenueFilterEnabled(revenueFilterEnabled);
                      setDraftRevenueMin(revenueMin);
                      setDraftRevenueMax(revenueMax);
                      setDraftProfitFilterEnabled(profitFilterEnabled);
                      setDraftProfitMin(profitMin);
                      setDraftProfitMax(profitMax);
                      setDraftScoreFilterEnabled(scoreFilterEnabled);
                      setDraftScoreMin(scoreMin);
                      setDraftScoreMax(scoreMax);
                    }
                    setVehicleFilterOpen(open);
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="relative">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filter
                      {(marginFilterEnabled || revenueFilterEnabled || profitFilterEnabled || scoreFilterEnabled) && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                          {[marginFilterEnabled, revenueFilterEnabled, profitFilterEnabled, scoreFilterEnabled].filter(Boolean).length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 space-y-4 max-h-[70vh] overflow-y-auto">
                    <Label className="text-sm font-semibold">Show Vehicles</Label>

                    {[
                      { id: "vpl-margin", label: "Margin %", enabled: draftMarginFilterEnabled, setEnabled: setDraftMarginFilterEnabled, min: draftMarginMin, setMin: setDraftMarginMin, max: draftMarginMax, setMax: setDraftMarginMax },
                      { id: "vpl-revenue", label: "Revenue (₦)", enabled: draftRevenueFilterEnabled, setEnabled: setDraftRevenueFilterEnabled, min: draftRevenueMin, setMin: setDraftRevenueMin, max: draftRevenueMax, setMax: setDraftRevenueMax },
                      { id: "vpl-profit", label: "Net Profit (₦)", enabled: draftProfitFilterEnabled, setEnabled: setDraftProfitFilterEnabled, min: draftProfitMin, setMin: setDraftProfitMin, max: draftProfitMax, setMax: setDraftProfitMax },
                      { id: "vpl-score", label: "Score (0–100)", enabled: draftScoreFilterEnabled, setEnabled: setDraftScoreFilterEnabled, min: draftScoreMin, setMin: setDraftScoreMin, max: draftScoreMax, setMax: setDraftScoreMax },
                    ].map((f) => (
                      <div key={f.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={f.id}
                            checked={f.enabled}
                            onCheckedChange={(c) => f.setEnabled(c === true)}
                          />
                          <Label htmlFor={f.id} className="text-xs cursor-pointer">{f.label}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            value={f.min}
                            onChange={(e) => f.setMin(e.target.value)}
                            disabled={!f.enabled}
                            className="h-9"
                          />
                          <span className="text-xs text-muted-foreground">to</span>
                          <Input
                            type="number"
                            placeholder="To"
                            value={f.max}
                            onChange={(e) => f.setMax(e.target.value)}
                            disabled={!f.enabled}
                            className="h-9"
                          />
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between gap-2 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setMarginFilterEnabled(draftMarginFilterEnabled);
                          setMarginMin(draftMarginFilterEnabled ? draftMarginMin : "");
                          setMarginMax(draftMarginFilterEnabled ? draftMarginMax : "");
                          setRevenueFilterEnabled(draftRevenueFilterEnabled);
                          setRevenueMin(draftRevenueFilterEnabled ? draftRevenueMin : "");
                          setRevenueMax(draftRevenueFilterEnabled ? draftRevenueMax : "");
                          setProfitFilterEnabled(draftProfitFilterEnabled);
                          setProfitMin(draftProfitFilterEnabled ? draftProfitMin : "");
                          setProfitMax(draftProfitFilterEnabled ? draftProfitMax : "");
                          setScoreFilterEnabled(draftScoreFilterEnabled);
                          setScoreMin(draftScoreFilterEnabled ? draftScoreMin : "");
                          setScoreMax(draftScoreFilterEnabled ? draftScoreMax : "");
                          setVehicleFilterOpen(false);
                        }}
                      >
                        Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setMarginFilterEnabled(false); setMarginMin(""); setMarginMax("");
                          setRevenueFilterEnabled(false); setRevenueMin(""); setRevenueMax("");
                          setProfitFilterEnabled(false); setProfitMin(""); setProfitMax("");
                          setScoreFilterEnabled(false); setScoreMin(""); setScoreMax("");
                          setDraftMarginFilterEnabled(false); setDraftMarginMin(""); setDraftMarginMax("");
                          setDraftRevenueFilterEnabled(false); setDraftRevenueMin(""); setDraftRevenueMax("");
                          setDraftProfitFilterEnabled(false); setDraftProfitMin(""); setDraftProfitMax("");
                          setDraftScoreFilterEnabled(false); setDraftScoreMin(""); setDraftScoreMax("");
                        }}
                      >
                        Show All
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Costs</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleTableData.map((item) => (
                    <TableRow key={item.vehicle_id}>
                      <TableCell className="font-medium">
                        {getVehicleName(item.vehicle_id)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {format(item.revenue?.total || 0)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {format(item.costs?.total || 0)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${(item.profitability?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {format(item.profitability?.net_profit || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.profitability?.margin_percent || 0).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {getTierBadge(item.profitability?.tier || 'marginal')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Progress 
                            value={item.profitability?.score || 0} 
                            className="w-16 h-2"
                          />
                          <span className="text-sm">{item.profitability?.score || 0}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {vehicleTableData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {isVehicleProfitabilityFetching ? 'Calculating profitability...' : 'No matching vehicle profit and loss data.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Detailed Cost Analysis</CardTitle>
                  <CardDescription>Per-vehicle cost breakdown</CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportCostBreakdown} disabled={isExportingCostBreakdown}>
                  <Download className="h-4 w-4 mr-2" />
                  {isExportingCostBreakdown ? "Exporting..." : "Export Data"}
                </Button>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by vehicle..."
                    value={costSearch}
                    onChange={(e) => setCostSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Popover
                  open={costFilterOpen}
                  onOpenChange={(open) => {
                    if (open) {
                      setDraftCostTotalEnabled(costTotalEnabled);
                      setDraftCostTotalMin(costTotalMin);
                      setDraftCostTotalMax(costTotalMax);
                      setDraftCostFuelEnabled(costFuelEnabled);
                      setDraftCostFuelMin(costFuelMin);
                      setDraftCostFuelMax(costFuelMax);
                      setDraftCostWagesEnabled(costWagesEnabled);
                      setDraftCostWagesMin(costWagesMin);
                      setDraftCostWagesMax(costWagesMax);
                      setDraftCostMaintEnabled(costMaintEnabled);
                      setDraftCostMaintMin(costMaintMin);
                      setDraftCostMaintMax(costMaintMax);
                    }
                    setCostFilterOpen(open);
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="relative">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filter
                      {(costTotalEnabled || costFuelEnabled || costWagesEnabled || costMaintEnabled) && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                          {[costTotalEnabled, costFuelEnabled, costWagesEnabled, costMaintEnabled].filter(Boolean).length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 space-y-4 max-h-[70vh] overflow-y-auto">
                    <Label className="text-sm font-semibold">Show Vehicles</Label>
                    {[
                      { id: "cost-total", label: "Total Cost (₦)", enabled: draftCostTotalEnabled, setEnabled: setDraftCostTotalEnabled, min: draftCostTotalMin, setMin: setDraftCostTotalMin, max: draftCostTotalMax, setMax: setDraftCostTotalMax },
                      { id: "cost-fuel", label: "Fuel Cost (₦)", enabled: draftCostFuelEnabled, setEnabled: setDraftCostFuelEnabled, min: draftCostFuelMin, setMin: setDraftCostFuelMin, max: draftCostFuelMax, setMax: setDraftCostFuelMax },
                      { id: "cost-wages", label: "Wages Cost (₦)", enabled: draftCostWagesEnabled, setEnabled: setDraftCostWagesEnabled, min: draftCostWagesMin, setMin: setDraftCostWagesMin, max: draftCostWagesMax, setMax: setDraftCostWagesMax },
                      { id: "cost-maint", label: "Maintenance Cost (₦)", enabled: draftCostMaintEnabled, setEnabled: setDraftCostMaintEnabled, min: draftCostMaintMin, setMin: setDraftCostMaintMin, max: draftCostMaintMax, setMax: setDraftCostMaintMax },
                    ].map((f) => (
                      <div key={f.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id={f.id} checked={f.enabled} onCheckedChange={(c) => f.setEnabled(c === true)} />
                          <Label htmlFor={f.id} className="text-xs cursor-pointer">{f.label}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input type="number" placeholder="From" value={f.min} onChange={(e) => f.setMin(e.target.value)} disabled={!f.enabled} className="h-9" />
                          <span className="text-xs text-muted-foreground">to</span>
                          <Input type="number" placeholder="To" value={f.max} onChange={(e) => f.setMax(e.target.value)} disabled={!f.enabled} className="h-9" />
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between gap-2 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setCostTotalEnabled(draftCostTotalEnabled);
                          setCostTotalMin(draftCostTotalEnabled ? draftCostTotalMin : "");
                          setCostTotalMax(draftCostTotalEnabled ? draftCostTotalMax : "");
                          setCostFuelEnabled(draftCostFuelEnabled);
                          setCostFuelMin(draftCostFuelEnabled ? draftCostFuelMin : "");
                          setCostFuelMax(draftCostFuelEnabled ? draftCostFuelMax : "");
                          setCostWagesEnabled(draftCostWagesEnabled);
                          setCostWagesMin(draftCostWagesEnabled ? draftCostWagesMin : "");
                          setCostWagesMax(draftCostWagesEnabled ? draftCostWagesMax : "");
                          setCostMaintEnabled(draftCostMaintEnabled);
                          setCostMaintMin(draftCostMaintEnabled ? draftCostMaintMin : "");
                          setCostMaintMax(draftCostMaintEnabled ? draftCostMaintMax : "");
                          setCostFilterOpen(false);
                        }}
                      >
                        Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setCostTotalEnabled(false); setCostTotalMin(""); setCostTotalMax("");
                          setCostFuelEnabled(false); setCostFuelMin(""); setCostFuelMax("");
                          setCostWagesEnabled(false); setCostWagesMin(""); setCostWagesMax("");
                          setCostMaintEnabled(false); setCostMaintMin(""); setCostMaintMax("");
                          setDraftCostTotalEnabled(false); setDraftCostTotalMin(""); setDraftCostTotalMax("");
                          setDraftCostFuelEnabled(false); setDraftCostFuelMin(""); setDraftCostFuelMax("");
                          setDraftCostWagesEnabled(false); setDraftCostWagesMin(""); setDraftCostWagesMax("");
                          setDraftCostMaintEnabled(false); setDraftCostMaintMin(""); setDraftCostMaintMax("");
                        }}
                      >
                        Show All
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Fuel</TableHead>
                    <TableHead className="text-right">Maintenance</TableHead>
                    <TableHead className="text-right">Wages</TableHead>
                    <TableHead className="text-right">Insurance</TableHead>
                    <TableHead className="text-right">Depreciation</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData
                    .filter((item) => {
                      const name = getVehicleName(item.vehicle_id).toLowerCase();
                      if (costSearch && !name.includes(costSearch.toLowerCase())) return false;
                      if (costTotalEnabled) {
                        const t = item.costs?.total ?? 0;
                        if (costTotalMin && t < Number(costTotalMin)) return false;
                        if (costTotalMax && t > Number(costTotalMax)) return false;
                      }
                      if (costFuelEnabled) {
                        const f = item.costs?.fuel ?? 0;
                        if (costFuelMin && f < Number(costFuelMin)) return false;
                        if (costFuelMax && f > Number(costFuelMax)) return false;
                      }
                      if (costWagesEnabled) {
                        const m = item.costs?.wages ?? 0;
                        if (costWagesMin && m < Number(costWagesMin)) return false;
                        if (costWagesMax && m > Number(costWagesMax)) return false;
                      }
                      if (costMaintEnabled) {
                        const mn = item.costs?.maintenance ?? 0;
                        if (costMaintMin && mn < Number(costMaintMin)) return false;
                        if (costMaintMax && mn > Number(costMaintMax)) return false;
                      }
                      return true;
                    })
                    .map((item) => (
                    <TableRow key={item.vehicle_id}>
                      <TableCell className="font-medium">
                        {getVehicleName(item.vehicle_id)}
                      </TableCell>
                      <TableCell className="text-right">{format(item.costs?.fuel || 0)}</TableCell>
                      <TableCell className="text-right">{format(item.costs?.maintenance || 0)}</TableCell>
                      <TableCell className="text-right">{format(item.costs?.wages || 0)}</TableCell>
                      <TableCell className="text-right">{format(item.costs?.insurance || 0)}</TableCell>
                      <TableCell className="text-right">{format(item.costs?.depreciation || 0)}</TableCell>
                      <TableCell className="text-right font-semibold">{format(item.costs?.total || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="underperforming">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Underperforming Assets
                </CardTitle>
                <CardDescription>
                  Vehicles with marginal or negative profitability requiring attention
                </CardDescription>
              </div>
              <PeriodFilter value={underperformingPeriod} onChange={setUnderperformingPeriod} variant="short" className="w-[140px] h-8" />
            </CardHeader>
            <CardContent>
              {underperformingVehicles.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">All vehicles are performing well!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {underperformingVehicles.map((item) => {
                    const vehicleName = getVehicleName(item.vehicle_id);
                    const vehicleDescription = [item.make, item.model].filter(Boolean).join(" ");
                    const vehicle = {
                      make: vehicleDescription,
                      model: "",
                    };
                    return (
                      <Card key={item.vehicle_id} className="border-amber-200 dark:border-amber-800">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                {vehicleName}
                                {getTierBadge(item.profitability?.tier || 'marginal')}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {vehicle?.make} {vehicle?.model} • {item.revenue?.jobs_completed || 0} jobs
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${(item.profitability?.net_profit || 0) >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                {format(item.profitability?.net_profit || 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(item.profitability?.margin_percent || 0).toFixed(1)}% margin
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Revenue:</span>
                              <span className="ml-2 font-medium">{format(item.revenue?.total || 0)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Costs:</span>
                              <span className="ml-2 font-medium">{format(item.costs?.total || 0)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">KM Driven:</span>
                              <span className="ml-2 font-medium">{(item.revenue?.total_km || 0).toFixed(0)} km</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VehicleFinancialConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        vehicles={vehicles.map(v => ({
          id: v.id,
          registration_number: v.registrationNumber,
          make: v.make,
          model: v.model,
        }))}
      />

      <VehiclePLStatementBuilder
        open={statementBuilderOpen}
        onOpenChange={setStatementBuilderOpen}
        data={profitabilityData}
        vehicleNameLookup={getVehicleName}
        defaultPeriodLabel={`Last ${profitabilityPeriod} days`}
        periodMonths={periodToMonths(profitabilityPeriod)}
      />
    </div>
  );
}
