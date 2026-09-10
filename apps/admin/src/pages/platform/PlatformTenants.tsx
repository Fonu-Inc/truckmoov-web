import type { ColumnDef } from "@tanstack/react-table";
import type { SystemTenant } from "@truckmoov/api/auth";
import type {
  FilterDraft,
  FilterField,
} from "@/components/shadcn/platform-filter-popover";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemSubscriptionPlansQueryOptions,
  getSystemTenantsExportQueryOptions,
  getSystemTenantsQueryOptions,
  getSystemTenantsSummaryQueryOptions,
  useUpdateTenantStatus,
} from "@truckmoov/api/auth";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle,
  Clock,
  Cpu,
  Download,
  Eye,
  MoreHorizontal,
  Search,
  Smartphone,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { KYCReviewPanel } from "@/components/platform/KYCReviewPanel";
import { TenantDetailsSheet } from "@/components/platform/TenantDetailsSheet";
import { TenantEditDialog } from "@/components/platform/TenantEditDialog";
import { TerminateTenantDialog } from "@/components/platform/TerminateTenantDialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";

const ORG_TYPE_LABELS: Record<string, string> = {
  enterprise: "Enterprise",
  fleet_provider: "Fleet Provider",
  aggregator: "Aggregator",
  owner_operator: "Owner-Operator",
};

