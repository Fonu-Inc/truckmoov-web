import type { SystemTenant } from "@truckmoov/api/auth";
import type {
  FilterDraft,
  FilterField,
} from "@/components/shadcn/platform-filter-popover";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemTenantGrowthQueryOptions,
  getSystemTenantsQueryOptions,
  getSystemTenantsSummaryQueryOptions,
  useUpdateTenantStatus,
} from "@truckmoov/api/auth";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  Building2,
  CheckCircle,
  Clock,
  Cpu,
  Eye,
  MoreHorizontal,
  Search,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import {
  buildEmptyDraft,
  PlatformFilterPopover,
} from "@/components/shadcn/platform-filter-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { SuspendAccessDialog } from "@/features/tenants/components/ui/SuspendAccessDialog";
import { TenantDetailsSheet } from "@/features/tenants/components/ui/TenantDetailsSheet";
import { TenantOnboardingPanel } from "@/features/tenants/components/ui/TenantOnboardingPanel";
import { TerminateTenantDialog } from "@/features/tenants/components/ui/TerminateTenantDialog";
import { TmNumbersPanel } from "@/features/tenants/components/ui/TmNumbersPanel";
import {
  getBillingModel,
  inDateWindow,
  normalizeStatus,
  tenantOrgTypes,
  tenantTypeOf,
  toTime,
} from "@/features/tenants/utils/tenants";
import { PageTitle } from "@/shared/components/layout/PageTitle";

const tenantFilterFields: FilterField[] = [
  {
    key: "orgType",
    label: "Organization Type",
    type: "select",
    options: [
      {
        value: "ENTERPRISE",
        label: "Enterprise",
      },
      {
        value: "OWNER_OPERATOR",
        label: "Owner-Operator",
      },
    ],
  },
  {
    key: "billingModel",
    label: "Billing Model",
    type: "select",
    options: [
      {
        value: "prepaid",
        label: "Prepaid",
      },
      {
        value: "postpaid",
        label: "Postpaid",
      },
    ],
  },
  {
    key: "plan",
    label: "Plan",
    type: "select",
    options: [
      {
        value: "starter",
        label: "Starter",
      },
      {
        value: "professional",
        label: "Professional",
      },
      {
        value: "enterprise",
        label: "Enterprise",
      },
    ],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      {
        value: "active",
        label: "Active",
      },
      {
        value: "suspended",
        label: "Suspended",
      },
      {
        value: "terminated",
        label: "Terminated",
      },
      {
        value: "inactive",
        label: "Inactive",
      },
    ],
  },
  {
    key: "lastActive",
    label: "Last Active",
    type: "date",
  },
];

type SortKey = "name" | "orgType" | "status" | "vehicleCount" | "lastActiveAt";

// Fleetflow renders these with `new Date(x).toLocaleString()` — the en-US shape, pinned.
const LOCALE_DATE_TIME = "M/d/yyyy, h:mm:ss a";

function SortIcon({
  active, dir,
}: {
  active: boolean; dir: "asc" | "desc";
}) {
  if (!active)
    return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" />;
  return dir === "asc"
    ? <ArrowUp className="h-3 w-3 ml-1 inline" />
    : <ArrowDown className="h-3 w-3 ml-1 inline" />;
}

