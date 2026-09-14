import type { ColumnDef } from "@tanstack/react-table";
import type {
  SystemDeviceInventoryItem,
  SystemDevicesQuery,
} from "@truckmoov/api/auth";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemDeviceQueryOptions,
  getSystemDevicesCatalogExportQueryOptions,
  getSystemDevicesQueryOptions,
  getSystemDevicesSummaryQueryOptions,
  getSystemTenantsQueryOptions,
  useSuspendSystemDevice,
  useReinstateSystemDevice,
} from "@truckmoov/api/auth";
import { formatCompactRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  ArrowUpDown,
  Battery,
  Building2,
  CheckCircle,
  Cpu,
  Download,
  Eye,
  Loader2,
  MoreHorizontal,
  Navigation,
  Pencil,
  Search,
  Signal,
  SlidersHorizontal,
  Trash2,
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
import { Checkbox } from "@/components/shadcn/checkbox";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Progress } from "@/components/shadcn/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog as Sheet,
  DialogContent as SheetContent,
  DialogDescription as SheetDescription,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Textarea } from "@/components/shadcn/textarea";

const lifecycleStatuses = [
  {
    value: "all",
    label: "All Statuses",
  },
  {
    value: "registered",
    label: "Registered",
  },
  {
    value: "config_pending",
    label: "Config Pending",
  },
  {
    value: "configured",
    label: "Configured",
  },
  {
    value: "verified_online",
    label: "Verified Online",
  },
  {
    value: "assignable",
    label: "Assignable",
  },
  {
    value: "assigned",
    label: "Assigned",
  },
  {
    value: "faulty",
    label: "Faulty",
  },
  {
    value: "decommissioned",
    label: "Decommissioned",
  },
];

const operationalStatuses = [
  {
    value: "registered",
    label: "Registered",
  },
  {
    value: "configured",
    label: "Configured",
  },
  {
    value: "assigned",
    label: "Assigned",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "faulty",
    label: "Faulty",
  },
  {
    value: "decommissioned",
    label: "Decommissioned",
  },
];

type DeviceFilterDraft = {
  operationalStatus: {
    enabled: boolean;
    value: string;
  };
  lifecycleStatus: {
    enabled: boolean;
    value: string;
  };
  manufacturer: {
    enabled: boolean;
    value: string;
  };
};

const emptyFilters: DeviceFilterDraft = {
  operationalStatus: {
    enabled: false,
    value: "",
  },
  lifecycleStatus: {
    enabled: false,
    value: "",
  },
  manufacturer: {
    enabled: false,
    value: "",
  },
};

function formatSignal(signalStrength: number | null) {
  return signalStrength === null ? null : `${signalStrength}%`;
}

function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "registered":
    case "verified_online":
      return "border-info/30 bg-info/10 text-info hover:bg-info/10";
    case "config_pending":
      return "border-warning/30 bg-warning/10 text-warning hover:bg-warning/10";
    case "configured":
      return "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10";
    case "assignable":
    case "assigned":
    case "active":
      return "border-success/30 bg-success/10 text-success hover:bg-success/10";
    case "faulty":
      return "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10";
    default:
      return "border-border bg-muted text-muted-foreground hover:bg-muted";
  }
}

/**
 * Fold lifecycle + operational fields into fleetflow's 7 normalized buckets so
 * the table Status column and stats agree. Mirrors the helper in
 * `fleetflow-pro-main/src/components/devices/PlatformDeviceManagement.tsx`.
 */
const NORMALIZED_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  assigned: "Assigned",
  unassigned: "Unassigned",
  configured: "Configured",
  registered: "Registered",
  unregistered: "Unregistered",
};