const tenantFilterFields: FilterField[] = [
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
        value: "pending",
        label: "Trial",
      },
      {
        value: "suspended",
        label: "Suspended",
      },
      {
        value: "inactive",
        label: "Inactive",
      },
    ],
  },
  {
    key: "orgType",
    label: "Organization Type",
    type: "select",
    options: [
      {
        value: "enterprise",
        label: "Enterprise",
      },
      {
        value: "fleet_provider",
        label: "Fleet Provider",
      },
      {
        value: "aggregator",
        label: "Aggregator",
      },
      {
        value: "owner_operator",
        label: "Owner-Operator",
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
    key: "kyc",
    label: "KYC Status",
    type: "select",
    options: [
      {
        value: "not_submitted",
        label: "Not Submitted",
      },
      {
        value: "pending",
        label: "Pending",
      },
      {
        value: "under_review",
        label: "Under Review",
      },
      {
        value: "verified",
        label: "Verified",
      },
      {
        value: "rejected",
        label: "Rejected",
      },
    ],
  },
  {
    key: "revenue",
    label: "Revenue (NGN)",
    type: "range",
  },
  {
    key: "lastActive",
    label: "Last Active",
    type: "date",
  },
];

export default function PlatformTenants() {
  const queryClient = useQueryClient();
  const updateTenantStatusMutation = useUpdateTenantStatus();
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  // Filter state declared before the query so params can be wired
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    advancedFilters,
    setAdvancedFilters,
  ] = useState<FilterDraft>(buildEmptyDraft(tenantFilterFields));

  // Debounce search to avoid a query on every keystroke
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  useEffect(
    () => {
      const timer = setTimeout(
        setDebouncedSearch,
        400,
        searchQuery,
      );
      return () => clearTimeout(timer);
    },
    [searchQuery],
  );

  // Derive server-side filter params.
  const apiStatus = advancedFilters.status?.enabled && advancedFilters.status?.value
    ? advancedFilters.status.value as "active" | "pending" | "suspended" | "inactive" | "terminated"
    : undefined;
  const apiPlan = advancedFilters.plan?.enabled && advancedFilters.plan?.value
    ? advancedFilters.plan.value as "starter" | "professional" | "enterprise"
    : undefined;
  const apiOrganizationType = advancedFilters.orgType?.enabled && advancedFilters.orgType?.value
    ? advancedFilters.orgType.value as "fleet_provider" | "enterprise" | "aggregator" | "owner_operator"
    : undefined;
  const apiKycStatus = advancedFilters.kyc?.enabled && advancedFilters.kyc?.value
    ? advancedFilters.kyc.value as "not_submitted" | "pending" | "under_review" | "verified" | "rejected"
    : undefined;
  const apiRevenueFrom = advancedFilters.revenue?.enabled && advancedFilters.revenue?.from
    ? Number(advancedFilters.revenue.from)
    : undefined;
  const apiRevenueTo = advancedFilters.revenue?.enabled && advancedFilters.revenue?.to
    ? Number(advancedFilters.revenue.to)
    : undefined;
  const apiLastActiveFrom = advancedFilters.lastActive?.enabled && advancedFilters.lastActive?.from
    ? advancedFilters.lastActive.from
    : undefined;
  const apiLastActiveTo = advancedFilters.lastActive?.enabled && advancedFilters.lastActive?.to
    ? advancedFilters.lastActive.to
    : undefined;

  const tenantsQuery = useQuery(getSystemTenantsQueryOptions({
    params: {
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(apiStatus ? { status: apiStatus } : {}),
      ...(apiPlan ? { plan: apiPlan } : {}),
      ...(apiOrganizationType ? { organizationType: apiOrganizationType } : {}),
      ...(apiKycStatus ? { kycStatus: apiKycStatus } : {}),
      ...(apiRevenueFrom !== undefined ? { revenueFrom: apiRevenueFrom } : {}),
      ...(apiRevenueTo !== undefined ? { revenueTo: apiRevenueTo } : {}),
      ...(apiLastActiveFrom ? { lastActiveFrom: apiLastActiveFrom } : {}),
      ...(apiLastActiveTo ? { lastActiveTo: apiLastActiveTo } : {}),
    },
  }));
  const summaryQuery = useQuery(getSystemTenantsSummaryQueryOptions());

  const plansQuery = useQuery(getSystemSubscriptionPlansQueryOptions());

  const tenantsPayload = tenantsQuery.data?.data;
  const summaryPayload = summaryQuery.data?.data;

  const dbTenants: SystemTenant[] = useMemo(
    () => tenantsPayload?.tenants ?? [],
    [tenantsPayload],
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
    isDbEditDialogOpen,
    setIsDbEditDialogOpen,
  ] = useState(false);
  const [
    deleteConfirmDbTenant,
    setDeleteConfirmDbTenant,
  ] = useState<SystemTenant | null>(null);

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

  // Quota fraction for a resource. limit === null means unlimited — plain count.
  const renderQuota = (used: number, limit: number | null) => {
    if (limit === null || limit === undefined) return <span>{used}</span>;
    const over = used > limit;
    return (
      <span className={over ? "text-destructive font-medium" : ""}>
        {used}
        /
        {limit}
      </span>
    );
  };

  // Org types per tenant — derived from API response
  const tenantOrgTypesState = useMemo<Record<string, string[]>>(
    () => {
      const map: Record<string, string[]> = {};
      (tenantsPayload?.tenants ?? []).forEach((raw) => {
        if (raw.id && raw.organizationTypes?.length)
          map[raw.id] = raw.organizationTypes;
      });
      return map;
    },
    [tenantsPayload],
  );

  // Stats — sourced exclusively from the summary API; show "N/A" when not available
  const {
    totalTenants,
    activeTenants,
    suspendedTenants,
    inactiveTenants,
    terminatedTenants,
  } = useMemo(
    () => ({
      totalTenants: summaryPayload?.totalTenants ?? "N/A",
      activeTenants: summaryPayload?.activeTenants ?? "N/A",
      suspendedTenants: summaryPayload?.suspendedTenants ?? "N/A",
      inactiveTenants: summaryPayload?.inactiveTenants ?? "N/A",
      terminatedTenants: summaryPayload?.terminatedTenants ?? "N/A",
    }),
    [summaryPayload],
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
      case "trial":
        return <Badge className="bg-primary/10 text-primary border-primary/30">Trial</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "terminated":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/40">Terminated</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // DB Tenant handlers
  const handleDbTenantStatusChange = async (tenant: SystemTenant, newStatus: SystemTenant["status"]) => {
    try {
      await updateTenantStatusMutation.mutateAsync({
        id: tenant.id,
        data: { status: newStatus },
      });
      toast.success(`${tenant.name} is now ${newStatus}`);
    }
    catch {
      // Error handled by react-query
    }
  };

  const tenantColumns: ColumnDef<SystemTenant>[] = [
    {
      id: "name",
      accessorFn: row => row.name?.toLowerCase() ?? "",
      header: "Tenant",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
              {getInitials(tenant.name)}
            </div>
            <div>
              <p className="font-medium">{tenant.name}</p>
              <p className="text-xs text-muted-foreground">{tenant.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "primaryContact",
      header: "Primary Contact",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.primaryContactName
            ? <span className="font-medium">{row.original.primaryContactName}</span>
            : <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      id: "orgType",
      accessorFn: row => (tenantOrgTypesState[row.id] || []).join(","),
      header: "Org Type",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(tenantOrgTypesState[row.original.id] || []).length > 0
            ? (
                tenantOrgTypesState[row.original.id].map(ot => (
                  <Badge
                    key={ot}
                    variant="outline"
                    className="text-xs whitespace-nowrap"
                  >
                    {ORG_TYPE_LABELS[ot] ?? ot}
                  </Badge>
                ))
              )
            : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
        </div>
      ),
    },
    {
      id: "status",
      accessorFn: row => row.status ?? "",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "vehicleCount",
      accessorFn: row => row.vehicleCount ?? 0,
      header: "Vehicles",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Truck className="h-4 w-4 text-muted-foreground" />
          {renderQuota(row.original.vehicleCount, row.original.quotas?.vehicles ?? null)}
        </div>
      ),
    },
    {
      id: "drivers",
      header: "Drivers",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          {renderQuota(row.original.driverCount, row.original.quotas?.drivers ?? null)}
        </div>
      ),
    },
    {
      id: "devices",
      header: "Devices",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          {renderQuota(row.original.deviceCount, row.original.quotas?.devices ?? null)}
        </div>
      ),
    },
    {
      id: "simCount",
      accessorFn: row => row.simCount ?? 0,
      header: "SIMs",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          {renderQuota(row.original.simCount, row.original.quotas?.sims ?? null)}
        </div>
      ),
    },
    {
      id: "lastActiveAt",
      accessorFn: row => (row.lastActiveAt ? new Date(row.lastActiveAt).getTime() : 0),
      header: "Last Active",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastActiveAt ? formatDate(row.original.lastActiveAt) : "Never"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      meta: { className: "w-[50px]" },
      cell: ({ row }) => {
        const tenant = row.original;
        return (
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
              {tenant.status === "suspended"
                ? (
                    <DropdownMenuItem
                      onClick={() => handleDbTenantStatusChange(
                        tenant,
                        "active",
                      )}
                      className="text-success"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Reinstate
                    </DropdownMenuItem>
                  )
                : (
                    <DropdownMenuItem
                      onClick={() => handleDbTenantStatusChange(
                        tenant,
                        "suspended",
                      )}
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
        );
      },
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(
        getSystemTenantsExportQueryOptions({
          params: {
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
            ...(apiStatus ? { status: apiStatus } : {}),
            ...(apiPlan ? { plan: apiPlan } : {}),
            ...(apiOrganizationType ? { organizationType: apiOrganizationType } : {}),
            ...(apiKycStatus ? { kycStatus: apiKycStatus } : {}),
            ...(apiRevenueFrom !== undefined ? { revenueFrom: apiRevenueFrom } : {}),
            ...(apiRevenueTo !== undefined ? { revenueTo: apiRevenueTo } : {}),
            ...(apiLastActiveFrom ? { lastActiveFrom: apiLastActiveFrom } : {}),
            ...(apiLastActiveTo ? { lastActiveTo: apiLastActiveTo } : {}),
          },
        }),
      );
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tenants.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* ponytail: stats live inside the All Tenants tab (mirrors the platform
          reference at :8080/platform/tenants). Tab-scoped context sits under
          its tab, not floating above the tab bar. */}
      <Tabs
        defaultValue="all-tenants"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all-tenants">All Tenants</TabsTrigger>
          <TabsTrigger value="kyc-review">Applications by Organizations</TabsTrigger>
        </TabsList>

        <TabsContent
          value="all-tenants"
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatCard
              title="Total Tenants"
              value={totalTenants}
              icon={Building2}
              change={12}
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
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      All Tenants
                    </CardTitle>
                    <CardDescription>
                      Complete directory of tenant organizations with plan, lifecycle status, and quota usage.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exporting…" : "Export Data"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      name="tenants-search"
                      autoComplete="off"
                      placeholder="Search by name or email..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    value={apiStatus ?? "all"}
                    onValueChange={(v) => {
                      setAdvancedFilters(prev => ({
                        ...prev,
                        status: v === "all"
                          ? {
                              enabled: false, value: "",
                            }
                          : {
                              enabled: true, value: v,
                            },
                      }));
                    }}
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
                  : dbTenants.length === 0
                    ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No tenants found
                        </div>
                      )
                    : (
                        <div className="rounded-lg border overflow-x-auto">
                          <DataTable
                            columns={tenantColumns}
                            data={dbTenants}
                            isError={tenantsQuery.isError}
                            errorMessage="Unable to load tenants."
                            onRetry={() => tenantsQuery.refetch()}
                            className="[&_th]:px-6 [&_td]:px-6 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap"
                          />
                        </div>
                      )}
              </CardContent>
            </Card>
          </TabsContent>

        <TabsContent value="kyc-review">
          <KYCReviewPanel />
        </TabsContent>
      </Tabs>

      {/* Database Tenant Details Sheet */}
      <TenantDetailsSheet
        tenant={selectedDbTenant}
        open={isDbDetailsSheetOpen}
        onOpenChange={setIsDbDetailsSheetOpen}
      />

      {/* Edit DB Tenant Dialog */}
      <TenantEditDialog
        tenant={selectedDbTenant}
        open={isDbEditDialogOpen}
        onOpenChange={setIsDbEditDialogOpen}
        subscriptionPlans={plansQuery.data?.data?.plans ?? []}
        isSubscriptionPlansLoading={plansQuery.isLoading}
      />

      {/* Terminate DB Tenant Confirmation */}
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
