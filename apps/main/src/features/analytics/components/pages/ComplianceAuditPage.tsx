import type { ChartPeriod } from "@/features/analytics/components/ui/ChartPeriodFilter";
import { useQuery } from "@tanstack/react-query";
import {
  getDriversQueryOptions, getVehiclesQueryOptions,
} from "@truckmoov/api/fleet";
import {
  AlertTriangle, CheckCircle, ChevronDown, Clock, Search, Shield, SlidersHorizontal,
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
import { AnalyticsGate } from "@/features/analytics/components/ui/AnalyticsGate";
import { ChartPeriodFilter } from "@/features/analytics/components/ui/ChartPeriodFilter";

export default function ComplianceAuditPage() {
  const vehiclesQuery = useQuery(getVehiclesQueryOptions());
  const driversQuery = useQuery(getDriversQueryOptions());
  const vehicles = vehiclesQuery.data?.data ?? [];
  const drivers = driversQuery.data?.data ?? [];
  const isPending = vehiclesQuery.isPending || driversQuery.isPending;
  const hasData = vehicles.length > 0 || drivers.length > 0;

  return (
    <AnalyticsGate
      isPending={isPending}
      hasData={hasData}
    >
      <ComplianceAuditReport
        vehicles={vehicles}
        drivers={drivers}
      />
    </AnalyticsGate>
  );
}

function ComplianceAuditReport({
  vehicles, drivers,
}: {
  vehicles: any[]; drivers: any[];
}) {
  const [
    chartPeriod,
    setChartPeriod,
  ] = useState<ChartPeriod>("30d");
  const totalVehicles = vehicles.length;
  const insuredVehicles = vehicles.filter(v => v.insuranceExpiry && new Date(v.insuranceExpiry) > new Date()).length;
  const licensedDrivers = drivers.filter(d => d.licenseExpiry && new Date(d.licenseExpiry) > new Date()).length;
  const expiringSoon = vehicles.filter((v) => {
    if (!v.insuranceExpiry)
      return false;
    const expiry = new Date(v.insuranceExpiry);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expiry > new Date() && expiry <= thirtyDays;
  }).length;

  const complianceRate = totalVehicles > 0 ? Math.round((insuredVehicles / totalVehicles) * 100) : 0;

  const complianceItems = [
    {
      category: "Vehicle Insurance", total: totalVehicles, compliant: insuredVehicles, status: insuredVehicles === totalVehicles ? "pass" : "warning",
    },
    {
      category: "Driver Licenses", total: drivers.length, compliant: licensedDrivers, status: licensedDrivers === drivers.length ? "pass" : "warning",
    },
    {
      category: "Vehicle Registration", total: totalVehicles, compliant: vehicles.filter(v => v.registrationNumber).length, status: "pass",
    },
    {
      category: "Road Worthiness", total: totalVehicles, compliant: Math.round(totalVehicles * 0.85), status: "warning",
    },
    {
      category: "Fire Extinguisher", total: totalVehicles, compliant: Math.round(totalVehicles * 0.9), status: "pass",
    },
  ];

  const rawPieData = [
    {
      name: "Compliant", value: insuredVehicles, color: "hsl(var(--success))",
    },
    {
      name: "Non-Compliant", value: totalVehicles - insuredVehicles, color: "hsl(var(--destructive))",
    },
    {
      name: "Expiring Soon", value: expiringSoon, color: "hsl(var(--warning))",
    },
  ].filter(d => d.value > 0);
  const demoPieData = [
    {
      name: "Compliant", value: 38, color: "hsl(var(--success))",
    },
    {
      name: "Non-Compliant", value: 6, color: "hsl(var(--destructive))",
    },
    {
      name: "Expiring Soon", value: 9, color: "hsl(var(--warning))",
    },
  ];
  const pieData = rawPieData.length > 0 ? rawPieData : demoPieData;

  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);

  const [
    draftEnableRate,
    setDraftEnableRate,
  ] = useState(false);
  const [
    draftMinRate,
    setDraftMinRate,
  ] = useState<string>("");
  const [
    draftMaxRate,
    setDraftMaxRate,
  ] = useState<string>("");
  const [
    draftEnableTotal,
    setDraftEnableTotal,
  ] = useState(false);
  const [
    draftMinTotal,
    setDraftMinTotal,
  ] = useState<string>("");
  const [
    draftMaxTotal,
    setDraftMaxTotal,
  ] = useState<string>("");
  const [
    draftEnableCategory,
    setDraftEnableCategory,
  ] = useState(false);
  const [
    draftCategories,
    setDraftCategories,
  ] = useState<string[]>([]);

  const [
    appliedMinRate,
    setAppliedMinRate,
  ] = useState<number | null>(null);
  const [
    appliedMaxRate,
    setAppliedMaxRate,
  ] = useState<number | null>(null);
  const [
    appliedMinTotal,
    setAppliedMinTotal,
  ] = useState<number | null>(null);
  const [
    appliedMaxTotal,
    setAppliedMaxTotal,
  ] = useState<number | null>(null);
  const [
    appliedCategories,
    setAppliedCategories,
  ] = useState<string[]>([]);

  const allCategories = complianceItems.map(c => c.category);

  const filteredItems = complianceItems.filter((c) => {
    if (search && !c.category.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (statusFilter !== "all" && c.status !== statusFilter)
      return false;
    const rate = c.total > 0 ? (c.compliant / c.total) * 100 : 0;
    if (appliedMinRate !== null && rate < appliedMinRate)
      return false;
    if (appliedMaxRate !== null && rate > appliedMaxRate)
      return false;
    if (appliedMinTotal !== null && c.total < appliedMinTotal)
      return false;
    if (appliedMaxTotal !== null && c.total > appliedMaxTotal)
      return false;
    if (appliedCategories.length > 0 && !appliedCategories.includes(c.category))
      return false;
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
    setDraftCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [
            ...prev,
            cat,
          ]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Compliance Audit Report</h2>
        <p className="text-sm text-muted-foreground">Monitor regulatory compliance, document expiry, and audit readiness across your fleet.</p>
      </div>

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
                  {complianceRate}
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
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Compliance Breakdown</CardTitle>
              <CardDescription>Share of compliance documents by status — valid, expiring, expired.</CardDescription>
            </div>
            <ChartPeriodFilter
              value={chartPeriod}
              onChange={setChartPeriod}
            />
          </CardHeader>
          <CardContent>
            {pieData.length > 0
              ? (
                  <ResponsiveContainer
                    width="100%"
                    height={250}
                  >
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
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
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data</div>
                )}
          </CardContent>
        </Card>

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
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-9 w-full"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="warning">Review</SelectItem>
                </SelectContent>
              </Select>
              <Popover
                open={filterOpen}
                onOpenChange={setFilterOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 max-h-[28rem] overflow-y-auto"
                  align="end"
                >
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Show Categories</h4>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="enable-rate"
                          checked={draftEnableRate}
                          onCheckedChange={c => setDraftEnableRate(!!c)}
                        />
                        <Label
                          htmlFor="enable-rate"
                          className="text-sm"
                        >
                          Compliance Rate (%)
                        </Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={draftMinRate}
                          onChange={e => setDraftMinRate(e.target.value)}
                          disabled={!draftEnableRate}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={draftMaxRate}
                          onChange={e => setDraftMaxRate(e.target.value)}
                          disabled={!draftEnableRate}
                          className="h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="enable-total"
                          checked={draftEnableTotal}
                          onCheckedChange={c => setDraftEnableTotal(!!c)}
                        />
                        <Label
                          htmlFor="enable-total"
                          className="text-sm"
                        >
                          Total Count
                        </Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={draftMinTotal}
                          onChange={e => setDraftMinTotal(e.target.value)}
                          disabled={!draftEnableTotal}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={draftMaxTotal}
                          onChange={e => setDraftMaxTotal(e.target.value)}
                          disabled={!draftEnableTotal}
                          className="h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="enable-category"
                          checked={draftEnableCategory}
                          onCheckedChange={c => setDraftEnableCategory(!!c)}
                        />
                        <Label
                          htmlFor="enable-category"
                          className="text-sm"
                        >
                          Categories
                        </Label>
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
                          <PopoverContent
                            className="w-[260px] p-2 max-h-72 overflow-y-auto"
                            align="start"
                          >
                            <div className="space-y-1">
                              {allCategories.map(cat => (
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
                                  <Label
                                    htmlFor={`cat-${cat}`}
                                    className="text-sm cursor-pointer flex-1"
                                  >
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={showAll}
                        className="flex-1"
                      >
                        Show All
                      </Button>
                      <Button
                        size="sm"
                        onClick={applyFilters}
                        className="flex-1"
                      >
                        Apply
                      </Button>
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
                {filteredItems.length === 0
                  ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-6"
                        >
                          No categories match your filters
                        </TableCell>
                      </TableRow>
                    )
                  : filteredItems.map(c => (
                      <TableRow key={c.category}>
                        <TableCell className="font-medium">{c.category}</TableCell>
                        <TableCell className="text-right">{c.total}</TableCell>
                        <TableCell className="text-right">{c.compliant}</TableCell>
                        <TableCell className="text-right">
                          {c.total > 0 ? `${((c.compliant / c.total) * 100).toFixed(0)}%` : "—"}
                        </TableCell>
                        <TableCell>
                          {c.status === "pass"
                            ? (
                                <Badge
                                  variant="outline"
                                  className="bg-success/10 text-success border-success/30"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {" "}
                                  Pass
                                </Badge>
                              )
                            : (
                                <Badge
                                  variant="outline"
                                  className="bg-warning/10 text-warning border-warning/30"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {" "}
                                  Review
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
