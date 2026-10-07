import type { ColumnDef } from "@tanstack/react-table";
import type { FleetUtilization } from "@truckmoov/api/fleet";
import type { ChartPeriod } from "@/features/analytics/components/ui/ChartPeriodFilter";
import { useQuery } from "@tanstack/react-query";
import { getFleetUtilizationReportQueryOptions } from "@truckmoov/api/fleet";
import {
  Clock, DollarSign, Search, SlidersHorizontal, TrendingUp, Truck,
} from "lucide-react";
import { useState } from "react";
import {
  Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip,
} from "recharts";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { AnalyticsGate } from "@/features/analytics/components/ui/AnalyticsGate";
import { ChartPeriodFilter } from "@/features/analytics/components/ui/ChartPeriodFilter";
import { ExportCsvButton } from "@/features/analytics/components/ui/ExportCsvButton";
import {
  periodLabel, periodToRange,
} from "@/features/analytics/utils/period";
import { formatCurrency } from "@/lib/currency";

type UtilizationRow = {
  vehicle: string; status: string; completedJobs: number; revenue: number; utilization: number;
};

const UTILIZATION_COLUMNS: ColumnDef<UtilizationRow>[] = [
  {
    accessorKey: "vehicle",
    header: "Vehicle",
    cell: ({ row }) => <span className="font-medium">{row.original.vehicle}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status } = row.original;
      return (
        <Badge
          variant="outline"
          className={
            status === "active"
              ? "bg-success/10 text-success border-success/30"
              : status === "maintenance"
                ? "bg-warning/10 text-warning border-warning/30"
                : "bg-muted text-muted-foreground"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "completedJobs",
    header: "Jobs",
    meta: { className: "text-right" },
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    meta: { className: "text-right" },
    cell: ({ row }) => formatCurrency(row.original.revenue),
  },
  {
    accessorKey: "utilization",
    header: "Utilization",
    meta: { className: "text-right" },
    cell: ({ row }) => {
      const { utilization } = row.original;
      return (
        <div className="flex items-center gap-2 justify-end">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                utilization > 70 ? "bg-success" : utilization >= 30 ? "bg-warning" : "bg-destructive"
              }`}
              style={{ width: `${utilization}%` }}
            />
          </div>
          <span className="text-xs w-8 text-right">
            {utilization}
            %
          </span>
        </div>
      );
    },
  },
];

export default function FleetUtilizationPage() {
  const [
    chartPeriod,
    setChartPeriod,
  ] = useState<ChartPeriod>("30d");
  const query = useQuery(getFleetUtilizationReportQueryOptions({ params: periodToRange(chartPeriod) }));
  const report = query.data?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Fleet Utilization Report</h3>
          <p className="text-sm text-muted-foreground">
            {periodLabel(chartPeriod)}
            {" · utilization is the share of days with a job on the vehicle"}
          </p>
        </div>
        <ChartPeriodFilter
          value={chartPeriod}
          onChange={setChartPeriod}
        />
      </div>
      <AnalyticsGate
        isPending={query.isPending}
        isError={query.isError}
        onRetry={() => query.refetch()}
        hasData={(report?.summary.fleetSize ?? 1) > 0}
      >
        {report && (
          <div className={query.isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
            <FleetUtilizationReport report={report} />
          </div>
        )}
      </AnalyticsGate>
    </div>
  );
}

function FleetUtilizationReport({ report }: { report: FleetUtilization }) {
  const [
    utilSearch,
    setUtilSearch,
  ] = useState("");
  const [
    utilStatus,
    setUtilStatus,
  ] = useState<string>("all");
  const [
    utilFilterOpen,
    setUtilFilterOpen,
  ] = useState(false);
  const [
    jobsEnabled,
    setJobsEnabled,
  ] = useState(false);
  const [
    jobsMin,
    setJobsMin,
  ] = useState("");
  const [
    jobsMax,
    setJobsMax,
  ] = useState("");
  const [
    revEnabled,
    setRevEnabled,
  ] = useState(false);
  const [
    revMin,
    setRevMin,
  ] = useState("");
  const [
    revMax,
    setRevMax,
  ] = useState("");
  const [
    dJobsEnabled,
    setDJobsEnabled,
  ] = useState(false);
  const [
    dJobsMin,
    setDJobsMin,
  ] = useState("");
  const [
    dJobsMax,
    setDJobsMax,
  ] = useState("");
  const [
    dRevEnabled,
    setDRevEnabled,
  ] = useState(false);
  const [
    dRevMin,
    setDRevMin,
  ] = useState("");
  const [
    dRevMax,
    setDRevMax,
  ] = useState("");

  const openUtilFilter = () => {
    setDJobsEnabled(jobsEnabled);
    setDJobsMin(jobsMin);
    setDJobsMax(jobsMax);
    setDRevEnabled(revEnabled);
    setDRevMin(revMin);
    setDRevMax(revMax);
    setUtilFilterOpen(true);
  };
  const applyUtilFilter = () => {
    setJobsEnabled(dJobsEnabled);
    setJobsMin(dJobsMin);
    setJobsMax(dJobsMax);
    setRevEnabled(dRevEnabled);
    setRevMin(dRevMin);
    setRevMax(dRevMax);
    setUtilFilterOpen(false);
  };
  const clearUtilFilter = () => {
    setJobsEnabled(false);
    setJobsMin("");
    setJobsMax("");
    setRevEnabled(false);
    setRevMin("");
    setRevMax("");
    setUtilFilterOpen(false);
  };
  const utilActiveFilters = [
    jobsEnabled,
    revEnabled,
  ].filter(Boolean).length;

  const displayVehicleUtilization = report.vehicles.map(v => ({
    vehicle: v.plateNumber,
    type: v.type ?? "Unknown",
    status: v.status,
    completedJobs: v.completedJobs,
    activeJobs: v.activeJobs,
    totalJobs: v.totalJobs,
    revenue: v.revenue,
    activeDays: v.activeDays,
    utilization: v.utilizationPercent,
  }));
  const {
    fleetSize, avgUtilizationPercent, idleVehicles, fleetRevenue: totalFleetRevenue, highCount, mediumCount, lowCount,
  } = report.summary;

  const utilizationBuckets = [
    {
      name: "High (>70%)", value: highCount, color: "hsl(var(--success))",
    },
    {
      name: "Medium (30-70%)", value: mediumCount, color: "hsl(var(--warning))",
    },
    {
      name: "Low (<30%)", value: lowCount, color: "hsl(var(--destructive))",
    },
  ].filter(b => b.value > 0);

  const utilStatuses = Array.from(new Set(displayVehicleUtilization.map(v => v.status))).sort();
  const filteredUtil = displayVehicleUtilization.filter((v) => {
    if (utilSearch && !v.vehicle.toLowerCase().includes(utilSearch.toLowerCase()))
      return false;
    if (utilStatus !== "all" && v.status !== utilStatus)
      return false;
    if (jobsEnabled) {
      if (jobsMin && v.completedJobs < Number(jobsMin))
        return false;
      if (jobsMax && v.completedJobs > Number(jobsMax))
        return false;
    }
    if (revEnabled) {
      if (revMin && v.revenue < Number(revMin))
        return false;
      if (revMax && v.revenue > Number(revMax))
        return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Fleet Size</p>
                <p className="text-2xl font-bold truncate">{fleetSize}</p>
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
                <p className="text-2xl font-bold truncate">
                  {avgUtilizationPercent}
                  %
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
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Utilization Distribution</CardTitle>
            <CardDescription>Distribution of vehicles by utilization band — under-used, optimal, and over-stretched assets.</CardDescription>
          </CardHeader>
          <CardContent>
            {utilizationBuckets.length > 0
              ? (
                  <ResponsiveContainer
                    width="100%"
                    height={220}
                  >
                    <PieChart>
                      <Pie
                        data={utilizationBuckets}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {utilizationBuckets.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{
                        backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px",
                      }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )
              : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground">No data</div>
                )}
          </CardContent>
        </Card>

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
                  onChange={e => setUtilSearch(e.target.value)}
                  className="pl-8 h-9 w-full"
                />
              </div>
              <Select
                value={utilStatus}
                onValueChange={setUtilStatus}
              >
                <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {utilStatuses.map(s => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="capitalize"
                    >
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover
                open={utilFilterOpen}
                onOpenChange={o => (o ? openUtilFilter() : setUtilFilterOpen(false))}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                    {utilActiveFilters > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 px-1.5"
                      >
                        {utilActiveFilters}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80"
                  align="end"
                >
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-foreground px-0.5">Show vehicles by...</h4>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="u-jobs-en"
                          checked={dJobsEnabled}
                          onCheckedChange={v => setDJobsEnabled(!!v)}
                        />
                        <Label
                          htmlFor="u-jobs-en"
                          className="text-sm"
                        >
                          Jobs
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={dJobsMin}
                          onChange={e => setDJobsMin(e.target.value)}
                          disabled={!dJobsEnabled}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={dJobsMax}
                          onChange={e => setDJobsMax(e.target.value)}
                          disabled={!dJobsEnabled}
                          className="h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="u-rev-en"
                          checked={dRevEnabled}
                          onCheckedChange={v => setDRevEnabled(!!v)}
                        />
                        <Label
                          htmlFor="u-rev-en"
                          className="text-sm"
                        >
                          Revenue (₦)
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={dRevMin}
                          onChange={e => setDRevMin(e.target.value)}
                          disabled={!dRevEnabled}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={dRevMax}
                          onChange={e => setDRevMax(e.target.value)}
                          disabled={!dRevEnabled}
                          className="h-8"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearUtilFilter}
                      >
                        Show All
                      </Button>
                      <Button
                        size="sm"
                        onClick={applyUtilFilter}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <ExportCsvButton
                rows={filteredUtil}
                filename="fleet-utilization"
                columns={[
                  {
                    header: "Vehicle", accessor: "vehicle",
                  },
                  {
                    header: "Status", accessor: "status",
                  },
                  {
                    header: "Completed jobs", accessor: "completedJobs",
                  },
                  {
                    header: "Revenue (NGN)", accessor: "revenue",
                  },
                  {
                    header: "Active days", accessor: "activeDays",
                  },
                  {
                    header: "Utilization (%)", accessor: "utilization",
                  },
                ]}
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <DataTable
                columns={UTILIZATION_COLUMNS}
                data={filteredUtil}
                emptyState="No vehicles match your filters"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
