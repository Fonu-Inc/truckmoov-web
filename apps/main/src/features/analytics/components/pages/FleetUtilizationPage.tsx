import type { ChartPeriod } from "@/features/analytics/components/ui/ChartPeriodFilter";
import { useQuery } from "@tanstack/react-query";
import { getJobsQueryOptions } from "@truckmoov/api/dispatch";
import { getVehiclesQueryOptions } from "@truckmoov/api/fleet";
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
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { useCurrency } from "@/contexts/CurrencyContext";
import { AnalyticsGate } from "@/features/analytics/components/ui/AnalyticsGate";
import { ChartPeriodFilter } from "@/features/analytics/components/ui/ChartPeriodFilter";

export default function FleetUtilizationPage() {
  const { format: formatCurrency } = useCurrency();
  const vehiclesQuery = useQuery(getVehiclesQueryOptions());
  const jobsQuery = useQuery(getJobsQueryOptions());
  const vehicles = vehiclesQuery.data?.data ?? [];
  const jobs = jobsQuery.data?.data ?? [];
  const isPending = vehiclesQuery.isPending || jobsQuery.isPending;
  const hasData = vehicles.length > 0 || jobs.length > 0;

  return (
    <AnalyticsGate
      isPending={isPending}
      hasData={hasData}
    >
      <FleetUtilizationReport
        vehicles={vehicles}
        jobs={jobs}
        formatCurrency={formatCurrency}
      />
    </AnalyticsGate>
  );
}

function FleetUtilizationReport({
  vehicles, jobs, formatCurrency,
}: {
  vehicles: any[]; jobs: any[]; formatCurrency: (v: number) => string;
}) {
  const [
    chartPeriod,
    setChartPeriod,
  ] = useState<ChartPeriod>("30d");

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

  const vehicleUtilization = vehicles.map((v) => {
    const vehicleJobs = jobs.filter(j => j.assignedVehicleId === v.id);
    const completedJobs = vehicleJobs.filter(j => j.status === "completed");
    const activeJobs = vehicleJobs.filter(j => [
      "assigned",
      "in_progress",
    ].includes(j.status));
    const totalRevenue = completedJobs.reduce(
      (s, j) => s + (j.revenueNgn || j.amountNgn || 0),
      0,
    );
    const utilization = Math.min(
      100,
      completedJobs.length * 15,
    );

    return {
      vehicle: v.registrationNumber || v.id.slice(
        0,
        8,
      ),
      type: v.type || "Unknown",
      status: v.status,
      completedJobs: completedJobs.length,
      activeJobs: activeJobs.length,
      totalJobs: vehicleJobs.length,
      revenue: totalRevenue,
      utilization,
    };
  }).sort((a, b) => b.utilization - a.utilization);

  const avgUtilization = vehicleUtilization.length > 0
    ? Math.round(vehicleUtilization.reduce(
        (s, v) => s + v.utilization,
        0,
      ) / vehicleUtilization.length)
    : 0;
  const idleVehicles = vehicleUtilization.filter(v => v.totalJobs === 0).length;
  const totalFleetRevenue = vehicleUtilization.reduce(
    (s, v) => s + v.revenue,
    0,
  );

  const displayVehicleUtilization = vehicleUtilization;

  const utilizationBuckets = [
    {
      name: "High (>70%)", value: displayVehicleUtilization.filter(v => v.utilization > 70).length, color: "hsl(var(--success))",
    },
    {
      name: "Medium (30-70%)", value: displayVehicleUtilization.filter(v => v.utilization >= 30 && v.utilization <= 70).length, color: "hsl(var(--warning))",
    },
    {
      name: "Low (<30%)", value: displayVehicleUtilization.filter(v => v.utilization < 30).length, color: "hsl(var(--destructive))",
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
      <div>
        <h3 className="text-lg font-semibold">Fleet Utilization Report</h3>
        <p className="text-sm text-muted-foreground">Vehicle activity and efficiency analysis</p>
      </div>

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
                <p className="text-2xl font-bold truncate">
                  {avgUtilization}
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
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Utilization Distribution</CardTitle>
              <CardDescription>Distribution of vehicles by utilization band — under-used, optimal, and over-stretched assets.</CardDescription>
            </div>
            <ChartPeriodFilter
              value={chartPeriod}
              onChange={setChartPeriod}
            />
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
            </div>
            {filteredUtil.length > 0
              ? (
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
                              <Badge
                                variant="outline"
                                className={
                                  v.status === "active"
                                    ? "bg-success/10 text-success border-success/30"
                                    : v.status === "maintenance"
                                      ? "bg-warning/10 text-warning border-warning/30"
                                      : "bg-muted text-muted-foreground"
                                }
                              >
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
                                <span className="text-xs w-8 text-right">
                                  {v.utilization}
                                  %
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              : (
                  <div className="text-center py-8 text-muted-foreground">No vehicles match your filters</div>
                )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
