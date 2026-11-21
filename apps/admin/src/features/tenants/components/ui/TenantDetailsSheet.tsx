import type {
  SystemTenant,
  SystemTenantAuditLogEntry,
  SystemTenantBilling,
  SystemTenantContactDetail,
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
  getSystemTenantBillingQueryOptions,
  getSystemTenantDocumentsQueryOptions,
  getSystemTenantQueryOptions,
  getSystemTenantResourcesQueryOptions,
  useUpdateTenantStatus,
} from "@truckmoov/api/auth";
import { getBillingPlanQueryOptions } from "@truckmoov/api/billing";
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
  Shield,
  Smartphone,
  Truck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
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
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";

import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { ListSkeleton } from "@/components/ui/skeletons";
import { SuspendAccessDialog } from "@/features/tenants/components/ui/SuspendAccessDialog";
import { TenantDataExportPanel } from "./TenantDataExportPanel";
import { TenantQuotaEditor } from "./TenantQuotaEditor";
import { TenantTrialCard } from "./TenantTrialCard";
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

const formatNgn = (amount: number) => `₦${amount.toLocaleString()}`;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "card",
  bank_transfer: "bank transfer",
  mtn_momo: "MTN MoMo",
  wallet: "wallet",
  other: "another method",
};

function formatDay(day: string) {
  return formatWithPattern(
    day,
    "d MMM yyyy",
  );
}

function graceSentence(enforcement: NonNullable<SystemTenantBilling["enforcement"]>) {
  if (enforcement.suspended) {
    return enforcement.suspensionCause === "non_payment"
      ? "Suspended for non-payment"
      : "Suspended by an admin";
  }
  if (enforcement.stage === "in_grace")
    return `In grace period until ${formatDay(enforcement.graceEndsOn)}`;
  if (enforcement.stage === "past_grace")
    return `Grace period ended ${formatDay(enforcement.graceEndsOn)}`;
  return "Nothing overdue";
}

function BillingFact({
  label, children,
}: {
  label: string; children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{children}</p>
    </div>
  );
}

function BillingFacts({ billing }: { billing: SystemTenantBilling }) {
  const {
    licence, openInvoice, lastPayment, enforcement, wallet,
  } = billing;
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
        <CreditCard className="h-4 w-4" />
        Billing Summary
      </h4>
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <BillingFact label="Licence period started">
            {licence ? formatDay(licence.periodStart) : "No licence on record"}
          </BillingFact>
          <BillingFact label="Licence valid until">
            {licence ? formatDay(licence.validUntil) : "No licence on record"}
          </BillingFact>
          <BillingFact label="Next renewal due">
            {openInvoice ? `${formatDay(openInvoice.dueDate)} (${openInvoice.number})` : "Nothing due"}
          </BillingFact>
          <BillingFact label="Last payment">
            {lastPayment
              ? `${formatNgn(lastPayment.amountNgn)} on ${formatDay(lastPayment.paidAt)}`
              : "No payment yet"}
          </BillingFact>
          <BillingFact label="Payment method">
            {lastPayment?.method ? (PAYMENT_METHOD_LABELS[lastPayment.method] ?? lastPayment.method) : "No payment yet"}
          </BillingFact>
          <BillingFact label="Amount owed">{formatNgn(billing.totalOwedNgn)}</BillingFact>
          <BillingFact label="Grace state">
            {enforcement ? graceSentence(enforcement) : "Nothing overdue"}
          </BillingFact>
          <BillingFact label="Wallet">
            {wallet ? `${formatNgn(wallet.balanceNgn)} (${wallet.status})` : "No wallet yet"}
          </BillingFact>
          <BillingFact label="Collected this month">{formatNgn(billing.collectedThisMonthNgn)}</BillingFact>
        </div>
      </Card>
    </div>
  );
}

const PAYMENT_MODEL_SENTENCES = {
  prepaid: "Usage is taken from the wallet, which the tenant tops up in advance.",
  postpaid: "Usage is billed after it happens.",
} as const;

function billingModelText(model: SystemTenantBilling["billingModel"]) {
  const paymentModel = model.paymentModel ? PAYMENT_MODEL_SENTENCES[model.paymentModel] : null;
  if (model.kind === "per_device_licence") {
    const devices = model.deviceCount === null ? "" : ` for ${model.deviceCount} device${model.deviceCount === 1 ? "" : "s"}`;
    return {
      label: "Per-device licence",
      detail: `A licence${devices} that runs for a set period. A renewal invoice is raised before it ends.`,
      paymentModel,
    };
  }
  if (model.kind === "subscription") {
    const cycle = model.billingCycle ? ` each ${model.billingCycle === "yearly" ? "year" : "month"}` : "";
    return {
      label: "Subscription plan", detail: `A fixed subscription fee${cycle}.`, paymentModel,
    };
  }
  return {
    label: "No billing model yet", detail: "The tenant has no licence or plan on record.", paymentModel,
  };
}

function BillingModelCard({ model }: { model: SystemTenantBilling["billingModel"] }) {
  const {
    label, detail, paymentModel,
  } = billingModelText(model);
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">Billing Model</h4>
      <Card className="p-4 space-y-2">
        <Badge variant="outline">{label}</Badge>
        <p className="text-xs text-muted-foreground">{detail}</p>
        {paymentModel && <p className="text-xs text-muted-foreground">{paymentModel}</p>}
      </Card>
    </div>
  );
}