function getStatusBadge(rawStatus: string) {
  const status = normalizeStatus(rawStatus);
  switch (status) {
    case "active":
      return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
    case "suspended":
      return <Badge variant="destructive">Suspended</Badge>;
    case "terminated":
      return <Badge className="bg-destructive/20 text-destructive border-destructive/40">Terminated</Badge>;
    case "inactive":
      return <Badge variant="secondary">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

/** Fleetflow's PlatformTenants (Tenants → All Tenants / Onboarding / Telematics Numbers). */
export default function TenantsPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();
  const activeTab = [
    "kyc-review",
    "tm-numbers",
  ].includes(searchParams.get("tab") ?? "")
    ? (searchParams.get("tab") as string)
    : "all-tenants";
  const updateTenantStatusMutation = useUpdateTenantStatus();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    advancedFilters,
    setAdvancedFilters,
  ] = useState<FilterDraft>(() => buildEmptyDraft(tenantFilterFields));

  // The list endpoint returns every tenant, so search, filters and sorting run
  // client-side over it, as the reference does.
  const tenantsQuery = useQuery(getSystemTenantsQueryOptions());
  const summaryQuery = useQuery(getSystemTenantsSummaryQueryOptions());
  // Month-on-month growth for the Total Tenants card: cumulative count at the
  // end of this month vs last.
  const growthQuery = useQuery(getSystemTenantGrowthQueryOptions(2));
  const tenantGrowthPercent = useMemo(
    () => {
      const months = growthQuery.data?.data.months ?? [];
      if (months.length < 2)
        return undefined;
      const previous = months[months.length - 2].tenants;
      const current = months[months.length - 1].tenants;
      return previous > 0 ? Math.round(((current - previous) / previous) * 100) : undefined;
    },
    [growthQuery.data],
  );

  const allTenants: SystemTenant[] = useMemo(
    () => tenantsQuery.data?.data?.tenants ?? [],
    [tenantsQuery.data],
  );
  const isLoadingDbTenants = tenantsQuery.isLoading;
  const refetchDbTenants = tenantsQuery.refetch;

  const [
    selectedDbTenant,
    setSelectedDbTenant,
  ] = useState<SystemTenant | null>(null);
  const [
    isDbDetailsSheetOpen,
    setIsDbDetailsSheetOpen,
  ] = useState(false);
  const [
    suspendDbTenant,
    setSuspendDbTenant,
  ] = useState<SystemTenant | null>(null);
  const [
    deleteConfirmDbTenant,
    setDeleteConfirmDbTenant,
  ] = useState<SystemTenant | null>(null);

  const [
    sortKey,
    setSortKey,
  ] = useState<SortKey>("name");
  const [
    sortDir,
    setSortDir,
  ] = useState<"asc" | "desc">("asc");
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    }
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ponytail: mock data from fleetflow parity port — wire to packages/api
  // Overdue invoices per tenant (id -> count): the reference tints ~25% of rows
  // (index % 4 === 1) as overdue for demo. No overdue flag on SystemTenant yet.
  const overdueByTenant = useMemo<Record<string, number>>(
    () => {
      const map: Record<string, number> = {};
      allTenants.forEach((t, i) => {
        if ((i % 4) === 1)
          map[t.id] = (i % 3) + 1;
      });
      return map;
    },
    [allTenants],
  );

  // Auto-refresh every 60 seconds
  useEffect(
    () => {
      const id = setInterval(
        () => {
          refetchDbTenants();
        },
        60000,
      );
      return () => clearInterval(id);
    },
    [refetchDbTenants],
  );

  const sortedDbTenants = useMemo(
    () => {
      const q = searchQuery.toLowerCase();
      const filtered = allTenants.filter((tenant) => {
        const matchesSearch
          = tenant.name.toLowerCase().includes(q)
            || tenant.email.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || normalizeStatus(tenant.status) === statusFilter;

        const orgTypeF = advancedFilters.orgType;
        const matchesOrgType = !orgTypeF?.enabled || !orgTypeF.value || tenantOrgTypes(tenant).includes(orgTypeF.value);

        const planF = advancedFilters.plan;
        const matchesPlan = !planF?.enabled || !planF.value || tenant.plan === planF.value;

        const billingF = advancedFilters.billingModel;
        const matchesBilling = !billingF?.enabled || !billingF.value || getBillingModel(tenant) === billingF.value;

        const statusF = advancedFilters.status;
        const matchesAdvStatus = !statusF?.enabled || !statusF.value || normalizeStatus(tenant.status) === statusF.value;

        const lastF = advancedFilters.lastActive;
        const matchesLast = !lastF?.enabled || inDateWindow(
          tenant.lastActiveAt,
          lastF.from,
          lastF.to,
        );

        return matchesSearch && matchesStatus && matchesOrgType && matchesPlan && matchesBilling && matchesAdvStatus && matchesLast;
      });

      const value = (t: SystemTenant): string | number => {
        switch (sortKey) {
          case "name":
            return t.name?.toLowerCase() || "";
          case "orgType":
            return tenantOrgTypes(t).join(",");
          case "status":
            return t.status || "";
          case "vehicleCount":
            return t.vehicleCount || 0;
          case "lastActiveAt":
            return toTime(t.lastActiveAt);
        }
      };
      return [...filtered].sort((a, b) => {
        const av = value(a);
        const bv = value(b);
        if (av < bv)
          return sortDir === "asc" ? -1 : 1;
        if (av > bv)
          return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    },
    [
      allTenants,
      searchQuery,
      statusFilter,
      advancedFilters,
      sortKey,
      sortDir,
    ],
  );

  // Stats — live from the summary endpoint.
  const summaryPayload = summaryQuery.data?.data;
  const totalTenants = summaryPayload?.totalTenants ?? "—";
  const activeTenants = summaryPayload?.activeTenants ?? "—";
  const suspendedTenants = summaryPayload?.suspendedTenants ?? "—";
  const terminatedTenants = summaryPayload?.terminatedTenants ?? "—";
  const inactiveTenants = summaryPayload?.inactiveTenants ?? "—";

  const handleReinstate = async (tenant: SystemTenant) => {
    try {
      await updateTenantStatusMutation.mutateAsync({
        id: tenant.id,
        data: { status: "active" },
      });
      toast.success(`${tenant.name} reinstated`);
    }
    catch {
      toast.error(`Could not reinstate ${tenant.name}`);
    }
  };

  const headSortable = (key: SortKey, label: string) => (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => toggleSort(key)}
    >
      {label}
      <SortIcon
        active={sortKey === key}
        dir={sortDir}
      />
    </TableHead>
  );

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={v => setSearchParams(v === "all-tenants" ? {} : { tab: v })}
        className="space-y-4"
      >
        <TabsList className="flex w-fit mx-auto h-auto max-w-full flex-wrap gap-1">
          <TabsTrigger value="all-tenants">All Tenants</TabsTrigger>
          <TabsTrigger value="kyc-review">Onboarding</TabsTrigger>
          <TabsTrigger value="tm-numbers">Telematics Numbers</TabsTrigger>
        </TabsList>

        <PageTitle
          title={activeTab === "kyc-review" ? "Tenants Onboarding" : activeTab === "tm-numbers" ? "Telematics Numbers" : "Tenants"}
          description={activeTab === "tm-numbers"
            ? "Track enterprise telematics number verification and allocation requests."
            : activeTab === "kyc-review"
              ? "Review tenant applications and manage their approval and onboarding progress."
              : "View and manage all tenants, their account status, and subscription details."}
        />

        <TabsContent
          value="all-tenants"
          className="space-y-4"
        >
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatCard
              title="Total Tenants"
              value={totalTenants}
              icon={Building2}
              // ponytail: mock data from fleetflow parity port — wire to packages/api
              // (the reference hard-codes +12%; live growth replaces it once there is a previous month to compare).
              change={tenantGrowthPercent ?? 12}
              changeLabel="this month"
              loading={summaryQuery.isPending}
            />
            <StatCard
              title="Active Tenants"
              value={activeTenants}
              icon={CheckCircle}
              variant="success"
              loading={summaryQuery.isPending}
            />
            <StatCard
              title="Suspended Tenants"
              value={suspendedTenants}
              icon={Ban}
              variant="warning"
              loading={summaryQuery.isPending}
            />
            <StatCard
              title="Terminated Tenants"
              value={terminatedTenants}
              icon={AlertTriangle}
              variant="danger"
              loading={summaryQuery.isPending}
            />
            <StatCard
              title="Inactive Tenants"
              value={inactiveTenants}
              icon={Clock}
              loading={summaryQuery.isPending}
            />
          </div>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    All Tenants
                  </CardTitle>
                  <CardDescription>
                    Complete directory of tenant organizations with plan, lifecycle status, and quota usage.
                  </CardDescription>
                </div>
                <ExportButton
                  filename="tenants"
                  rows={sortedDbTenants}
                  columns={[
                    {
                      header: "Name", accessor: t => t.name,
                    },
                    {
                      header: "Primary Contact", accessor: t => t.primaryContactName || "",
                    },
                    {
                      header: "Email", accessor: t => t.email,
                    },
                    {
                      header: "Plan", accessor: t => t.plan,
                    },
                    {
                      header: "Status", accessor: t => normalizeStatus(t.status),
                    },
                    {
                      header: "Vehicles", accessor: t => t.vehicleCount,
                    },
                    {
                      header: "Drivers", accessor: t => t.driverCount,
                    },
                    {
                      header: "Devices", accessor: t => t.deviceCount,
                    },
                    {
                      header: "Last Active", accessor: t => t.lastActiveAt || "",
                    },
                    {
                      header: "Date Added", accessor: t => t.createdAt || "",
                    },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <PlatformFilterPopover
                  entity="tenants"
                  fields={tenantFilterFields}
                  value={advancedFilters}
                  onApply={setAdvancedFilters}
                  onReset={() => setAdvancedFilters(buildEmptyDraft(tenantFilterFields))}
                />
              </div>

              {isLoadingDbTenants
                ? (
                    <div className="space-y-4">
                      {[
                        1,
                        2,
                        3,
                      ].map(i => (
                        <div
                          key={i}
                          className="flex items-center gap-4"
                        >
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-3 w-[150px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                : tenantsQuery.isError
                  ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Unable to load tenants.
                        <Button
                          variant="link"
                          onClick={() => refetchDbTenants()}
                        >
                          Retry
                        </Button>
                      </div>
                    )
                  : sortedDbTenants.length === 0
                    ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No tenants found
                        </div>
                      )
                    : (
                        <div className="rounded-lg border overflow-x-auto">
                          <Table className="[&_th]:px-6 [&_td]:px-6 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
                            <TableHeader>
                              <TableRow>
                                {headSortable(
                                  "name",
                                  "Tenant",
                                )}
                                <TableHead>Primary Contact</TableHead>
                                {headSortable(
                                  "orgType",
                                  "Tenant Type",
                                )}
                                {headSortable(
                                  "status",
                                  "Status",
                                )}
                                {headSortable(
                                  "vehicleCount",
                                  "Vehicles",
                                )}
                                <TableHead>Drivers</TableHead>
                                <TableHead>Devices</TableHead>
                                {headSortable(
                                  "lastActiveAt",
                                  "Last Active",
                                )}
                                <TableHead>Date Added</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedDbTenants.map((tenant) => {
                                const orgTypes = tenantOrgTypes(tenant);
                                return (
                                  <TableRow
                                    key={tenant.id}
                                    className={overdueByTenant[tenant.id] ? "bg-warning/5 hover:bg-warning/10" : undefined}
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                                          {tenant.name.charAt(0)}
                                        </div>
                                        <div>
                                          <p className="font-medium">{tenant.name}</p>
                                          <p className="text-xs text-muted-foreground">{tenant.email}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {tenant.primaryContactName
                                        ? <span className="font-medium">{tenant.primaryContactName}</span>
                                        : <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {orgTypes.length > 0
                                          ? orgTypes.map(ot => (
                                              <Badge
                                                key={ot}
                                                variant="outline"
                                                className="text-xs whitespace-nowrap"
                                              >
                                                {ot === "OWNER_OPERATOR" ? "Owner-Operator" : "Enterprise"}
                                              </Badge>
                                            ))
                                          : <span className="text-xs text-muted-foreground">—</span>}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1.5">
                                        {getStatusBadge(tenant.status)}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <Truck className="h-4 w-4 text-muted-foreground" />
                                        <span>{tenant.vehicleCount}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span>{tenant.driverCount}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <Cpu className="h-4 w-4 text-muted-foreground" />
                                        <span>{tenant.deviceCount}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {formatWithPattern(
                                        tenant.lastActiveAt,
                                        LOCALE_DATE_TIME,
                                        "Never",
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {formatWithPattern(
                                        tenant.createdAt,
                                        LOCALE_DATE_TIME,
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => {
                                            setSelectedDbTenant(tenant);
                                            setIsDbDetailsSheetOpen(true);
                                          }}
                                          >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          {normalizeStatus(tenant.status) === "suspended"
                                            ? (
                                                <DropdownMenuItem
                                                  onClick={() => handleReinstate(tenant)}
                                                  className="text-success"
                                                >
                                                  <CheckCircle className="h-4 w-4 mr-2" />
                                                  Reinstate
                                                </DropdownMenuItem>
                                              )
                                            : (
                                                // The API needs a reason to suspend, so this opens
                                                // the reason dialog rather than suspending outright.
                                                <DropdownMenuItem
                                                  onClick={() => setSuspendDbTenant(tenant)}
                                                  className="text-warning"
                                                >
                                                  <XCircle className="h-4 w-4 mr-2" />
                                                  Suspend
                                                </DropdownMenuItem>
                                              )}
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => setDeleteConfirmDbTenant(tenant)}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Ban className="h-4 w-4 mr-2" />
                                            Terminate
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc-review">
          <TenantOnboardingPanel />
        </TabsContent>

        <TabsContent value="tm-numbers">
          <TmNumbersPanel />
        </TabsContent>
      </Tabs>

      {/* Tenant Details */}
      <TenantDetailsSheet
        tenant={selectedDbTenant}
        tenantType={selectedDbTenant ? tenantTypeOf(selectedDbTenant) : "ENTERPRISE"}
        open={isDbDetailsSheetOpen}
        onOpenChange={setIsDbDetailsSheetOpen}
      />

      <SuspendAccessDialog
        tenant={suspendDbTenant}
        onClose={() => setSuspendDbTenant(null)}
      />

      {/* Terminate Tenant Confirmation */}
      {deleteConfirmDbTenant && (
        <TerminateTenantDialog
          tenant={deleteConfirmDbTenant}
          open={!!deleteConfirmDbTenant}
          onOpenChange={(o) => {
            if (!o)
              setDeleteConfirmDbTenant(null);
          }}
          onTerminated={() => {
            setDeleteConfirmDbTenant(null);
            refetchDbTenants();
          }}
        />
      )}
    </>
  );
}