const NORMALIZED_STATUS_CLASSES: Record<string, string> = {
  active: "border-success/30 bg-success/10 text-success hover:bg-success/10",
  inactive: "border-border bg-muted text-muted-foreground hover:bg-muted",
  // TRU-FE-5 § 7 — suspended is a real lifecycle state; render distinctly from inactive.
  suspended: "border-warning/30 bg-warning/10 text-warning hover:bg-warning/10",
  assigned: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  unassigned: "border-warning/30 bg-warning/10 text-warning hover:bg-warning/10",
  configured: "border-info/30 bg-info/10 text-info hover:bg-info/10",
  registered: "border-secondary bg-secondary text-secondary-foreground",
  unregistered: "border-secondary bg-secondary text-muted-foreground",
};

function normalizeDeviceStatus(device: SystemDeviceInventoryItem): string {
  const lifecycle = (device.lifecycleStatus ?? "").toString();
  const legacy = (device.operationalStatus ?? "").toString();
  // TRU-FE-5 § 7 — suspended is now a real lifecycle state; check it before
  // the generic active/inactive fallthrough so it renders as "Suspended" not "Inactive".
  if (lifecycle === "suspended")
    return "suspended";
  if (legacy === "active")
    return "active";
  if (legacy === "unregistered")
    return "unregistered";
  if (lifecycle === "assigned" || legacy === "assigned")
    return "assigned";
  if (lifecycle === "assignable" || lifecycle === "verified_online")
    return "unassigned";
  if (lifecycle === "configured" || lifecycle === "config_pending" || legacy === "configured")
    return "configured";
  if (lifecycle === "registered" || legacy === "registered")
    return "registered";
  if (legacy === "inactive" || lifecycle === "inactive")
    return "inactive";
  return "unregistered";
}

