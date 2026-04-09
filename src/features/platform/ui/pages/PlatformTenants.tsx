import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "react-router-dom";
import {
  getSystemTenantsQueryOptions,
  getSystemTenantsSummaryQueryOptions,
  useExportSystemTenants,
  useUpdateSystemTenantStatus,
} from "@/features/auth/api";
import type {
  OrganizationType,
  SystemTenantListItem,
  SystemTenantsQuery,
  SystemTenantStatus,
  VerificationStatus,
} from "@/features/auth/api/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TenantOnboardingWizard } from "@/components/platform/TenantOnboardingWizard";
import { TenantDetailsSheet } from "@/components/platform/TenantDetailsSheet";
import {
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  Users,
  XCircle,
  Cpu,
  Smartphone,
} from "lucide-react";

const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  fleet_provider: "Fleet Provider",
  enterprise: "Enterprise",
  aggregator: "Aggregator",
  owner_operator: "Owner-Operator",
};

const PLAN_LABELS = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
} as const;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleDateString();
}

function getStatusBadge(status: SystemTenantStatus) {
  switch (status) {
    case "active":
      return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
    case "pending":
      return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
    case "suspended":
      return <Badge variant="destructive">Suspended</Badge>;
    case "inactive":
      return <Badge variant="secondary">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getVerificationBadge(status: VerificationStatus) {
  switch (status) {
    case "verified":
      return (
        <Badge className="bg-success/10 text-success border-success/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    case "under_review":
      return (
        <Badge className="bg-warning/10 text-warning border-warning/30">
          <Clock className="h-3 w-3 mr-1" />
          Under Review
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-warning/10 text-warning border-warning/30">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "not_submitted":
    default:
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Not Submitted
        </Badge>
      );
  }
}

function getPendingStatusHint(tenant: SystemTenantListItem) {
  if (tenant.status !== "pending") return null;

  if (!tenant.invitationStatus.invitationAccepted && tenant.invitationStatus.hasPendingInvitation) {
    return "(Awaiting Invite Acceptance)";
  }

  if (
    tenant.businessInfo.verificationStatus === "pending" ||
    tenant.businessInfo.verificationStatus === "not_submitted"
  ) {
    return "(Awaiting KYC)";
  }

  return null;
}

function buildTenantFilters(searchParams: URLSearchParams): SystemTenantsQuery {
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";
  const plan = searchParams.get("plan") ?? "all";

  return {
    search: search || undefined,
    status: status !== "all" ? (status as SystemTenantStatus) : undefined,
    plan: plan !== "all" ? (plan as SystemTenantsQuery["plan"]) : undefined,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function PlatformTenants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

  const filters = useMemo(() => buildTenantFilters(searchParams), [searchParams]);
  const searchValue = searchParams.get("search") ?? "";
  const statusFilter = searchParams.get("status") ?? "all";
  const planFilter = searchParams.get("plan") ?? "all";

  const summaryQuery = useQuery(getSystemTenantsSummaryQueryOptions());
  const tenantsQuery = useQuery(getSystemTenantsQueryOptions(filters));
  const exportTenantsMutation = useExportSystemTenants();
  const updateTenantStatusMutation = useUpdateSystemTenantStatus();

  const tenants = tenantsQuery.data?.data.tenants ?? [];
  const summary = summaryQuery.data?.data;

  const setFilterParam = (key: "search" | "status" | "plan", value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleRefresh = async () => {
    await Promise.all([summaryQuery.refetch(), tenantsQuery.refetch()]);
  };

  const handleExport = async () => {
    const blob = await exportTenantsMutation.mutateAsync(filters);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `system-tenants-${timestamp}.csv`);
  };

  const handleViewDetails = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setIsDetailsSheetOpen(true);
  };

  const handleStatusChange = async (tenantId: string, status: Extract<SystemTenantStatus, "active" | "suspended">) => {
    await updateTenantStatusMutation.mutateAsync({
      tenantId,
      data: { status },
    });
  };

  const columns = useMemo<ColumnDef<SystemTenantListItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tenant",
        cell: ({ row }) => {
          const tenant = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                {tenant.name.charAt(0)}
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
        accessorKey: "organizationTypes",
        header: "Org Type",
        cell: ({ row }) => {
          const tenant = row.original;
          const organizationTypes =
            tenant.organizationTypes.length > 0
              ? tenant.organizationTypes
              : tenant.organizationType
                ? [tenant.organizationType]
                : [];

          if (organizationTypes.length === 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {organizationTypes.map((organizationType) => (
                <Badge key={organizationType} variant="outline" className="text-xs whitespace-nowrap">
                  {ORG_TYPE_LABELS[organizationType]}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => (
          <Badge className="bg-primary/10 text-primary border-primary/30">
            {PLAN_LABELS[row.original.plan]}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const tenant = row.original;
          const hint = getPendingStatusHint(tenant);

          return (
            <div className="space-y-1">
              <div>{getStatusBadge(tenant.status)}</div>
              {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
          );
        },
      },
      {
        accessorKey: "businessInfo.verificationStatus",
        header: "KYC Status",
        cell: ({ row }) => getVerificationBadge(row.original.businessInfo.verificationStatus),
      },
      {
        accessorKey: "vehicleCount",
        header: "Vehicles",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.vehicleCount}</span>
          </div>
        ),
      },
      {
        accessorKey: "driverCount",
        header: "Drivers",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.driverCount}</span>
          </div>
        ),
      },
      {
        accessorKey: "deviceCount",
        header: "Devices",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.deviceCount}</span>
          </div>
        ),
      },
      {
        accessorKey: "simCount",
        header: "SIMs",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.simCount}</span>
          </div>
        ),
      },
      {
        accessorKey: "monthlyRevenueNgn",
        header: "Revenue",
        cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.monthlyRevenueNgn)}</span>,
      },
      {
        accessorKey: "lastActiveAt",
        header: "Last Active",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.lastActiveAt)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const tenant = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewDetails(tenant.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {tenant.status === "active" && (
                  <DropdownMenuItem onClick={() => handleStatusChange(tenant.id, "suspended")}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Suspend
                  </DropdownMenuItem>
                )}
                {tenant.status === "suspended" && (
                  <DropdownMenuItem onClick={() => handleStatusChange(tenant.id, "active")}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header Actions */}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Tenants"
            value={summaryQuery.isLoading ? "..." : summary?.totalTenants ?? "N/A"}
            icon={Building2}
          />
          <StatCard
            title="Active Tenants"
            value={summaryQuery.isLoading ? "..." : summary?.activeTenants ?? "N/A"}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Monthly Revenue"
            value={summaryQuery.isLoading ? "..." : summary ? formatCurrency(summary.monthlyRevenueNgn) : "N/A"}
            icon={CreditCard}
          />
          <StatCard
            title="Total Vehicles"
            value={summaryQuery.isLoading ? "..." : summary?.totalVehicles ?? "N/A"}
            icon={Truck}
          />
        </div>

        {/* All Tenants */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                All Tenants
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  isLoading={summaryQuery.isFetching || tenantsQuery.isFetching}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  isLoading={exportTenantsMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" onClick={() => setIsWizardOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Onboard Tenant
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchValue}
                  onChange={(event) => setFilterParam("search", event.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setFilterParam("status", value)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={(value) => setFilterParam("plan", value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DataTable
              columns={columns}
              data={tenants}
              isLoading={tenantsQuery.isLoading}
              noResultStatement="No tenants match the current filters."
            />
          </CardContent>
        </Card>
      </div>

      <TenantOnboardingWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={() => undefined}
      />

      <TenantDetailsSheet
        tenantId={selectedTenantId}
        open={isDetailsSheetOpen}
        onOpenChange={(open) => {
          setIsDetailsSheetOpen(open);
          if (!open) setSelectedTenantId(null);
        }}
      />
    </>
  );

  /*
    Preserved legacy UI for later endpoint integration.

    Header Actions
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CurrencySelector />
      </div>
      <NotificationCenter
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClear={clearNotifications}
      />
    </div>

    Legacy row actions and dialogs
    <DropdownMenuItem onClick={() => handleOpenDbEdit(tenant)}>
      <Pencil className="h-4 w-4 mr-2" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleResendInvitation(tenant)}>
      <Send className="h-4 w-4 mr-2" />
      Resend Invitation
    </DropdownMenuItem>
    <DropdownMenuItem
      onClick={() => setDeleteConfirmDbTenant(tenant)}
      className="text-destructive"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>

    <Dialog open={isDbEditDialogOpen} onOpenChange={setIsDbEditDialogOpen}>
      ...legacy edit tenant form...
    </Dialog>

    <AlertDialog open={!!deleteConfirmDbTenant} onOpenChange={() => setDeleteConfirmDbTenant(null)}>
      ...legacy delete confirmation...
    </AlertDialog>
  */
}
