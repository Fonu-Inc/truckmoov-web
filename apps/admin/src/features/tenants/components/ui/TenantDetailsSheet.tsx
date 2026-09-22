import type {
  SystemTenant,
  SystemTenantAuditLogEntry,
  SystemTenantDeviceRow,
  SystemTenantDocument,
  SystemTenantDriverRow,
  SystemTenantResourcesResponse,
  SystemTenantResourceTab,
  SystemTenantSimRow,
  SystemTenantVehicleRow,
} from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemTenantAuditLogQueryOptions,
  getSystemTenantDocumentsQueryOptions,
  getSystemTenantQueryOptions,
  getSystemTenantResourcesQueryOptions,
  useUpdateTenantStatus,
} from "@truckmoov/api/auth";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  formatDayMonthTime,
  formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Ban,
  Building,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  CreditCard,
  FileText,
  Hash,
  Mail,
  MapPin,
  Package,
  Phone,
  Save,
  Shield,
  Smartphone,
  Sparkles,
  Truck,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataExportPanel } from "@/components/platform/DataExportPanel";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import {
  Dialog as Sheet,
  DialogContent as SheetContent,
  DialogDescription as SheetDescription,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";

import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TerminateTenantDialog } from "./TerminateTenantDialog";

type TenantDetailsSheetProps = {
  tenant: SystemTenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Render inline as a full page instead of a dialog. The header, tabs and every
   * tab body are shared with the dialog form — only the surrounding chrome differs,
   * so the two can never drift apart.
   */
  asPage?: boolean;
};

const planDetails = {
  starter: {
    name: "Starter",
    priceNGN: 774500,
    priceUSD: 499,
    color: "bg-muted text-muted-foreground",
  },
  professional: {
    name: "Professional",
    priceNGN: 2323500,
    priceUSD: 1499,
    color: "bg-primary/10 text-primary",
  },
  enterprise: {
    name: "Enterprise",
    priceNGN: 7748500,
    priceUSD: 4999,
    color: "bg-success/10 text-success",
  },
};

