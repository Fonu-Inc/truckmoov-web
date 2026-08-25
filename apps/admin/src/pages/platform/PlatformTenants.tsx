import type { ColumnDef } from "@tanstack/react-table";
import type {
  SubscriptionPlan,
  SystemTenant,
} from "@truckmoov/api/auth";
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

  useResendTenantInvite,
  useUpdateTenantStatus,
} from "@truckmoov/api/auth";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";
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
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  Smartphone,
  Sparkles,
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
import { TenantDetailsSheet } from "@/components/platform/TenantDetailsSheet";
import { TenantEditDialog } from "@/components/platform/TenantEditDialog";
import { TenantOnboardingWizard } from "@/components/platform/TenantOnboardingWizard";
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
import { useCurrency } from "@/contexts/CurrencyContext";

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

// Badge colours are a UI concern — not returned by the API
const TIER_COLORS: Record<string, string> = {
  starter: "bg-muted text-muted-foreground",
  professional: "bg-primary/10 text-primary",
  enterprise: "bg-success/10 text-success",
};

type SortKey = "name" | "orgType" | "plan" | "status" | "vehicleCount" | "simCount" | "monthlyRevenueNgn" | "lastActiveAt";
type SortDir = "asc" | "desc";

function SortIcon({
  active, dir,
}: {
  active: boolean; dir: SortDir;
}) {
  if (!active)
    return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" />;
  return dir === "asc"
    ? <ArrowUp className="h-3 w-3 ml-1 inline" />
    : <ArrowDown className="h-3 w-3 ml-1 inline" />;
}

