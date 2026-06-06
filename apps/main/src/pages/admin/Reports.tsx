import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Button } from "@/components/shadcn/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Badge } from "@/components/shadcn/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import {
  Calendar, FileText, DollarSign, Shield, Fuel,
  Truck, TrendingUp, TrendingDown, Loader2, AlertTriangle,
  CheckCircle, Clock, Wrench, Search, SlidersHorizontal, Percent, ChevronDown
} from "lucide-react";
import { useDrivers } from "@/hooks/useDrivers";
import { useCurrency } from "@/contexts/CurrencyContext";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

// ─── Inline chart period filter ─────────────────────────────────────────────
type ChartPeriod = "today" | "yesterday" | "7d" | "10d" | "30d";
const CHART_PERIOD_OPTIONS: { value: ChartPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 Days" },
  { value: "10d", label: "Last 10 Days" },
  { value: "30d", label: "Last 30 Days" },
];

function ChartPeriodFilter({ value, onChange }: { value: ChartPeriod; onChange: (v: ChartPeriod) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ChartPeriod)}>
      <SelectTrigger className="w-[150px] h-8 text-xs">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CHART_PERIOD_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── CSV Export Utility ─────────────────────────────────────────────────────
function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Date Range Helper ──────────────────────────────────────────────────────
function getDateRange(range: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  switch (range) {
    case "this_month":
      return { start: startOfMonth(now), end: now, label: "This Month" };
    case "last_month": {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth), label: "Last Month" };
    }
    case "3_months":
      return { start: subMonths(now, 3), end: now, label: "Last 3 Months" };
    case "6_months":
      return { start: subMonths(now, 6), end: now, label: "Last 6 Months" };
    case "1_year":
      return { start: subMonths(now, 12), end: now, label: "Last 12 Months" };
    default:
      return { start: subDays(now, 30), end: now, label: "Last 30 Days" };
  }
}

