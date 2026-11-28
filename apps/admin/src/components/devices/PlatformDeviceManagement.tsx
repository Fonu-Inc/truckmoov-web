import type { ColumnDef } from "@tanstack/react-table";
import type {
  SystemDevicesQuery, SystemSimItem,
} from "@truckmoov/api/auth";
import type { PlatformDevice } from "./management/deviceStatus";
import type { FilterDraft } from "@/components/shadcn/platform-filter-popover";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemDeviceManufacturersQueryOptions,
  getSystemDevicesExportQueryOptions,
  getSystemDevicesQueryOptions,
  getSystemSimsQueryOptions,
  getSystemTenantsQueryOptions,
  useReinstateSystemDevice,
  useRetryDeviceProvisioning,
  useSuspendSystemDevice,
} from "@truckmoov/api/auth";
import { downloadBlob } from "@truckmoov/app-core/utils/general-utils";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import { useServerPagination } from "@truckmoov/reusables/hooks/useServerPagination";
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
  useEffect,
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
import { useDebouncedValue } from "@/features/communications/useDebouncedValue";
import { PageActions } from "@/shared/components/layout/PageTitle";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";
import { AddPlatformStockDialog } from "./management/AddPlatformStockDialog";
import { DeviceDetailSheet } from "./management/DeviceDetailSheet";
import {
  formatLastSeen,
  isRetryableProvisionFailure,
  LAST_SEEN_DAYS,
  lifecycleStatuses,
  provisionFailureMessage,
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

export function PlatformDeviceManagement({ inventory = false }: { inventory?: boolean }) {
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery(getSystemTenantsQueryOptions());
  const manufacturersQuery = useQuery(getSystemDeviceManufacturersQueryOptions("all"));
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
    stockScope,
    setStockScope,
  ] = useState<"available" | "stock">("available");
  const scope = inventory ? stockScope : "assigned";
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
    addOpen,
    setAddOpen,
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

  const debouncedSearch = useDebouncedValue(
    searchQuery.trim(),
    300,
  );
  const tenantId = !inventory && filterDraft.tenant?.enabled ? filterDraft.tenant.value : undefined;
  const manufacturer = filterDraft.manufacturer?.enabled ? filterDraft.manufacturer.value : undefined;
  const lastSeen = filterDraft.lastSeen?.enabled && filterDraft.lastSeen.value ? LAST_SEEN_DAYS[filterDraft.lastSeen.value] : undefined;
  const filters: NonNullable<SystemDevicesQuery["params"]> = {
    scope,
    search: debouncedSearch || undefined,
    bucket: statusFilter === "all" ? undefined : statusFilter as PlatformDevice["bucket"],
    tenantId,
    manufacturer,
    lastSeenDays: lastSeen,
    hideFaulty: scope === "assigned",
  };
  const {
    page, pageSize, pagination, setPage,
  } = useServerPagination(
    [
      debouncedSearch,
      statusFilter,
      scope,
      tenantId,
      manufacturer,
      lastSeen,
    ],
    50,
  );
  const devicesQuery = useQuery({
    ...getSystemDevicesQueryOptions({
      params: {
        ...filters,
        page,
        limit: pageSize,
      },
    }),
    placeholderData: keepPreviousData,
  });

  const devices = devicesQuery.data?.data.items ?? [];
  const deviceIds = devices.map(d => d.id).join(",");
  const simsQuery = useQuery({
    ...getSystemSimsQueryOptions({
      params: {
        deviceIds,
        limit: 100,
      },
    }),
    enabled: deviceIds !== "",
    placeholderData: keepPreviousData,
  });
  // Placeholder data is the previous page's SIMs, so it can't answer for the current devices.
  const simsLoading = simsQuery.isFetching || simsQuery.isPlaceholderData;
  const stats = devicesQuery.data?.data.summary;
  const availableByModel = devicesQuery.data?.data.availableByModel ?? [];
  const total = devicesQuery.data?.data.total ?? 0;
  // Last row of the last page was removed: step back to the last valid page.
  useEffect(
    () => {
      if (devices.length === 0 && total > 0 && page > 1) {
        setPage(Math.max(
          1,
          Math.ceil(total / pageSize),
        ));
      }
    },
    [
      devices.length,
      total,
      page,
      pageSize,
      setPage,
    ],
  );
  const hasActiveFilters = Boolean(debouncedSearch || tenantId || manufacturer || lastSeen || statusFilter !== "all");

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

  const failedCount = stats?.failedProvision;
  const noFailed = failedCount === 0;

  const handleRetryAllFailed = () => {
    confirm({
      title: "Retry failed registrations?",
      description: failedCount === undefined
        ? "Every device that failed to register with the tracking network will be retried."
        : `${failedCount} device(s) that failed to register with the tracking network will be retried.`,
      confirmLabel: "Retry",
      destructive: false,
      onConfirm: () => retryRegistration(),
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemDevicesExportQueryOptions({ params: filters }));
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

  const columns: ColumnDef<PlatformDevice>[] = [
    {
      id: "imei",
      header: "IMEI",
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.imei}</span>,
    },
    {
      id: "model",
      header: "Manufacturer / Model",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.manufacturer}</p>
          {row.original.model && (
            <p className="text-xs text-muted-foreground">{row.original.model}</p>
          )}
        </div>
      ),
    },
    {
      id: "tenant",
      header: "Tenant",
      cell: ({ row }) => {
        const device = row.original;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {device.isPlatformStock
              ? (
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    Platform stock
                  </Badge>
                )
              : device.tenantId
                ? (
                    <span
                      className="text-sm truncate max-w-[150px]"
                      title={device.tenantName ?? device.tenantId}
                    >
                      {device.tenantName ?? device.tenantId}
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
        );
      },
    },
    {
      id: "sim",
      header: "SIM Card",
      cell: ({ row }) => {
        const sim = simByDevice[row.original.id];
        return sim
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
          : <span className="text-xs text-muted-foreground">{simsLoading ? "…" : simsQuery.isError ? "-" : "No SIM linked"}</span>;
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const device = row.original;
        const provisionMessage = provisionFailureMessage(device);
        return (
          <>
            <Badge
              variant="outline"
              className={`border-transparent ${statusClasses[device.bucket]}`}
            >
              {statusLabels[device.bucket]}
            </Badge>
            {provisionMessage && (
              <p
                className="mt-1 max-w-[220px] text-xs text-destructive"
                title={device.provisionError ?? undefined}
              >
                {provisionMessage}
              </p>
            )}
          </>
        );
      },
    },
    {
      id: "signal",
      header: "Signal",
      cell: ({ row }) => {
        const device = row.original;
        return (
          <div className="flex items-center gap-2">
            {getSignalIcon(
              device.signalStrength,
              device.lifecycleStatus || device.operationalStatus,
            )}
            {device.signalStrength !== null && (
              <span className="text-sm">{`${device.signalStrength}%`}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "lastSeen",
      header: "Last Seen",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatLastSeen(row.original.lastSeen)}</span>,
    },
    {
      id: "assignedAt",
      header: "Date Assigned",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.isPlatformStock || !row.original.assignedAt
            ? "-"
            : formatWithPattern(
                row.original.assignedAt,
                "M/d/yyyy, h:mm:ss a",
              )}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-[50px]" },
      cell: ({ row }) => {
        const device = row.original;
        const lifecycleStatus = device.lifecycleStatus || device.operationalStatus;
        const isSuspended = device.operationalStatus === "suspended" || lifecycleStatus === "suspended";
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
        );
      },
    },
  ];

  return (
    <>
      <PageActions>
        {inventory && (
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
          >
            Add device
          </Button>
        )}
        {inventory && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setImportOpen(true)}
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Import stock
          </Button>
        )}
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
        {inventory && (
          <Button
            size="sm"
            onClick={() => setAssignmentOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Assign to Tenant
          </Button>
        )}
      </PageActions>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                {inventory ? "Available devices" : "Assigned Devices"}
              </CardTitle>
              <CardDescription>
                {inventory ? "Platform-owned devices eligible for assignment to a tenant" : "Devices that have been assigned to tenants across the platform"}
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
            {(inventory
              ? [
                  {
                    label: stockScope === "available" ? "Available" : "Platform stock", value: stats?.all, icon: Cpu, tone: "text-primary bg-primary/10",
                  },
                ]
              : [
                  {
                    label: "All Devices", value: stats?.all, icon: Cpu, tone: "text-primary bg-primary/10",
                  },
                  {
                    label: "Active", value: stats?.active, icon: Activity, tone: "text-success bg-success/10",
                  },
                  {
                    label: "Inactive", value: stats?.inactive, icon: PowerOff, tone: "text-muted-foreground bg-muted",
                  },
                  {
                    label: "Assigned", value: stats?.assigned, icon: UserCheck, tone: "text-info bg-info/10",
                  },
                  {
                    label: "Unassigned", value: stats?.unassigned, icon: UserX, tone: "text-warning bg-warning/10",
                  },
                ]).map((k) => {
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
                  {k.value === undefined
                    ? <Skeleton className="mt-2 h-8 w-16" />
                    : <p className="mt-2 text-2xl font-bold">{k.value}</p>}
                </div>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {inventory && availableByModel.length > 0 && (
            <div
              className="mb-6 flex flex-wrap gap-2"
              aria-label="Available units by model"
            >
              {availableByModel.map(entry => (
                <Badge
                  key={JSON.stringify([
                    entry.manufacturer,
                    entry.model,
                  ])}
                  variant="outline"
                >
                  {entry.manufacturer}
                  {" "}
                  {entry.model}
                  :
                  {" "}
                  {entry.available}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, IMEI, model or tenant..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {inventory && (
              <Select
                value={stockScope}
                onValueChange={value => setStockScope(value as typeof stockScope)}
              >
                <SelectTrigger
                  aria-label="Stock availability"
                  className="w-[190px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available units</SelectItem>
                  <SelectItem value="stock">All platform stock</SelectItem>
                </SelectContent>
              </Select>
            )}
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
                ...(!inventory ? [
                  {
                    key: "tenant",
                    label: "Tenant",
                    type: "select",
                    options: (tenantsQuery.data?.data.tenants ?? [])
                      .map(t => ({
                        value: t.id, label: t.name,
                      }))
                      .sort((a, b) => a.label.localeCompare(b.label)),
                  } as const,
                ] : []),
                {
                  key: "manufacturer",
                  label: "Manufacturer",
                  type: "select",
                  options: (manufacturersQuery.data?.data.manufacturers ?? [])
                    .map(m => ({
                      value: m.manufacturer, label: m.manufacturer,
                    })),
                },
              ]}
              value={filterDraft}
              onApply={setFilterDraft}
              onReset={() => setFilterDraft(buildEmptyDraft([]))}
            />
          </div>

          {devicesQuery.isError && devicesQuery.data && (
            <p className="mb-3 text-sm text-destructive">
              Unable to refresh devices.
              {" "}
              <Button
                variant="link"
                className="h-auto p-0"
                onClick={() => devicesQuery.refetch()}
              >
                Try again
              </Button>
            </p>
          )}
          <div className={`rounded-lg border transition-opacity ${devicesQuery.isPlaceholderData ? "opacity-60" : ""}`}>
            <DataTable
              columns={columns}
              data={devices}
              isLoading={devicesQuery.isLoading}
              isError={devicesQuery.isError && !devicesQuery.data}
              errorMessage="Unable to load devices."
              onRetry={() => devicesQuery.refetch()}
              hasActiveFilters={hasActiveFilters}
              emptyState={inventory ? "No devices match this inventory view." : "No devices assigned to tenants."}
              filteredEmptyState="No devices match your filters."
              pagination={pagination(devicesQuery.data?.data.total ?? 0)}
            />
          </div>

        </CardContent>

        {/* Device Details Sheet */}
        <DeviceDetailSheet
          device={selectedDevice}
          sim={selectedDevice ? simByDevice[selectedDevice.id] : undefined}
          simLoading={simsLoading}
          simError={simsQuery.isError}
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
        open={assignmentOpen}
        onOpenChange={setAssignmentOpen}
      />
      <AddPlatformStockDialog
        open={addOpen}
        onOpenChange={setAddOpen}
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