export function PlatformDeviceManagement() {
  const queryClient = useQueryClient();
  const [
    selectedDevice,
    setSelectedDevice,
  ] = useState<SystemDeviceInventoryItem | null>(null);
  const [
    editDevice,
    setEditDevice,
  ] = useState<SystemDeviceInventoryItem | null>(null);
  const [
    reassignDevice,
    setReassignDevice,
  ] = useState<SystemDeviceInventoryItem | null>(null);
  const [
    reassignTenantId,
    setReassignTenantId,
  ] = useState("");
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    debouncedSearchQuery,
    setDebouncedSearchQuery,
  ] = useState("");
  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);
  const [
    filterDraft,
    setFilterDraft,
  ] = useState<DeviceFilterDraft>(emptyFilters);
  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState<DeviceFilterDraft>(emptyFilters);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const [
    suspendDevice,
    setSuspendDevice,
  ] = useState<SystemDeviceInventoryItem | null>(null);
  const [
    suspendReason,
    setSuspendReason,
  ] = useState("");
  const [
    reinstateDevice,
    setReinstateDevice,
  ] = useState<SystemDeviceInventoryItem | null>(null);

  const suspendMutation = useSuspendSystemDevice();
  const reinstateMutation = useReinstateSystemDevice();

  const summaryQuery = useQuery(getSystemDevicesSummaryQueryOptions());
  useEffect(
    () => {
      const timer = setTimeout(
        setDebouncedSearchQuery,
        400,
        searchQuery,
      );
      return () => clearTimeout(timer);
    },
    [searchQuery],
  );

  const devicesQueryPayload = useMemo<SystemDevicesQuery>(
    () => ({
      params: {
        ...(debouncedSearchQuery.trim() ? { search: debouncedSearchQuery.trim() } : {}),
        ...(appliedFilters.operationalStatus.enabled && appliedFilters.operationalStatus.value
          ? { status: appliedFilters.operationalStatus.value as NonNullable<SystemDevicesQuery["params"]>["status"] }
          : {}),
        ...(appliedFilters.lifecycleStatus.enabled && appliedFilters.lifecycleStatus.value
          ? { lifecycleStatus: appliedFilters.lifecycleStatus.value as NonNullable<SystemDevicesQuery["params"]>["lifecycleStatus"] }
          : {}),
        ...(appliedFilters.manufacturer.enabled && appliedFilters.manufacturer.value.trim()
          ? { manufacturer: appliedFilters.manufacturer.value.trim() }
          : {}),
      },
    }),
    [
      appliedFilters,
      debouncedSearchQuery,
    ],
  );

  const devicesQuery = useQuery(getSystemDevicesQueryOptions(devicesQueryPayload));
  const selectedDeviceDetailQuery = useQuery({
    ...getSystemDeviceQueryOptions(selectedDevice?.id ?? ""),
    enabled: Boolean(selectedDevice?.id),
  });
  const tenantsQuery = useQuery({
    ...getSystemTenantsQueryOptions(),
    enabled: Boolean(reassignDevice),
  });
  const tenants = tenantsQuery.data?.data?.tenants ?? [];
  const summary = summaryQuery.data?.data;
  const devices = useMemo<SystemDeviceInventoryItem[]>(
    () => devicesQuery.data?.data?.devices ?? [],
    [devicesQuery.data],
  );
  // TRU-FE-5 § 8 — Active excludes assigned so it doesn't double-count with Assigned.
  // The four new counters (unassignedDevices, unregisteredDevices, inactiveDevices,
  // suspendedDevices) come straight from the endpoint now.
  const summaryCards = useMemo(
    () => [
      {
        label: "All Devices",
        value: summary?.totalDevices ?? "N/A",
        className: "",
      },
      {
        label: "Active",
        value: summary?.activeDevices ?? "N/A",
        className: "text-success",
      },
      {
        label: "Assigned",
        value: summary?.assignedDevices ?? "N/A",
        className: "text-primary",
      },
      {
        label: "Unassigned",
        value: summary?.unassignedDevices ?? "N/A",
        className: "text-warning",
      },
      {
        label: "Registered",
        value: summary?.registeredDevices ?? "N/A",
        className: "text-muted-foreground",
      },
      {
        label: "Unregistered",
        value: summary?.unregisteredDevices ?? "N/A",
        className: "text-muted-foreground",
      },
      {
        label: "Configured",
        value: summary?.configuredDevices ?? "N/A",
        className: "text-info",
      },
      {
        label: "Suspended",
        value: summary?.suspendedDevices ?? "N/A",
        className: "text-warning",
      },
      {
        label: "Inactive",
        value: summary?.inactiveDevices ?? "N/A",
        className: "text-muted-foreground",
      },
    ],
    [summary],
  );
  const activeFilterCount = useMemo(
    () => Object.values(appliedFilters).filter(filter => filter.enabled).length,
    [appliedFilters],
  );

  const detailDevice = selectedDeviceDetailQuery.data?.data ?? selectedDevice;
  const selectedSignal = detailDevice?.signalStrength ?? 0;
  const selectedBattery = detailDevice?.batteryLevel ?? 0;

  const deviceColumns: ColumnDef<SystemDeviceInventoryItem>[] = [
    {
      accessorKey: "imei",
      header: "IMEI",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-foreground">{row.original.imei}</span>
      ),
    },
    {
      id: "manufacturer",
      header: "Manufacturer / Model",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-foreground">{row.original.manufacturer}</p>
          <p className="text-xs text-muted-foreground">{row.original.model}</p>
        </div>
      ),
    },
    {
      accessorKey: "tenantName",
      header: "Tenant",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {row.original.tenantName ?? "Unknown tenant"}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const normalized = normalizeDeviceStatus(row.original);
        return (
          <Badge className={NORMALIZED_STATUS_CLASSES[normalized]}>
            {NORMALIZED_STATUS_LABELS[normalized]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "signalStrength",
      header: "Signal",
      cell: ({ row }) => (
        formatSignal(row.original.signalStrength)
          ? (
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Signal className="h-4 w-4 text-success" />
                {formatSignal(row.original.signalStrength)}
              </div>
            )
          : (
              <span className="text-muted-foreground">.</span>
            )
      ),
    },
    {
      accessorKey: "lastSeen",
      header: "Last Seen",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatCompactRelative(
            row.original.lastSeen,
            "Never",
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
        const isAssigned = Boolean(device.tenantId);
        const isFaulty = device.lifecycleStatus === "faulty";
        // TRU-FE-5 § 7 — suspended is a real lifecycle state (not operationalStatus).
        const isSuspended = device.lifecycleStatus === "suspended";
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
              <DropdownMenuItem onClick={() => setSelectedDevice(device)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditDevice(device)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setReassignDevice(device);
                setReassignTenantId(device.tenantId ?? "");
              }}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {isAssigned ? "Reassign" : "Assign to Tenant"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isSuspended
                ? (
                    <DropdownMenuItem
                      className="text-success"
                      onClick={() => setReinstateDevice(device)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Reinstate
                    </DropdownMenuItem>
                  )
                : (
                    <DropdownMenuItem
                      className="text-warning"
                      onClick={() => {
                        setSuspendDevice(device);
                        setSuspendReason("");
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Suspend
                    </DropdownMenuItem>
                  )}
              {!isAssigned && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    // ponytail: wire useDeleteDevice when the API exposes it
                    toast.info("Not yet implemented");
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
              {isFaulty && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      // ponytail: wire fault details view when the API exposes it
                      toast.info("Not yet implemented");
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    View Fault Details
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemDevicesCatalogExportQueryOptions());
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "device-catalog.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Device Inventory
            </CardTitle>
            <CardDescription>Platform-wide device overview (read-only)</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export Data"}
          </Button>
        </div>

        {summaryQuery.isError
          ? (
              <div className="mt-4 rounded-lg border border-border/50 bg-card/50 py-4 text-center">
                <p className="text-destructive">Unable to load device summary.</p>
                <Button
                  variant="link"
                  className="mt-1"
                  onClick={() => summaryQuery.refetch()}
                >
                  Try again
                </Button>
              </div>
            )
          : (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
                {summaryCards.map(stat => (
                  <div
                    key={stat.label}
                    className="rounded-lg border bg-card p-3"
                  >
                    {summaryQuery.isLoading
                      ? <Skeleton className="h-8 w-16" />
                      : <p className={`text-2xl font-bold ${stat.className}`}>{stat.value}</p>}
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ID, IMEI, or tenant..."
              className="pl-10"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
            />
          </div>

          <Select
            value={appliedFilters.lifecycleStatus.enabled && appliedFilters.lifecycleStatus.value
              ? appliedFilters.lifecycleStatus.value
              : "all"}
            onValueChange={(value) => {
              setAppliedFilters(current => ({
                ...current,
                lifecycleStatus: value === "all"
                  ? {
                      enabled: false, value: "",
                    }
                  : {
                      enabled: true, value,
                    },
              }));
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {lifecycleStatuses.map(status => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover
            open={filterOpen}
            onOpenChange={(open) => {
              setFilterOpen(open);
              if (open)
                setFilterDraft(appliedFilters);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-[324px] rounded-xl p-3"
            >
              <div className="space-y-3">
                <h4 className="px-0.5 text-xs font-semibold text-foreground">
                  Only show devices by...
                </h4>

                <div className="space-y-1.5">
                  <label className="flex cursor-pointer select-none items-center gap-2">
                    <Checkbox
                      checked={filterDraft.operationalStatus.enabled}
                      onCheckedChange={checked =>
                        setFilterDraft(current => ({
                          ...current,
                          operationalStatus: {
                            ...current.operationalStatus,
                            enabled: !!checked,
                          },
                        }))}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      Status
                    </span>
                  </label>
                  <Select
                    disabled={!filterDraft.operationalStatus.enabled}
                    value={filterDraft.operationalStatus.value}
                    onValueChange={value =>
                      setFilterDraft(current => ({
                        ...current,
                        operationalStatus: {
                          ...current.operationalStatus,
                          value,
                        },
                      }))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {operationalStatuses.map(status => (
                        <SelectItem
                          key={status.value}
                          value={status.value}
                        >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="flex cursor-pointer select-none items-center gap-2">
                    <Checkbox
                      checked={filterDraft.lifecycleStatus.enabled}
                      onCheckedChange={checked =>
                        setFilterDraft(current => ({
                          ...current,
                          lifecycleStatus: {
                            ...current.lifecycleStatus,
                            enabled: !!checked,
                          },
                        }))}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      Lifecycle Status
                    </span>
                  </label>
                  <Select
                    disabled={!filterDraft.lifecycleStatus.enabled}
                    value={filterDraft.lifecycleStatus.value}
                    onValueChange={value =>
                      setFilterDraft(current => ({
                        ...current,
                        lifecycleStatus: {
                          ...current.lifecycleStatus,
                          value,
                        },
                      }))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select lifecycle status" />
                    </SelectTrigger>
                    <SelectContent>
                      {lifecycleStatuses
                        .filter(status => status.value !== "all")
                        .map(status => (
                          <SelectItem
                            key={status.value}
                            value={status.value}
                          >
                            {status.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="flex cursor-pointer select-none items-center gap-2">
                    <Checkbox
                      checked={filterDraft.manufacturer.enabled}
                      onCheckedChange={checked =>
                        setFilterDraft(current => ({
                          ...current,
                          manufacturer: {
                            ...current.manufacturer,
                            enabled: !!checked,
                          },
                        }))}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      Manufacturer
                    </span>
                  </label>
                  <Input
                    disabled={!filterDraft.manufacturer.enabled}
                    placeholder="Enter manufacturer"
                    className="h-9 text-xs"
                    value={filterDraft.manufacturer.value}
                    onChange={event =>
                      setFilterDraft(current => ({
                        ...current,
                        manufacturer: {
                          ...current.manufacturer,
                          value: event.target.value,
                        },
                      }))}
                  />
                </div>

                <div className="flex gap-2 border-t border-border pt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setAppliedFilters(filterDraft);
                      setFilterOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setFilterDraft(emptyFilters);
                      setAppliedFilters(emptyFilters);
                      setFilterOpen(false);
                    }}
                  >
                    Show All
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <DataTable
            columns={deviceColumns}
            data={devices}
            isLoading={devicesQuery.isLoading}
            isError={devicesQuery.isError}
            errorMessage="Unable to load devices."
            onRetry={() => devicesQuery.refetch()}
            hasActiveFilters={!!debouncedSearchQuery.trim() || activeFilterCount > 0}
            emptyState="No devices yet."
            filteredEmptyState="No devices match your filters."
          />
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Platform Admin View:</strong>
            {" "}
            This is a read-only overview. Device
            registration, configuration, and vehicle assignment are managed by tenant
            administrators. Use the Device Catalog tab to manage supported manufacturers
            and models.
          </p>
        </div>
      </CardContent>

      <Sheet
        open={!!selectedDevice}
        onOpenChange={open => !open && setSelectedDevice(null)}
      >
        <SheetContent className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="block">
                  {detailDevice?.manufacturer}
                  {" "}
                  {detailDevice?.model}
                </span>
                <span className="text-sm font-normal text-muted-foreground font-mono">
                  IMEI:
                  {" "}
                  {detailDevice?.imei}
                </span>
              </div>
            </SheetTitle>
            <SheetDescription className="sr-only">Device details</SheetDescription>
          </SheetHeader>

          {detailDevice && (
            <div className="mt-6 space-y-4">
              {selectedDeviceDetailQuery.isLoading && (
                <Skeleton className="h-4 w-56" />
              )}
              {selectedDeviceDetailQuery.isError && (
                <div className="rounded-lg border border-border/50 bg-card/50 py-4 text-center">
                  <p className="text-destructive">Unable to load latest device details.</p>
                  <Button
                    variant="link"
                    className="mt-1"
                    onClick={() => selectedDeviceDetailQuery.refetch()}
                  >
                    Try again
                  </Button>
                </div>
              )}

              {/* Status & Basic Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Lifecycle / Operational</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge className={getStatusBadgeClass(detailDevice.lifecycleStatus)}>
                          {formatStatusLabel(detailDevice.lifecycleStatus)}
                        </Badge>
                        {detailDevice.operationalStatus && detailDevice.operationalStatus !== detailDevice.lifecycleStatus && (
                          <Badge className={getStatusBadgeClass(detailDevice.operationalStatus)}>
                            {formatStatusLabel(detailDevice.operationalStatus)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Seen</p>
                      <p className="text-sm font-medium mt-1">
                        {formatCompactRelative(
                          detailDevice.lastSeen,
                          "Never",
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tenant</p>
                      <p className="text-sm font-medium mt-1 max-w-[220px] truncate">
                        {detailDevice.tenantName ?? detailDevice.tenantId ?? "Unknown tenant"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Protocol</p>
                      <p className="text-sm font-medium mt-1 uppercase">{detailDevice.protocol ?? "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Device Health */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Device Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Signal className="h-4 w-4 text-muted-foreground" />
                        <span>Signal Strength</span>
                      </div>
                      <span className="font-medium">
                        {detailDevice.signalStrength ?? 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={selectedSignal}
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4 text-muted-foreground" />
                        <span>Battery Level</span>
                      </div>
                      <span className="font-medium">
                        {detailDevice.batteryLevel === null || detailDevice.batteryLevel === undefined
                          ? "N/A"
                          : `${detailDevice.batteryLevel}%`}
                      </span>
                    </div>
                    <Progress
                      value={selectedBattery}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Current Location — ponytail: wire lat/lng/speed when SystemDevice DTO exposes GPS fields */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    Current Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-sm text-muted-foreground">—</div>
                  <div className="mt-2 text-sm text-muted-foreground">Speed: —</div>
                </CardContent>
              </Card>

              {/* Configuration */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Firmware Version</span>
                    <span className="font-mono">{detailDevice.firmwareVersion ?? "Unknown"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Manufacturer</span>
                    <span>{detailDevice.manufacturer}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Model</span>
                    <span>{detailDevice.model || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Device Dialog — ponytail: form-only for now. Wire submit when
          `PATCH /system/devices/:id` ships. */}
      <Dialog
        open={!!editDevice}
        onOpenChange={open => !open && setEditDevice(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Device Details</DialogTitle>
            <DialogDescription>
              Update the record for
              {" "}
              {editDevice?.manufacturer}
              {" "}
              {editDevice?.model}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-imei">IMEI</Label>
              <Input
                id="edit-imei"
                defaultValue={editDevice?.imei ?? ""}
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manufacturer">Manufacturer</Label>
              <Input
                id="edit-manufacturer"
                defaultValue={editDevice?.manufacturer ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                defaultValue={editDevice?.model ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-firmware">Firmware Version</Label>
              <Input
                id="edit-firmware"
                defaultValue={editDevice?.firmwareVersion ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-protocol">Protocol</Label>
                <Input
                  id="edit-protocol"
                  defaultValue={editDevice?.protocol ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Input
                  id="edit-status"
                  defaultValue={editDevice?.operationalStatus ?? ""}
                  disabled
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDevice(null)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              toast.info("Backend endpoint pending — form values not saved");
              setEditDevice(null);
            }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Device Dialog — ponytail: tenant list is real, submit is a
          stub until `POST /system/devices/:id/assign` ships. */}
      <Dialog
        open={!!reassignDevice}
        onOpenChange={(open) => {
          if (!open) {
            setReassignDevice(null);
            setReassignTenantId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reassignDevice?.tenantId ? "Reassign Device" : "Assign Device to Tenant"}
            </DialogTitle>
            <DialogDescription>
              Allocate
              {" "}
              {reassignDevice?.manufacturer}
              {" "}
              {reassignDevice?.model}
              {" "}
              (IMEI
              {" "}
              {reassignDevice?.imei}
              ) to a tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Tenant</Label>
            <Select
              value={reassignTenantId}
              onValueChange={setReassignTenantId}
            >
              <SelectTrigger>
                <SelectValue placeholder={tenantsQuery.isLoading ? "Loading tenants…" : "Select tenant"} />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(t => (
                  <SelectItem
                    key={t.id}
                    value={t.id}
                  >
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReassignDevice(null);
                setReassignTenantId("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!reassignTenantId}
              onClick={() => {
                toast.info("Backend endpoint pending — assignment not persisted");
                setReassignDevice(null);
                setReassignTenantId("");
              }}
            >
              {reassignDevice?.tenantId ? "Reassign" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TRU-FE-5 § 7 — Suspend device. Optional reason; 503 means the change did
          not happen — do NOT optimistically update; let the invalidation on success
          handle the refresh. */}
      <Dialog
        open={!!suspendDevice}
        onOpenChange={(open) => {
          if (!open && !suspendMutation.isPending) {
            setSuspendDevice(null);
            setSuspendReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend Device</DialogTitle>
            <DialogDescription>
              This takes
              {" "}
              {suspendDevice?.manufacturer}
              {" "}
              {suspendDevice?.model}
              {" "}
              (IMEI
              {" "}
              {suspendDevice?.imei}
              ) out of service platform-wide and releases its vehicle assignment. Add an optional reason for the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="suspend-reason">Reason (optional)</Label>
            <Textarea
              id="suspend-reason"
              rows={3}
              placeholder="Reason for suspension…"
              className="resize-none"
              value={suspendReason}
              onChange={event => setSuspendReason(event.target.value)}
              disabled={suspendMutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDevice(null);
                setSuspendReason("");
              }}
              disabled={suspendMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={suspendMutation.isPending}
              onClick={() => {
                if (!suspendDevice)
                  return;
                suspendMutation.mutate(
                  {
                    id: suspendDevice.id,
                    ...(suspendReason.trim() ? { data: { reason: suspendReason.trim() } } : {}),
                  },
                  {
                    onSuccess: () => {
                      toast.success("Device suspended");
                      setSuspendDevice(null);
                      setSuspendReason("");
                    },
                    onError: error => toast.error(error.message),
                  },
                );
              }}
            >
              {suspendMutation.isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : null}
              Suspend Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TRU-FE-5 § 7 — Reinstate a suspended device. ⚠️ The device returns
          assignable, NOT assigned — its vehicle link was released on suspension
          and may since have been taken by another device. The copy below says so. */}
      <Dialog
        open={!!reinstateDevice}
        onOpenChange={(open) => {
          if (!open && !reinstateMutation.isPending)
            setReinstateDevice(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reinstate Device</DialogTitle>
            <DialogDescription>
              This brings
              {" "}
              {reinstateDevice?.manufacturer}
              {" "}
              {reinstateDevice?.model}
              {" "}
              (IMEI
              {" "}
              {reinstateDevice?.imei}
              ) back into service. Note: the device returns as
              {" "}
              <strong>assignable</strong>
              {" "}
              — its previous vehicle assignment was released when it was suspended and is not automatically restored.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReinstateDevice(null)}
              disabled={reinstateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={reinstateMutation.isPending}
              onClick={() => {
                if (!reinstateDevice)
                  return;
                reinstateMutation.mutate(
                  { id: reinstateDevice.id },
                  {
                    onSuccess: () => {
                      toast.success("Device reinstated");
                      setReinstateDevice(null);
                    },
                    onError: error => toast.error(error.message),
                  },
                );
              }}
            >
              {reinstateMutation.isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : null}
              Reinstate Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
