import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  getSystemTenantsQueryOptions,
  getSystemTenantsSummaryQueryOptions,
  getSystemTenantQueryOptions,
  getSystemSubscriptionPlansQueryOptions,
  useExportSystemTenants,
  useDeleteSystemTenant,
  useUpdateSystemTenant,
  useUpdateSystemTenantStatus,
} from "@/features/auth/api";
import type {
  BillingCycle,
  OrganizationType,
  SystemSubscriptionPlan,
  SystemTenantListItem,
  SystemTenantDetail,
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Pencil,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  Users,
  XCircle,
  Cpu,
  Smartphone,
  Trash2,
  Loader2,
} from "lucide-react";

const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  fleet_provider: "Fleet Provider",
  enterprise: "Enterprise",
  aggregator: "Aggregator",
  owner_operator: "Owner-Operator",
};

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

function getPlanLabel(planCode: string, plans: SystemSubscriptionPlan[]) {
  return plans.find((plan) => plan.code === planCode)?.name ?? planCode;
}

function getPlanOptions(plans: SystemSubscriptionPlan[], fallbackValue?: string) {
  const options = plans.map((plan) => ({
    value: plan.code,
    label: plan.name,
  }));

  if (fallbackValue && !options.some((option) => option.value === fallbackValue)) {
    options.push({
      value: fallbackValue,
      label: fallbackValue,
    });
  }

  return options;
}

const tenantEditSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Enter a valid email address"),
  phoneNumber: z.string().optional(),
  billingEmail: z.union([z.string().email("Enter a valid billing email"), z.literal("")]).optional(),
  businessAddress: z.string().optional(),
  organizationType: z.string().min(1, "Organization type is required"),
  planCode: z.string().min(1, "Plan is required"),
  billingCycle: z.string().min(1, "Billing cycle is required"),
});

type TenantEditFormValues = z.infer<typeof tenantEditSchema>;

function buildTenantEditFormState(detail: SystemTenantDetail | null): TenantEditFormValues | null {
  if (!detail) return null;

  const { tenant, onboarding } = detail;

  return {
    companyName: tenant.businessInfo.companyName || tenant.name,
    email: tenant.email,
    phoneNumber: tenant.phone ?? "",
    billingEmail: tenant.billingEmail ?? "",
    businessAddress: tenant.address ?? tenant.businessInfo.addressLine1 ?? "",
    organizationType: tenant.organizationType ?? tenant.organizationTypes[0] ?? "fleet_provider",
    planCode: tenant.planCode ?? tenant.plan,
    billingCycle: onboarding?.subscription.billingCycle ?? "monthly",
  };
}

