import type { ChartPeriod } from "@/features/analytics/components/ui/ChartPeriodFilter";
import type { FleetProfitLoss } from "@truckmoov/api/fleet";
import { useQuery } from "@tanstack/react-query";
import { getFleetProfitLossQueryOptions } from "@truckmoov/api/fleet";
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
import { AnalyticsGate } from "@/features/analytics/components/ui/AnalyticsGate";
import { ChartPeriodFilter } from "@/features/analytics/components/ui/ChartPeriodFilter";
import { ExportCsvButton } from "@/features/analytics/components/ui/ExportCsvButton";
import { formatMonthLabel, periodLabel, periodToRange } from "@/features/analytics/utils/period";
import { formatCurrency } from "@/lib/currency";

export default function ProfitLossPage() {
  const [
    period,
    setPeriod,
  ] = useState<ChartPeriod>("30d");
  const query = useQuery(getFleetProfitLossQueryOptions({ params: periodToRange(period) }));
  const report = query.data?.data;

  return (
    <AnalyticsGate
      isPending={query.isPending}
      isError={query.isError}
      onRetry={() => query.refetch()}
      hasData
    >
      {report && (
        <div className={query.isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
          <ProfitLossReport
            report={report}
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>
      )}
    </AnalyticsGate>
  );
}

function ProfitLossReport({
  report, period, onPeriodChange,
}: {
  report: FleetProfitLoss; period: ChartPeriod; onPeriodChange: (v: ChartPeriod) => void;
}) {
  const {
    revenue: totalRevenue, totalCosts, netProfit, marginPercent, deliveredJobs, costs,
  } = report.summary;
  const displayMonthlyData = report.monthly.map(m => ({
    ...m,
    month: formatMonthLabel(m.month),
  }));

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Profit & Loss Summary</h3>
          <p className="text-sm text-muted-foreground">{periodLabel(period)}</p>
        </div>
        <ChartPeriodFilter
          value={period}
          onChange={onPeriodChange}
        />
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
                  {deliveredJobs}
                  {" "}
                  delivered jobs
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
                <p className="text-xs text-muted-foreground">
                  Fuel
                  {" "}
                  {formatCurrency(costs.fuel)}
                  {" · "}
                  Maintenance
                  {" "}
                  {formatCurrency(costs.maintenance)}
                  {" · "}
                  Wages
                  {" "}
                  {formatCurrency(costs.wages)}
                  {" · "}
                  Other
                  {" "}
                  {formatCurrency(costs.insurance + costs.depreciation + costs.other)}
                </p>
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
                <p className={`text-2xl font-bold ${marginPercent >= 0 ? "text-success" : "text-destructive"}`}>
                  {marginPercent.toFixed(1)}
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
          <CardDescription>6-month trend, to the end of the selected period</CardDescription>
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
            <ExportCsvButton
              rows={filteredMonthly}
              filename="profit-loss-monthly"
              columns={[
                {
                  header: "Month", accessor: "month",
                },
                {
                  header: "Revenue (NGN)", accessor: "revenue",
                },
                {
                  header: "Costs (NGN)", accessor: "costs",
                },
                {
                  header: "Net profit (NGN)", accessor: "profit",
                },
                {
                  header: "Margin (%)", accessor: "marginPercent",
                },
              ]}
            />
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
