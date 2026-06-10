import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Badge } from "@/components/shadcn/badge";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/shadcn/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/shadcn/dropdown-menu";
import {
  Building2,
  Search,
  MoreHorizontal,
  Truck,
  Users,
  Send,
  Eye,
  Pencil,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Cpu,
  Sparkles,
  Smartphone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TenantOnboardingWizard } from "@/components/platform/TenantOnboardingWizard";
import { TenantEditDialog } from "@/components/platform/TenantEditDialog";
import {
  PlatformFilterPopover,
  buildEmptyDraft,
  type FilterField,
  type FilterDraft
} from "@/components/shadcn/platform-filter-popover";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSystemTenantsQueryOptions,
  getSystemTenantsSummaryQueryOptions,
  getSystemTenantsExportQueryOptions,
  getSystemSubscriptionPlansQueryOptions,
  useUpdateTenantStatus,
  useResendTenantInvite,
  type SubscriptionPlan,
  type SystemTenant,
} from "@truckmoov/api/auth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { TenantDetailsSheet } from "@/components/platform/TenantDetailsSheet";
import { TerminateTenantDialog } from "@/components/platform/TerminateTenantDialog";

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
      { value: "active", label: "Active" },
      { value: "pending", label: "Trial" },
      { value: "suspended", label: "Suspended" },
      { value: "inactive", label: "Inactive" },
    ]
  },
  {
    key: "orgType",
    label: "Organization Type",
    type: "select",
    options: [
      { value: "enterprise", label: "Enterprise" },
      { value: "fleet_provider", label: "Fleet Provider" },
      { value: "aggregator", label: "Aggregator" },
      { value: "owner_operator", label: "Owner-Operator" },
    ]
  },
  {
    key: "plan",
    label: "Plan",
    type: "select",
    options: [
      { value: "starter", label: "Starter" },
      { value: "professional", label: "Professional" },
      { value: "enterprise", label: "Enterprise" },
    ]
  },
  {
    key: "kyc",
    label: "KYC Status",
    type: "select",
    options: [
      { value: "not_submitted", label: "Not Submitted" },
      { value: "pending", label: "Pending" },
      { value: "under_review", label: "Under Review" },
      { value: "verified", label: "Verified" },
      { value: "rejected", label: "Rejected" },
    ]
  },
  { key: "revenue", label: "Revenue (NGN)", type: "range" },
  { key: "lastActive", label: "Last Active", type: "date" },
];

// Badge colours are a UI concern — not returned by the API
const TIER_COLORS: Record<string, string> = {
  starter: "bg-muted text-muted-foreground",
  professional: "bg-primary/10 text-primary",
  enterprise: "bg-success/10 text-success",
};

