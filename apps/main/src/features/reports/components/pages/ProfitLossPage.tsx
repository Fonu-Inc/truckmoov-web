import { useQuery } from "@tanstack/react-query";
import { getJobsQueryOptions } from "@truckmoov/api/dispatch";
import { getVehiclesQueryOptions } from "@truckmoov/api/fleet";
import {
  endOfMonth, formatMonthYear, getDateRange, isWithinRange, startOfMonth, subMonths,
} from "@truckmoov/app-core/utils/time-utils";
import {
  DollarSign, Percent, Search, SlidersHorizontal, TrendingDown, TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ReportsGate } from "@/features/reports/components/ui/ReportsGate";

export default function ProfitLossPage() {
  const { format: formatCurrency } = useCurrency();
  const [dateRange] = useState("this_month");
  const vehiclesQuery = useQuery(getVehiclesQueryOptions());
  const jobsQuery = useQuery(getJobsQueryOptions());
  const vehicles = vehiclesQuery.data?.data ?? [];
  const jobs = jobsQuery.data?.data ?? [];
  const isPending = vehiclesQuery.isPending || jobsQuery.isPending;
  const hasData = vehicles.length > 0 || jobs.length > 0;

  return (
    <ReportsGate
      isPending={isPending}
      hasData={hasData}
    >
      <ProfitLossReport
        jobs={jobs}
        vehicles={vehicles}
        dateRange={dateRange}
        formatCurrency={formatCurrency}
      />
    </ReportsGate>
  );
}

