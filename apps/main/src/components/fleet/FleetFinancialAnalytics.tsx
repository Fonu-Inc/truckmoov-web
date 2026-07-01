import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useFleetFinancialSummary } from "@truckmoov/api/fleet";
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
  Legend
} from "recharts";
import { VehicleFinancialConfigDialog } from "./VehicleFinancialConfigDialog";
import { VehiclePLStatementBuilder } from "./VehiclePLStatementBuilder";
import { PeriodFilter, PeriodValue } from "./PeriodFilter";

const TIER_COLORS = {
  excellent: "#22c55e",
  good: "#3b82f6",
  marginal: "#f59e0b",
  "loss-making": "#ef4444",
};

const TIER_LABELS = {
  excellent: "Excellent",
  good: "Good",
  marginal: "Marginal",
  "loss-making": "Loss-Making",
};

export function FleetFinancialAnalytics() {
  const vehicles: any[] = [];
  const configs: any[] = [];
  const calculateFleetProfitability = async (_vehicleIds: any[], _start: Date, _end: Date): Promise<any[]> => [];
  const isLoading = false;
  const { format } = useCurrency();
  const { data: financialSummaryResp } = useFleetFinancialSummary();
  
  const [period, setPeriod] = useState<PeriodValue>("30");
  const [profitabilityPeriod, setProfitabilityPeriod] = useState<PeriodValue>("30");
  const [costBreakdownPeriod, setCostBreakdownPeriod] = useState<PeriodValue>("30");
  const [underperformingPeriod, setUnderperformingPeriod] = useState<PeriodValue>("30");
  const [profitabilityData, setProfitabilityData] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [statementBuilderOpen, setStatementBuilderOpen] = useState(false);

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

  const loadProfitability = async () => {
    if (vehicles.length === 0) return;
    
    setIsCalculating(true);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const vehicleIds = vehicles.map(v => v.id);
    const results = await calculateFleetProfitability(vehicleIds, startDate, endDate);
    setProfitabilityData(results);
    setIsCalculating(false);
  };

  useEffect(() => {
    loadProfitability();
  }, [vehicles, period]);

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
  // Tier distribution for pie chart
  const tierDistribution = profitabilityData.reduce((acc, v) => {
    const tier = v.profitability?.tier || 'marginal';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(tierDistribution).map(([tier, count]) => ({
    name: TIER_LABELS[tier as keyof typeof TIER_LABELS],
    value: count,
    fill: TIER_COLORS[tier as keyof typeof TIER_COLORS],
  }));

  const pieDataChart = pieData;

  // Cost breakdown for bar chart
  const costBreakdown = profitabilityData.reduce((acc, v) => {
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

  const costChartDataDemo = costChartData.filter(c => c.value > 0);

  const chartConfig = {
    fuel: { label: "Fuel", color: "#f59e0b" },
    maintenance: { label: "Maintenance", color: "#3b82f6" },
    wages: { label: "Wages", color: "#8b5cf6" },
    insurance: { label: "Insurance", color: "#22c55e" },
    depreciation: { label: "Depreciation", color: "#64748b" },
  };

  // ── Dummy P&L rows (used when no real config has been computed) ──
  const DEMO_PL: any[] = [
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
  const displayData: any[] = profitabilityData.length > 0 ? profitabilityData : DEMO_PL;
  const displayTotals = displayData.reduce((acc, v) => ({
    totalRevenue: acc.totalRevenue + (v.revenue?.total || 0),
    totalCosts: acc.totalCosts + (v.costs?.total || 0),
    totalProfit: acc.totalProfit + (v.profitability?.net_profit || 0),
  }), { totalRevenue: 0, totalCosts: 0, totalProfit: 0 });
  const displayMargin = displayTotals.totalRevenue > 0
    ? (displayTotals.totalProfit / displayTotals.totalRevenue) * 100
    : 0;
  const financialSummary = financialSummaryResp?.data;
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
  const underperformingVehicles = displayData
    .filter(v => v.profitability?.tier === 'loss-making' || v.profitability?.tier === 'marginal')
    .sort((a, b) => (a.profitability?.net_profit || 0) - (b.profitability?.net_profit || 0));

  const getVehicleName = (vehicleId: string) => {
    if (DEMO_NAMES[vehicleId]) return DEMO_NAMES[vehicleId];
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
        {TIER_LABELS[tier as keyof typeof TIER_LABELS] || tier}
      </Badge>
    );
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
                  <CardDescription>Vehicle count by profitability tier</CardDescription>
                </div>
                <PeriodFilter value={profitabilityPeriod} onChange={setProfitabilityPeriod} variant="short" className="w-[150px]" />
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieDataChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieDataChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                  <CardDescription>Total costs by category</CardDescription>
                </div>
                <PeriodFilter value={costBreakdownPeriod} onChange={setCostBreakdownPeriod} variant="short" className="w-[150px]" />
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costChartDataDemo} layout="vertical">
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
                  rows={displayData.filter((item) => {
                    const name = getVehicleName(item.vehicle_id).toLowerCase();
                    if (vehicleSearch && !name.includes(vehicleSearch.toLowerCase())) return false;
                    if (vehicleStatusFilter !== "all" && (item.profitability?.tier || 'marginal') !== vehicleStatusFilter) return false;
                    if (marginFilterEnabled) {
                      const m = item.profitability?.margin_percent ?? 0;
                      if (marginMin && m < Number(marginMin)) return false;
                      if (marginMax && m > Number(marginMax)) return false;
                    }
                    if (revenueFilterEnabled) {
                      const r = item.revenue?.total ?? 0;
                      if (revenueMin && r < Number(revenueMin)) return false;
                      if (revenueMax && r > Number(revenueMax)) return false;
                    }
                    if (profitFilterEnabled) {
                      const p = item.profitability?.net_profit ?? 0;
                      if (profitMin && p < Number(profitMin)) return false;
                      if (profitMax && p > Number(profitMax)) return false;
                    }
                    if (scoreFilterEnabled) {
                      const s = item.profitability?.score ?? 0;
                      if (scoreMin && s < Number(scoreMin)) return false;
                      if (scoreMax && s > Number(scoreMax)) return false;
                    }
                    return true;
                  })}
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
                  {displayData
                    .filter((item) => {
                      const name = getVehicleName(item.vehicle_id).toLowerCase();
                      if (vehicleSearch && !name.includes(vehicleSearch.toLowerCase())) return false;
                      if (vehicleStatusFilter !== "all" && (item.profitability?.tier || 'marginal') !== vehicleStatusFilter) return false;
                      if (marginFilterEnabled) {
                        const m = item.profitability?.margin_percent ?? 0;
                        if (marginMin && m < Number(marginMin)) return false;
                        if (marginMax && m > Number(marginMax)) return false;
                      }
                      if (revenueFilterEnabled) {
                        const r = item.revenue?.total ?? 0;
                        if (revenueMin && r < Number(revenueMin)) return false;
                        if (revenueMax && r > Number(revenueMax)) return false;
                      }
                      if (profitFilterEnabled) {
                        const p = item.profitability?.net_profit ?? 0;
                        if (profitMin && p < Number(profitMin)) return false;
                        if (profitMax && p > Number(profitMax)) return false;
                      }
                      if (scoreFilterEnabled) {
                        const s = item.profitability?.score ?? 0;
                        if (scoreMin && s < Number(scoreMin)) return false;
                        if (scoreMax && s > Number(scoreMax)) return false;
                      }
                      return true;
                    })
                    .map((item) => (
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
                  {displayData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {isCalculating ? 'Calculating profitability...' : 'No data available. Configure vehicle costs to see analysis.'}
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
                <ExportButton
                  rows={displayData.filter((item) => {
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
                  })}
                  columns={[
                    { header: "Vehicle", accessor: (r) => getVehicleName(r.vehicle_id) },
                    { header: "Fuel", accessor: (r) => r.costs?.fuel ?? 0 },
                    { header: "Maintenance", accessor: (r) => r.costs?.maintenance ?? 0 },
                    { header: "Wages", accessor: (r) => r.costs?.wages ?? 0 },
                    { header: "Insurance", accessor: (r) => r.costs?.insurance ?? 0 },
                    { header: "Depreciation", accessor: (r) => r.costs?.depreciation ?? 0 },
                    { header: "Total", accessor: (r) => r.costs?.total ?? 0 },
                  ]}
                  filename="vehicle-cost-analysis"
                />
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
                    const vehicle = vehicles.find(v => v.id === item.vehicle_id);
                    return (
                      <Card key={item.vehicle_id} className="border-amber-200 dark:border-amber-800">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                {vehicle?.registrationNumber || 'Unknown Vehicle'}
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
      />
    </div>
  );
}
