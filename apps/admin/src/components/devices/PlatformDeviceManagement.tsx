import type { SystemSimItem } from "@truckmoov/api/auth";
import type { PlatformDevice } from "./management/deviceStatus";
import type { FilterDraft } from "@/components/shadcn/platform-filter-popover";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemDevicesExportQueryOptions,
  getSystemDevicesQueryOptions,
  getSystemSimsQueryOptions,
  useReinstateSystemDevice,
  useRetryDeviceProvisioning,
  useSuspendSystemDevice,
} from "@truckmoov/api/auth";
import { downloadBlob } from "@truckmoov/app-core/utils/general-utils";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity,
  Building2,
  CheckCircle,
  Cpu,
  Download,
  Eye,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  PowerOff,
  Radio,
  RefreshCw,
  Search,
  Signal,
  SignalLow,
  SignalZero,
  UserCheck,
  UserPlus,
  UserX,
  XCircle,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { PageActions } from "@/shared/components/layout/PageTitle";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";
import { DeviceDetailSheet } from "./management/DeviceDetailSheet";
import {
  formatLastSeen,
  isRetryableProvisionFailure,
  LAST_SEEN_DAYS,
  lifecycleStatuses,
  normalizeDeviceStatus,
  provisionFailureMessage,
  seenWithinDays,
  statusClasses,
  statusLabels,
} from "./management/deviceStatus";
import { EditDeviceDialog } from "./management/EditDeviceDialog";
import { ImportPlatformStockDialog } from "./management/ImportPlatformStockDialog";
import { RecordDeviceAssignmentDialog } from "./management/RecordDeviceAssignmentDialog";
import { SendTestTelemetryDialog } from "./management/SendTestTelemetryDialog";

const ONLINE_STATUSES = [
  "active",
  "assigned",
  "verified_online",
  "assignable",
];

function getSignalIcon(strength: number | null, status: string) {
  // Only show signal for active/online devices
  if (!ONLINE_STATUSES.includes(status) || !strength) {
    return <SignalZero className="h-4 w-4 text-muted-foreground" />;
  }
  if (strength >= 70)
    return <Signal className="h-4 w-4 text-success" />;
  if (strength >= 30)
    return <SignalLow className="h-4 w-4 text-warning" />;
  return <SignalZero className="h-4 w-4 text-destructive" />;
}

