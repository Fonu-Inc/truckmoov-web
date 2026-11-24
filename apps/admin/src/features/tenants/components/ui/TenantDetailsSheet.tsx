import type {
  SystemTenant,
  SystemTenantContactDetail,
  SystemTenantDeviceRow,
  SystemTenantDocument,
  SystemTenantDriverRow,
  SystemTenantResourcesResponse,
  SystemTenantResourceTab,
  SystemTenantVehicleRow,
} from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import type { FilterValues } from "@/components/shadcn/table-toolbar";
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
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowRight,
  Ban,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  Download,
  Eye,
  FileText,
  Truck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
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
  Dialog as Sheet,
  DialogContent as SheetContent,
  DialogDescription as SheetDescription,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle,
} from "@/components/shadcn/dialog";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { SuspendAccessDialog } from "@/features/tenants/components/ui/SuspendAccessDialog";
import {
  prettyDocumentType,
  prettyFileSize,
} from "@/features/tenants/utils/onboarding";
import {
  inDateWindow,
  normalizeStatus,
  tenantTypeOf,
} from "@/features/tenants/utils/tenants";
import { TerminateTenantDialog } from "./TerminateTenantDialog";

type TenantDetailsSheetProps = {
  tenant: SystemTenant | null;
  tenantType?: "ENTERPRISE" | "OWNER_OPERATOR";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Render inline as a full page instead of a dialog. The header, tabs and every
   * tab body are shared with the dialog form — only the surrounding chrome differs,
   * so the two can never drift apart.
   */
  asPage?: boolean;
};

type RecordDetail = {
  title: string;
  rows: Array<[string, string | number | null | undefined]>;
};

type AuditRow = {
  id: string;
  event_type: string;
  description: string | null;
  severity: "info" | "warning" | "error";
  created_at: string;
  user_name: string | null;
};