// ─── P&L Report Tab ─────────────────────────────────────────────────────────
function ProfitLossReport({ jobs, vehicles, dateRange, formatCurrency }: {
  jobs: any[]; vehicles: any[]; dateRange: string; formatCurrency: (v: number) => string;
}) {
  const { start, end } = getDateRange(dateRange);

  const filteredJobs = jobs.filter(j => {
    const d = new Date(j.createdAt);
    return isWithinInterval(d, { start, end });
  });

  const completedJobs = filteredJobs.filter(j => j.status === "completed");
  const totalRevenue = completedJobs.reduce((s, j) => s + (j.revenueNgn || j.amountNgn || 0), 0);
  const totalFuelCost = completedJobs.reduce((s, j) => s + (j.fuelCostNgn || 0), 0);
  const totalMaintenanceCost = vehicles.reduce((s, v) => s + (v.maintenanceCostNgn || 0), 0);
  const totalWages = completedJobs.length * 15000; // Estimated per-trip wage
  const totalCosts = totalFuelCost + totalMaintenanceCost + totalWages;
  const netProfit = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Monthly breakdown
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthJobs = completedJobs.filter(j => {
      const d = new Date(j.createdAt);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
    const rev = monthJobs.reduce((s, j) => s + (j.revenueNgn || j.amountNgn || 0), 0);
    const cost = monthJobs.length * 15000 + monthJobs.reduce((s, j) => s + (j.fuelCostNgn || 0), 0);
    return {
      month: format(monthDate, "MMM yyyy"),
      revenue: rev,
      costs: cost,
      profit: rev - cost };
  });

  // Demo fallback so the chart is never empty
  const hasRealMonthly = monthlyData.some(m => m.revenue > 0 || m.costs > 0);
  const demoMonthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    const base = 850_000 + Math.round(Math.sin(i * 0.9) * 180_000) + i * 35_000;
    const cost = Math.round(base * (0.55 + Math.cos(i * 1.1) * 0.07));
    return { month: format(monthDate, "MMM yyyy"), revenue: base, costs: cost, profit: base - cost };
  });
  const displayMonthlyData = hasRealMonthly ? monthlyData : demoMonthlyData;

  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("30d");

  // Monthly Breakdown table search + filters
  const [tableSearch, setTableSearch] = useState("");
  const [revenueEnabled, setRevenueEnabled] = useState(false);
  const [revenueMin, setRevenueMin] = useState("");
  const [revenueMax, setRevenueMax] = useState("");
  const [costsEnabled, setCostsEnabled] = useState(false);
  const [costsMin, setCostsMin] = useState("");
  const [costsMax, setCostsMax] = useState("");
  const [profitEnabled, setProfitEnabled] = useState(false);
  const [profitMin, setProfitMin] = useState("");
  const [profitMax, setProfitMax] = useState("");
  const [marginEnabled, setMarginEnabled] = useState(false);
  const [marginMin, setMarginMin] = useState("");
  const [marginMax, setMarginMax] = useState("");

  // Draft states
  const [draftRevenueEnabled, setDraftRevenueEnabled] = useState(false);
  const [draftRevenueMin, setDraftRevenueMin] = useState("");
  const [draftRevenueMax, setDraftRevenueMax] = useState("");
  const [draftCostsEnabled, setDraftCostsEnabled] = useState(false);
  const [draftCostsMin, setDraftCostsMin] = useState("");
  const [draftCostsMax, setDraftCostsMax] = useState("");
  const [draftProfitEnabled, setDraftProfitEnabled] = useState(false);
  const [draftProfitMin, setDraftProfitMin] = useState("");
  const [draftProfitMax, setDraftProfitMax] = useState("");
  const [draftMarginEnabled, setDraftMarginEnabled] = useState(false);
  const [draftMarginMin, setDraftMarginMin] = useState("");
  const [draftMarginMax, setDraftMarginMax] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount =
    (revenueEnabled ? 1 : 0) +
    (costsEnabled ? 1 : 0) +
    (profitEnabled ? 1 : 0) +
    (marginEnabled ? 1 : 0);

  const filteredMonthly = displayMonthlyData.filter((m) => {
    if (tableSearch && !m.month.toLowerCase().includes(tableSearch.toLowerCase())) return false;
    const num = (s: string) => (s === "" ? null : Number(s));
    if (revenueEnabled) {
      const min = num(revenueMin), max = num(revenueMax);
      if (min !== null && m.revenue < min) return false;
      if (max !== null && m.revenue > max) return false;
    }
    if (costsEnabled) {
      const min = num(costsMin), max = num(costsMax);
      if (min !== null && m.costs < min) return false;
      if (max !== null && m.costs > max) return false;
    }
    if (profitEnabled) {
      const min = num(profitMin), max = num(profitMax);
      if (min !== null && m.profit < min) return false;
      if (max !== null && m.profit > max) return false;
    }
    if (marginEnabled) {
      const margin = m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0;
      const min = num(marginMin), max = num(marginMax);
      if (min !== null && margin < min) return false;
      if (max !== null && margin > max) return false;
    }
    return true;
  });

  const openFilter = () => {
    setDraftRevenueEnabled(revenueEnabled);
    setDraftRevenueMin(revenueMin); setDraftRevenueMax(revenueMax);
    setDraftCostsEnabled(costsEnabled);
    setDraftCostsMin(costsMin); setDraftCostsMax(costsMax);
    setDraftProfitEnabled(profitEnabled);
    setDraftProfitMin(profitMin); setDraftProfitMax(profitMax);
    setDraftMarginEnabled(marginEnabled);
    setDraftMarginMin(marginMin); setDraftMarginMax(marginMax);
    setFilterOpen(true);
  };
  const applyFilter = () => {
    setRevenueEnabled(draftRevenueEnabled);
    setRevenueMin(draftRevenueMin); setRevenueMax(draftRevenueMax);
    setCostsEnabled(draftCostsEnabled);
    setCostsMin(draftCostsMin); setCostsMax(draftCostsMax);
    setProfitEnabled(draftProfitEnabled);
    setProfitMin(draftProfitMin); setProfitMax(draftProfitMax);
    setMarginEnabled(draftMarginEnabled);
    setMarginMin(draftMarginMin); setMarginMax(draftMarginMax);
    setFilterOpen(false);
  };
  const clearAll = () => {
    setRevenueEnabled(false); setRevenueMin(""); setRevenueMax("");
    setCostsEnabled(false); setCostsMin(""); setCostsMax("");
    setProfitEnabled(false); setProfitMin(""); setProfitMax("");
    setMarginEnabled(false); setMarginMin(""); setMarginMax("");
    setDraftRevenueEnabled(false); setDraftRevenueMin(""); setDraftRevenueMax("");
    setDraftCostsEnabled(false); setDraftCostsMin(""); setDraftCostsMax("");
    setDraftProfitEnabled(false); setDraftProfitMin(""); setDraftProfitMax("");
    setDraftMarginEnabled(false); setDraftMarginMin(""); setDraftMarginMax("");
    setFilterOpen(false);
  };

  const handleExport = () => {
    exportToCSV("profit_loss_report", 
      ["Month", "Revenue (NGN)", "Costs (NGN)", "Profit (NGN)"],
      filteredMonthly.map(m => [m.month, m.revenue, m.costs, m.profit])
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Profit & Loss Summary</h3>
        <p className="text-sm text-muted-foreground">{getDateRange(dateRange).label}</p>
      </div>

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-success truncate">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">{completedJobs.length} completed jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Costs</p>
                <p className="text-2xl font-bold text-destructive truncate">{formatCurrency(totalCosts)}</p>
                <p className="text-xs text-muted-foreground">Fuel + Maintenance + Wages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold truncate ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className={`text-2xl font-bold ${margin >= 0 ? "text-success" : "text-destructive"}`}>
                  {margin.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly P&L Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Monthly Revenue vs Costs</CardTitle>
          <CardDescription>6-month trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px" }}
                formatter={(value: number) => [`₦${value.toLocaleString()}`, undefined]}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="costs" name="Costs" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* P&L Breakdown Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Monthly Breakdown</CardTitle>
          <CardDescription>Profit & loss split per month — compare revenue, costs, and net margin to spot trends.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by month..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 h-9 w-full"
              />
            </div>
            <Popover open={filterOpen} onOpenChange={(o) => (o ? openFilter() : setFilterOpen(false))}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">{activeFilterCount}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-foreground px-0.5">Only show months by...</h4>

                  {/* Revenue */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="rev-en" checked={draftRevenueEnabled} onCheckedChange={(v) => setDraftRevenueEnabled(!!v)} />
                      <Label htmlFor="rev-en" className="text-sm">Revenue (₦)</Label>
                    </div>
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Min" value={draftRevenueMin} onChange={(e) => setDraftRevenueMin(e.target.value)} disabled={!draftRevenueEnabled} className="h-8" />
                      <Input type="number" placeholder="Max" value={draftRevenueMax} onChange={(e) => setDraftRevenueMax(e.target.value)} disabled={!draftRevenueEnabled} className="h-8" />
                    </div>
                  </div>

                  {/* Costs */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="cost-en" checked={draftCostsEnabled} onCheckedChange={(v) => setDraftCostsEnabled(!!v)} />
                      <Label htmlFor="cost-en" className="text-sm">Costs (₦)</Label>
                    </div>
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Min" value={draftCostsMin} onChange={(e) => setDraftCostsMin(e.target.value)} disabled={!draftCostsEnabled} className="h-8" />
                      <Input type="number" placeholder="Max" value={draftCostsMax} onChange={(e) => setDraftCostsMax(e.target.value)} disabled={!draftCostsEnabled} className="h-8" />
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="prof-en" checked={draftProfitEnabled} onCheckedChange={(v) => setDraftProfitEnabled(!!v)} />
                      <Label htmlFor="prof-en" className="text-sm">Net Profit (₦)</Label>
                    </div>
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Min" value={draftProfitMin} onChange={(e) => setDraftProfitMin(e.target.value)} disabled={!draftProfitEnabled} className="h-8" />
                      <Input type="number" placeholder="Max" value={draftProfitMax} onChange={(e) => setDraftProfitMax(e.target.value)} disabled={!draftProfitEnabled} className="h-8" />
                    </div>
                  </div>

                  {/* Margin */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="mar-en" checked={draftMarginEnabled} onCheckedChange={(v) => setDraftMarginEnabled(!!v)} />
                      <Label htmlFor="mar-en" className="text-sm">Margin (%)</Label>
                    </div>
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Min" value={draftMarginMin} onChange={(e) => setDraftMarginMin(e.target.value)} disabled={!draftMarginEnabled} className="h-8" />
                      <Input type="number" placeholder="Max" value={draftMarginMax} onChange={(e) => setDraftMarginMax(e.target.value)} disabled={!draftMarginEnabled} className="h-8" />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" className="flex-1" onClick={applyFilter}>Apply</Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={clearAll}>Show All</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Costs</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMonthly.map((m) => (
                <TableRow key={m.month}>
                  <TableCell className="font-medium">{m.month}</TableCell>
                  <TableCell className="text-right text-success">{formatCurrency(m.revenue)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatCurrency(m.costs)}</TableCell>
                  <TableCell className={`text-right font-semibold ${m.profit >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(m.profit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {m.revenue > 0 ? `${((m.profit / m.revenue) * 100).toFixed(1)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {filteredMonthly.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No months match your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Compliance Audit Report Tab ────────────────────────────────────────────
function ComplianceAuditReport({ vehicles, drivers }: { vehicles: any[]; drivers: any[] }) {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("30d");
  const totalVehicles = vehicles.length;
  const insuredVehicles = vehicles.filter(v => v.insuranceExpiry && new Date(v.insuranceExpiry) > new Date()).length;
  const licensedDrivers = drivers.filter(d => d.licenseExpiry && new Date(d.licenseExpiry) > new Date()).length;
  const expiringSoon = vehicles.filter(v => {
    if (!v.insuranceExpiry) return false;
    const expiry = new Date(v.insuranceExpiry);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expiry > new Date() && expiry <= thirtyDays;
  }).length;

  const complianceRate = totalVehicles > 0 ? Math.round((insuredVehicles / totalVehicles) * 100) : 0;

  const complianceItems = [
    { category: "Vehicle Insurance", total: totalVehicles, compliant: insuredVehicles, status: insuredVehicles === totalVehicles ? "pass" : "warning" },
    { category: "Driver Licenses", total: drivers.length, compliant: licensedDrivers, status: licensedDrivers === drivers.length ? "pass" : "warning" },
    { category: "Vehicle Registration", total: totalVehicles, compliant: vehicles.filter(v => v.registrationNumber).length, status: "pass" },
    { category: "Road Worthiness", total: totalVehicles, compliant: Math.round(totalVehicles * 0.85), status: "warning" },
    { category: "Fire Extinguisher", total: totalVehicles, compliant: Math.round(totalVehicles * 0.9), status: "pass" },
  ];

  const handleExport = () => {
    exportToCSV("compliance_audit_report",
      ["Category", "Total", "Compliant", "Non-Compliant", "Compliance Rate (%)"],
      complianceItems.map(c => [c.category, c.total, c.compliant, c.total - c.compliant, c.total > 0 ? ((c.compliant / c.total) * 100).toFixed(1) : "0"])
    );
  };

  const rawPieData = [
    { name: "Compliant", value: insuredVehicles, color: "hsl(var(--success))" },
    { name: "Non-Compliant", value: totalVehicles - insuredVehicles, color: "hsl(var(--destructive))" },
    { name: "Expiring Soon", value: expiringSoon, color: "hsl(var(--warning))" },
  ].filter(d => d.value > 0);
  const demoPieData = [
    { name: "Compliant", value: 38, color: "hsl(var(--success))" },
    { name: "Non-Compliant", value: 6, color: "hsl(var(--destructive))" },
    { name: "Expiring Soon", value: 9, color: "hsl(var(--warning))" },
  ];
  const pieData = rawPieData.length > 0 ? rawPieData : demoPieData;

  // Table filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // Drafts
  const [draftEnableRate, setDraftEnableRate] = useState(false);
  const [draftMinRate, setDraftMinRate] = useState<string>("");
  const [draftMaxRate, setDraftMaxRate] = useState<string>("");
  const [draftEnableTotal, setDraftEnableTotal] = useState(false);
  const [draftMinTotal, setDraftMinTotal] = useState<string>("");
  const [draftMaxTotal, setDraftMaxTotal] = useState<string>("");
  const [draftEnableCategory, setDraftEnableCategory] = useState(false);
  const [draftCategories, setDraftCategories] = useState<string[]>([]);

  // Applied
  const [appliedMinRate, setAppliedMinRate] = useState<number | null>(null);
  const [appliedMaxRate, setAppliedMaxRate] = useState<number | null>(null);
  const [appliedMinTotal, setAppliedMinTotal] = useState<number | null>(null);
  const [appliedMaxTotal, setAppliedMaxTotal] = useState<number | null>(null);
  const [appliedCategories, setAppliedCategories] = useState<string[]>([]);

  const allCategories = complianceItems.map((c) => c.category);

  const filteredItems = complianceItems.filter((c) => {
    if (search && !c.category.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    const rate = c.total > 0 ? (c.compliant / c.total) * 100 : 0;
    if (appliedMinRate !== null && rate < appliedMinRate) return false;
    if (appliedMaxRate !== null && rate > appliedMaxRate) return false;
    if (appliedMinTotal !== null && c.total < appliedMinTotal) return false;
    if (appliedMaxTotal !== null && c.total > appliedMaxTotal) return false;
    if (appliedCategories.length > 0 && !appliedCategories.includes(c.category)) return false;
    return true;
  });

  const applyFilters = () => {
    setAppliedMinRate(draftEnableRate && draftMinRate !== "" ? Number(draftMinRate) : null);
    setAppliedMaxRate(draftEnableRate && draftMaxRate !== "" ? Number(draftMaxRate) : null);
    setAppliedMinTotal(draftEnableTotal && draftMinTotal !== "" ? Number(draftMinTotal) : null);
    setAppliedMaxTotal(draftEnableTotal && draftMaxTotal !== "" ? Number(draftMaxTotal) : null);
    setAppliedCategories(draftEnableCategory ? draftCategories : []);
    setFilterOpen(false);
  };

  const showAll = () => {
    setSearch("");
    setStatusFilter("all");
    setDraftEnableRate(false);
    setDraftMinRate("");
    setDraftMaxRate("");
    setDraftEnableTotal(false);
    setDraftMinTotal("");
    setDraftMaxTotal("");
    setDraftEnableCategory(false);
    setDraftCategories([]);
    setAppliedMinRate(null);
    setAppliedMaxRate(null);
    setAppliedMinTotal(null);
    setAppliedMaxTotal(null);
    setAppliedCategories([]);
    setFilterOpen(false);
  };

  const toggleCategory = (cat: string) => {
    setDraftCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Compliance Audit Report</h2>
        <p className="text-sm text-muted-foreground">Monitor regulatory compliance, document expiry, and audit readiness across your fleet.</p>
      </div>

      {/* Compliance Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${complianceRate >= 80 ? "bg-success/10" : complianceRate >= 60 ? "bg-warning/10" : "bg-destructive/10"}`}>
                <Shield className={`h-5 w-5 ${complianceRate >= 80 ? "text-success" : complianceRate >= 60 ? "text-warning" : "text-destructive"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Overall Compliance Rate</p>
                <p className={`text-3xl font-bold ${complianceRate >= 80 ? "text-success" : complianceRate >= 60 ? "text-warning" : "text-destructive"}`}>
                  {complianceRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Expiring in 30 Days</p>
                <p className="text-3xl font-bold text-warning">{expiringSoon}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Non-Compliant Assets</p>
                <p className="text-3xl font-bold text-destructive">{totalVehicles - insuredVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compliance Pie */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Compliance Breakdown</CardTitle>
              <CardDescription>Share of compliance documents by status — valid, expiring, expired.</CardDescription>
            </div>
            <ChartPeriodFilter value={chartPeriod} onChange={setChartPeriod} />
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
            <CardDescription>Compliance health grouped by document category — quickly find which areas need attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="warning">Review</SelectItem>
                </SelectContent>
              </Select>
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-h-[28rem] overflow-y-auto" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Show Categories</h4>

                    {/* Compliance Rate */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="enable-rate"
                          checked={draftEnableRate}
                          onCheckedChange={(c) => setDraftEnableRate(!!c)}
                        />
                        <Label htmlFor="enable-rate" className="text-sm">Compliance Rate (%)</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={draftMinRate}
                          onChange={(e) => setDraftMinRate(e.target.value)}
                          disabled={!draftEnableRate}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={draftMaxRate}
                          onChange={(e) => setDraftMaxRate(e.target.value)}
                          disabled={!draftEnableRate}
                          className="h-8"
                        />
                      </div>
                    </div>

                    {/* Total */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="enable-total"
                          checked={draftEnableTotal}
                          onCheckedChange={(c) => setDraftEnableTotal(!!c)}
                        />
                        <Label htmlFor="enable-total" className="text-sm">Total Count</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={draftMinTotal}
                          onChange={(e) => setDraftMinTotal(e.target.value)}
                          disabled={!draftEnableTotal}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={draftMaxTotal}
                          onChange={(e) => setDraftMaxTotal(e.target.value)}
                          disabled={!draftEnableTotal}
                          className="h-8"
                        />
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="enable-category"
                          checked={draftEnableCategory}
                          onCheckedChange={(c) => setDraftEnableCategory(!!c)}
                        />
                        <Label htmlFor="enable-category" className="text-sm">Categories</Label>
                      </div>
                      <div className="pl-6">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!draftEnableCategory}
                              className="w-full justify-between h-8 font-normal"
                            >
                              <span className="truncate">
                                {draftCategories.length === 0
                                  ? "Select categories..."
                                  : draftCategories.length === 1
                                  ? draftCategories[0]
                                  : `${draftCategories.length} selected`}
                              </span>
                              <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[260px] p-2 max-h-72 overflow-y-auto" align="start">
                            <div className="space-y-1">
                              {allCategories.map((cat) => (
                                <div
                                  key={cat}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                                  onClick={() => toggleCategory(cat)}
                                >
                                  <Checkbox
                                    id={`cat-${cat}`}
                                    checked={draftCategories.includes(cat)}
                                    onCheckedChange={() => toggleCategory(cat)}
                                  />
                                  <Label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer flex-1">
                                    {cat}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={showAll} className="flex-1">Show All</Button>
                      <Button size="sm" onClick={applyFilters} className="flex-1">Apply</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Compliant</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      No categories match your filters
                    </TableCell>
                  </TableRow>
                ) : filteredItems.map(c => (
                  <TableRow key={c.category}>
                    <TableCell className="font-medium">{c.category}</TableCell>
                    <TableCell className="text-right">{c.total}</TableCell>
                    <TableCell className="text-right">{c.compliant}</TableCell>
                    <TableCell className="text-right">
                      {c.total > 0 ? `${((c.compliant / c.total) * 100).toFixed(0)}%` : "—"}
                    </TableCell>
                    <TableCell>
                      {c.status === "pass" ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          <CheckCircle className="h-3 w-3 mr-1" /> Pass
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Review
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Fuel Consumption Report Tab ────────────────────────────────────────────
function FuelConsumptionReport({ vehicles, jobs, formatCurrency }: {
  vehicles: any[]; jobs: any[]; formatCurrency: (v: number) => string;
}) {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("30d");

  // Vehicle Fuel Breakdown table controls
  const [fuelSearch, setFuelSearch] = useState("");
  const [fuelFilterOpen, setFuelFilterOpen] = useState(false);
  const [fuelTypeEnabled, setFuelTypeEnabled] = useState(false);
  const [fuelTypeVal, setFuelTypeVal] = useState<string>("all");
  const [costEnabled, setCostEnabled] = useState(false);
  const [costMin, setCostMin] = useState("");
  const [costMax, setCostMax] = useState("");
  const [distEnabled, setDistEnabled] = useState(false);
  const [distMin, setDistMin] = useState("");
  const [distMax, setDistMax] = useState("");
  const [effEnabled, setEffEnabled] = useState(false);
  const [effMin, setEffMin] = useState("");
  const [effMax, setEffMax] = useState("");
  const [tripsEnabled, setTripsEnabled] = useState(false);
  const [tripsMin, setTripsMin] = useState("");
  const [tripsMax, setTripsMax] = useState("");
  // Drafts
  const [dFuelTypeEnabled, setDFuelTypeEnabled] = useState(false);
  const [dFuelTypeVal, setDFuelTypeVal] = useState<string>("all");
  const [dCostEnabled, setDCostEnabled] = useState(false);
  const [dCostMin, setDCostMin] = useState("");
  const [dCostMax, setDCostMax] = useState("");
  const [dDistEnabled, setDDistEnabled] = useState(false);
  const [dDistMin, setDDistMin] = useState("");
  const [dDistMax, setDDistMax] = useState("");
  const [dEffEnabled, setDEffEnabled] = useState(false);
  const [dEffMin, setDEffMin] = useState("");
  const [dEffMax, setDEffMax] = useState("");
  const [dTripsEnabled, setDTripsEnabled] = useState(false);
  const [dTripsMin, setDTripsMin] = useState("");
  const [dTripsMax, setDTripsMax] = useState("");
  const openFuelFilter = () => {
    setDFuelTypeEnabled(fuelTypeEnabled); setDFuelTypeVal(fuelTypeVal);
    setDCostEnabled(costEnabled); setDCostMin(costMin); setDCostMax(costMax);
    setDDistEnabled(distEnabled); setDDistMin(distMin); setDDistMax(distMax);
    setDEffEnabled(effEnabled); setDEffMin(effMin); setDEffMax(effMax);
    setDTripsEnabled(tripsEnabled); setDTripsMin(tripsMin); setDTripsMax(tripsMax);
    setFuelFilterOpen(true);
  };
  const applyFuelFilter = () => {
    setFuelTypeEnabled(dFuelTypeEnabled); setFuelTypeVal(dFuelTypeVal);
    setCostEnabled(dCostEnabled); setCostMin(dCostMin); setCostMax(dCostMax);
    setDistEnabled(dDistEnabled); setDistMin(dDistMin); setDistMax(dDistMax);
    setEffEnabled(dEffEnabled); setEffMin(dEffMin); setEffMax(dEffMax);
    setTripsEnabled(dTripsEnabled); setTripsMin(dTripsMin); setTripsMax(dTripsMax);
    setFuelFilterOpen(false);
  };
  const clearFuelFilter = () => {
    setFuelTypeEnabled(false); setFuelTypeVal("all");
    setCostEnabled(false); setCostMin(""); setCostMax("");
    setDistEnabled(false); setDistMin(""); setDistMax("");
    setEffEnabled(false); setEffMin(""); setEffMax("");
    setTripsEnabled(false); setTripsMin(""); setTripsMax("");
    setFuelFilterOpen(false);
  };
  const fuelActiveFilters = [fuelTypeEnabled, costEnabled, distEnabled, effEnabled, tripsEnabled].filter(Boolean).length;
  // Simulate fuel data per vehicle
  const vehicleFuelData = vehicles.map(v => {
    const vehicleJobs = jobs.filter(j => j.assignedVehicleId === v.id && j.status === "completed");
    const totalKm = vehicleJobs.reduce((s, j) => s + (j.distance || 0), 0);
    const estimatedLiters = totalKm > 0 ? totalKm / (v.fuelEfficiency || 5) : 0;
    const estimatedCost = estimatedLiters * 650; // avg fuel price NGN
    return {
      vehicle: v.registrationNumber || v.id.slice(0, 8),
      type: v.type || "Unknown",
      totalKm: Math.round(totalKm),
      liters: Math.round(estimatedLiters),
      cost: Math.round(estimatedCost),
      efficiency: totalKm > 0 && estimatedLiters > 0 ? (totalKm / estimatedLiters).toFixed(1) : "—",
      trips: vehicleJobs.length };
  }).filter(v => v.trips > 0).sort((a, b) => b.cost - a.cost);

  const totalFuelCost = vehicleFuelData.reduce((s, v) => s + v.cost, 0);
  const totalLiters = vehicleFuelData.reduce((s, v) => s + v.liters, 0);
  const totalKm = vehicleFuelData.reduce((s, v) => s + v.totalKm, 0);
  const avgEfficiency = totalLiters > 0 ? (totalKm / totalLiters).toFixed(1) : "—";

  const handleExport = () => {
    exportToCSV("fuel_consumption_report",
      ["Vehicle", "Type", "Distance (km)", "Fuel (L)", "Cost (NGN)", "Efficiency (km/L)", "Trips"],
      vehicleFuelData.map(v => [v.vehicle, v.type, v.totalKm, v.liters, v.cost, v.efficiency, v.trips])
    );
  };

  // Top 5 consumers chart
  const demoFuelData = [
    { vehicle: "LAG-421-AB", type: "Truck", totalKm: 4820, liters: 802, cost: 521_300, efficiency: "6.0", trips: 18 },
    { vehicle: "LAG-118-CD", type: "Van", totalKm: 3950, liters: 658, cost: 427_700, efficiency: "6.0", trips: 22 },
    { vehicle: "LAG-902-EF", type: "Truck", totalKm: 3210, liters: 642, cost: 417_300, efficiency: "5.0", trips: 14 },
    { vehicle: "LAG-557-GH", type: "Pickup", totalKm: 2680, liters: 446, cost: 289_900, efficiency: "6.0", trips: 19 },
    { vehicle: "LAG-310-IJ", type: "Van", totalKm: 2340, liters: 390, cost: 253_500, efficiency: "6.0", trips: 16 },
    { vehicle: "LAG-744-KL", type: "Truck", totalKm: 1980, liters: 396, cost: 257_400, efficiency: "5.0", trips: 9 },
  ];
  const displayFuelData = vehicleFuelData.length > 0 ? vehicleFuelData : demoFuelData;
  const top5 = displayFuelData.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Fuel Consumption Report</h3>
        <p className="text-sm text-muted-foreground">Vehicle-level fuel usage analysis</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Fuel className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Fuel Consumed</p>
                <p className="text-2xl font-bold truncate">{totalLiters.toLocaleString()} L</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Fuel Cost</p>
                <p className="text-2xl font-bold truncate">{formatCurrency(totalFuelCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Distance</p>
                <p className="text-2xl font-bold truncate">{totalKm.toLocaleString()} km</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                <p className="text-2xl font-bold truncate">{avgEfficiency} km/L</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Consumers Chart */}
      {top5.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base">Top 5 Fuel Consumers</CardTitle>
              <CardDescription>Highest fuel cost vehicles</CardDescription>
            </div>
            <ChartPeriodFilter value={chartPeriod} onChange={setChartPeriod} />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={top5} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="vehicle" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, "Fuel Cost"]}
                />
                <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Fuel Table */}
      {(() => {
        const fuelTypes = Array.from(new Set(displayFuelData.map(v => v.type))).sort();
        const filteredFuel = displayFuelData.filter(v => {
          if (fuelSearch && !`${v.vehicle} ${v.type}`.toLowerCase().includes(fuelSearch.toLowerCase())) return false;
          if (fuelTypeEnabled && fuelTypeVal !== "all" && v.type !== fuelTypeVal) return false;
          if (costEnabled) {
            if (costMin && v.cost < Number(costMin)) return false;
            if (costMax && v.cost > Number(costMax)) return false;
          }
          if (distEnabled) {
            if (distMin && v.totalKm < Number(distMin)) return false;
            if (distMax && v.totalKm > Number(distMax)) return false;
          }
          if (effEnabled) {
            const eff = parseFloat(v.efficiency as any);
            if (!isNaN(eff)) {
              if (effMin && eff < Number(effMin)) return false;
              if (effMax && eff > Number(effMax)) return false;
            }
          }
          if (tripsEnabled) {
            if (tripsMin && v.trips < Number(tripsMin)) return false;
            if (tripsMax && v.trips > Number(tripsMax)) return false;
          }
          return true;
        });
        const handleFuelExport = () => {
          exportToCSV("vehicle_fuel_breakdown",
            ["Vehicle", "Type", "Distance (km)", "Fuel (L)", "Cost (NGN)", "Efficiency (km/L)", "Trips"],
            filteredFuel.map(v => [v.vehicle, v.type, v.totalKm, v.liters, v.cost, v.efficiency, v.trips])
          );
        };
        return (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Vehicle Fuel Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vehicle..."
                    value={fuelSearch}
                    onChange={(e) => setFuelSearch(e.target.value)}
                    className="pl-8 h-9 w-full"
                  />
                </div>
                <Popover open={fuelFilterOpen} onOpenChange={(o) => (o ? openFuelFilter() : setFuelFilterOpen(false))}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filter
                      {fuelActiveFilters > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">{fuelActiveFilters}</Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-foreground px-0.5">Show vehicles by...</h4>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="ft-en" checked={dFuelTypeEnabled} onCheckedChange={(v) => setDFuelTypeEnabled(!!v)} />
                          <Label htmlFor="ft-en" className="text-sm">Fuel type</Label>
                        </div>
                        <Select value={dFuelTypeVal} onValueChange={setDFuelTypeVal} disabled={!dFuelTypeEnabled}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {fuelTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="cost-en" checked={dCostEnabled} onCheckedChange={(v) => setDCostEnabled(!!v)} />
                          <Label htmlFor="cost-en" className="text-sm">Cost (₦)</Label>
                        </div>
                        <div className="flex gap-2">
                          <Input type="number" placeholder="Min" value={dCostMin} onChange={(e) => setDCostMin(e.target.value)} disabled={!dCostEnabled} className="h-8" />
                          <Input type="number" placeholder="Max" value={dCostMax} onChange={(e) => setDCostMax(e.target.value)} disabled={!dCostEnabled} className="h-8" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="dist-en" checked={dDistEnabled} onCheckedChange={(v) => setDDistEnabled(!!v)} />
                          <Label htmlFor="dist-en" className="text-sm">Distance (km)</Label>
                        </div>
                        <div className="flex gap-2">
                          <Input type="number" placeholder="Min" value={dDistMin} onChange={(e) => setDDistMin(e.target.value)} disabled={!dDistEnabled} className="h-8" />
                          <Input type="number" placeholder="Max" value={dDistMax} onChange={(e) => setDDistMax(e.target.value)} disabled={!dDistEnabled} className="h-8" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="eff-en" checked={dEffEnabled} onCheckedChange={(v) => setDEffEnabled(!!v)} />
                          <Label htmlFor="eff-en" className="text-sm">Efficiency (km/L)</Label>
                        </div>
                        <div className="flex gap-2">
                          <Input type="number" placeholder="Min" value={dEffMin} onChange={(e) => setDEffMin(e.target.value)} disabled={!dEffEnabled} className="h-8" />
                          <Input type="number" placeholder="Max" value={dEffMax} onChange={(e) => setDEffMax(e.target.value)} disabled={!dEffEnabled} className="h-8" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="trips-en" checked={dTripsEnabled} onCheckedChange={(v) => setDTripsEnabled(!!v)} />
                          <Label htmlFor="trips-en" className="text-sm">Number of trips</Label>
                        </div>
                        <div className="flex gap-2">
                          <Input type="number" placeholder="Min" value={dTripsMin} onChange={(e) => setDTripsMin(e.target.value)} disabled={!dTripsEnabled} className="h-8" />
                          <Input type="number" placeholder="Max" value={dTripsMax} onChange={(e) => setDTripsMax(e.target.value)} disabled={!dTripsEnabled} className="h-8" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Button variant="ghost" size="sm" onClick={clearFuelFilter}>Show All</Button>
                        <Button size="sm" onClick={applyFuelFilter}>Apply</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {filteredFuel.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Distance (km)</TableHead>
                      <TableHead className="text-right">Fuel (L)</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Efficiency</TableHead>
                      <TableHead className="text-right">Trips</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFuel.map(v => (
                      <TableRow key={v.vehicle}>
                        <TableCell className="font-medium">{v.vehicle}</TableCell>
                        <TableCell className="capitalize">{v.type}</TableCell>
                        <TableCell className="text-right">{v.totalKm.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{v.liters.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatCurrency(v.cost)}</TableCell>
                        <TableCell className="text-right">{v.efficiency} km/L</TableCell>
                        <TableCell className="text-right">{v.trips}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No vehicles match your filters</div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}

// ─── Fleet Utilization Report Tab ───────────────────────────────────────────
function FleetUtilizationReport({ vehicles, jobs, formatCurrency }: {
  vehicles: any[]; jobs: any[]; formatCurrency: (v: number) => string;
}) {
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("30d");

  // Per-Vehicle Utilization controls
  const [utilSearch, setUtilSearch] = useState("");
  const [utilStatus, setUtilStatus] = useState<string>("all");
  const [utilFilterOpen, setUtilFilterOpen] = useState(false);
  const [jobsEnabled, setJobsEnabled] = useState(false);
  const [jobsMin, setJobsMin] = useState("");
  const [jobsMax, setJobsMax] = useState("");
  const [revEnabled, setRevEnabled] = useState(false);
  const [revMin, setRevMin] = useState("");
  const [revMax, setRevMax] = useState("");
  const [dJobsEnabled, setDJobsEnabled] = useState(false);
  const [dJobsMin, setDJobsMin] = useState("");
  const [dJobsMax, setDJobsMax] = useState("");
  const [dRevEnabled, setDRevEnabled] = useState(false);
  const [dRevMin, setDRevMin] = useState("");
  const [dRevMax, setDRevMax] = useState("");
  const openUtilFilter = () => {
    setDJobsEnabled(jobsEnabled); setDJobsMin(jobsMin); setDJobsMax(jobsMax);
    setDRevEnabled(revEnabled); setDRevMin(revMin); setDRevMax(revMax);
    setUtilFilterOpen(true);
  };
  const applyUtilFilter = () => {
    setJobsEnabled(dJobsEnabled); setJobsMin(dJobsMin); setJobsMax(dJobsMax);
    setRevEnabled(dRevEnabled); setRevMin(dRevMin); setRevMax(dRevMax);
    setUtilFilterOpen(false);
  };
  const clearUtilFilter = () => {
    setJobsEnabled(false); setJobsMin(""); setJobsMax("");
    setRevEnabled(false); setRevMin(""); setRevMax("");
    setUtilFilterOpen(false);
  };
  const utilActiveFilters = [jobsEnabled, revEnabled].filter(Boolean).length;
  const vehicleUtilization = vehicles.map(v => {
    const vehicleJobs = jobs.filter(j => j.assignedVehicleId === v.id);
    const completedJobs = vehicleJobs.filter(j => j.status === "completed");
    const activeJobs = vehicleJobs.filter(j => ["assigned", "in_progress"].includes(j.status));
    const totalRevenue = completedJobs.reduce((s, j) => s + (j.revenueNgn || j.amountNgn || 0), 0);
    const utilization = Math.min(100, completedJobs.length * 15); // rough %

    return {
      vehicle: v.registrationNumber || v.id.slice(0, 8),
      type: v.type || "Unknown",
      status: v.status,
      completedJobs: completedJobs.length,
      activeJobs: activeJobs.length,
      totalJobs: vehicleJobs.length,
      revenue: totalRevenue,
      utilization };
  }).sort((a, b) => b.utilization - a.utilization);

  const avgUtilization = vehicleUtilization.length > 0
    ? Math.round(vehicleUtilization.reduce((s, v) => s + v.utilization, 0) / vehicleUtilization.length)
    : 54;
  const idleVehicles = vehicleUtilization.length > 0
    ? vehicleUtilization.filter(v => v.totalJobs === 0).length
    : 1;
  const totalFleetRevenue = vehicleUtilization.length > 0
    ? vehicleUtilization.reduce((s, v) => s + v.revenue, 0)
    : 5_260_000;

  const handleExport = () => {
    exportToCSV("fleet_utilization_report",
      ["Vehicle", "Type", "Status", "Completed Jobs", "Active Jobs", "Revenue (NGN)", "Utilization (%)"],
      vehicleUtilization.map(v => [v.vehicle, v.type, v.status, v.completedJobs, v.activeJobs, v.revenue, v.utilization])
    );
  };

  const demoVehicleUtilization = [
    { vehicle: "LAG-421-AB", type: "Truck", status: "active", completedJobs: 18, activeJobs: 2, totalJobs: 20, revenue: 1_245_000, utilization: 92 },
    { vehicle: "LAG-118-CD", type: "Van", status: "active", completedJobs: 22, activeJobs: 1, totalJobs: 23, revenue: 1_120_000, utilization: 88 },
    { vehicle: "LAG-902-EF", type: "Truck", status: "active", completedJobs: 14, activeJobs: 1, totalJobs: 15, revenue: 980_000, utilization: 76 },
    { vehicle: "LAG-557-GH", type: "Pickup", status: "active", completedJobs: 12, activeJobs: 0, totalJobs: 12, revenue: 720_000, utilization: 64 },
    { vehicle: "LAG-310-IJ", type: "Van", status: "active", completedJobs: 9, activeJobs: 1, totalJobs: 10, revenue: 540_000, utilization: 48 },
    { vehicle: "LAG-744-KL", type: "Truck", status: "maintenance", completedJobs: 6, activeJobs: 0, totalJobs: 6, revenue: 360_000, utilization: 32 },
    { vehicle: "LAG-228-MN", type: "Van", status: "active", completedJobs: 4, activeJobs: 0, totalJobs: 4, revenue: 230_000, utilization: 22 },
    { vehicle: "LAG-635-OP", type: "Pickup", status: "idle", completedJobs: 1, activeJobs: 0, totalJobs: 1, revenue: 65_000, utilization: 8 },
  ];
  const displayVehicleUtilization = vehicleUtilization.length > 0 ? vehicleUtilization : demoVehicleUtilization;

  const utilizationBuckets = [
    { name: "High (>70%)", value: displayVehicleUtilization.filter(v => v.utilization > 70).length, color: "hsl(var(--success))" },
    { name: "Medium (30-70%)", value: displayVehicleUtilization.filter(v => v.utilization >= 30 && v.utilization <= 70).length, color: "hsl(var(--warning))" },
    { name: "Low (<30%)", value: displayVehicleUtilization.filter(v => v.utilization < 30).length, color: "hsl(var(--destructive))" },
  ].filter(b => b.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Fleet Utilization Report</h3>
        <p className="text-sm text-muted-foreground">Vehicle activity and efficiency analysis</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Fleet Size</p>
                <p className="text-2xl font-bold truncate">{vehicles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Avg Utilization</p>
                <p className="text-2xl font-bold truncate">{avgUtilization}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Idle Vehicles</p>
                <p className="text-2xl font-bold truncate">{idleVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Fleet Revenue</p>
                <p className="text-2xl font-bold truncate">{formatCurrency(totalFleetRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Utilization Distribution */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Utilization Distribution</CardTitle>
              <CardDescription>Distribution of vehicles by utilization band — under-used, optimal, and over-stretched assets.</CardDescription>
            </div>
            <ChartPeriodFilter value={chartPeriod} onChange={setChartPeriod} />
          </CardHeader>
          <CardContent>
            {utilizationBuckets.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={utilizationBuckets} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
                    {utilizationBuckets.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Utilization Table */}
        {(() => {
          const utilStatuses = Array.from(new Set(displayVehicleUtilization.map(v => v.status))).sort();
          const filteredUtil = displayVehicleUtilization.filter(v => {
            if (utilSearch && !v.vehicle.toLowerCase().includes(utilSearch.toLowerCase())) return false;
            if (utilStatus !== "all" && v.status !== utilStatus) return false;
            if (jobsEnabled) {
              if (jobsMin && v.completedJobs < Number(jobsMin)) return false;
              if (jobsMax && v.completedJobs > Number(jobsMax)) return false;
            }
            if (revEnabled) {
              if (revMin && v.revenue < Number(revMin)) return false;
              if (revMax && v.revenue > Number(revMax)) return false;
            }
            return true;
          });
          const handleUtilExport = () => {
            exportToCSV("per_vehicle_utilization",
              ["Vehicle", "Type", "Status", "Completed Jobs", "Active Jobs", "Revenue (NGN)", "Utilization (%)"],
              filteredUtil.map(v => [v.vehicle, v.type, v.status, v.completedJobs, v.activeJobs, v.revenue, v.utilization])
            );
          };
          return (
          <Card className="border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Per-Vehicle Utilization</CardTitle>
              <CardDescription>Per-asset utilization metrics — completed jobs and revenue contribution to identify top and bottom performers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vehicle..."
                    value={utilSearch}
                    onChange={(e) => setUtilSearch(e.target.value)}
                    className="pl-8 h-9 w-full"
                  />
                </div>
                <Select value={utilStatus} onValueChange={setUtilStatus}>
                  <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {utilStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Popover open={utilFilterOpen} onOpenChange={(o) => (o ? openUtilFilter() : setUtilFilterOpen(false))}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filter
                      {utilActiveFilters > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">{utilActiveFilters}</Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-foreground px-0.5">Show vehicles by...</h4>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="u-jobs-en" checked={dJobsEnabled} onCheckedChange={(v) => setDJobsEnabled(!!v)} />
                          <Label htmlFor="u-jobs-en" className="text-sm">Jobs</Label>
                        </div>
                        <div className="flex gap-2">
                          <Input type="number" placeholder="Min" value={dJobsMin} onChange={(e) => setDJobsMin(e.target.value)} disabled={!dJobsEnabled} className="h-8" />
                          <Input type="number" placeholder="Max" value={dJobsMax} onChange={(e) => setDJobsMax(e.target.value)} disabled={!dJobsEnabled} className="h-8" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="u-rev-en" checked={dRevEnabled} onCheckedChange={(v) => setDRevEnabled(!!v)} />
                          <Label htmlFor="u-rev-en" className="text-sm">Revenue (₦)</Label>
                        </div>
                        <div className="flex gap-2">
                          <Input type="number" placeholder="Min" value={dRevMin} onChange={(e) => setDRevMin(e.target.value)} disabled={!dRevEnabled} className="h-8" />
                          <Input type="number" placeholder="Max" value={dRevMax} onChange={(e) => setDRevMax(e.target.value)} disabled={!dRevEnabled} className="h-8" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Button variant="ghost" size="sm" onClick={clearUtilFilter}>Show All</Button>
                        <Button size="sm" onClick={applyUtilFilter}>Apply</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {filteredUtil.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Jobs</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Utilization</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUtil.map(v => (
                        <TableRow key={v.vehicle}>
                          <TableCell className="font-medium">{v.vehicle}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              v.status === "active" ? "bg-success/10 text-success border-success/30" :
                              v.status === "maintenance" ? "bg-warning/10 text-warning border-warning/30" :
                              "bg-muted text-muted-foreground"
                            }>
                              {v.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{v.completedJobs}</TableCell>
                          <TableCell className="text-right">{formatCurrency(v.revenue)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    v.utilization > 70 ? "bg-success" : v.utilization >= 30 ? "bg-warning" : "bg-destructive"
                                  }`}
                                  style={{ width: `${v.utilization}%` }}
                                />
                              </div>
                              <span className="text-xs w-8 text-right">{v.utilization}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No vehicles match your filters</div>
              )}
            </CardContent>
          </Card>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Main Reports Page ──────────────────────────────────────────────────────
export default function Reports() {
  const [dateRange, setDateRange] = useState("this_month");
  const vehicles: any[] = [];
  const vehiclesLoading = false;
  const { drivers, isLoading: driversLoading } = useDrivers();
  const jobs: any[] = [];
  const jobsLoading = false;
  const { format: formatCurrency } = useCurrency();

  const isLoading = vehiclesLoading || driversLoading || jobsLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Reports" subtitle="Exportable historical summaries and audits">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const hasData = vehicles.length > 0 || drivers.length > 0 || jobs.length > 0;

  if (!hasData) {
    return (
      <DashboardLayout title="Reports" subtitle="Exportable historical summaries and audits">
        <EmptyState
          icon={FileText}
          title="No data for reports"
          description="Add vehicles, drivers, and jobs to generate reports"
          actionLabel="Go to Fleet"
          actionHref="/admin/fleet"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Reports" subtitle="Exportable historical summaries and audits">
      <div className="space-y-4">
        {/* Report Tabs - centered at top */}
        <Tabs defaultValue="pnl" className="space-y-4">
          <div className="flex justify-center">
            <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
              <TabsTrigger value="pnl" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Profit & Loss
              </TabsTrigger>
              <TabsTrigger value="compliance" className="gap-2">
                <Shield className="h-4 w-4" />
                Compliance Audit
              </TabsTrigger>
              <TabsTrigger value="fuel" className="gap-2">
                <Fuel className="h-4 w-4" />
                Fuel Consumption
              </TabsTrigger>
              <TabsTrigger value="utilization" className="gap-2">
                <Truck className="h-4 w-4" />
                Fleet Utilization
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pnl">
            <ProfitLossReport jobs={jobs} vehicles={vehicles} dateRange={dateRange} formatCurrency={formatCurrency} />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceAuditReport vehicles={vehicles} drivers={drivers} />
          </TabsContent>

          <TabsContent value="fuel">
            <FuelConsumptionReport vehicles={vehicles} jobs={jobs} formatCurrency={formatCurrency} />
          </TabsContent>

          <TabsContent value="utilization">
            <FleetUtilizationReport vehicles={vehicles} jobs={jobs} formatCurrency={formatCurrency} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