// Usage bar for a resource tab. Mirrors renderQuota on the list page:
// limit === null → unlimited; used > limit → destructive.
type ResourceUsageProps = {
  icon: typeof Building2;
  label: string;
  used: number;
  limit: number | null;
  planAssigned: boolean;
  custom?: boolean;
};
function ResourceUsage({
  icon: Icon, label, used, limit, planAssigned, custom,
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
            ? <span className="text-muted-foreground font-normal">{planAssigned ? " · Unlimited" : " · No plan assigned"}</span>
            : (
                <span className="text-muted-foreground font-normal">
                  {" / "}
                  {limit}
                  {custom ? " · custom" : ""}
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
    return <ListSkeleton rows={3} />;
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
  const queryClient = useQueryClient();
  const [
    terminateOpen,
    setTerminateOpen,
  ] = useState(false);
  const [
    suspendOpen,
    setSuspendOpen,
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

  const detail: SystemTenantContactDetail | undefined = detailQuery.data?.data;
  const company = detail?.onboarding?.company;
  const billingCycle = detail?.onboarding?.subscription?.billingCycle;
  const planQuery = useQuery(getBillingPlanQueryOptions(tenant?.planCode ?? ""));
  const plan = planQuery.data?.data?.plan;
  const planName = plan?.name ?? tenant?.planCode ?? "No plan assigned";

  const tenantId = tenant?.id ?? "";
  const billingQuery = useQuery({
    ...getSystemTenantBillingQueryOptions(tenantId),
    enabled: (open || asPage) && !!tenantId && activeTab === "billing",
  });
  const billing = billingQuery.data?.data;
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
                        onClick={() => setSuspendOpen(true)}
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
                    {planQuery.isLoading
                      ? <Skeleton className="h-5 w-20" />
                      : <Badge variant="outline">{planName}</Badge>}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tenant Status</p>
                    {getStatusBadge(tenant.status)}
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
                    {company?.contactName && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {company.contactName}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {company?.email ?? tenant.email}
                    </div>
                    {(company?.phoneNumber ?? tenant.phone) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {company?.phoneNumber ?? tenant.phone}
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

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Plan Usage</h4>
                  <ResourceUsage
                    icon={Truck}
                    label="Vehicles"
                    used={tenant.vehicleCount}
                    limit={tenant.quotas.vehicles}
                    planAssigned={tenant.planAssigned}
                    custom={tenant.quotaOverrides.vehicles !== null}
                  />
                  <ResourceUsage
                    icon={Users}
                    label="Drivers"
                    used={tenant.driverCount}
                    limit={tenant.quotas.drivers}
                    planAssigned={tenant.planAssigned}
                    custom={tenant.quotaOverrides.drivers !== null}
                  />
                  <ResourceUsage
                    icon={Cpu}
                    label="Devices"
                    used={tenant.deviceCount}
                    limit={tenant.quotas.devices}
                    planAssigned={tenant.planAssigned}
                    custom={tenant.quotaOverrides.devices !== null}
                  />
                  <ResourceUsage
                    icon={Smartphone}
                    label="SIMs"
                    used={tenant.simCount}
                    limit={tenant.quotas.sims}
                    planAssigned={tenant.planAssigned}
                    custom={tenant.quotaOverrides.sims !== null}
                  />
                  <TenantQuotaEditor
                    key={JSON.stringify(tenant.quotaOverrides)}
                    tenant={tenant}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm text-muted-foreground">Enabled Features</h4>
                    <p className="text-xs text-muted-foreground">
                      Capabilities switched on for this tenant.
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
                    planAssigned={tenant.planAssigned}
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
                    planAssigned={tenant.planAssigned}
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
                    planAssigned={tenant.planAssigned}
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
                    planAssigned={tenant.planAssigned}
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
                  ? <ListSkeleton rows={3} />
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
                <Card className="p-5 space-y-5">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
                    <p className="text-xl font-semibold">{planName}</p>
                    {plan && (
                      <p className="text-sm text-muted-foreground">
                        {formatNgn(plan.perDeviceYear1Ngn)}
                        {" per device, first year · "}
                        {formatNgn(plan.perDeviceRenewalNgn)}
                        {" per device on renewal"}
                      </p>
                    )}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Billing Cycle</p>
                      <p className="font-medium capitalize">{billingCycle ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Plan Validity</p>
                      <p className="font-medium">{plan ? `${plan.validityDays} days` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Status</p>
                      <p className="font-medium capitalize">{tenant.status}</p>
                    </div>
                  </div>
                </Card>

                {billing?.trial && (
                  <TenantTrialCard
                    tenantId={tenant.id}
                    trial={billing.trial}
                  />
                )}

                {billingQuery.isLoading
                  ? <ListSkeleton rows={3} />
                  : billingQuery.isError
                    ? (
                        <Card className="p-4 text-sm text-muted-foreground">
                          Billing details could not be loaded.
                        </Card>
                      )
                    : billing && (
                      <>
                        <BillingFacts billing={billing} />
                        <BillingModelCard model={billing.billingModel} />
                      </>
                    )}

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Billing Contact</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {company?.billingEmail ?? tenant.billingEmail ?? tenant.email}
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
              <TenantDataExportPanel tenantId={tenant.id} />
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
                  ? <ListSkeleton rows={4} />
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
      <SuspendAccessDialog
        tenant={suspendOpen ? tenant : null}
        onClose={() => setSuspendOpen(false)}
      />
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