export function PlatformDeviceManagement() {
  const queryClient = useQueryClient();
  const devicesQuery = useQuery(getSystemDevicesQueryOptions());
  const simsQuery = useQuery(getSystemSimsQueryOptions());
  const suspendMutation = useSuspendSystemDevice();
  const reinstateMutation = useReinstateSystemDevice();
  const retryMutation = useRetryDeviceProvisioning();
  const {
    confirm, confirmDialog,
  } = useConfirmAction();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    filterDraft,
    setFilterDraft,
  ] = useState<FilterDraft>({
    lastSeen: { enabled: false },
    tenant: { enabled: false },
    manufacturer: { enabled: false },
  });
  const [
    selectedDevice,
    setSelectedDevice,
  ] = useState<PlatformDevice | null>(null);
  const [
    showDetailsSheet,
    setShowDetailsSheet,
  ] = useState(false);
  const [
    editingDevice,
    setEditingDevice,
  ] = useState<PlatformDevice | null>(null);
  const [
    assignmentOpen,
    setAssignmentOpen,
  ] = useState(false);
  const [
    importOpen,
    setImportOpen,
  ] = useState(false);
  const [
    telemetryOpen,
    setTelemetryOpen,
  ] = useState(false);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  const devices = devicesQuery.data?.data?.devices ?? [];

  // SIM cards linked to devices (the system links SIMs; admins only view)
  const simByDevice = useMemo(
    () => {
      const map: Record<string, SystemSimItem> = {};
      for (const sim of simsQuery.data?.data?.sims ?? []) {
        if (sim.deviceId)
          map[sim.deviceId] = sim;
      }
      return map;
    },
    [simsQuery.data],
  );

  const tenantName = (device: PlatformDevice) => device.tenantId ? device.tenantName || "Unknown tenant" : "Unknown tenant";

  // Get unique manufacturers from devices
  const manufacturers = [
    "all",
    ...new Set(devices.map(d => d.manufacturer)),
  ];

  const visibleDevices = devices.filter(
    d => d.operationalStatus !== "faulty" && d.lifecycleStatus !== "faulty",
  );

  const filteredDevices = visibleDevices.filter((device) => {
    const name = tenantName(device);
    const q = searchQuery.toLowerCase();
    const matchesSearch
      = device.id.toLowerCase().includes(q)
        || device.imei.includes(searchQuery)
        || name.toLowerCase().includes(q)
        || !!device.tenantId?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || normalizeDeviceStatus(device) === statusFilter;

    const mfgFilter = filterDraft.manufacturer;
    const matchesManufacturer
      = !mfgFilter?.enabled || !mfgFilter.value || device.manufacturer === mfgFilter.value;

    const tenantFilterDraft = filterDraft.tenant;
    const matchesTenantFilter
      = !tenantFilterDraft?.enabled
        || !tenantFilterDraft.value
        || name === tenantFilterDraft.value;

    const lastSeenFilter = filterDraft.lastSeen;
    const days = lastSeenFilter?.enabled && lastSeenFilter.value ? LAST_SEEN_DAYS[lastSeenFilter.value] ?? 0 : 0;
    const matchesLastSeen = days > 0 ? seenWithinDays(
      device.lastSeen,
      days,
    ) : true;

    return matchesSearch && matchesStatus && matchesManufacturer && matchesTenantFilter && matchesLastSeen;
  });

  const handleViewDetails = (device: PlatformDevice) => {
    setSelectedDevice(device);
    setShowDetailsSheet(true);
  };

  const handleSuspend = (device: PlatformDevice) => {
    suspendMutation.mutate(
      { id: device.id },
      {
        onSuccess: () => toast.success("Device suspended"),
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleReactivate = (device: PlatformDevice) => {
    reinstateMutation.mutate(
      { id: device.id },
      {
        onSuccess: () => toast.success("Device reactivated"),
        onError: error => toast.error(error.message),
      },
    );
  };

  const retryRegistration = (deviceIds?: string[]) =>
    retryMutation.mutateAsync(
      deviceIds ? { deviceIds } : {},
      {
        onSuccess: res => toast.success(`${res.data.requeued} device(s) queued for registration retry`),
        onError: error => toast.error(error.message),
      },
    ).catch(() => undefined);

  const provisionKnown = devices.some(d => d.provisionStatus);
  const failedCount = devices.filter(isRetryableProvisionFailure).length;
  const noFailed = provisionKnown && failedCount === 0;

  const handleRetryAllFailed = () => {
    const known = provisionKnown;
    const count = failedCount;
    confirm({
      title: "Retry failed registrations?",
      description: known
        ? `${count} device(s) that failed to register with the tracking network will be retried.`
        : "Every device that failed to register with the tracking network will be retried.",
      confirmLabel: "Retry",
      destructive: false,
      onConfirm: () => retryRegistration(),
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemDevicesExportQueryOptions());
      downloadBlob(
        blob as Blob,
        "devices.csv",
      );
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  };

  const countStatus = (v: string) => visibleDevices.filter(d => normalizeDeviceStatus(d) === v).length;
  const stats = {
    all: visibleDevices.length,
    active: countStatus("active"),
    inactive: countStatus("inactive"),
    assigned: countStatus("assigned"),
    unassigned: countStatus("unassigned"),
  };

  if (devicesQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      <PageActions>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setImportOpen(true)}
        >
          <PackagePlus className="mr-2 h-4 w-4" />
          Import stock
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={retryMutation.isPending || noFailed}
          onClick={handleRetryAllFailed}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {noFailed ? "No failed registrations" : "Retry failed registrations"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setTelemetryOpen(true)}
        >
          <Radio className="mr-2 h-4 w-4" />
          Send test telemetry
        </Button>
        <Button
          size="sm"
          onClick={() => setAssignmentOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Record Assignment
        </Button>
      </PageActions>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Assigned Devices
              </CardTitle>
              <CardDescription>
                Devices that have been assigned to tenants across the platform
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[
              {
                label: "All Devices", value: stats.all, icon: Cpu, tone: "text-primary bg-primary/10",
              },
              {
                label: "Active", value: stats.active, icon: Activity, tone: "text-success bg-success/10",
              },
              {
                label: "Inactive", value: stats.inactive, icon: PowerOff, tone: "text-muted-foreground bg-muted",
              },
              {
                label: "Assigned", value: stats.assigned, icon: UserCheck, tone: "text-info bg-info/10",
              },
              {
                label: "Unassigned", value: stats.unassigned, icon: UserX, tone: "text-warning bg-warning/10",
              },
            ].map((k) => {
              const Icon = k.icon;
              return (
                <div
                  key={k.label}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md ${k.tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm text-muted-foreground">{k.label}</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{k.value}</p>
                </div>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, IMEI, or tenant..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {lifecycleStatuses.map(s => (
                  <SelectItem
                    key={s.value}
                    value={s.value}
                  >
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PlatformFilterPopover
              entity="devices"
              fields={[
                {
                  key: "lastSeen",
                  label: "Last Seen",
                  type: "select",
                  options: [
                    {
                      value: "7d", label: "Last 7 days",
                    },
                    {
                      value: "30d", label: "Last 30 days",
                    },
                    {
                      value: "90d", label: "Last 90 days",
                    },
                  ],
                },
                {
                  key: "tenant",
                  label: "Tenant",
                  type: "select",
                  options: Array.from(
                    new Set(devices.map(d => tenantName(d))),
                  )
                    .filter(n => n && n !== "Unknown tenant")
                    .map(n => ({
                      value: n, label: n,
                    })),
                },
                {
                  key: "manufacturer",
                  label: "Manufacturer",
                  type: "select",
                  options: manufacturers
                    .filter(m => m !== "all")
                    .map(m => ({
                      value: m, label: m,
                    })),
                },
              ]}
              value={filterDraft}
              onApply={setFilterDraft}
              onReset={() => setFilterDraft(buildEmptyDraft([]))}
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Manufacturer / Model</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>SIM Card</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Date Assigned</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devicesQuery.isError
                  ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Unable to load devices.
                          {" "}
                          <Button
                            variant="link"
                            className="h-auto p-0"
                            onClick={() => devicesQuery.refetch()}
                          >
                            Try again
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  : filteredDevices.length === 0
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-8 text-muted-foreground"
                          >
                            {devices.length === 0
                              ? "No devices registered across tenants."
                              : "No devices match your filters."}
                          </TableCell>
                        </TableRow>
                      )
                    : (
                        filteredDevices.map((device) => {
                          const lifecycleStatus = device.lifecycleStatus || device.operationalStatus;
                          const normalizedStatus = normalizeDeviceStatus(device);
                          const sim = simByDevice[device.id];
                          const isSuspended = device.operationalStatus === "suspended" || lifecycleStatus === "suspended";
                          const provisionMessage = provisionFailureMessage(device);

                          return (
                            <TableRow key={device.id}>
                              <TableCell className="font-mono text-sm">{device.imei}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{device.manufacturer}</p>
                                  {device.model && (
                                    <p className="text-xs text-muted-foreground">{device.model}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  {device.tenantId
                                    ? (
                                        <span
                                          className="text-sm truncate max-w-[150px]"
                                          title={device.tenantName ?? device.tenantId}
                                        >
                                          {tenantName(device)}
                                        </span>
                                      )
                                    : (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          Unassigned
                                        </Badge>
                                      )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {sim
                                  ? (
                                      <div>
                                        <p className="font-mono text-xs">{sim.iccid}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {[
                                            sim.msisdn,
                                            sim.carrier,
                                          ].filter(Boolean).join(" · ") || "-"}
                                        </p>
                                      </div>
                                    )
                                  : (
                                      <span className="text-xs text-muted-foreground">No SIM linked</span>
                                    )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`border-transparent ${statusClasses[normalizedStatus]}`}
                                >
                                  {statusLabels[normalizedStatus]}
                                </Badge>
                                {provisionMessage && (
                                  <p
                                    className="mt-1 max-w-[220px] text-xs text-destructive"
                                    title={device.provisionError ?? undefined}
                                  >
                                    {provisionMessage}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getSignalIcon(
                                    device.signalStrength,
                                    lifecycleStatus,
                                  )}
                                  {device.signalStrength !== null && (
                                    <span className="text-sm">{`${device.signalStrength}%`}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatLastSeen(device.lastSeen)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {device.tenantId
                                  ? formatWithPattern(
                                      device.assignedAt,
                                      "M/d/yyyy, h:mm:ss a",
                                    )
                                  : "-"}
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
                                    <DropdownMenuItem onClick={() => handleViewDetails(device)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setEditingDevice(device)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    {isRetryableProvisionFailure(device) && (
                                      <DropdownMenuItem
                                        disabled={retryMutation.isPending}
                                        onClick={() => retryRegistration([device.id])}
                                      >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Retry registration
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {device.tenantId && (
                                      isSuspended
                                        ? (
                                            <DropdownMenuItem
                                              className="text-success"
                                              disabled={reinstateMutation.isPending}
                                              onClick={() => handleReactivate(device)}
                                            >
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Reactivate
                                            </DropdownMenuItem>
                                          )
                                        : (
                                            <DropdownMenuItem
                                              className="text-warning"
                                              disabled={suspendMutation.isPending}
                                              onClick={() => handleSuspend(device)}
                                            >
                                              <XCircle className="h-4 w-4 mr-2" />
                                              Suspend Device
                                            </DropdownMenuItem>
                                          )
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
              </TableBody>
            </Table>
          </div>

        </CardContent>

        {/* Device Details Sheet */}
        <DeviceDetailSheet
          device={selectedDevice}
          sim={selectedDevice ? simByDevice[selectedDevice.id] : undefined}
          open={showDetailsSheet}
          onOpenChange={setShowDetailsSheet}
        />
      </Card>

      <EditDeviceDialog
        device={editingDevice}
        open={!!editingDevice}
        onOpenChange={open => !open && setEditingDevice(null)}
      />
      <RecordDeviceAssignmentDialog
        devices={visibleDevices}
        open={assignmentOpen}
        onOpenChange={setAssignmentOpen}
      />
      <ImportPlatformStockDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />
      <SendTestTelemetryDialog
        open={telemetryOpen}
        onOpenChange={setTelemetryOpen}
      />
      {confirmDialog}
    </>
  );
}