export default function PlatformTenants() {
  const { currency, format } = useCurrency();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, addNotification } = useRealtimeNotifications();

  const queryClient = useQueryClient();
  const updateTenantStatusMutation = useUpdateTenantStatus();
  const resendTenantInviteMutation = useResendTenantInvite();
  const [isExporting, setIsExporting] = useState(false);

  // Filter state declared before the query so params can be wired
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<FilterDraft>(buildEmptyDraft(tenantFilterFields));

  // Debounce search to avoid a query on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Derive server-side filter params.
  const apiStatus = advancedFilters.status?.enabled && advancedFilters.status?.value
    ? advancedFilters.status.value as "active" | "pending" | "suspended" | "inactive"
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

  const dbTenants: SystemTenant[] = useMemo(() => tenantsPayload?.tenants ?? [], [tenantsPayload]);
  const isLoadingDbTenants = tenantsQuery.isLoading;
  const refetchDbTenants = tenantsQuery.refetch;

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedDbTenant, setSelectedDbTenant] = useState<SystemTenant | null>(null);
  const [isDbDetailsSheetOpen, setIsDbDetailsSheetOpen] = useState(false);
  const [isDbEditDialogOpen, setIsDbEditDialogOpen] = useState(false);
  const [deleteConfirmDbTenant, setDeleteConfirmDbTenant] = useState<SystemTenant | null>(null);

  // Sorting state
  type SortKey = "name" | "orgType" | "plan" | "status" | "vehicleCount" | "simCount" | "monthlyRevenueNgn" | "lastActiveAt";
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 inline" />
      : <ArrowDown className="h-3 w-3 ml-1 inline" />;
  };


  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => {
      refetchDbTenants();
    }, 60000);
    return () => clearInterval(id);
  }, [refetchDbTenants]);


  const plansByTier = useMemo(() => {
    const map: Record<string, SubscriptionPlan> = {};
    (plansQuery.data?.data?.plans ?? []).forEach((p) => { map[p.tier] = p; });
    return map;
  }, [plansQuery.data]);

  const getPlanLimits = (tier: string) => {
    const p = plansByTier[tier];
    const maxVehicles = p?.maxActiveVehicles ?? 10;
    return {
      maxVehicles,
      maxDrivers: Math.ceil(maxVehicles * 1.5),
      maxDevices: maxVehicles,
      maxSims: maxVehicles,
    };
  };

  // Org types per tenant — derived from API response
  const tenantOrgTypesState = useMemo<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    (tenantsPayload?.tenants ?? []).forEach((raw) => {
      if (raw.id && raw.organizationTypes?.length) map[raw.id] = raw.organizationTypes;
    });
    return map;
  }, [tenantsPayload]);

  // Apply sorting
  const sortedDbTenants = useMemo(() => {
    const arr = [...dbTenants];
    arr.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      switch (sortKey) {
        case "name": av = a.name?.toLowerCase() || ""; bv = b.name?.toLowerCase() || ""; break;
        case "orgType":
          av = (tenantOrgTypesState[a.id] || []).join(",");
          bv = (tenantOrgTypesState[b.id] || []).join(",");
          break;
        case "plan": av = a.plan || ""; bv = b.plan || ""; break;
        case "status": av = a.status || ""; bv = b.status || ""; break;
        case "vehicleCount": av = a.vehicleCount || 0; bv = b.vehicleCount || 0; break;
        case "simCount": av = a.simCount || 0; bv = b.simCount || 0; break;
        case "monthlyRevenueNgn": av = a.monthlyRevenueNgn || 0; bv = b.monthlyRevenueNgn || 0; break;
        case "lastActiveAt":
          av = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          bv = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [dbTenants, sortKey, sortDir, tenantOrgTypesState]);

  // Stats — sourced exclusively from the summary API; show "N/A" when not available
  const { totalTenants, activeTenants, suspendedTenants, totalVehicles, totalSims, overdueInvoices } = useMemo(() => ({
    totalTenants: summaryPayload?.totalTenants ?? "N/A",
    activeTenants: summaryPayload?.activeTenants ?? "N/A",
    suspendedTenants: summaryPayload?.suspendedTenants ?? "N/A",
    totalVehicles: summaryPayload?.totalVehicles ?? "N/A",
    totalSims: summaryPayload?.totalSims ?? "N/A",
    overdueInvoices: summaryPayload?.overdueInvoices ?? "N/A",
  }), [summaryPayload]);

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


  const handleWizardComplete = (wizardData: { companyName?: string }) => {
    addNotification({
      type: "tenant_created",
      title: "Tenant Onboarded",
      message: `${wizardData.companyName || "New tenant"} has been onboarded successfully`,
      severity: "success",
    });
  };

  // DB Tenant handlers
  const handleDbTenantStatusChange = async (tenant: SystemTenant, newStatus: SystemTenant["status"]) => {
    try {
      await updateTenantStatusMutation.mutateAsync({ id: tenant.id, data: { status: newStatus } });
      addNotification({
        type: "system",
        title: "Tenant Status Changed",
        message: `${tenant.name} status changed to ${newStatus}`,
        severity: newStatus === "suspended" ? "warning" : "info",
      });
    } catch {
      // Error handled by react-query
    }
  };

  const handleOpenDbEdit = (tenant: SystemTenant) => {
    setSelectedDbTenant(tenant);
    setIsDbEditDialogOpen(true);
  };

  const handleResendInvitation = async (tenant: SystemTenant) => {
    try {
      await resendTenantInviteMutation.mutateAsync({ id: tenant.id });
      toast.success(`Invitation resent to ${tenant.name}`);
    } catch {
      // error handled by react-query
    }
  };

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
        })
      );
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tenants.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <DashboardLayout
      title="Tenant Management"
      subtitle="Create, edit, and manage tenant organizations"
    >
      <div className="space-y-6">
        {/* Top-right grouped controls (currency configured globally in Settings → Billing) */}
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" onClick={() => setIsWizardOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Onboard Tenant
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Total Tenants"
            value={totalTenants}
            icon={Building2}
            change={12}
            changeLabel="this month"
          />
          <StatCard
            title="Active Tenants"
            value={activeTenants}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Suspended"
            value={suspendedTenants}
            icon={Ban}
            variant="danger"
          />
          <StatCard
            title="Total Vehicles"
            value={totalVehicles.toLocaleString()}
            icon={Truck}
          />
          <StatCard
            title="Total SIMs"
            value={totalSims.toLocaleString()}
            icon={Smartphone}
          />
          <StatCard
            title="Overdue Invoices"
            value={overdueInvoices}
            icon={AlertTriangle}
            variant="default"
          />
        </div>


        {/* All Tenants */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  All Tenants
                </CardTitle>
                <CardDescription>
                  Complete directory of tenant organizations with plan, KYC status, fleet size, and revenue.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
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
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <PlatformFilterPopover
                entity="tenants"
                fields={tenantFilterFields}
                value={advancedFilters}
                onApply={setAdvancedFilters}
                onReset={() => setAdvancedFilters(buildEmptyDraft(tenantFilterFields))}
              />
            </div>

            {isLoadingDbTenants ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedDbTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tenants found
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table className="[&_th]:px-6 [&_td]:px-6 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant ID</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                        Tenant<SortIcon k="name" />
                      </TableHead>
                      <TableHead>Primary Contact</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("orgType")}>
                        Org Type<SortIcon k="orgType" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("plan")}>
                        Plan<SortIcon k="plan" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("status")}>
                        Status<SortIcon k="status" />
                      </TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("vehicleCount")}>
                        Vehicles<SortIcon k="vehicleCount" />
                      </TableHead>
                      <TableHead>Drivers</TableHead>
                      <TableHead>Devices</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("simCount")}>
                        SIMs<SortIcon k="simCount" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("monthlyRevenueNgn")}>
                        Revenue<SortIcon k="monthlyRevenueNgn" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("lastActiveAt")}>
                        Last Active<SortIcon k="lastActiveAt" />
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDbTenants.map((tenant) => (
                      <TableRow
                        key={tenant.id}
                      >
                        <TableCell>
                          <span className="font-mono text-xs px-2 py-1 rounded bg-muted text-foreground">
                            TENANT-{String(tenant.id).replace(/-/g, "").slice(0, 8).toUpperCase()}
                          </span>
                        </TableCell>
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
                          {tenant.primaryContactName ? (
                            <span className="font-medium">{tenant.primaryContactName}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(tenantOrgTypesState[tenant.id] || []).length > 0 ? (
                              tenantOrgTypesState[tenant.id].map((ot) => (
                                <Badge key={ot} variant="outline" className="text-xs whitespace-nowrap">
                                  {ORG_TYPE_LABELS[ot] ?? ot}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={TIER_COLORS[tenant.plan] + " capitalize"}>
                            {tenant.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(tenant.status)}
                            {tenant.status === "pending" && (
                              <span className="text-xs text-muted-foreground">
                                {/* Check invitation status first, then KYC status */}
                                {!tenant.invitationStatus?.invitationAccepted && tenant.invitationStatus?.hasPendingInvitation
                                  ? "(Awaiting Invite Acceptance)"
                                  : (!tenant.businessInfo?.verificationStatus || tenant.businessInfo?.verificationStatus === "pending")
                                    ? "(Awaiting KYC)"
                                    : null
                                }
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {tenant.businessInfo?.verificationStatus === "verified" ? (
                            <Badge className="bg-success/10 text-success border-success/30">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : tenant.businessInfo?.verificationStatus === "under_review" ? (
                            <Badge className="bg-warning/10 text-warning border-warning/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Under Review
                            </Badge>
                          ) : tenant.businessInfo?.verificationStatus === "rejected" ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Not Submitted
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className={tenant.vehicleCount >= getPlanLimits(tenant.plan).maxVehicles ? "text-destructive font-medium" : ""}>
                              {tenant.vehicleCount}/{getPlanLimits(tenant.plan).maxVehicles}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className={tenant.driverCount >= getPlanLimits(tenant.plan).maxDrivers ? "text-destructive font-medium" : ""}>
                              {tenant.driverCount}/{getPlanLimits(tenant.plan).maxDrivers}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            <span className={tenant.deviceCount >= getPlanLimits(tenant.plan).maxDevices ? "text-destructive font-medium" : ""}>
                              {tenant.deviceCount}/{getPlanLimits(tenant.plan).maxDevices}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <span className={tenant.simCount >= getPlanLimits(tenant.plan).maxSims ? "text-destructive font-medium" : ""}>
                              {tenant.simCount}/{getPlanLimits(tenant.plan).maxSims}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {currency === "NGN"
                            ? `₦${(tenant.monthlyRevenueNgn || 0).toLocaleString()}`
                            : `$${Math.round((tenant.monthlyRevenueNgn || 0) / 1550).toLocaleString()}`}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tenant.lastActiveAt
                            ? new Date(tenant.lastActiveAt).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedDbTenant(tenant);
                                setIsDbDetailsSheetOpen(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDbEdit(tenant)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {(tenant.status === "pending" || tenant.status === "inactive") && (
                                <DropdownMenuItem onClick={() => handleResendInvitation(tenant)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Resend Invitation
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {tenant.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() => handleDbTenantStatusChange(tenant, "suspended")}
                                  className="text-warning"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : tenant.status === "suspended" ? (
                                <DropdownMenuItem
                                  onClick={() => handleDbTenantStatusChange(tenant, "active")}
                                  className="text-success"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              ) : null}
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tenant Onboarding Wizard */}
      <TenantOnboardingWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={handleWizardComplete}
      />
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
      />

      {/* Terminate DB Tenant Confirmation */}
      {deleteConfirmDbTenant && (
        <TerminateTenantDialog
          tenant={deleteConfirmDbTenant}
          open={!!deleteConfirmDbTenant}
          onOpenChange={(o) => { if (!o) setDeleteConfirmDbTenant(null); }}
          onTerminated={() => {
            setDeleteConfirmDbTenant(null);
            refetchDbTenants();
          }}
        />
      )}
    </DashboardLayout>
  );
}



