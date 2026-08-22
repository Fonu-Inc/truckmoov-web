import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  SlidersHorizontal as FilterIcon,
  Fuel,
  Gauge,
  Link2,
  MapPin,
  Package,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Truck,
  UserPlus, Users, Wallet,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CreateOwnerOperatorDialog } from "@/components/aggregator/CreateOwnerOperatorDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { ChartDateFilter } from "@/components/shadcn/chart-date-filter";
import { Checkbox } from "@/components/shadcn/checkbox";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { useAuthStore } from "@/stores/authStore";

/**
 * Aggregator Dashboard (Stub)
 * Manage linked owner-operators and execution view for aggregated fleet.
 */
export default function AggregatorDashboard() {
  const { user } = useAuthStore();
  const [
    showCreateOO,
    setShowCreateOO,
  ] = useState(false);

  // Sub-Dispatch Queue toolbar state
  const [
    dispatchSearch,
    setDispatchSearch,
  ] = useState("");
  const [
    dispatchStatus,
    setDispatchStatus,
  ] = useState<string>("ALL");
  const [
    dispatchValueEnabled,
    setDispatchValueEnabled,
  ] = useState(false);
  const [
    dispatchValueOp,
    setDispatchValueOp,
  ] = useState<string>("gte");
  const [
    dispatchValueAmt,
    setDispatchValueAmt,
  ] = useState<string>("");
  const [
    dispatchOperatorEnabled,
    setDispatchOperatorEnabled,
  ] = useState(false);
  const [
    dispatchOperatorVal,
    setDispatchOperatorVal,
  ] = useState("");

  // Operator Performance toolbar state
  const [
    perfSearch,
    setPerfSearch,
  ] = useState("");
  const [
    perfRatingEnabled,
    setPerfRatingEnabled,
  ] = useState(false);
  const [
    perfRatingMin,
    setPerfRatingMin,
  ] = useState("");
  const [
    perfRevenueEnabled,
    setPerfRevenueEnabled,
  ] = useState(false);
  const [
    perfRevenueMin,
    setPerfRevenueMin,
  ] = useState("");
  const [
    perfJobsEnabled,
    setPerfJobsEnabled,
  ] = useState(false);
  const [
    perfJobsMin,
    setPerfJobsMin,
  ] = useState("");

  // Chart date ranges
  const [
    coverageRange,
    setCoverageRange,
  ] = useState<ChartDateRange>("30d");
  const [
    utilizationRange,
    setUtilizationRange,
  ] = useState<ChartDateRange>("30d");

  // Settlements toolbar state
  const [
    settleSearch,
    setSettleSearch,
  ] = useState("");
  const [
    settleStatusEnabled,
    setSettleStatusEnabled,
  ] = useState(false);
  const [
    settleStatusVal,
    setSettleStatusVal,
  ] = useState("PAID");
  const [
    settleNetEnabled,
    setSettleNetEnabled,
  ] = useState(false);
  const [
    settleNetOp,
    setSettleNetOp,
  ] = useState("gte");
  const [
    settleNetAmt,
    setSettleNetAmt,
  ] = useState("");

  const orgCtx = {
    memberships: [], isLoading: false, hasOrgRole: () => false, hasOrgType: () => false, getByOrgType: (_type: string) => [] as any[],
  };

  const aggregatorOrgIds = useMemo(
    () => orgCtx.getByOrgType("AGGREGATOR").map((m: any) => m.orgId),
    [],
  );

  // Fetch linked organizations (owner-operators under this aggregator)
  const {
    data: linkedOrgs = [], isLoading, refetch: refetchOrgs,
  } = useQuery({
    queryKey: [
      "aggregator-linked-orgs",
      aggregatorOrgIds,
    ],
    queryFn: async () => [],
    enabled: !!user && aggregatorOrgIds.length > 0,
  });

  const childOrgIds = useMemo(
    () => linkedOrgs.map((r: any) => r.to_org?.id).filter(Boolean),
    [linkedOrgs],
  );

  // Fetch jobs assigned to aggregator's execution scope (self + children)
  const { data: jobs = [] } = useQuery({
    queryKey: [
      "aggregator-jobs",
      aggregatorOrgIds,
      childOrgIds,
    ],
    queryFn: async () => [],
    enabled: !!user && aggregatorOrgIds.length > 0,
  });

  // Demo fallback data — shown when no real linked operators exist so the
  // Network Overview page renders a fully populated preview state.
  const DEMO_LINKED_ORGS = useMemo(
    () => [
      {
        id: "demo-1", name: "Adeyemi Haulage Co.", vehicles: 8, drivers: 11, activeJobs: 4, completedJobs: 142, rating: 4.8, status: "ACTIVE", region: "Lagos", relationshipType: "AGGREGATED_FLEET",
      },
      {
        id: "demo-2", name: "Northbridge Logistics", vehicles: 5, drivers: 6, activeJobs: 2, completedJobs: 87, rating: 4.6, status: "ACTIVE", region: "Abuja", relationshipType: "AGGREGATED_FLEET",
      },
      {
        id: "demo-3", name: "Okonkwo Transport Ltd.", vehicles: 12, drivers: 14, activeJobs: 6, completedJobs: 218, rating: 4.9, status: "ACTIVE", region: "Port Harcourt", relationshipType: "AGGREGATED_FLEET",
      },
      {
        id: "demo-4", name: "Sahara Freight Partners", vehicles: 3, drivers: 4, activeJobs: 1, completedJobs: 54, rating: 4.4, status: "ACTIVE", region: "Kano", relationshipType: "AGGREGATED_FLEET",
      },
      {
        id: "demo-5", name: "Coastal Movers Nigeria", vehicles: 7, drivers: 9, activeJobs: 3, completedJobs: 119, rating: 4.7, status: "ACTIVE", region: "Lagos", relationshipType: "AGGREGATED_FLEET",
      },
      {
        id: "demo-6", name: "Greenline Carriers", vehicles: 4, drivers: 5, activeJobs: 2, completedJobs: 76, rating: 4.5, status: "ACTIVE", region: "Ibadan", relationshipType: "AGGREGATED_FLEET",
      },
      {
        id: "demo-7", name: "Trans-Sahel Cargo", vehicles: 9, drivers: 12, activeJobs: 5, completedJobs: 163, rating: 4.6, status: "ACTIVE", region: "Kaduna", relationshipType: "AGGREGATED_FLEET",
      },
      {
        id: "demo-8", name: "Eko Express Movers", vehicles: 6, drivers: 8, activeJobs: 3, completedJobs: 98, rating: 4.7, status: "ACTIVE", region: "Lagos", relationshipType: "AGGREGATED_FLEET",
      },
    ],
    [],
  );

  const DEMO_SUB_DISPATCH = useMemo(
    () => [
      {
        id: "JOB-10421", route: "Lagos → Ibadan", operator: "Adeyemi Haulage Co.", value: "₦485,000", status: "IN_TRANSIT",
      },
      {
        id: "JOB-10422", route: "Apapa → Kano", operator: "Trans-Sahel Cargo", value: "₦1,250,000", status: "ASSIGNED",
      },
      {
        id: "JOB-10423", route: "Port Harcourt → Aba", operator: "Okonkwo Transport Ltd.", value: "₦320,000", status: "DELIVERED",
      },
      {
        id: "JOB-10424", route: "Lagos → Benin", operator: "Coastal Movers Nigeria", value: "₦540,000", status: "PENDING_ASSIGNMENT",
      },
      {
        id: "JOB-10425", route: "Abuja → Jos", operator: "Northbridge Logistics", value: "₦410,000", status: "IN_TRANSIT",
      },
      {
        id: "JOB-10426", route: "Kaduna → Kano", operator: "Sahara Freight Partners", value: "₦275,000", status: "PENDING_ASSIGNMENT",
      },
      {
        id: "JOB-10427", route: "Lagos → Onitsha", operator: "Eko Express Movers", value: "₦620,000", status: "DELIVERED",
      },
      {
        id: "JOB-10428", route: "Ibadan → Akure", operator: "Greenline Carriers", value: "₦195,000", status: "ASSIGNED",
      },
    ],
    [],
  );

  // Always show enriched demo content on the Network Overview so the page stays
  // visually full, even when real linked operators exist.
  const useDemo = !isLoading;

  const realActiveJobs = jobs.filter(j => ![
    "completed",
    "cancelled",
  ].includes(j.status)).length;
  const realCompletedJobs = jobs.filter(j => j.status === "completed").length;
  const realOwnerOperatorCount = linkedOrgs.filter(
    (r: any) => r.to_org?.organization_type === "OWNER_OPERATOR",
  ).length;

  const ownerOperatorCount = useDemo ? DEMO_LINKED_ORGS.length : realOwnerOperatorCount;
  const totalRelationships = useDemo ? DEMO_LINKED_ORGS.length : linkedOrgs.length;
  const activeJobs = useDemo
    ? DEMO_LINKED_ORGS.reduce(
        (s, o) => s + o.activeJobs,
        0,
      )
    : realActiveJobs;
  const completedJobs = useDemo
    ? DEMO_LINKED_ORGS.reduce(
        (s, o) => s + o.completedJobs,
        0,
      )
    : realCompletedJobs;

  return (
    <>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Linked Operators"
            value={isLoading ? "..." : ownerOperatorCount}
            icon={Users}
          />
          <StatCard
            title="Total Relationships"
            value={isLoading ? "..." : totalRelationships}
            icon={Link2}
          />
          <StatCard
            title="Active Jobs"
            value={activeJobs}
            icon={Package}
            variant={activeJobs > 0 ? "success" : "default"}
          />
          <StatCard
            title="Completed"
            value={completedJobs}
            icon={TrendingUp}
          />
        </div>

        {/* Network rollup KPIs */}
        {useDemo && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Network Vehicles"
              value={DEMO_LINKED_ORGS.reduce(
                (s, o) => s + o.vehicles,
                0,
              )}
              icon={Truck}
            />
            <StatCard
              title="Network Drivers"
              value={DEMO_LINKED_ORGS.reduce(
                (s, o) => s + o.drivers,
                0,
              )}
              icon={Users}
            />
            <StatCard
              title="Avg Operator Rating"
              value={(
                DEMO_LINKED_ORGS.reduce(
                  (s, o) => s + o.rating,
                  0,
                )
                / DEMO_LINKED_ORGS.length
              ).toFixed(2)}
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Regions Covered"
              value={new Set(DEMO_LINKED_ORGS.map(o => o.region)).size}
              icon={Building2}
            />
          </div>
        )}

        {/* Linked Owner-Operators */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Linked Owner-Operators
                {useDemo && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-[10px]"
                  >
                    Demo data
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Owner-operators connected to your aggregator network and available for sub-dispatch.</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowCreateOO(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Operator
            </Button>
          </CardHeader>
          <CardContent>
            {!useDemo && linkedOrgs.length === 0
              ? (
                  <EmptyState
                    icon={Link2}
                    title="No linked operators"
                    description="Owner-operators linked to your aggregator will appear here. Relationships are managed via the platform admin."
                  />
                )
              : useDemo
                ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {DEMO_LINKED_ORGS.map(op => (
                        <div
                          key={op.id}
                          className="rounded-lg border border-border p-4 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <Truck className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium text-sm truncate">{op.name}</p>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] shrink-0"
                                >
                                  ★
                                  {" "}
                                  {op.rating}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{op.region}</p>
                              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  OWNER OPERATOR
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {op.relationshipType}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-border">
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Vehicles</p>
                              <p className="text-sm font-semibold">{op.vehicles}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Drivers</p>
                              <p className="text-sm font-semibold">{op.drivers}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Active</p>
                              <p className="text-sm font-semibold text-primary">{op.activeJobs}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {linkedOrgs.map((rel: any) => (
                        <div
                          key={rel.id}
                          className="flex items-center gap-3 rounded-lg border border-border p-4"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Truck className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {rel.to_org?.name || "Unknown"}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px]"
                              >
                                {rel.to_org?.organization_type?.replace(
                                  "_",
                                  " ",
                                ) || "Operator"}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {rel.relationship_type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
          </CardContent>
        </Card>

        {useDemo && (
          <>
            {/* Sub-Dispatch Queue */}
            {(() => {
              const parseNgn = (s: string) => Number(s.replace(
                /[^\d.]/g,
                "",
              )) || 0;
              const compare = (a: number, op: string, b: number) =>
                op === "gte" ? a >= b : op === "lte" ? a <= b : op === "eq" ? a === b : true;
              const filteredDispatch = DEMO_SUB_DISPATCH.filter((j) => {
                if (dispatchSearch) {
                  const q = dispatchSearch.toLowerCase();
                  if (
                    !j.id.toLowerCase().includes(q)
                    && !j.route.toLowerCase().includes(q)
                    && !j.operator.toLowerCase().includes(q)
                  ) {
                    return false;
                  }
                }
                if (dispatchStatus !== "ALL" && j.status !== dispatchStatus)
                  return false;
                if (dispatchValueEnabled && dispatchValueAmt) {
                  if (!compare(
                    parseNgn(j.value),
                    dispatchValueOp,
                    Number(dispatchValueAmt),
                  )) {
                    return false;
                  }
                }
                if (dispatchOperatorEnabled && dispatchOperatorVal) {
                  if (!j.operator.toLowerCase().includes(dispatchOperatorVal.toLowerCase()))
                    return false;
                }
                return true;
              });
              return (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Sub-Dispatch Queue
                        <Badge
                          variant="outline"
                          className="ml-2 text-[10px]"
                        >
                          Demo data
                        </Badge>
                      </CardTitle>
                      <CardDescription>Incoming jobs awaiting assignment to a linked owner-operator in your network.</CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px]"
                    >
                      {filteredDispatch.filter(j => j.status === "PENDING_ASSIGNMENT").length}
                      {" "}
                      awaiting
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search jobs, routes, operators…"
                          value={dispatchSearch}
                          onChange={e => setDispatchSearch(e.target.value)}
                          className="pl-8 h-9"
                        />
                      </div>
                      <Select
                        value={dispatchStatus}
                        onValueChange={setDispatchStatus}
                      >
                        <SelectTrigger className="w-[170px] h-9">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All statuses</SelectItem>
                          <SelectItem value="PENDING_ASSIGNMENT">Pending</SelectItem>
                          <SelectItem value="ASSIGNED">In Progress</SelectItem>
                          <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                          <SelectItem value="DELIVERED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                          >
                            <FilterIcon className="h-3.5 w-3.5 mr-1.5" />
                            {" "}
                            Filter
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-80"
                          align="end"
                        >
                          <div className="space-y-4">
                            <p className="text-sm font-semibold">Show Dispatches</p>
                            {/* Value filter */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="d-val"
                                  checked={dispatchValueEnabled}
                                  onCheckedChange={c => setDispatchValueEnabled(!!c)}
                                />
                                <Label
                                  htmlFor="d-val"
                                  className="text-xs"
                                >
                                  Value (₦)
                                </Label>
                              </div>
                              <div className="flex gap-2">
                                <Select
                                  value={dispatchValueOp}
                                  onValueChange={setDispatchValueOp}
                                  disabled={!dispatchValueEnabled}
                                >
                                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gte">≥ at least</SelectItem>
                                    <SelectItem value="lte">≤ at most</SelectItem>
                                    <SelectItem value="eq">= equals</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  placeholder="Amount"
                                  value={dispatchValueAmt}
                                  onChange={e => setDispatchValueAmt(e.target.value)}
                                  disabled={!dispatchValueEnabled}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            {/* Operator filter */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="d-op"
                                  checked={dispatchOperatorEnabled}
                                  onCheckedChange={c => setDispatchOperatorEnabled(!!c)}
                                />
                                <Label
                                  htmlFor="d-op"
                                  className="text-xs"
                                >
                                  Operator name
                                </Label>
                              </div>
                              <Input
                                placeholder="e.g. Adeyemi"
                                value={dispatchOperatorVal}
                                onChange={e => setDispatchOperatorVal(e.target.value)}
                                disabled={!dispatchOperatorEnabled}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="flex justify-between pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setDispatchValueEnabled(false);
                                  setDispatchValueAmt("");
                                  setDispatchOperatorEnabled(false);
                                  setDispatchOperatorVal("");
                                  setDispatchStatus("ALL");
                                  setDispatchSearch("");
                                }}
                              >
                                Show All
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                              >
                                Apply
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                            <th className="py-2 pr-3 font-medium">Job</th>
                            <th className="py-2 pr-3 font-medium">Route</th>
                            <th className="py-2 pr-3 font-medium">Operator</th>
                            <th className="py-2 pr-3 font-medium">Value</th>
                            <th className="py-2 pr-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDispatch.length === 0
                            ? (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="py-6 text-center text-xs text-muted-foreground"
                                  >
                                    No dispatches match your filters.
                                  </td>
                                </tr>
                              )
                            : (
                                filteredDispatch.map(j => (
                                  <tr
                                    key={j.id}
                                    className="border-b border-border/50 last:border-0"
                                  >
                                    <td className="py-2.5 pr-3 font-medium">{j.id}</td>
                                    <td className="py-2.5 pr-3 text-muted-foreground">{j.route}</td>
                                    <td className="py-2.5 pr-3">{j.operator}</td>
                                    <td className="py-2.5 pr-3 font-medium">{j.value}</td>
                                    <td className="py-2.5 pr-3">
                                      <Badge
                                        variant={
                                          j.status === "IN_TRANSIT"
                                            ? "default"
                                            : j.status === "PENDING_ASSIGNMENT"
                                              ? "outline"
                                              : j.status === "DELIVERED"
                                                ? "secondary"
                                                : "secondary"
                                        }
                                        className="text-[10px]"
                                      >
                                        {j.status.replace(
                                          /_/g,
                                          " ",
                                        )}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))
                              )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Operator Performance */}
            {(() => {
              const perfRows = DEMO_LINKED_ORGS.slice(
                0,
                6,
              ).map((op, i) => ({
                operator: op.name,
                jobs: op.completedJobs,
                onTime: [
                  96,
                  92,
                  98,
                  88,
                  94,
                  91,
                ][i],
                acceptance: [
                  89,
                  82,
                  95,
                  76,
                  87,
                  80,
                ][i],
                revenueM: [
                  3.2,
                  1.8,
                  5.4,
                  1.1,
                  2.7,
                  1.6,
                ][i],
                rating: op.rating,
              }));
              const filteredPerf = perfRows.filter((r) => {
                if (perfSearch && !r.operator.toLowerCase().includes(perfSearch.toLowerCase()))
                  return false;
                if (perfRatingEnabled && perfRatingMin && r.rating < Number(perfRatingMin))
                  return false;
                if (perfRevenueEnabled && perfRevenueMin && r.revenueM < Number(perfRevenueMin))
                  return false;
                if (perfJobsEnabled && perfJobsMin && r.jobs < Number(perfJobsMin))
                  return false;
                return true;
              });
              return (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Operator Performance (Last 30 Days)
                        <Badge
                          variant="outline"
                          className="ml-2 text-[10px]"
                        >
                          Demo data
                        </Badge>
                      </CardTitle>
                      <CardDescription>On-time delivery, acceptance, and completion rates per linked owner-operator.</CardDescription>
                    </div>
                    <ExportButton
                      rows={filteredPerf}
                      columns={[
                        {
                          header: "Operator", accessor: "operator",
                        },
                        {
                          header: "Jobs", accessor: "jobs",
                        },
                        {
                          header: "On-Time %", accessor: "onTime",
                        },
                        {
                          header: "Acceptance %", accessor: "acceptance",
                        },
                        {
                          header: "Revenue (₦M)", accessor: "revenueM",
                        },
                        {
                          header: "Rating", accessor: "rating",
                        },
                      ]}
                      filename="operator_performance"
                    />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search operators…"
                          value={perfSearch}
                          onChange={e => setPerfSearch(e.target.value)}
                          className="pl-8 h-9"
                        />
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                          >
                            <FilterIcon className="h-3.5 w-3.5 mr-1.5" />
                            {" "}
                            Filter
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-80"
                          align="end"
                        >
                          <div className="space-y-4">
                            <p className="text-sm font-semibold">Show Operators</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="p-rating"
                                  checked={perfRatingEnabled}
                                  onCheckedChange={c => setPerfRatingEnabled(!!c)}
                                />
                                <Label
                                  htmlFor="p-rating"
                                  className="text-xs"
                                >
                                  Min Rating
                                </Label>
                              </div>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="e.g. 4.5"
                                value={perfRatingMin}
                                onChange={e => setPerfRatingMin(e.target.value)}
                                disabled={!perfRatingEnabled}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="p-rev"
                                  checked={perfRevenueEnabled}
                                  onCheckedChange={c => setPerfRevenueEnabled(!!c)}
                                />
                                <Label
                                  htmlFor="p-rev"
                                  className="text-xs"
                                >
                                  Min Revenue (₦M)
                                </Label>
                              </div>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="e.g. 2.0"
                                value={perfRevenueMin}
                                onChange={e => setPerfRevenueMin(e.target.value)}
                                disabled={!perfRevenueEnabled}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="p-jobs"
                                  checked={perfJobsEnabled}
                                  onCheckedChange={c => setPerfJobsEnabled(!!c)}
                                />
                                <Label
                                  htmlFor="p-jobs"
                                  className="text-xs"
                                >
                                  Min Jobs Completed
                                </Label>
                              </div>
                              <Input
                                type="number"
                                placeholder="e.g. 100"
                                value={perfJobsMin}
                                onChange={e => setPerfJobsMin(e.target.value)}
                                disabled={!perfJobsEnabled}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="flex justify-between pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setPerfRatingEnabled(false);
                                  setPerfRatingMin("");
                                  setPerfRevenueEnabled(false);
                                  setPerfRevenueMin("");
                                  setPerfJobsEnabled(false);
                                  setPerfJobsMin("");
                                  setPerfSearch("");
                                }}
                              >
                                Show All
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                              >
                                Apply
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                            <th className="py-2 pr-3 font-medium">Operator</th>
                            <th className="py-2 pr-3 font-medium">Jobs</th>
                            <th className="py-2 pr-3 font-medium">On-Time</th>
                            <th className="py-2 pr-3 font-medium">Acceptance</th>
                            <th className="py-2 pr-3 font-medium">Revenue</th>
                            <th className="py-2 pr-3 font-medium">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPerf.length === 0
                            ? (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className="py-6 text-center text-xs text-muted-foreground"
                                  >
                                    No operators match your filters.
                                  </td>
                                </tr>
                              )
                            : (
                                filteredPerf.map(r => (
                                  <tr
                                    key={r.operator}
                                    className="border-b border-border/50 last:border-0"
                                  >
                                    <td className="py-2.5 pr-3 font-medium">{r.operator}</td>
                                    <td className="py-2.5 pr-3">{r.jobs}</td>
                                    <td className="py-2.5 pr-3">
                                      <span className={r.onTime >= 95 ? "text-success" : r.onTime >= 90 ? "text-foreground" : "text-warning"}>
                                        {r.onTime}
                                        %
                                      </span>
                                    </td>
                                    <td className="py-2.5 pr-3 text-muted-foreground">
                                      {r.acceptance}
                                      %
                                    </td>
                                    <td className="py-2.5 pr-3 font-medium">
                                      ₦
                                      {r.revenueM.toFixed(1)}
                                      M
                                    </td>
                                    <td className="py-2.5 pr-3">
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        ★
                                        {r.rating}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))
                              )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Network Activity Trend + Regional Distribution */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Network Activity (Last 14 Days)
                    <Badge
                      variant="outline"
                      className="ml-2 text-[10px]"
                    >
                      Demo data
                    </Badge>
                  </CardTitle>
                  <CardDescription>Daily jobs dispatched and revenue generated across the aggregator network.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer
                    width="100%"
                    height={260}
                  >
                    <AreaChart
                      data={Array.from({ length: 14 }).map((_, i) => ({
                        day: `D${i + 1}`,
                        jobs: 18 + Math.round(Math.sin(i / 1.7) * 6 + i * 0.6),
                        revenue: 1.4 + Math.sin(i / 2) * 0.5 + i * 0.08,
                      }))}
                      margin={{
                        top: 10, right: 10, left: 0, bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="aggJobs"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="aggRev"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--success))"
                            stopOpacity={0.45}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--success))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.4}
                      />
                      <XAxis
                        dataKey="day"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="jobs"
                        stroke="hsl(var(--primary))"
                        fill="url(#aggJobs)"
                        name="Jobs"
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--success))"
                        fill="url(#aggRev)"
                        name="Revenue (₦M)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Regional Coverage
                    </CardTitle>
                    <CardDescription>Geographic spread of operator activity across regions.</CardDescription>
                  </div>
                  <ChartDateFilter
                    value={coverageRange}
                    onValueChange={setCoverageRange}
                    options={[
                      "7d",
                      "30d",
                      "90d",
                    ]}
                  />
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer
                    width="100%"
                    height={220}
                  >
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          DEMO_LINKED_ORGS.reduce<Record<string, number>>(
                            (acc, o) => {
                              acc[o.region] = (acc[o.region] || 0) + o.vehicles;
                              return acc;
                            },
                            {},
                          ),
                        ).map(([
                          name,
                          value,
                        ]) => ({
                          name, value,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {[
                          "hsl(var(--primary))",
                          "hsl(var(--success))",
                          "hsl(var(--warning))",
                          "hsl(var(--destructive))",
                          "hsl(var(--muted-foreground))",
                          "hsl(var(--accent))",
                        ].map((c, i) => (
                          <Cell
                            key={i}
                            fill={c}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers + Live Activity Feed */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Top Performing Operators
                  </CardTitle>
                  <CardDescription>Owner-operators with the highest completed job volume and ratings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...DEMO_LINKED_ORGS]
                    .sort((a, b) => b.completedJobs - a.completedJobs)
                    .slice(
                      0,
                      5,
                    )
                    .map((op, idx) => {
                      const max = DEMO_LINKED_ORGS[0].completedJobs;
                      const pct = Math.round((op.completedJobs / max) * 100);
                      return (
                        <div
                          key={op.id}
                          className="space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                                {idx + 1}
                              </span>
                              <span className="font-medium truncate">{op.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {op.completedJobs}
                              {" "}
                              jobs · ★
                              {op.rating}
                            </span>
                          </div>
                          <Progress
                            value={pct}
                            className="h-1.5"
                          />
                        </div>
                      );
                    })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Live Network Activity
                  </CardTitle>
                  <CardDescription>Real-time stream of job, settlement, and onboarding events across the network.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        icon: CheckCircle2, color: "text-success", text: "Okonkwo Transport completed JOB-10423", time: "2m ago",
                      },
                      {
                        icon: Truck, color: "text-primary", text: "Trans-Sahel Cargo accepted Apapa → Kano", time: "8m ago",
                      },
                      {
                        icon: AlertTriangle, color: "text-warning", text: "Sahara Freight low driver availability", time: "21m ago",
                      },
                      {
                        icon: Wallet, color: "text-success", text: "Settlement of ₦485,000 to Adeyemi Haulage", time: "37m ago",
                      },
                      {
                        icon: Plus, color: "text-primary", text: "New operator Greenline Carriers onboarded", time: "1h ago",
                      },
                      {
                        icon: Clock, color: "text-muted-foreground", text: "Northbridge ETA updated for Abuja → Jos", time: "2h ago",
                      },
                    ].map((a, i) => {
                      const Icon = a.icon;
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 text-sm"
                        >
                          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${a.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{a.text}</p>
                            <p className="text-[11px] text-muted-foreground">{a.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fleet Utilization + SLA Health */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-primary" />
                      Operator Fleet Utilization
                    </CardTitle>
                    <CardDescription>Active jobs vs available vehicles per operator, expressed as a utilization rate.</CardDescription>
                  </div>
                  <ChartDateFilter
                    value={utilizationRange}
                    onValueChange={setUtilizationRange}
                    options={[
                      "7d",
                      "30d",
                      "90d",
                    ]}
                  />
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer
                    width="100%"
                    height={240}
                  >
                    <BarChart
                      data={DEMO_LINKED_ORGS.map(o => ({
                        name: o.name.split(" ")[0],
                        utilization: Math.min(
                          100,
                          Math.round((o.activeJobs / Math.max(
                            1,
                            o.vehicles,
                          )) * 100 + 35),
                        ),
                      }))}
                      margin={{
                        top: 10, right: 10, left: 0, bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.4}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        unit="%"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="utilization"
                        fill="hsl(var(--primary))"
                        radius={[
                          6,
                          6,
                          0,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Network SLA Health
                  </CardTitle>
                  <CardDescription>Key service-level indicators tracked across all linked operators.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      label: "On-Time Delivery", value: 93, tone: "success",
                    },
                    {
                      label: "Job Acceptance", value: 86, tone: "primary",
                    },
                    {
                      label: "POD Compliance", value: 78, tone: "warning",
                    },
                    {
                      label: "Driver Availability", value: 71, tone: "warning",
                    },
                  ].map(m => (
                    <div
                      key={m.label}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className="font-semibold">
                          {m.value}
                          %
                        </span>
                      </div>
                      <Progress
                        value={m.value}
                        className="h-2"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Avg Response</p>
                      <p className="text-lg font-semibold">4.2 min</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Disputes</p>
                      <p className="text-lg font-semibold text-warning">3</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settlements & Payouts + Compliance Snapshot */}
            <div className="grid gap-4 lg:grid-cols-3">
              {(() => {
                const settleRows = [
                  {
                    op: "Okonkwo Transport Ltd.", period: "W17", gross: "₦2,180,000", fee: "₦174,400", net: "₦2,005,600", netNum: 2005600, status: "PAID",
                  },
                  {
                    op: "Adeyemi Haulage Co.", period: "W17", gross: "₦1,420,000", fee: "₦113,600", net: "₦1,306,400", netNum: 1306400, status: "PAID",
                  },
                  {
                    op: "Trans-Sahel Cargo", period: "W17", gross: "₦1,675,000", fee: "₦134,000", net: "₦1,541,000", netNum: 1541000, status: "PROCESSING",
                  },
                  {
                    op: "Coastal Movers Nigeria", period: "W17", gross: "₦940,000", fee: "₦75,200", net: "₦864,800", netNum: 864800, status: "PENDING",
                  },
                  {
                    op: "Eko Express Movers", period: "W17", gross: "₦780,000", fee: "₦62,400", net: "₦717,600", netNum: 717600, status: "PAID",
                  },
                ];
                const filteredSettle = settleRows.filter((r) => {
                  if (settleSearch && !r.op.toLowerCase().includes(settleSearch.toLowerCase()))
                    return false;
                  if (settleStatusEnabled && r.status !== settleStatusVal)
                    return false;
                  if (settleNetEnabled && settleNetAmt) {
                    const a = r.netNum;
                    const b = Number(settleNetAmt);
                    if (settleNetOp === "gte" && !(a >= b))
                      return false;
                    if (settleNetOp === "lte" && !(a <= b))
                      return false;
                  }
                  return true;
                });
                return (
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Wallet className="h-5 w-5 text-primary" />
                          Settlements & Payouts (This Week)
                          <Badge
                            variant="outline"
                            className="ml-2 text-[10px]"
                          >
                            Demo data
                          </Badge>
                        </CardTitle>
                        <CardDescription>Weekly gross earnings, aggregator fees, and net payouts per operator.</CardDescription>
                      </div>
                      <ExportButton
                        rows={filteredSettle}
                        columns={[
                          {
                            header: "Operator", accessor: "op",
                          },
                          {
                            header: "Period", accessor: "period",
                          },
                          {
                            header: "Gross", accessor: "gross",
                          },
                          {
                            header: "Fee", accessor: "fee",
                          },
                          {
                            header: "Net", accessor: "net",
                          },
                          {
                            header: "Status", accessor: "status",
                          },
                        ]}
                        filename="settlements_payouts"
                      />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Released</p>
                          <p className="text-lg font-semibold text-success flex items-center gap-1">
                            ₦8.4M
                            {" "}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">42 payouts</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Pending</p>
                          <p className="text-lg font-semibold text-warning">₦2.1M</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">11 awaiting POD</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Aggregator Fee</p>
                          <p className="text-lg font-semibold">₦680K</p>
                          <p className="text-[11px] text-success mt-0.5 flex items-center gap-0.5">
                            <ArrowUpRight className="h-3 w-3" />
                            {" "}
                            +12% WoW
                          </p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Disputes</p>
                          <p className="text-lg font-semibold text-destructive flex items-center gap-1">
                            ₦145K
                            {" "}
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">3 open cases</p>
                        </div>
                      </div>

                      {/* Toolbar */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Search operators…"
                            value={settleSearch}
                            onChange={e => setSettleSearch(e.target.value)}
                            className="pl-8 h-9"
                          />
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9"
                            >
                              <FilterIcon className="h-3.5 w-3.5 mr-1.5" />
                              {" "}
                              Filter
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-80"
                            align="end"
                          >
                            <div className="space-y-4">
                              <p className="text-sm font-semibold">Show Settlements</p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="s-status"
                                    checked={settleStatusEnabled}
                                    onCheckedChange={c => setSettleStatusEnabled(!!c)}
                                  />
                                  <Label
                                    htmlFor="s-status"
                                    className="text-xs"
                                  >
                                    Status
                                  </Label>
                                </div>
                                <Select
                                  value={settleStatusVal}
                                  onValueChange={setSettleStatusVal}
                                  disabled={!settleStatusEnabled}
                                >
                                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PAID">Paid</SelectItem>
                                    <SelectItem value="PROCESSING">Processing</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id="s-net"
                                    checked={settleNetEnabled}
                                    onCheckedChange={c => setSettleNetEnabled(!!c)}
                                  />
                                  <Label
                                    htmlFor="s-net"
                                    className="text-xs"
                                  >
                                    Net amount (₦)
                                  </Label>
                                </div>
                                <div className="flex gap-2">
                                  <Select
                                    value={settleNetOp}
                                    onValueChange={setSettleNetOp}
                                    disabled={!settleNetEnabled}
                                  >
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="gte">≥ at least</SelectItem>
                                      <SelectItem value="lte">≤ at most</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="number"
                                    placeholder="Amount"
                                    value={settleNetAmt}
                                    onChange={e => setSettleNetAmt(e.target.value)}
                                    disabled={!settleNetEnabled}
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between pt-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setSettleStatusEnabled(false);
                                    setSettleNetEnabled(false);
                                    setSettleNetAmt("");
                                    setSettleSearch("");
                                  }}
                                >
                                  Show All
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                >
                                  Apply
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                              <th className="py-2 pr-3 font-medium">Operator</th>
                              <th className="py-2 pr-3 font-medium">Period</th>
                              <th className="py-2 pr-3 font-medium">Gross</th>
                              <th className="py-2 pr-3 font-medium">Fee</th>
                              <th className="py-2 pr-3 font-medium">Net</th>
                              <th className="py-2 pr-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSettle.length === 0
                              ? (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="py-6 text-center text-xs text-muted-foreground"
                                    >
                                      No settlements match your filters.
                                    </td>
                                  </tr>
                                )
                              : (
                                  filteredSettle.map(r => (
                                    <tr
                                      key={r.op}
                                      className="border-b border-border/50 last:border-0"
                                    >
                                      <td className="py-2.5 pr-3 font-medium">{r.op}</td>
                                      <td className="py-2.5 pr-3 text-muted-foreground">{r.period}</td>
                                      <td className="py-2.5 pr-3">{r.gross}</td>
                                      <td className="py-2.5 pr-3 text-muted-foreground">{r.fee}</td>
                                      <td className="py-2.5 pr-3 font-semibold">{r.net}</td>
                                      <td className="py-2.5 pr-3">
                                        <Badge
                                          variant={r.status === "PAID" ? "secondary" : r.status === "PROCESSING" ? "default" : "outline"}
                                          className="text-[10px]"
                                        >
                                          {r.status}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))
                                )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-success" />
                    Compliance Snapshot
                  </CardTitle>
                  <CardDescription>KYC, insurance, roadworthiness, and licensing status across the network.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      label: "KYC Verified Operators", value: "7 / 8", tone: "success",
                    },
                    {
                      label: "Insurance Up-to-Date", value: "6 / 8", tone: "warning",
                    },
                    {
                      label: "Roadworthiness Valid", value: "52 / 54", tone: "success",
                    },
                    {
                      label: "Driver Licenses Valid", value: "63 / 69", tone: "warning",
                    },
                  ].map(c => (
                    <div
                      key={c.label}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <span className="text-sm text-muted-foreground">{c.label}</span>
                      <Badge
                        variant={c.tone === "success" ? "secondary" : "outline"}
                        className={`text-[11px] ${c.tone === "warning" ? "border-warning/40 text-warning" : ""}`}
                      >
                        {c.value}
                      </Badge>
                    </div>
                  ))}
                  <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs">
                    <p className="font-medium flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      6 driver licenses expiring this month
                    </p>
                    <p className="text-muted-foreground mt-0.5">Notify operators to renew before May 31.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Operator Approvals + Communications */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" />
                      Pending Operator Approvals
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px]"
                      >
                        3 awaiting
                      </Badge>
                    </CardTitle>
                    <CardDescription>Owner-operator applications awaiting your review and onboarding approval.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {[
                      {
                        name: "Lagoon Logistics Hub", region: "Lagos", vehicles: 4, submitted: "2h ago",
                      },
                      {
                        name: "Niger Delta Couriers", region: "Warri", vehicles: 2, submitted: "5h ago",
                      },
                      {
                        name: "Plateau Express", region: "Jos", vehicles: 6, submitted: "1d ago",
                      },
                    ].map(o => (
                      <div
                        key={o.name}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{o.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {o.region}
                              {" "}
                              ·
                              {o.vehicles}
                              {" "}
                              vehicles ·
                              {o.submitted}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                          >
                            Review
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Network Communications (24h)
                  </CardTitle>
                  <CardDescription>SMS, WhatsApp, and call volume sent across the network in the last 24 hours.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">SMS</p>
                      <p className="text-lg font-semibold">412</p>
                      <p className="text-[11px] text-success">98% delivered</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">WhatsApp</p>
                      <p className="text-lg font-semibold">287</p>
                      <p className="text-[11px] text-success">94% read</p>
                    </div>
                    <div className="rounded-lg border border-border p-3 text-center">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Calls</p>
                      <p className="text-lg font-semibold">63</p>
                      <p className="text-[11px] text-muted-foreground">3.4m avg</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        kind: "Broadcast", text: "Fuel price advisory sent to 8 operators", time: "1h ago",
                      },
                      {
                        kind: "Job Offer", text: "Auto-cascaded JOB-10428 to 4 operators", time: "3h ago",
                      },
                      {
                        kind: "Reminder", text: "POD upload reminder sent to 11 drivers", time: "6h ago",
                      },
                    ].map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-2 text-xs border-b border-border/40 last:border-0 pb-2 last:pb-0"
                      >
                        <div className="min-w-0">
                          <Badge
                            variant="outline"
                            className="text-[10px] mr-1.5"
                          >
                            {c.kind}
                          </Badge>
                          <span className="text-muted-foreground">{c.text}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">{c.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Network Alerts strip */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Network Alerts
                </CardTitle>
                <CardDescription>Active warnings across fuel, geofencing, ETAs, and vehicle health in the network.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      icon: Fuel, tone: "warning", title: "Low fuel", text: "3 vehicles below 15%", badge: "Warning",
                    },
                    {
                      icon: AlertTriangle, tone: "destructive", title: "Geofence breach", text: "TS-CARGO-09 left Apapa zone", badge: "Critical",
                    },
                    {
                      icon: Clock, tone: "warning", title: "ETA slip", text: "JOB-10422 delayed 47 min", badge: "Watch",
                    },
                    {
                      icon: ShieldCheck, tone: "success", title: "All clear", text: "Lagos cluster nominal", badge: "OK",
                    },
                  ].map((a, i) => {
                    const Icon = a.icon;
                    const toneClass
                      = a.tone === "destructive"
                        ? "border-destructive/30 bg-destructive/5 text-destructive"
                        : a.tone === "warning"
                          ? "border-warning/30 bg-warning/5 text-warning"
                          : "border-success/30 bg-success/5 text-success";
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-3 ${toneClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <p className="text-sm font-semibold text-foreground">{a.title}</p>
                          <Badge
                            variant="outline"
                            className="ml-auto text-[10px]"
                          >
                            {a.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{a.text}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <CreateOwnerOperatorDialog
        open={showCreateOO}
        onOpenChange={setShowCreateOO}
        onCreated={refetchOrgs}
      />
    </>
  );
}
