import type { FleetProfitLoss } from "@truckmoov/api/fleet";
import type { PeriodRange } from "@/features/analytics/utils/period";
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
import { formatMonthLabel } from "@/features/analytics/utils/period";
import { formatCurrency } from "@/lib/currency";

type MonthRow = FleetProfitLoss["monthly"][number];

const COST_LABELS: Record<keyof FleetProfitLoss["summary"]["costs"], string> = {
  fuel: "Fuel",
  maintenance: "Maintenance",
  wages: "Wages",
  insurance: "Insurance",
  depreciation: "Depreciation",
  other: "Other",
};

const COMPACT_NGN = new Intl.NumberFormat(
  "en-NG",
  {
    notation: "compact", maximumFractionDigits: 1,
  },
);

/** ₦1.2M, ₦850k. */
function formatCompactNgn(value: number): string {
  return `₦${COMPACT_NGN.format(value).replace(
    "K",
    "k",
  )}`;
}
type RangeKey = "revenue" | "costs" | "profit" | "margin";
type RangeFilter = {
  enabled: boolean; min: string; max: string;
};
type RangeFilters = Record<RangeKey, RangeFilter>;

const EMPTY_RANGE: RangeFilter = {
  enabled: false, min: "", max: "",
};
const EMPTY_FILTERS: RangeFilters = {
  revenue: EMPTY_RANGE, costs: EMPTY_RANGE, profit: EMPTY_RANGE, margin: EMPTY_RANGE,
};

const RANGE_FIELDS: {
  key: RangeKey; id: string; label: string;
}[] = [
  {
    key: "revenue", id: "rev-en", label: "Revenue (₦)",
  },
  {
    key: "costs", id: "cost-en", label: "Costs (₦)",
  },
  {
    key: "profit", id: "prof-en", label: "Net Profit (₦)",
  },
  {
    key: "margin", id: "mar-en", label: "Margin (%)",
  },
];

function marginOf(m: MonthRow): number {
  return m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0;
}

function rangeValue(m: MonthRow, key: RangeKey): number {
  return key === "margin" ? marginOf(m) : m[key];
}

function pad(n: number): string {
  return String(n).padStart(
    2,
    "0",
  );
}

/** The design app's P&L tab reports "This Month": the 1st of the month to today. */
function thisMonthRange(): PeriodRange {
  const today = new Date();
  const ym = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
  return {
    from: `${ym}-01`, to: `${ym}-${pad(today.getDate())}`,
  };
}

export default function ProfitLossPage() {
  const query = useQuery(getFleetProfitLossQueryOptions({ params: thisMonthRange() }));
  const report = query.data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Profit & Loss Summary</h3>
        <p className="text-sm text-muted-foreground">This Month</p>
      </div>
      <AnalyticsGate
        isPending={query.isPending}
        isError={query.isError}
        onRetry={() => query.refetch()}
        hasData
      >
        {report && <ProfitLossReport report={report} />}
      </AnalyticsGate>
    </div>
  );
}

function ProfitLossReport({ report }: { report: FleetProfitLoss }) {
  const {
    revenue: totalRevenue, totalCosts, netProfit, marginPercent, deliveredJobs,
  } = report.summary;
  const costCategories = Object.entries(report.summary.costs)
    .filter(([
      , amount,
    ]) => amount > 0)
    .map(([key]) => COST_LABELS[key as keyof typeof COST_LABELS])
    .join(" + ");
  const displayMonthlyData = report.monthly.map(m => ({
    ...m,
    month: formatMonthLabel(m.month),
  }));

  const [
    tableSearch,
    setTableSearch,
  ] = useState("");
  const [
    filters,
    setFilters,
  ] = useState<RangeFilters>(EMPTY_FILTERS);
  const [
    draft,
    setDraft,
  ] = useState<RangeFilters>(EMPTY_FILTERS);
  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);

  const activeFilterCount = RANGE_FIELDS.filter(f => filters[f.key].enabled).length;

  const filteredMonthly = displayMonthlyData.filter((m) => {
    if (tableSearch && !m.month.toLowerCase().includes(tableSearch.toLowerCase()))
      return false;
    return RANGE_FIELDS.every(({ key }) => {
      const {
        enabled, min, max,
      } = filters[key];
      if (!enabled)
        return true;
      const value = rangeValue(
        m,
        key,
      );
      if (min !== "" && value < Number(min))
        return false;
      if (max !== "" && value > Number(max))
        return false;
      return true;
    });
  });

  const updateDraft = (key: RangeKey, patch: Partial<RangeFilter>) => setDraft(prev => ({
    ...prev,
    [key]: {
      ...prev[key],
      ...patch,
    },
  }));
  const openFilter = () => {
    setDraft(filters);
    setFilterOpen(true);
  };
  const applyFilter = () => {
    setFilters(draft);
    setFilterOpen(false);
  };
  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setDraft(EMPTY_FILTERS);
    setFilterOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl surface-sleek text-card-foreground border-border/50 bg-success/5">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-success truncate">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">{`${deliveredJobs} completed jobs`}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl surface-sleek text-card-foreground border-border/50 bg-destructive/5">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Costs</p>
                <p className="text-2xl font-bold text-destructive truncate">{formatCurrency(totalCosts)}</p>
                <p className="text-xs text-muted-foreground">{costCategories || "No costs recorded"}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl surface-sleek text-card-foreground border-border/50 bg-primary/5">
          <div className="p-4">
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
          </div>
        </div>
        <div className="rounded-2xl surface-sleek text-card-foreground border-border/50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className={`text-2xl font-bold ${marginPercent >= 0 ? "text-success" : "text-destructive"}`}>
                  {`${marginPercent.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl surface-sleek text-card-foreground border-border/50">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <h3 className="font-semibold tracking-tight text-foreground font-display text-base">Monthly Revenue vs Costs</h3>
          <p className="text-sm text-muted-foreground">6-month trend</p>
        </div>
        <div className="p-6 pt-0">
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
                tickFormatter={formatCompactNgn}
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
        </div>
      </div>

      <div className="rounded-2xl surface-sleek text-card-foreground border-border/50">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <h3 className="font-semibold tracking-tight text-foreground font-display text-base">Monthly Breakdown</h3>
          <p className="text-sm text-muted-foreground">Profit & loss split per month — compare revenue, costs, and net margin to spot trends.</p>
        </div>
        <div className="p-6 pt-0 space-y-4">
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

                  {RANGE_FIELDS.map(({
                    key, id, label,
                  }) => (
                    <div
                      key={key}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={id}
                          checked={draft[key].enabled}
                          onCheckedChange={v => updateDraft(
                            key,
                            { enabled: !!v },
                          )}
                        />
                        <Label
                          htmlFor={id}
                          className="text-sm"
                        >
                          {label}
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={draft[key].min}
                          onChange={e => updateDraft(
                            key,
                            { min: e.target.value },
                          )}
                          disabled={!draft[key].enabled}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={draft[key].max}
                          onChange={e => updateDraft(
                            key,
                            { max: e.target.value },
                          )}
                          disabled={!draft[key].enabled}
                          className="h-8"
                        />
                      </div>
                    </div>
                  ))}

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
              {filteredMonthly.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No months match your filters
                      </TableCell>
                    </TableRow>
                  )
                : filteredMonthly.map(m => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium">{m.month}</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(m.revenue)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(m.costs)}</TableCell>
                      <TableCell className={`text-right font-semibold ${m.profit >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatCurrency(m.profit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.revenue > 0 ? `${marginOf(m).toFixed(1)}%` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