export default function PlatformTenants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [editTenantId, setEditTenantId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteTenant, setDeleteTenant] = useState<SystemTenantListItem | null>(null);

  const filters = useMemo(() => buildTenantFilters(searchParams), [searchParams]);
  const searchValue = searchParams.get("search") ?? "";
  const statusFilter = searchParams.get("status") ?? "all";
  const planFilter = searchParams.get("plan") ?? "all";

  const summaryQuery = useQuery(getSystemTenantsSummaryQueryOptions());
  const tenantsQuery = useQuery(getSystemTenantsQueryOptions(filters));
  const subscriptionPlansQuery = useQuery(getSystemSubscriptionPlansQueryOptions());
  const exportTenantsMutation = useExportSystemTenants();
  const updateTenantStatusMutation = useUpdateSystemTenantStatus();
  const updateTenantMutation = useUpdateSystemTenant();
  const deleteTenantMutation = useDeleteSystemTenant();
  const editTenantQuery = useQuery({
    ...getSystemTenantQueryOptions(editTenantId ?? ""),
    enabled: isEditDialogOpen && !!editTenantId,
  });
  const editTenantForm = useForm<TenantEditFormValues>({
    resolver: zodResolver(tenantEditSchema),
    defaultValues: {
      companyName: "",
      email: "",
      phoneNumber: "",
      billingEmail: "",
      businessAddress: "",
      organizationType: "fleet_provider",
      planCode: "starter",
      billingCycle: "monthly",
    },
  });

  const tenants = tenantsQuery.data?.data.tenants ?? [];
  const subscriptionPlans = subscriptionPlansQuery.data?.data.plans ?? [];
  const summary = summaryQuery.data?.data;

  useEffect(() => {
    if (!isEditDialogOpen) return;

    const nextEditForm = buildTenantEditFormState(editTenantQuery.data?.data ?? null);
    if (nextEditForm) {
      editTenantForm.reset(nextEditForm);
    }
  }, [editTenantForm, editTenantQuery.data, isEditDialogOpen]);

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

  const handleEditTenant = (tenant: SystemTenantListItem) => {
    setEditTenantId(tenant.id);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTenant = (tenant: SystemTenantListItem) => {
    setDeleteTenant(tenant);
  };

  const handleStatusChange = async (tenantId: string, status: Extract<SystemTenantStatus, "active" | "suspended">) => {
    await updateTenantStatusMutation.mutateAsync({
      tenantId,
      data: { status },
    });
  };

  const handleEditSubmit = async (values: TenantEditFormValues) => {
    if (!editTenantId) return;

    await updateTenantMutation.mutateAsync({
      tenantId: editTenantId,
      data: {
        company: {
          companyName: values.companyName,
          email: values.email,
          phoneNumber: values.phoneNumber || undefined,
          billingEmail: values.billingEmail || undefined,
          businessAddress: values.businessAddress || undefined,
          organizationType: values.organizationType as OrganizationType,
        },
        subscription: {
          planCode: values.planCode,
          billingCycle: values.billingCycle as BillingCycle,
        },
      },
    });

    setIsEditDialogOpen(false);
    setEditTenantId(null);
    editTenantForm.reset();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTenant) return;

    await deleteTenantMutation.mutateAsync(deleteTenant.id);
    if (selectedTenantId === deleteTenant.id) {
      setIsDetailsSheetOpen(false);
      setSelectedTenantId(null);
    }
    setDeleteTenant(null);
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
        cell: ({ row }) => {
          const planCode = row.original.planCode ?? row.original.plan;
          return (
            <Badge className="bg-primary/10 text-primary border-primary/30">
              {getPlanLabel(planCode, subscriptionPlans)}
            </Badge>
          );
        },
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEditTenant(tenant)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Tenant
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteTenant(tenant)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Tenant
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [subscriptionPlans]
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
                  {getPlanOptions(subscriptionPlans, planFilter !== "all" ? planFilter : undefined).map((plan) => (
                    <SelectItem key={plan.value} value={plan.value}>
                      {plan.label}
                    </SelectItem>
                  ))}
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

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditTenantId(null);
            editTenantForm.reset();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>Update the tenant company and subscription details.</DialogDescription>
          </DialogHeader>

          {editTenantQuery.isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tenant details...
            </div>
          ) : (
            <Form {...editTenantForm}>
              <form className="space-y-6" onSubmit={editTenantForm.handleSubmit(handleEditSubmit)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={editTenantForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input id="edit-company-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editTenantForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input id="edit-email" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editTenantForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input id="edit-phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editTenantForm.control}
                    name="billingEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Email</FormLabel>
                        <FormControl>
                          <Input id="edit-billing-email" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editTenantForm.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Input id="edit-business-address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editTenantForm.control}
                    name="organizationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ORG_TYPE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editTenantForm.control}
                    name="planCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getPlanOptions(subscriptionPlans, field.value).map((plan) => (
                              <SelectItem key={plan.value} value={plan.value}>
                                {plan.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editTenantForm.control}
                    name="billingCycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Cycle</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select billing cycle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditTenantId(null);
                      editTenantForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={updateTenantMutation.isPending}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTenant}
        onOpenChange={(open) => {
          if (!open) setDeleteTenant(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTenant?.name ?? "this tenant"} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                isLoading={deleteTenantMutation.isPending}
                onClick={handleDeleteConfirm}
              >
                Delete Tenant
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