// Usage bar for a resource tab. Mirrors renderQuota on the list page:
// limit === null → unlimited; used > limit → destructive.
type ResourceUsageProps = {
  icon: typeof Building2;
  label: string;
  used: number;
  limit: number | null;
};
function ResourceUsage({
  icon: Icon, label, used, limit,
}: ResourceUsageProps) {
  const unlimited = limit === null || limit === undefined;
  const over = !unlimited && used > (limit as number);
  const pct = unlimited || (limit as number) === 0
    ? 0
    : Math.min(
        100,
        Math.round((used / (limit as number)) * 100),
      );
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${over ? "text-destructive" : ""}`}>
          {used}
          {unlimited
            ? <span className="text-muted-foreground font-normal"> · Unlimited</span>
            : (
                <span className="text-muted-foreground font-normal">
                  {" / "}
                  {limit}
                </span>
              )}
        </span>
      </div>
      {!unlimited && (
        <Progress
          value={pct}
          className="h-2"
        />
      )}
    </Card>
  );
}

// `available: false` means the fleet service was unreachable — not empty.
type ResourceStateProps = {
  payload: {
    available: boolean; items: unknown[];
  } | undefined;
  isLoading: boolean;
  empty: string;
};
function ResourceState({
  payload, isLoading, empty,
}: ResourceStateProps) {
  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!payload)
    return null;
  if (!payload.available) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Service unavailable — could not reach the fleet service.
      </Card>
    );
  }
  if (payload.items.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        {empty}
      </Card>
    );
  }
  return null;
}

// Page-mode chrome. Declared at module scope so the tab tree is never remounted
// by a component identity that changes on every render (react/static-components).
type ShellSlotProps = {
  children?: ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
function PageShell({ children }: ShellSlotProps) {
  return <>{children}</>;
}
function PageShellContent({ children }: ShellSlotProps) {
  return <div className="space-y-6">{children}</div>;
}
function PageShellHeader({ children }: ShellSlotProps) {
  return <div className="space-y-2">{children}</div>;
}
function PageShellTitle({
  children, className,
}: ShellSlotProps) {
  return <h1 className={className}>{children}</h1>;
}
function PageShellDescription({
  children, className,
}: ShellSlotProps) {
  return <p className={`text-sm text-muted-foreground ${className ?? ""}`}>{children}</p>;
}

export function TenantDetailsSheet({
  tenant,
  open,
  onOpenChange,
  asPage = false,
}: TenantDetailsSheetProps) {
  const { currency } = useCurrency();
  const queryClient = useQueryClient();
  const [
    terminateOpen,
    setTerminateOpen,
  ] = useState(false);
  const [
    activeTab,
    setActiveTab,
  ] = useState("overview");
  const updateStatusMutation = useUpdateTenantStatus();

  // Fetch fresh tenant detail when the sheet opens
  const detailQuery = useQuery({
    ...getSystemTenantQueryOptions(tenant?.id ?? ""),
    enabled: (open || asPage) && !!tenant?.id,
  });
  const detail = detailQuery.data?.data as Record<string, unknown> | undefined;

  // Fetch Owner-Operator orgs under this tenant for vehicle cap management
  const { data: ooOrgs = [] } = useQuery({
    queryKey: [
      "tenant-oo-orgs",
      tenant?.id,
    ],
    enabled: false,
    queryFn: async () => [] as any[],
  });

  // Fetch vehicle counts per org
  const { data: vehicleCounts = {} } = useQuery({
    queryKey: [
      "tenant-oo-vehicle-counts",
      ooOrgs.map((o: any) => o.id),
    ],
    enabled: false,
    queryFn: async () => ({} as Record<string, number>),
  });

  const [
    editingCaps,
    setEditingCaps,
  ] = useState<Record<string, number>>({});
  const [savingOrgId] = useState<string | null>(null);
  const [billingModel] = useState<string | null>(null);
  const [_savingBillingModel] = useState(false);
  const [
    editingQuota,
    setEditingQuota,
  ] = useState<number | null>(null);
  const [savingQuota] = useState(false);
  const [
    editingOpQuota,
    setEditingOpQuota,
  ] = useState<Record<"driver" | "device" | "sim", number | null>>({
    driver: null,
    device: null,
    sim: null,
  });
  const [savingOpQuota] = useState<"driver" | "device" | "sim" | null>(null);

  // Tenant-level vehicle quota + active vehicle count
  const { data: tenantQuotaData } = useQuery({
    queryKey: [
      "tenant-vehicle-quota",
      tenant?.id,
    ],
    enabled: false,
    queryFn: async () => ({
      quota: 25,
      activeCount: 0,
    }),
  });

  const handleSaveQuota = async () => {
    toast.info("Coming soon");
  };

  // Operational quotas (driver, device, sim) + current counts
  const { data: opQuotaData } = useQuery({
    queryKey: [
      "tenant-op-quotas",
      tenant?.id,
    ],
    enabled: false,
    queryFn: async () => ({
      driver: {
        quota: 30,
        count: 0,
      },
      device: {
        quota: 25,
        count: 0,
      },
      sim: {
        quota: 25,
        count: 0,
      },
    }),
  });

  const handleSaveOpQuota = async (_kind) => {
    toast.info("Coming soon");
  };

  // Fetch current billing model
  const { data: tenantBillingData } = useQuery({
    queryKey: [
      "tenant-billing-model",
      tenant?.id,
    ],
    enabled: false,
    queryFn: async () => null as any,
  });

  const tenantId = tenant?.id ?? "";
  const planCode = tenant?.planCode ?? undefined;

  // Resource tabs — one endpoint, four shapes. Only the visible tab fetches.
  function useResourceTab<TItem>(tab: SystemTenantResourceTab) {
    const query = useQuery({
      ...getSystemTenantResourcesQueryOptions({
        id: tenantId, tab, planCode,
      }),
      enabled: (open || asPage) && !!tenantId && activeTab === tab,
    });
    return {
      payload: query.data?.data as SystemTenantResourcesResponse<TItem>["data"] | undefined,
      isLoading: query.isLoading,
      isError: query.isError,
    };
  }

  const vehiclesTab = useResourceTab<SystemTenantVehicleRow>("vehicles");
  const driversTab = useResourceTab<SystemTenantDriverRow>("drivers");
  const devicesTab = useResourceTab<SystemTenantDeviceRow>("devices");
  const simsTab = useResourceTab<SystemTenantSimRow>("sims");

  // Documents
  const documentsQuery = useQuery({
    ...getSystemTenantDocumentsQueryOptions(tenantId),
    enabled: (open || asPage) && !!tenantId && activeTab === "kyc",
  });
  const documents = documentsQuery.data?.data?.items ?? [];

  // Audit log — fixed 10 entries server-side, no pagination.
  const auditQuery = useQuery({
    ...getSystemTenantAuditLogQueryOptions(tenantId),
    enabled: (open || asPage) && !!tenantId && activeTab === "audit",
  });
  const auditEntries: SystemTenantAuditLogEntry[] = auditQuery.data?.data?.items ?? [];
  const loadingAudit = auditQuery.isLoading;

  // Trial status (from view)
  const { data: trialStatus } = useQuery({
    queryKey: [
      "tenant-trial-status",
      tenant?.id,
    ],
    enabled: false,
    queryFn: async () => null as any,
  });

  // Comprehensive billing summary: subscription + plan + last payment
  const { data: billingSummary } = useQuery({
    queryKey: [
      "tenant-billing-summary",
      tenant?.id,
    ],
    enabled: false,
    queryFn: async () => ({
      sub: null,
      lastPayment: null,
    }),
  });

  const [
    extendDays,
    setExtendDays,
  ] = useState<number>(14);
  const [savingTrial] = useState(false);

  const handleExtendTrial = async () => {
    toast.info("Coming soon");
  };

  const handleConvertTrial = async () => {
    toast.info("Coming soon");
  };

  const handleSaveVehicleCap = async (_orgId) => {
    toast.info("Coming soon");
  };

  if (!tenant)
    return null;

  // Page mode swaps the dialog chrome for plain elements so the header, tabs and
  // every tab body below are rendered from one source in both forms.
  const Shell = asPage ? PageShell : Sheet;
  const ShellContent = asPage ? PageShellContent : SheetContent;
  const ShellHeader = asPage ? PageShellHeader : SheetHeader;
  const ShellTitle = asPage ? PageShellTitle : SheetTitle;
  const ShellDescription = asPage ? PageShellDescription : SheetDescription;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "terminated":
        return (
          <Badge
            variant="destructive"
            className="gap-1"
          >
            <Ban className="h-3 w-3" />
            Terminated
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVerificationBadge = (status: string | null | undefined) => {
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
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const fullAddress = tenant.businessInfo
    ? [
        tenant.businessInfo.addressLine1,
        tenant.businessInfo.addressLine2,
        tenant.businessInfo.city,
        tenant.businessInfo.state,
        tenant.businessInfo.postalCode,
        tenant.businessInfo.country,
      ]
        .filter(Boolean)
        .join(", ")
    : tenant.address;

  return (
    <Shell
      open={open}
      onOpenChange={onOpenChange}
    >
      <ShellContent className={asPage ? undefined : "max-w-2xl max-h-[85vh] overflow-y-auto"}>
        <ShellHeader>
          <ShellTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
              {getInitials(tenant.name)}
            </div>
            <div className="flex-1">
              <span>{tenant.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {tenant.status === "suspended"
                ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate({
                        id: tenant.id,
                        data: { status: "active" },
                      })}
                      className="gap-2 border-success/40 text-success hover:bg-success/10"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Activate
                    </Button>
                  )
                : tenant.status === "active"
                  ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({
                          id: tenant.id,
                          data: { status: "suspended" },
                        })}
                        className="gap-2 border-warning/40 text-warning hover:bg-warning/10"
                      >
                        <Clock className="h-4 w-4" />
                        Suspend
                      </Button>
                    )
                  : null}
              {tenant.status !== "inactive" && tenant.status !== "terminated" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setTerminateOpen(true)}
                  className="gap-2"
                >
                  <Ban className="h-4 w-4" />
                  Terminate
                </Button>
              )}
            </div>
          </ShellTitle>
          <ShellDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Member since
            {" "}
            {formatWithPattern(
              tenant.createdAt,
              "MMMM yyyy",
            )}
          </ShellDescription>
        </ShellHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-6"
        >
          <TabsList className="grid grid-cols-9 w-full">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="vehicles"
              className="flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Vehicles
            </TabsTrigger>
            <TabsTrigger
              value="drivers"
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Drivers
            </TabsTrigger>
            <TabsTrigger
              value="devices"
              className="flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              Devices
            </TabsTrigger>
            <TabsTrigger
              value="sims"
              className="flex items-center gap-2"
            >
              SIMs
            </TabsTrigger>
            <TabsTrigger
              value="kyc"
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              KYC & Docs
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger
              value="export"
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Data Export
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-6 pr-4">
                {/* Subscription Plan & Tenant Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Subscription Plan</p>
                    {detailQuery.isLoading && !detail
                      ? (
                          <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                        )
                      : (
                          <Badge className={planDetails[(detail?.plan as keyof typeof planDetails) ?? tenant.plan]?.color ?? planDetails[tenant.plan].color}>
                            {planDetails[(detail?.plan as keyof typeof planDetails) ?? tenant.plan]?.name ?? planDetails[tenant.plan].name}
                          </Badge>
                        )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tenant Status</p>
                    {detailQuery.isLoading && !detail
                      ? (
                          <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                        )
                      : (
                          getStatusBadge(String(detail?.status ?? tenant.status))
                        )}
                  </div>
                </div>
                <Separator />
                {/* Business Information */}
                {tenant.businessInfo && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-muted-foreground">Business Information</h4>
                        {getVerificationBadge(tenant.businessInfo.verificationStatus)}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Company:</span>
                            <span className="font-medium">{tenant.businessInfo.companyName}</span>
                          </div>
                          {tenant.businessInfo.registrationNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Reg No:</span>
                              <span className="font-medium">{tenant.businessInfo.registrationNumber}</span>
                            </div>
                          )}
                          {tenant.businessInfo.taxId && (
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Tax ID:</span>
                              <span className="font-medium">{tenant.businessInfo.taxId}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {tenant.businessInfo.businessType && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Type:</span>
                              <span className="font-medium">{tenant.businessInfo.businessType}</span>
                            </div>
                          )}
                          {tenant.businessInfo.industry && (
                            <div className="flex items-center gap-2 text-sm">
                              <Truck className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Industry:</span>
                              <span className="font-medium">{tenant.businessInfo.industry}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {String(detail?.email ?? tenant.email)}
                    </div>
                    {(detail?.phone ?? tenant.phone) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {String(detail?.phone ?? tenant.phone)}
                      </div>
                    )}
                    {fullAddress && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {fullAddress}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Usage Statistics */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Resource Quotas</h4>

                  {/* Vehicle Quota — Platform Admin can adjust at any time */}
                  <Card className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Vehicle Quota (active vehicles only)</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {tenantQuotaData?.activeCount ?? 0}
                        {" "}
                        /
                        {editingQuota ?? tenantQuotaData?.quota ?? 25}
                        {" "}
                        active
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Max active vehicles</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editingQuota ?? tenantQuotaData?.quota ?? 25}
                        onChange={e =>
                          setEditingQuota(Math.max(
                            1,
                            Number(e.target.value) || 1,
                          ))}
                        className="w-24 h-8 text-sm"
                      />
                      {editingQuota !== null && editingQuota !== (tenantQuotaData?.quota ?? 25) && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={savingQuota}
                            onClick={handleSaveQuota}
                          >
                            <Save className="h-3.5 w-3.5 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            disabled={savingQuota}
                            onClick={() => setEditingQuota(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Suspended, inactive, or decommissioned vehicles do not count against this quota. Changes are recorded in the platform audit trail.
                    </p>
                  </Card>

                  {/* Driver / Device / SIM operational quotas */}
                  {([
                    {
                      key: "driver" as const,
                      label: "Driver Quota",
                      icon: Users,
                      hint: "Maximum drivers this tenant can register.",
                    },
                    {
                      key: "device" as const,
                      label: "Device Quota",
                      icon: Cpu,
                      hint: "Maximum IoT devices this tenant can register.",
                    },
                    {
                      key: "sim" as const,
                      label: "SIM Quota",
                      icon: Smartphone,
                      hint: "Maximum SIMs this tenant can hold.",
                    },
                  ]).map(({
                    key,
                    label,
                    icon: Icon,
                    hint,
                  }) => {
                    const current = opQuotaData?.[key];
                    const fallback = key === "driver" ? 30 : 25;
                    const editing = editingOpQuota[key];
                    const displayValue = editing ?? current?.quota ?? fallback;
                    const isDirty = editing !== null && editing !== (current?.quota ?? fallback);
                    return (
                      <Card
                        key={key}
                        className="p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground">{label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {current?.count ?? 0}
                            {" "}
                            /
                            {displayValue}
                            {" "}
                            used
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Maximum</Label>
                          <Input
                            type="number"
                            min={1}
                            value={displayValue}
                            onChange={e =>
                              setEditingOpQuota(prev => ({
                                ...prev,
                                [key]: Math.max(
                                  1,
                                  Number(e.target.value) || 1,
                                ),
                              }))}
                            className="w-24 h-8 text-sm"
                          />
                          {isDirty && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                disabled={savingOpQuota === key}
                                onClick={() => handleSaveOpQuota(key)}
                              >
                                <Save className="h-3.5 w-3.5 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8"
                                disabled={savingOpQuota === key}
                                onClick={() => setEditingOpQuota(prev => ({
                                  ...prev,
                                  [key]: null,
                                }))}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {hint}
                          {" "}
                          Enforced platform-wide. Changes are recorded in the audit trail.
                        </p>
                      </Card>
                    );
                  })}
                </div>

                <Separator />

                {/* Owner-Operator Vehicle Caps */}
                {ooOrgs.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Owner-Operator Vehicle Caps</h4>
                      <div className="space-y-3">
                        {ooOrgs.map((org) => {
                          const currentCount = vehicleCounts[org.id] ?? 0;
                          const currentCap = editingCaps[org.id] ?? (org as any).max_vehicles ?? 7;
                          const isEditing = editingCaps[org.id] !== undefined;
                          return (
                            <Card
                              key={org.id}
                              className="p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{org.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {currentCount}
                                    {" "}
                                    vehicle
                                    {currentCount !== 1 ? "s" : ""}
                                    {" "}
                                    registered
                                  </p>
                                </div>
                                <Badge variant={org.status === "ACTIVE" ? "default" : "secondary"}>
                                  {org.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Max vehicles</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={currentCap}
                                  onChange={e => setEditingCaps(prev => ({
                                    ...prev,
                                    [org.id]: Math.min(
                                      10,
                                      Math.max(
                                        1,
                                        Number(e.target.value) || 1,
                                      ),
                                    ),
                                  }))}
                                  className="w-20 h-8 text-sm"
                                />
                                <span className="text-xs text-muted-foreground">/ 10 max</span>
                                {isEditing && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    disabled={savingOrgId === org.id}
                                    onClick={() => handleSaveVehicleCap(org.id)}
                                  >
                                    <Save className="h-3.5 w-3.5 mr-1" />
                                    Save
                                  </Button>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm text-muted-foreground">Enabled Features</h4>
                    <p className="text-xs text-muted-foreground">
                      Capabilities included in this tenant's current subscription plan. Greyed-out items are not part of the selected tier.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(tenant.features).map(([
                      feature,
                      enabled,
                    ]) => (
                      <div
                        key={feature}
                        className={`flex items-center gap-2 text-sm p-2 rounded-lg ${enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {enabled
                          ? (
                              <CheckCircle className="h-4 w-4" />
                            )
                          : (
                              <XCircle className="h-4 w-4" />
                            )}
                        <span className="capitalize">
                          {feature.replace(
                            /_/g,
                            " ",
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="vehicles"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-4">
                {vehiclesTab.payload && (
                  <ResourceUsage
                    icon={Truck}
                    label="Vehicle Usage"
                    used={vehiclesTab.payload.used}
                    limit={vehiclesTab.payload.limit}
                  />
                )}
                <h4 className="font-medium text-sm text-muted-foreground">
                  Vehicles (
                  {vehiclesTab.payload?.total ?? 0}
                  )
                </h4>
                <ResourceState
                  payload={vehiclesTab.payload}
                  isLoading={vehiclesTab.isLoading}
                  empty="No vehicles registered for this tenant."
                />
                {vehiclesTab.payload?.available && vehiclesTab.payload.items.length > 0 && (
                  <div className="space-y-2">
                    {(vehiclesTab.payload.items as SystemTenantVehicleRow[]).map(v => (
                      <Card
                        key={v.vehicleId}
                        className="p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{v.registrationNumber || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {[
                                v.make,
                                v.model,
                              ].filter(Boolean).join(" ") || "Unknown vehicle"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="capitalize text-xs"
                        >
                          {v.status || "unknown"}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                )}
                {vehiclesTab.payload && vehiclesTab.payload.total > vehiclesTab.payload.items.length && (
                  <p className="text-xs text-muted-foreground">
                    Showing
                    {" "}
                    {vehiclesTab.payload.items.length}
                    {" "}
                    of
                    {" "}
                    {vehiclesTab.payload.total}
                    . Open the tenant's own pages for the full roster.
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="drivers"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-4">
                {driversTab.payload && (
                  <ResourceUsage
                    icon={Users}
                    label="Driver Usage"
                    used={driversTab.payload.used}
                    limit={driversTab.payload.limit}
                  />
                )}
                <h4 className="font-medium text-sm text-muted-foreground">
                  Drivers (
                  {driversTab.payload?.total ?? 0}
                  )
                </h4>
                <ResourceState
                  payload={driversTab.payload}
                  isLoading={driversTab.isLoading}
                  empty="No drivers registered for this tenant."
                />
                {driversTab.payload?.available && driversTab.payload.items.length > 0 && (
                  <div className="space-y-2">
                    {(driversTab.payload.items as SystemTenantDriverRow[]).map(d => (
                      <Card
                        key={d.driverId}
                        className="p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{d.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {[
                                d.phone,
                                d.licenseNumber,
                              ].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="capitalize text-xs"
                        >
                          {d.status || "unknown"}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                )}
                {driversTab.payload && driversTab.payload.total > driversTab.payload.items.length && (
                  <p className="text-xs text-muted-foreground">
                    Showing
                    {" "}
                    {driversTab.payload.items.length}
                    {" "}
                    of
                    {" "}
                    {driversTab.payload.total}
                    .
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="devices"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-4">
                {devicesTab.payload && (
                  <ResourceUsage
                    icon={Cpu}
                    label="Device Usage"
                    used={devicesTab.payload.used}
                    limit={devicesTab.payload.limit}
                  />
                )}
                <h4 className="font-medium text-sm text-muted-foreground">
                  Devices (
                  {devicesTab.payload?.total ?? 0}
                  )
                </h4>
                <ResourceState
                  payload={devicesTab.payload}
                  isLoading={devicesTab.isLoading}
                  empty="No devices registered for this tenant."
                />
                {devicesTab.payload?.available && devicesTab.payload.items.length > 0 && (
                  <div className="space-y-2">
                    {(devicesTab.payload.items as SystemTenantDeviceRow[]).map(d => (
                      <Card
                        key={d.deviceId}
                        className="p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Cpu className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {[
                                d.manufacturer,
                                d.model,
                              ].filter(Boolean).join(" ") || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              IMEI:
                              {" "}
                              {d.imei || "—"}
                              {d.assignedVehicleId ? " · Assigned" : " · Unassigned"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="capitalize text-xs"
                        >
                          {d.status || "unknown"}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                )}
                {devicesTab.payload && devicesTab.payload.total > devicesTab.payload.items.length && (
                  <p className="text-xs text-muted-foreground">
                    Showing
                    {" "}
                    {devicesTab.payload.items.length}
                    {" "}
                    of
                    {" "}
                    {devicesTab.payload.total}
                    .
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="sims"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-4">
                {simsTab.payload && (
                  <ResourceUsage
                    icon={Smartphone}
                    label="SIM Usage"
                    used={simsTab.payload.used}
                    limit={simsTab.payload.limit}
                  />
                )}
                <h4 className="font-medium text-sm text-muted-foreground">
                  SIM Cards (
                  {simsTab.payload?.total ?? 0}
                  )
                </h4>
                <ResourceState
                  payload={simsTab.payload}
                  isLoading={simsTab.isLoading}
                  empty="No SIMs assigned to this tenant."
                />
                {simsTab.payload?.available && simsTab.payload.items.length > 0 && (
                  <div className="space-y-2">
                    {(simsTab.payload.items as SystemTenantSimRow[]).map(s => (
                      <Card
                        key={s.simId}
                        className="p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{s.msisdn || s.iccid || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.carrier ? `${s.carrier} · ` : ""}
                              ICCID:
                              {" "}
                              {s.iccid || "—"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="capitalize text-xs"
                        >
                          {s.status || "unknown"}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                )}
                {simsTab.payload && simsTab.payload.total > simsTab.payload.items.length && (
                  <p className="text-xs text-muted-foreground">
                    Showing
                    {" "}
                    {simsTab.payload.items.length}
                    {" "}
                    of
                    {" "}
                    {simsTab.payload.total}
                    .
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="kyc"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-3 pr-4">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Documents (
                  {documents.length}
                  )
                </h4>
                {documentsQuery.isLoading
                  ? <p className="text-sm text-muted-foreground">Loading documents…</p>
                  : documents.length === 0
                    ? (
                        <Card className="p-6 text-center text-sm text-muted-foreground">
                          No documents submitted at onboarding.
                        </Card>
                      )
                    : (
                        <div className="space-y-2">
                          {(documents as SystemTenantDocument[]).map(doc => (
                            <Card
                              key={doc.documentId}
                              className="p-3 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {doc.documentName || doc.documentType}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {doc.documentType}
                                    {" · "}
                                    {doc.mimeType}
                                    {" · "}
                                    {(doc.fileSize / 1024).toFixed(1)}
                                    {" KB · "}
                                    {formatDayMonthTime(doc.uploadedAt)}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="capitalize text-xs shrink-0"
                              >
                                {doc.status}
                              </Badge>
                            </Card>
                          ))}
                        </div>
                      )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="billing"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-6 pr-4">
                {/* Trial Status (only when on trial) */}
                {trialStatus?.status === "trial" && (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {" "}
                        Trial Status
                      </h4>
                      <Card className={`p-4 space-y-4 ${(trialStatus.days_remaining ?? 0) <= 7 ? "border-warning/40 bg-warning/5" : ""}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {trialStatus.is_expired
                                ? "Trial expired"
                                : `${trialStatus.days_remaining ?? 0} day${(trialStatus.days_remaining ?? 0) === 1 ? "" : "s"} remaining`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ends
                              {" "}
                              {trialStatus.trial_ends_at
                                ? formatWithPattern(
                                    trialStatus.trial_ends_at,
                                    "PPP",
                                  )
                                : "—"}
                              {(trialStatus as any).trial_extended_count > 0
                                ? ` · Extended ${(trialStatus as any).trial_extended_count}×`
                                : ""}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {trialStatus.payment_method_on_file ? "Payment on file" : "No payment method"}
                          </Badge>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Vehicle cap:</span>
                            <span className="font-medium">{trialStatus.trial_vehicle_cap ?? 5}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">SIM cap:</span>
                            <span className="font-medium">{trialStatus.trial_sim_cap ?? 5}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">WhatsApp/day:</span>
                            <span className="font-medium">{(trialStatus as any).trial_whatsapp_daily_cap ?? 100}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">SMS/day:</span>
                            <span className="font-medium">{(trialStatus as any).trial_sms_daily_cap ?? 50}</span>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <Label className="text-xs">Extend trial by (days)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min={1}
                              max={365}
                              value={extendDays}
                              onChange={e => setExtendDays(Math.max(
                                1,
                                parseInt(
                                  e.target.value,
                                  10,
                                ) || 14,
                              ))}
                              className="h-9 w-24"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleExtendTrial}
                              disabled={savingTrial}
                            >
                              <Clock className="h-4 w-4 mr-1.5" />
                              {" "}
                              Extend
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleConvertTrial}
                              disabled={savingTrial}
                            >
                              <Zap className="h-4 w-4 mr-1.5" />
                              {" "}
                              Convert to Paid
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Subscription Summary — at-a-glance billing answer */}
                {(() => {
                  const sub: any = billingSummary?.sub;
                  const plan: any = sub?.subscription_plans;
                  const lastPayment: any = billingSummary?.lastPayment;
                  const currentModel = (billingModel || tenantBillingData?.billing_model || "subscription") as string;
                  const modelLabel
                    = currentModel === "postpaid" ? "Postpaid" : currentModel === "prepaid" ? "Prepaid" : "Subscription (Prepaid)";
                  const planName = plan?.name || planDetails[tenant.plan]?.name || tenant.plan;
                  const cycleRaw: string = plan?.billing_cycle || "monthly";
                  const cycleLabel = cycleRaw.charAt(0).toUpperCase() + cycleRaw.slice(1);
                  const subStatus: string = sub?.status || tenant.status;
                  const periodStart = sub?.current_period_start ? new Date(sub.current_period_start) : null;
                  const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;
                  const renewalLabel = periodEnd
                    ? `${formatWithPattern(
                      periodEnd,
                      "PPP",
                    )}${sub?.auto_renew === false ? " (auto-renew off)" : ""}`
                    : "—";
                  const paymentStatus = (() => {
                    const s = lastPayment?.status?.toLowerCase();
                    if (!s) {
                      return {
                        label: "No payments on record",
                        tone: "secondary" as const,
                      };
                    }
                    if (s === "succeeded" || s === "paid" || s === "successful") {
                      return {
                        label: "Paid",
                        tone: "success" as const,
                      };
                    }
                    if (s === "pending" || s === "processing") {
                      return {
                        label: "Pending",
                        tone: "warning" as const,
                      };
                    }
                    if (s === "failed" || s === "declined") {
                      return {
                        label: "Overdue",
                        tone: "destructive" as const,
                      };
                    }
                    return {
                      label: lastPayment.status,
                      tone: "outline" as const,
                    };
                  })();
                  const paymentToneClass
                    = paymentStatus.tone === "success"
                      ? "bg-success/10 text-success border-success/30"
                      : paymentStatus.tone === "warning"
                        ? "bg-warning/10 text-warning border-warning/30"
                        : paymentStatus.tone === "destructive"
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : "bg-muted text-muted-foreground";
                  const subToneClass
                    = subStatus === "active"
                      ? "bg-success/10 text-success border-success/30"
                      : subStatus === "pending" || subStatus === "trial"
                        ? "bg-warning/10 text-warning border-warning/30"
                        : subStatus === "expired" || subStatus === "suspended" || subStatus === "terminated"
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : "bg-muted text-muted-foreground";

                  return (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {" "}
                        Billing Summary
                      </h4>
                      <Card className="p-5 space-y-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                        {/* Hero row: plan + status badges */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
                            <p className="text-xl font-semibold truncate">{planName}</p>
                            <p className="text-sm text-muted-foreground">
                              {currency === "NGN"
                                ? `₦${Number(
                                  cycleRaw === "yearly" && plan?.yearly_price_ngn
                                    ? plan.yearly_price_ngn
                                    : plan?.price_ngn ?? planDetails[tenant.plan]?.priceNGN ?? 0,
                                ).toLocaleString()}`
                                : `$${planDetails[tenant.plan]?.priceUSD?.toLocaleString() ?? "—"}`}
                              {" / "}
                              {cycleRaw === "yearly" ? "year" : "month"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge className={`${subToneClass} capitalize`}>{subStatus}</Badge>
                            <Badge className={paymentToneClass}>{paymentStatus.label}</Badge>
                          </div>
                        </div>

                        <Separator />

                        {/* Detail grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Billing Cycle</p>
                            <p className="font-medium">{cycleLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Billing Model</p>
                            <p className="font-medium">{modelLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Subscription Status</p>
                            <p className="font-medium capitalize">{subStatus}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Payment Status</p>
                            <p className="font-medium">{paymentStatus.label}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Period Start</p>
                            <p className="font-medium">
                              {periodStart
                                ? formatWithPattern(
                                    periodStart,
                                    "PPP",
                                  )
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Renewal Date</p>
                            <p className="font-medium">{renewalLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Payment Method</p>
                            <p className="font-medium capitalize">
                              {sub?.payment_method || lastPayment?.payment_method || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Auto-Renew</p>
                            <p className="font-medium">
                              {sub?.auto_renew === undefined || sub?.auto_renew === null
                                ? "—"
                                : sub.auto_renew
                                  ? "Enabled"
                                  : "Disabled"}
                            </p>
                          </div>
                          {lastPayment && (
                            <>
                              <div>
                                <p className="text-xs text-muted-foreground">Last Payment</p>
                                <p className="font-medium">
                                  {currency === "NGN"
                                    ? `₦${Number(lastPayment.amount_ngn || 0).toLocaleString()}`
                                    : `$${Number(lastPayment.amount_ngn || 0).toLocaleString()}`}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Last Payment Date</p>
                                <p className="font-medium">
                                  {formatWithPattern(
                                    lastPayment.created_at,
                                    "PPP",
                                  )}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })()}

                <Separator />

                {/* Billing Model description */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Billing Model</h4>
                  <Card className="p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm whitespace-nowrap">Current model</Label>
                      {(() => {
                        const current = billingModel || tenantBillingData?.billing_model || "subscription";
                        const label = current === "postpaid" ? "Postpaid" : current === "prepaid" ? "Prepaid" : "Subscription";
                        return (
                          <Badge
                            variant="outline"
                            className="capitalize text-sm font-medium"
                          >
                            {label}
                          </Badge>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(billingModel || tenantBillingData?.billing_model) === "postpaid"
                        ? "Tenant is billed for actual usage at the end of each billing cycle."
                        : (billingModel || tenantBillingData?.billing_model) === "prepaid"
                            ? "Tenant pre-loads wallet balance and usage is deducted in real-time."
                            : "Tenant pays a fixed subscription fee per billing cycle."}
                    </p>
                  </Card>
                </div>

                <Separator />

                {/* Billing Contact */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Billing Contact</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {tenant.billingEmail || tenant.email}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="export"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              <DataExportPanel tenant={tenant} />
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="audit"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-3 pr-4">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Recent Activity (
                  {auditEntries.length}
                  )
                </h4>
                {loadingAudit
                  ? <p className="text-sm text-muted-foreground">Loading audit log…</p>
                  : auditEntries.length === 0
                    ? (
                        <Card className="p-6 text-center text-sm text-muted-foreground">
                          No recent activity.
                        </Card>
                      )
                    : (
                        <div className="space-y-2">
                          {auditEntries.map(log => (
                            <Card
                              key={log.id}
                              className="p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                  <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{log.action}</p>
                                    {log.summary && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {log.summary}
                                      </p>
                                    )}
                                    {(log.actorName || log.actorEmail) && (
                                      <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
                                        by
                                        {" "}
                                        {log.actorName || log.actorEmail}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDayMonthTime(log.occurredAt)}
                                </span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </ShellContent>
      <TerminateTenantDialog
        tenant={tenant}
        open={terminateOpen}
        onOpenChange={setTerminateOpen}
        onTerminated={() => {
          queryClient.invalidateQueries({ queryKey: ["tenants"] });
          onOpenChange(false);
        }}
      />
    </Shell>
  );
}