function getStatusBadge(status: string) {
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

/** `available: false` means the fleet service was unreachable — not empty. */
function ResourceNotice({
  payload, empty,
}: {
  payload: {
    available: boolean; items: unknown[];
  } | undefined; empty: string;
}) {
  if (!payload)
    return null;
  if (!payload.available)
    return <p className="text-sm text-muted-foreground">Service unavailable: could not reach the fleet service.</p>;
  if (payload.items.length === 0)
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  return null;
}

/**
 * Tenant details drawer. The overview, resources, documents and audit tabs all
 * read live tenant endpoints; empty tabs render their own empty state.
 */
export function TenantDetailsSheet({
  tenant,
  tenantType,
  open,
  onOpenChange,
  asPage = false,
}: TenantDetailsSheetProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
  const [
    recordDetail,
    setRecordDetail,
  ] = useState<RecordDetail | null>(null);
  const [
    auditSearch,
    setAuditSearch,
  ] = useState("");
  const [
    auditFilters,
    setAuditFilters,
  ] = useState<FilterValues>({});
  const updateStatusMutation = useUpdateTenantStatus();

  const visible = open || asPage;
  const tenantId = tenant?.id ?? "";

  // Contact detail captured at onboarding fills fields the list row lacks.
  const detailQuery = useQuery({
    ...getSystemTenantQueryOptions(tenantId),
    enabled: visible && !!tenantId,
  });
  const detail: SystemTenantContactDetail | undefined = detailQuery.data?.data;
  const company = detail?.onboarding?.company;

  // Resource tabs — one endpoint, one shape per tab. Only the visible tab fetches.
  function useResourceTab<TItem>(tab: SystemTenantResourceTab) {
    const query = useQuery({
      ...getSystemTenantResourcesQueryOptions({
        id: tenantId, tab, planCode: tenant?.planCode ?? undefined,
      }),
      enabled: visible && !!tenantId && activeTab === tab,
    });
    return {
      payload: query.data?.data as SystemTenantResourcesResponse<TItem>["data"] | undefined,
      isLoading: query.isLoading,
    };
  }
  const vehiclesTab = useResourceTab<SystemTenantVehicleRow>("vehicles");
  const driversTab = useResourceTab<SystemTenantDriverRow>("drivers");
  const devicesTab = useResourceTab<SystemTenantDeviceRow>("devices");

  const documentsQuery = useQuery({
    ...getSystemTenantDocumentsQueryOptions(tenantId),
    enabled: visible && !!tenantId && activeTab === "kyc",
  });
  const documents: SystemTenantDocument[] = documentsQuery.data?.data?.items ?? [];

  // Audit log — the 10 most recent entries, server-side.
  const auditQuery = useQuery({
    ...getSystemTenantAuditLogQueryOptions(tenantId),
    enabled: visible && !!tenantId && activeTab === "audit",
  });
  const loadingAudit = auditQuery.isLoading;

  if (!tenant)
    return null;

  const type = tenantType ?? tenantTypeOf(tenant);

  // Page mode swaps the dialog chrome for plain elements so the header, tabs and
  // every tab body below are rendered from one source in both forms.
  const Shell = asPage ? PageShell : Sheet;
  const ShellContent = asPage ? PageShellContent : SheetContent;
  const ShellHeader = asPage ? PageShellHeader : SheetHeader;
  const ShellTitle = asPage ? PageShellTitle : SheetTitle;
  const ShellDescription = asPage ? PageShellDescription : SheetDescription;

  const vehicles = (vehiclesTab.payload?.available ? vehiclesTab.payload.items : []) as SystemTenantVehicleRow[];
  const drivers = (driversTab.payload?.available ? driversTab.payload.items : []) as SystemTenantDriverRow[];
  const devices = (devicesTab.payload?.available ? devicesTab.payload.items : []) as SystemTenantDeviceRow[];

  // ponytail: the tenant audit entries carry no severity — every live row reads "info".
  const liveAudit: AuditRow[] = (auditQuery.data?.data?.items ?? []).map(log => ({
    id: log.id,
    event_type: log.action,
    description: log.summary,
    severity: "info",
    created_at: log.occurredAt,
    user_name: log.actorName || log.actorEmail,
  }));
  const events = liveAudit;

  // ponytail: tenant documents have no download link in packages/api yet.
  const documentUnavailable = () => toast.info("This document can't be opened from here yet.");

  return (
    <Shell
      open={open}
      onOpenChange={onOpenChange}
    >
      <ShellContent className={asPage ? undefined : "max-w-2xl max-h-[85vh] overflow-y-auto"}>
        <ShellHeader>
          <ShellTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
              {tenant.name.charAt(0)}
            </div>
            <div className="flex-1">
              <span>{tenant.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {tenant.status === "suspended" || tenant.status === "inactive"
                ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate(
                        {
                          id: tenant.id,
                          data: { status: "active" },
                        },
                        {
                          onSuccess: () => toast.success("Tenant activated"),
                          onError: () => toast.error("Failed to activate tenant"),
                        },
                      )}
                      className="gap-2 border-success/40 text-success hover:bg-success/10"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Activate
                    </Button>
                  )
                : tenant.status === "active"
                  ? (
                      // The API needs a reason to suspend, so this opens the reason dialog.
                      <Button
                        variant="outline"
                        size="sm"
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
            {`Member since ${formatWithPattern(
              tenant.createdAt,
              "MMMM yyyy",
            )}`}
          </ShellDescription>
        </ShellHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-6"
        >
          <TabsList className="grid grid-cols-7 w-full">
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
              value="kyc"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Documents
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
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Basic Details</h4>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {([
                      [
                        "Company name",
                        tenant.businessInfo?.companyName || company?.companyName || tenant.name,
                      ],
                      [
                        "Company email address",
                        tenant.email || company?.email || "-",
                      ],
                      [
                        "Company phone number",
                        tenant.phone || company?.phoneNumber || "-",
                      ],
                      [
                        "Contact person's full name",
                        tenant.primaryContactName || company?.contactName || "-",
                      ],
                      [
                        "Company address",
                        tenant.address || tenant.businessInfo?.addressLine1 || company?.businessAddress || "-",
                      ],
                      [
                        "Tenant type",
                        type === "OWNER_OPERATOR" ? "Owner-Operator" : "Enterprise",
                      ],
                    ] as Array<[string, string]>).map(([
                      label,
                      value,
                    ]) => (
                      <div
                        key={label}
                        className="space-y-0.5"
                      >
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="text-sm font-medium break-words">{value}</dd>
                      </div>
                    ))}
                    <div className="space-y-0.5">
                      <dt className="text-xs text-muted-foreground">M2M license plan</dt>
                      <dd className="text-sm font-medium">
                        {tenant.planName || tenant.planCode || "No plan assigned"}
                      </dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-xs text-muted-foreground">Tenant status</dt>
                      <dd>{getStatusBadge(normalizeStatus(tenant.status))}</dd>
                    </div>
                  </dl>
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
                <h4 className="font-medium text-sm text-muted-foreground">
                  {`Vehicles (${vehiclesTab.payload?.total ?? vehicles.length})`}
                </h4>
                {vehiclesTab.isLoading
                  ? <p className="text-sm text-muted-foreground">Loading vehicles...</p>
                  : (
                      <div className="space-y-2">
                        <ResourceNotice
                          payload={vehiclesTab.payload}
                          empty="No vehicles registered for this tenant."
                        />
                        {vehicles.map(v => (
                          <Card
                            key={v.vehicleId}
                            className="p-3 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <Truck className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{v.registrationNumber || "-"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {[
                                    v.make,
                                    v.model,
                                  ].filter(Boolean).join(" ") || "Unknown vehicle"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                {v.status || "unknown"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRecordDetail({
                                  title: `Vehicle ${v.registrationNumber || ""}`.trim(),
                                  // ponytail: VIN, year, vehicle type and load capacity aren't on the tenant resource row yet.
                                  rows: [
                                    [
                                      "Registration",
                                      v.registrationNumber,
                                    ],
                                    [
                                      "VIN",
                                      null,
                                    ],
                                    [
                                      "Make",
                                      v.make,
                                    ],
                                    [
                                      "Model",
                                      v.model,
                                    ],
                                    [
                                      "Year",
                                      null,
                                    ],
                                    [
                                      "Vehicle type",
                                      null,
                                    ],
                                    [
                                      "Load capacity",
                                      null,
                                    ],
                                    [
                                      "Status",
                                      v.status,
                                    ],
                                  ],
                                })}
                              >
                                View vehicle details
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
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
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {`Devices (${devicesTab.payload?.total ?? devices.length})`}
                  </h4>
                  {devicesTab.isLoading
                    ? <p className="text-sm text-muted-foreground">Loading devices...</p>
                    : (
                        <div className="space-y-2">
                          <ResourceNotice
                            payload={devicesTab.payload}
                            empty="No devices registered for this tenant."
                          />
                          {devices.map(d => (
                            <Card
                              key={d.deviceId}
                              className="p-3 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <Cpu className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {`${d.manufacturer || "-"} ${d.model || ""}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {`IMEI: ${d.imei || "-"}${d.assignedVehicleId ? " · Assigned" : " · Unassigned"}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="capitalize text-xs"
                                >
                                  {d.status || "unknown"}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRecordDetail({
                                    title: `Device ${d.imei || ""}`.trim(),
                                    // ponytail: firmware and protocol aren't on the tenant resource row yet.
                                    rows: [
                                      [
                                        "IMEI",
                                        d.imei,
                                      ],
                                      [
                                        "Manufacturer",
                                        d.manufacturer,
                                      ],
                                      [
                                        "Model",
                                        d.model,
                                      ],
                                      [
                                        "Firmware",
                                        null,
                                      ],
                                      [
                                        "Protocol",
                                        null,
                                      ],
                                      [
                                        "Status",
                                        d.status,
                                      ],
                                      [
                                        "Assigned vehicle",
                                        d.assignedVehicleId ? "Assigned" : "Unassigned",
                                      ],
                                    ],
                                  })}
                                >
                                  View device details
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="kyc"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              {documentsQuery.isLoading
                ? (
                    <div className="space-y-3 pr-4">
                      {[
                        1,
                        2,
                        3,
                      ].map(i => (
                        <Skeleton
                          key={i}
                          className="h-16 w-full"
                        />
                      ))}
                    </div>
                  )
                : (
                    <div className="space-y-6 pr-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle>Submitted documents</CardTitle>
                              <CardDescription>
                                {`${documents.length} document${documents.length === 1 ? "" : "s"} on file.`}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {documents.length === 0
                            ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                  No documents submitted.
                                </p>
                              )
                            : (
                                documents.map(d => (
                                  <div
                                    key={d.documentId}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <FileText className="h-5 w-5 text-primary" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                          {prettyDocumentType(d.documentType)}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                          {`${d.documentName} · ${prettyFileSize(d.fileSize)} · ${formatWithPattern(
                                            d.uploadedAt,
                                            "MMM d, yyyy",
                                          )}`}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={documentUnavailable}
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={documentUnavailable}
                                      >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="drivers"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-4 pr-4">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {`Drivers (${driversTab.payload?.total ?? drivers.length})`}
                </h4>
                {driversTab.isLoading
                  ? <p className="text-sm text-muted-foreground">Loading drivers...</p>
                  : (
                      <div className="space-y-2">
                        <ResourceNotice
                          payload={driversTab.payload}
                          empty="No drivers registered for this tenant."
                        />
                        {drivers.map(dr => (
                          <Card
                            key={dr.driverId}
                            className="p-3 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{dr.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {`${dr.phone || "-"} · Licence ${dr.licenseNumber || "-"}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                {dr.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRecordDetail({
                                  title: dr.name,
                                  rows: [
                                    [
                                      "Full name",
                                      dr.name,
                                    ],
                                    [
                                      "Phone",
                                      dr.phone,
                                    ],
                                    [
                                      "Licence number",
                                      dr.licenseNumber,
                                    ],
                                    [
                                      "Status",
                                      dr.status,
                                    ],
                                  ],
                                })}
                              >
                                View driver details
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="audit"
            className="mt-4"
          >
            <ScrollArea className="h-[calc(100vh-280px)]">
              <AuditLogTab
                events={events}
                loading={loadingAudit}
                search={auditSearch}
                onSearchChange={setAuditSearch}
                filters={auditFilters}
                onFiltersApply={setAuditFilters}
                onViewFull={() => navigate(`/audit-compliance?tenant=${tenant.id}`)}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </ShellContent>
      <Sheet
        open={!!recordDetail}
        onOpenChange={o => !o && setRecordDetail(null)}
      >
        <SheetContent className="max-w-lg">
          <SheetHeader>
            <SheetTitle>{recordDetail?.title || "Details"}</SheetTitle>
            <SheetDescription>Record details for this tenant.</SheetDescription>
          </SheetHeader>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {(recordDetail?.rows || []).map(([
              label,
              value,
            ]) => (
              <div
                key={label}
                className="space-y-0.5"
              >
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium break-words">
                  {value === null || value === undefined || value === "" ? "-" : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </SheetContent>
      </Sheet>

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

const SEVERITY_OPTIONS = [
  {
    value: "info",
    label: "Info",
  },
  {
    value: "warning",
    label: "Warning",
  },
  {
    value: "error",
    label: "Error",
  },
];

function AuditLogTab({
  events,
  loading,
  search,
  onSearchChange,
  filters,
  onFiltersApply,
  onViewFull,
}: {
  events: AuditRow[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  filters: FilterValues;
  onFiltersApply: (v: FilterValues) => void;
  onViewFull: () => void;
}) {
  const eventTypeOptions = Array.from(new Set(events.map(log => log.event_type || "Event")))
    .sort()
    .map(type => ({
      value: type,
      label: type,
    }));
  const filteredEvents = events.filter((log) => {
    if (search) {
      const haystack = `${log.event_type || ""} ${log.description || ""} ${log.user_name || ""}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase()))
        return false;
    }
    if (filters.severity?.enabled && (filters.severity.value || "all") !== (log.severity || "info"))
      return false;
    if (filters.eventType?.enabled && (filters.eventType.value || "all") !== (log.event_type || "Event"))
      return false;
    if (filters.date?.enabled && !inDateWindow(
      log.created_at,
      filters.date.dateFrom,
      filters.date.dateTo,
    )) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-3 pr-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground">
          {`Recent Activity (${events.length})`}
        </h4>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={onViewFull}
          >
            View full audit log
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {loading
        ? <p className="text-sm text-muted-foreground">Loading audit log...</p>
        : (
            <>
              <TableToolbar
                search={search}
                onSearchChange={onSearchChange}
                searchPlaceholder="Search audit log..."
                filterEntity="audit events"
                filterFields={[
                  {
                    key: "eventType",
                    label: "Event Type",
                    type: "select",
                    options: eventTypeOptions,
                  },
                  {
                    key: "severity",
                    label: "Severity",
                    type: "select",
                    options: SEVERITY_OPTIONS,
                  },
                  {
                    key: "date",
                    label: "Date",
                    type: "daterange",
                  },
                ]}
                filterValues={filters}
                onFiltersApply={onFiltersApply}
              />
              {filteredEvents.length === 0
                ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No audit events match your search or filters.
                    </div>
                  )
                : (
                    <div className="rounded-lg border overflow-x-auto">
                      <Table className="[&_th]:px-4 [&_td]:px-4">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Date & Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEvents.map(log => (
                            <TableRow key={log.id}>
                              <TableCell className="text-sm font-medium whitespace-nowrap">
                                {log.event_type || "Event"}
                              </TableCell>
                              <TableCell className="text-sm max-w-[420px]">
                                <span
                                  className="block truncate"
                                  title={log.description ?? undefined}
                                >
                                  {log.description || "-"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-xs capitalize ${log.severity === "warning" ? "text-warning" : log.severity === "error" ? "text-destructive" : "text-muted-foreground"}`}
                                >
                                  {log.severity || "info"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {log.user_name || "-"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {formatWithPattern(
                                  log.created_at,
                                  "MMM d, yyyy · HH:mm",
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
            </>
          )}
    </div>
  );
}