function ProfitLossReport({
  jobs, vehicles, dateRange, formatCurrency,
}: {
  jobs: any[]; vehicles: any[]; dateRange: string; formatCurrency: (v: number) => string;
}) {
  const {
    start, end,
  } = getDateRange(dateRange);

  const filteredJobs = jobs.filter((j) => {
    const d = new Date(j.createdAt);
    return isWithinRange(
      d,
      start,
      end,
    );
  });

  const completedJobs = filteredJobs.filter(j => j.status === "completed");
  const totalRevenue = completedJobs.reduce(
    (s, j) => s + (j.revenueNgn || j.amountNgn || 0),
    0,
  );
  const totalFuelCost = completedJobs.reduce(
    (s, j) => s + (j.fuelCostNgn || 0),
    0,
  );
  const totalMaintenanceCost = vehicles.reduce(
    (s, v) => s + (v.maintenanceCostNgn || 0),
    0,
  );
  const totalWages = completedJobs.length * 15000; // Estimated per-trip wage
  const totalCosts = totalFuelCost + totalMaintenanceCost + totalWages;
  const netProfit = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const monthlyData = Array.from(
    { length: 6 },
    (_, i) => {
      const monthDate = subMonths(
        new Date(),
        5 - i,
      );
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthJobs = completedJobs.filter((j) => {
        const d = new Date(j.createdAt);
        return isWithinRange(
          d,
          monthStart,
          monthEnd,
        );
      });
      const rev = monthJobs.reduce(
        (s, j) => s + (j.revenueNgn || j.amountNgn || 0),
        0,
      );
      const cost = monthJobs.length * 15000 + monthJobs.reduce(
        (s, j) => s + (j.fuelCostNgn || 0),
        0,
      );
      return {
        month: formatMonthYear(monthDate),
        revenue: rev,
        costs: cost,
        profit: rev - cost,
      };
    },
  );

  const hasRealMonthly = monthlyData.some(m => m.revenue > 0 || m.costs > 0);
  const demoMonthlyData = Array.from(
    { length: 6 },
    (_, i) => {
      const monthDate = subMonths(
        new Date(),
        5 - i,
      );
      const base = 850_000 + Math.round(Math.sin(i * 0.9) * 180_000) + i * 35_000;
      const cost = Math.round(base * (0.55 + Math.cos(i * 1.1) * 0.07));
      return {
        month: formatMonthYear(monthDate), revenue: base, costs: cost, profit: base - cost,
      };
    },
  );
  const displayMonthlyData = hasRealMonthly ? monthlyData : demoMonthlyData;

  const [
    tableSearch,
    setTableSearch,
  ] = useState("");
  const [
    revenueEnabled,
    setRevenueEnabled,
  ] = useState(false);
  const [
    revenueMin,
    setRevenueMin,
  ] = useState("");
  const [
    revenueMax,
    setRevenueMax,
  ] = useState("");
  const [
    costsEnabled,
    setCostsEnabled,
  ] = useState(false);
  const [
    costsMin,
    setCostsMin,
  ] = useState("");
  const [
    costsMax,
    setCostsMax,
  ] = useState("");
  const [
    profitEnabled,
    setProfitEnabled,
  ] = useState(false);
  const [
    profitMin,
    setProfitMin,
  ] = useState("");
  const [
    profitMax,
    setProfitMax,
  ] = useState("");
  const [
    marginEnabled,
    setMarginEnabled,
  ] = useState(false);
  const [
    marginMin,
    setMarginMin,
  ] = useState("");
  const [
    marginMax,
    setMarginMax,
  ] = useState("");

  const [
    draftRevenueEnabled,
    setDraftRevenueEnabled,
  ] = useState(false);
  const [
    draftRevenueMin,
    setDraftRevenueMin,
  ] = useState("");
  const [
    draftRevenueMax,
    setDraftRevenueMax,
  ] = useState("");
  const [
    draftCostsEnabled,
    setDraftCostsEnabled,
  ] = useState(false);
  const [
    draftCostsMin,
    setDraftCostsMin,
  ] = useState("");
  const [
    draftCostsMax,
    setDraftCostsMax,
  ] = useState("");
  const [
    draftProfitEnabled,
    setDraftProfitEnabled,
  ] = useState(false);
  const [
    draftProfitMin,
    setDraftProfitMin,
  ] = useState("");
  const [
    draftProfitMax,
    setDraftProfitMax,
  ] = useState("");
  const [
    draftMarginEnabled,
    setDraftMarginEnabled,
  ] = useState(false);
  const [
    draftMarginMin,
    setDraftMarginMin,
  ] = useState("");
  const [
    draftMarginMax,
    setDraftMarginMax,
  ] = useState("");
  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);

  const activeFilterCount
    = (revenueEnabled ? 1 : 0)
      + (costsEnabled ? 1 : 0)
      + (profitEnabled ? 1 : 0)
      + (marginEnabled ? 1 : 0);

  const filteredMonthly = displayMonthlyData.filter((m) => {
    if (tableSearch && !m.month.toLowerCase().includes(tableSearch.toLowerCase()))
      return false;
    const num = (s: string) => (s === "" ? null : Number(s));
    if (revenueEnabled) {
      const min = num(revenueMin);
      const max = num(revenueMax);
      if (min !== null && m.revenue < min)
        return false;
      if (max !== null && m.revenue > max)
        return false;
    }
    if (costsEnabled) {
      const min = num(costsMin);
      const max = num(costsMax);
      if (min !== null && m.costs < min)
        return false;
      if (max !== null && m.costs > max)
        return false;
    }
    if (profitEnabled) {
      const min = num(profitMin);
      const max = num(profitMax);
      if (min !== null && m.profit < min)
        return false;
      if (max !== null && m.profit > max)
        return false;
    }
    if (marginEnabled) {
      const margin = m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0;
      const min = num(marginMin);
      const max = num(marginMax);
      if (min !== null && margin < min)
        return false;
      if (max !== null && margin > max)
        return false;
    }
    return true;
  });

  const openFilter = () => {
    setDraftRevenueEnabled(revenueEnabled);
    setDraftRevenueMin(revenueMin);
    setDraftRevenueMax(revenueMax);
    setDraftCostsEnabled(costsEnabled);
    setDraftCostsMin(costsMin);
    setDraftCostsMax(costsMax);
    setDraftProfitEnabled(profitEnabled);
    setDraftProfitMin(profitMin);
    setDraftProfitMax(profitMax);
    setDraftMarginEnabled(marginEnabled);
    setDraftMarginMin(marginMin);
    setDraftMarginMax(marginMax);
    setFilterOpen(true);
  };
  const applyFilter = () => {
    setRevenueEnabled(draftRevenueEnabled);
    setRevenueMin(draftRevenueMin);
    setRevenueMax(draftRevenueMax);
    setCostsEnabled(draftCostsEnabled);
    setCostsMin(draftCostsMin);
    setCostsMax(draftCostsMax);
    setProfitEnabled(draftProfitEnabled);
    setProfitMin(draftProfitMin);
    setProfitMax(draftProfitMax);
    setMarginEnabled(draftMarginEnabled);
    setMarginMin(draftMarginMin);
    setMarginMax(draftMarginMax);
    setFilterOpen(false);
  };
  const clearAll = () => {
    setRevenueEnabled(false);
    setRevenueMin("");
    setRevenueMax("");
    setCostsEnabled(false);
    setCostsMin("");
    setCostsMax("");
    setProfitEnabled(false);
    setProfitMin("");
    setProfitMax("");
    setMarginEnabled(false);
    setMarginMin("");
    setMarginMax("");
    setDraftRevenueEnabled(false);
    setDraftRevenueMin("");
    setDraftRevenueMax("");
    setDraftCostsEnabled(false);
    setDraftCostsMin("");
    setDraftCostsMax("");
    setDraftProfitEnabled(false);
    setDraftProfitMin("");
    setDraftProfitMax("");
    setDraftMarginEnabled(false);
    setDraftMarginMin("");
    setDraftMarginMax("");
    setFilterOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Profit & Loss Summary</h3>
        <p className="text-sm text-muted-foreground">{getDateRange(dateRange).label}</p>
      </div>

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
                <p className="text-xs text-muted-foreground">
                  {completedJobs.length}
                  {" "}
                  completed jobs
                </p>
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
                  {margin.toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Monthly Revenue vs Costs</CardTitle>
          <CardDescription>6-month trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart data={displayMonthlyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [
                  `₦${value.toLocaleString()}`,
                  undefined,
                ]}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="hsl(var(--success))"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
              />
              <Bar
                dataKey="costs"
                name="Costs"
                fill="hsl(var(--destructive))"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
                onChange={e => setTableSearch(e.target.value)}
                className="pl-8 h-9 w-full"
              />
            </div>
            <Popover
              open={filterOpen}
              onOpenChange={o => (o ? openFilter() : setFilterOpen(false))}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80"
                align="end"
              >
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-foreground px-0.5">Only show months by...</h4>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="rev-en"
                        checked={draftRevenueEnabled}
                        onCheckedChange={v => setDraftRevenueEnabled(!!v)}
                      />
                      <Label
                        htmlFor="rev-en"
                        className="text-sm"
                      >
                        Revenue (₦)
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={draftRevenueMin}
                        onChange={e => setDraftRevenueMin(e.target.value)}
                        disabled={!draftRevenueEnabled}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={draftRevenueMax}
                        onChange={e => setDraftRevenueMax(e.target.value)}
                        disabled={!draftRevenueEnabled}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="cost-en"
                        checked={draftCostsEnabled}
                        onCheckedChange={v => setDraftCostsEnabled(!!v)}
                      />
                      <Label
                        htmlFor="cost-en"
                        className="text-sm"
                      >
                        Costs (₦)
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={draftCostsMin}
                        onChange={e => setDraftCostsMin(e.target.value)}
                        disabled={!draftCostsEnabled}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={draftCostsMax}
                        onChange={e => setDraftCostsMax(e.target.value)}
                        disabled={!draftCostsEnabled}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="prof-en"
                        checked={draftProfitEnabled}
                        onCheckedChange={v => setDraftProfitEnabled(!!v)}
                      />
                      <Label
                        htmlFor="prof-en"
                        className="text-sm"
                      >
                        Net Profit (₦)
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={draftProfitMin}
                        onChange={e => setDraftProfitMin(e.target.value)}
                        disabled={!draftProfitEnabled}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={draftProfitMax}
                        onChange={e => setDraftProfitMax(e.target.value)}
                        disabled={!draftProfitEnabled}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="mar-en"
                        checked={draftMarginEnabled}
                        onCheckedChange={v => setDraftMarginEnabled(!!v)}
                      />
                      <Label
                        htmlFor="mar-en"
                        className="text-sm"
                      >
                        Margin (%)
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={draftMarginMin}
                        onChange={e => setDraftMarginMin(e.target.value)}
                        disabled={!draftMarginEnabled}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={draftMarginMax}
                        onChange={e => setDraftMarginMax(e.target.value)}
                        disabled={!draftMarginEnabled}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={applyFilter}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={clearAll}
                    >
                      Show All
                    </Button>
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
              {filteredMonthly.map(m => (
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
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
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