export default function PlatformTenants() {
  const { currency } = useCurrency();
  const queryClient = useQueryClient();
  const updateTenantStatusMutation = useUpdateTenantStatus();
  const resendTenantInviteMutation = useResendTenantInvite();
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

  const dbTenants: SystemTenant[] = useMemo(
    () => tenantsPayload?.tenants ?? [],
    [tenantsPayload],
  );
  const isLoadingDbTenants = tenantsQuery.isLoading;
  const refetchDbTenants = tenantsQuery.refetch;

  const [
    isWizardOpen,
    setIsWizardOpen,
  ] = useState(false);
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

  // Sorting state
  const [
    sortKey,
    setSortKey,
  ] = useState<SortKey>("name");
  const [
    sortDir,
    setSortDir,
  ] = useState<SortDir>("asc");
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    }
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
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

  const plansByTier = useMemo(
    () => {
      const map: Record<string, SubscriptionPlan> = {};
      (plansQuery.data?.data?.plans ?? []).forEach((p) => {
        map[p.tier] = p;
      });
      return map;
    },
    [plansQuery.data],
  );

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

  // Apply sorting
  const sortedDbTenants = useMemo(
    () => {
      const arr = [...dbTenants];
      arr.sort((a, b) => {
        let av: string | number;
        let bv: string | number;
        switch (sortKey) {
          case "name":
            av = a.name?.toLowerCase() || "";
            bv = b.name?.toLowerCase() || "";
            break;
          case "orgType":
            av = (tenantOrgTypesState[a.id] || []).join(",");
            bv = (tenantOrgTypesState[b.id] || []).join(",");
            break;
          case "plan":
            av = a.plan || "";
            bv = b.plan || "";
            break;
          case "status":
            av = a.status || "";
            bv = b.status || "";
            break;
          case "vehicleCount":
            av = a.vehicleCount || 0;
            bv = b.vehicleCount || 0;
            break;
          case "simCount":
            av = a.simCount || 0;
            bv = b.simCount || 0;
            break;
          case "monthlyRevenueNgn":
            av = a.monthlyRevenueNgn || 0;
            bv = b.monthlyRevenueNgn || 0;
            break;
          case "lastActiveAt":
            av = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
            bv = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
            break;
        }
        if (av < bv)
          return sortDir === "asc" ? -1 : 1;
        if (av > bv)
          return sortDir === "asc" ? 1 : -1;
        return 0;
      });
      return arr;
    },
    [
      dbTenants,
      sortKey,
      sortDir,
      tenantOrgTypesState,
    ],
  );

  // Stats — sourced exclusively from the summary API; show "N/A" when not available
  const {
    totalTenants,
    activeTenants,
    suspendedTenants,
    totalVehicles,
    totalSims,
    overdueInvoices,
  } = useMemo(
    () => ({
      totalTenants: summaryPayload?.totalTenants ?? "N/A",
      activeTenants: summaryPayload?.activeTenants ?? "N/A",
      suspendedTenants: summaryPayload?.suspendedTenants ?? "N/A",
      totalVehicles: summaryPayload?.totalVehicles ?? "N/A",
      totalSims: summaryPayload?.totalSims ?? "N/A",
      overdueInvoices: summaryPayload?.overdueInvoices ?? "N/A",
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

  const handleWizardComplete = (wizardData: { companyName?: string }) => {
    toast.success(`${wizardData.companyName || "New tenant"} onboarded`);
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

  const handleOpenDbEdit = (tenant: SystemTenant) => {
    setSelectedDbTenant(tenant);
    setIsDbEditDialogOpen(true);
  };

  const handleResendInvitation = async (tenant: SystemTenant) => {
    try {
      await resendTenantInviteMutation.mutateAsync({ id: tenant.id });
      toast.success(`Invitation resent to ${tenant.name}`);
    }
    catch {
      // error handled by react-query
    }
  };

  const tenantColumns: ColumnDef<SystemTenant>[] = [
    {
      id: "tenantId",
      header: "Tenant ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs px-2 py-1 rounded bg-muted text-foreground">
          TENANT-
          {String(row.original.id).replace(
            /-/g,
            "",
          ).slice(
            0,
            8,
          ).toUpperCase()}
        </span>
      ),
    },
    {
      id: "name",
      header: () => (
        <span
          className="cursor-pointer select-none"
          onClick={() => toggleSort("name")}
        >
          Tenant
          <SortIcon
            active={sortKey === "name"}
            dir={sortDir}
          />
        </span>
      ),
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
      header: () => (
        <span
          className="cursor-pointer select-none"
          onClick={() => toggleSort("orgType")}
        >
          Org Type
          <SortIcon
            active={sortKey === "orgType"}
            dir={sortDir}
          />
        </span>
      ),
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
      id: "plan",
      header: () => (
        <span
          className="cursor-pointer select-none"
          onClick={() => toggleSort("plan")}
        >
          Plan
          <SortIcon
            active={sortKey === "plan"}
            dir={sortDir}
          />
        </span>
      ),
      cell: ({ row }) => (
        <Badge className={`${TIER_COLORS[row.original.plan]} capitalize`}>
          {row.original.plan}
        </Badge>
      ),
    },
    {
      id: "status",
      header: () => (
        <span
          className="cursor-pointer select-none"
          onClick={() => toggleSort("status")}
        >
          Status
          <SortIcon
            active={sortKey === "status"}
            dir={sortDir}
          />
        </span>
      ),
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-1.5">
            {getStatusBadge(tenant.status)}
            {tenant.status === "pending" && (
              <span className="text-xs text-muted-foreground">
                {!tenant.invitationStatus?.invitationAccepted && tenant.invitationStatus?.hasPendingInvitation
                  ? "(Awaiting Invite Acceptance)"
                  : (!tenant.businessInfo?.verificationStatus || tenant.businessInfo?.verificationStatus === "pending")
                      ? "(Awaiting KYC)"
                      : null}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "kycStatus",
      header: "KYC Status",
      cell: ({ row }) => {
        const status = row.original.businessInfo?.verificationStatus;
        if (status === "verified") {
          return (
            <Badge className="bg-success/10 text-success border-success/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          );
        }
        if (status === "under_review") {
          return (
            <Badge className="bg-warning/10 text-warning border-warning/30">
              <Clock className="h-3 w-3 mr-1" />
              Under Review
            </Badge>
          );
        }
        if (status === "rejected") {
          return (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Rejected
            </Badge>
          );
        }
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Not Submitted
          </Badge>
        );
      },
    },
    {
      id: "vehicleCount",
      header: () => (
        <span
          className="cursor-pointer select-none"
          onClick={() => toggleSort("vehicleCount")}
        >
          Vehicles
          <SortIcon
            active={sortKey === "vehicleCount"}
            dir={sortDir}
          />
        </span>
      ),
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-1">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className={tenant.vehicleCount >= getPlanLimits(tenant.plan).maxVehicles ? "text-destructive font-medium" : ""}>
              {tenant.vehicleCount}
              /
              {getPlanLimits(tenant.plan).maxVehicles}
            </span>
          </div>
        );
      },
    },
    {
      id: "drivers",
      header: "Drivers",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className={tenant.driverCount >= getPlanLimits(tenant.plan).maxDrivers ? "text-destructive font-medium" : ""}>
              {tenant.driverCount}
              /
              {getPlanLimits(tenant.plan).maxDrivers}
            </span>
          </div>
        );
      },
    },
    {
      id: "devices",
      header: "Devices",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-1">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className={tenant.deviceCount >= getPlanLimits(tenant.plan).maxDevices ? "text-destructive font-medium" : ""}>
              {tenant.deviceCount}
              /
              {getPlanLimits(tenant.plan).maxDevices}
            </span>
          </div>
        );
      },
    },
    {
      id: "simCount",
      header: () => (
        <span
          className="cursor-pointer select-none"
          onClick={() => toggleSort("simCount")}
        >
          SIMs
          <SortIcon
            active={sortKey === "simCount"}
            dir={sortDir}
          />
        </span>
      ),
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-1">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span className={tenant.simCount >= getPlanLimits(tenant.plan).maxSims ? "text-destructive font-medium" : ""}>
              {tenant.simCount}
              /
              {getPlanLimits(tenant.plan).maxSims}
            </span>
          </div>
        );
      },
    },
    {
      id: "monthlyRevenueNgn",
      header: () => (
        <span
          className="cursor-pointer select-none"
          onClick={() => toggleSort("monthlyRevenueNgn")}
        >
          Revenue
          <SortIcon
            active={sortKey === "monthlyRevenueNgn"}
            dir={sortDir}
          />
        </span>
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {currency === "NGN"
            ? `₦${(row.original.monthlyRevenueNgn || 0).toLocaleString()}`
            : `$${Math.round((row.original.monthlyRevenueNgn || 0) / 1550).toLocaleString()}`}
        </span>
      ),
    },
    {
      id: "lastActiveAt",
      header: () => (
        <span
          className="cursor-pointer select-none"
          onClick={() => toggleSort("lastActiveAt")}
        >
          Last Active
          <SortIcon
            active={sortKey === "lastActiveAt"}
            dir={sortDir}
          />
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastActiveAt ? formatDate(row.original.lastActiveAt) : "Never"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
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
              <DropdownMenuItem onClick={() => handleOpenDbEdit(tenant)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {(tenant.status === "pending" || tenant.status === "inactive") && (
                <DropdownMenuItem onClick={() => handleResendInvitation(tenant)}>
                  Resend Invitation
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {tenant.status === "active"
                ? (
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
                  )
                : tenant.status === "suspended"
                  ? (
                      <DropdownMenuItem
                        onClick={() => handleDbTenantStatusChange(
                          tenant,
                          "active",
                        )}
                        className="text-success"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate
                      </DropdownMenuItem>
                    )
                  : null}
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
      <div className="space-y-6">
        {/* Top-right grouped controls (currency configured globally in Settings → Billing) */}
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            onClick={() => setIsWizardOpen(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Onboard Tenant
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
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
            title="Suspended"
            value={suspendedTenants}
            icon={Ban}
            variant="danger"
            loading={summaryQuery.isPending}
          />
          <StatCard
            title="Total Vehicles"
            value={typeof totalVehicles === "number" ? totalVehicles.toLocaleString() : totalVehicles}
            icon={Truck}
            loading={summaryQuery.isPending}
          />
          <StatCard
            title="Total SIMs"
            value={typeof totalSims === "number" ? totalSims.toLocaleString() : totalSims}
            icon={Smartphone}
            loading={summaryQuery.isPending}
          />
          <StatCard
            title="Overdue Invoices"
            value={overdueInvoices}
            icon={AlertTriangle}
            variant="default"
            loading={summaryQuery.isPending}
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
              <PlatformFilterPopover
                entity="tenants"
                fields={tenantFilterFields}
                value={advancedFilters}
                onApply={setAdvancedFilters}
                onReset={() => setAdvancedFilters(buildEmptyDraft(tenantFilterFields))}
              />
            </div>

            <div className="rounded-lg border overflow-x-auto">
              <DataTable
                columns={tenantColumns}
                data={sortedDbTenants}
                isLoading={isLoadingDbTenants}
                isError={tenantsQuery.isError}
                errorMessage="Unable to load tenants."
                onRetry={() => tenantsQuery.refetch()}
                hasActiveFilters={!!debouncedSearch || !!apiStatus || !!apiPlan || !!apiOrganizationType || !!apiKycStatus || apiRevenueFrom !== undefined || apiRevenueTo !== undefined || !!apiLastActiveFrom || !!apiLastActiveTo}
                emptyState="No tenants found"
                filteredEmptyState="No tenants match your filters."
                className="[&_th]:px-6 [&_td]:px-6 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Onboarding Wizard */}
      <TenantOnboardingWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        subscriptionPlans={plansQuery.data?.data?.plans ?? []}
        isSubscriptionPlansLoading={plansQuery.isLoading}
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
