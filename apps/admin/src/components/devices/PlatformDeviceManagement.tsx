import type { ColumnDef } from "@tanstack/react-table";
import type {
  SystemDeviceInventoryItem,
  SystemDevicesQuery,
  SystemSimItem,
} from "@truckmoov/api/auth";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemDevicesExportQueryOptions,
  getSystemDevicesQueryOptions,
  getSystemDevicesSummaryQueryOptions,
  getSystemSimsQueryOptions,
  useReinstateSystemDevice,
} from "@truckmoov/api/auth";
import {
  Building2,
  CheckCircle,
  Cpu,
  Download,
  Eye,
  MoreHorizontal,
  Search,
  Signal,
  SignalLow,
  SignalZero,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";
import { deviceActionError } from "./management/deviceActionError";
import { DeviceDetailSheet } from "./management/DeviceDetailSheet";
import { DeviceFilterPopover } from "./management/DeviceFilterPopover";
import {
  emptyFilters,
  formatLastSeen,
  matchesFilters,
  normalizeDeviceStatus,
  statusClasses,
  statusLabels,
  statusOptions,
} from "./management/deviceStatus";
import { SuspendDeviceDialog } from "./management/SuspendDeviceDialog";

function SignalCell({ device }: { device: SystemDeviceInventoryItem }) {
  const strength = device.signalStrength;
  const bucket = normalizeDeviceStatus(device);
  const online = bucket === "active" || bucket === "assigned";
  if (!online || !strength)
    return <SignalZero className="h-4 w-4 text-muted-foreground" />;
  const Icon = strength >= 70 ? Signal : strength >= 30 ? SignalLow : SignalZero;
  const tone = strength >= 70 ? "text-success" : strength >= 30 ? "text-warning" : "text-destructive";
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${tone}`} />
      <span className="text-sm">{`${strength}%`}</span>
    </div>
  );
}

function SimCell({ sim }: { sim: SystemSimItem | undefined }) {
  if (!sim)
    return <span className="text-xs text-muted-foreground">No SIM linked</span>;
  return (
    <div>
      <p className="font-mono text-xs">{sim.iccid}</p>
      <p className="text-xs text-muted-foreground">
        {[
          sim.msisdn,
          sim.carrier,
        ].filter(Boolean).join(" · ") || "—"}
      </p>
    </div>
  );
}

export function PlatformDeviceManagement() {
  const queryClient = useQueryClient();
  const {
    confirm, confirmDialog,
  } = useConfirmAction();
  const reinstateMutation = useReinstateSystemDevice();
  const [
    selectedDevice,
    setSelectedDevice,
  ] = useState<SystemDeviceInventoryItem | null>(null);
  const [
    suspendDevice,
    setSuspendDevice,
  ] = useState<SystemDeviceInventoryItem | null>(null);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    filters,
    setFilters,
  ] = useState(emptyFilters);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

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

  const queryPayload = useMemo<SystemDevicesQuery>(
    () => ({ params: debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {} }),
    [debouncedSearch],
  );
  const summaryQuery = useQuery(getSystemDevicesSummaryQueryOptions());
  const devicesQuery = useQuery(getSystemDevicesQueryOptions(queryPayload));
  const simsQuery = useQuery(getSystemSimsQueryOptions());

  const allDevices = useMemo(
    () => devicesQuery.data?.data?.devices ?? [],
    [devicesQuery.data],
  );
  const devices = useMemo(
    () => allDevices.filter(device => matchesFilters(
      device,
      statusFilter,
      filters,
    )),
    [
      allDevices,
      statusFilter,
      filters,
    ],
  );
  const simByDevice = useMemo(
    () => {
      const map = new Map<string, SystemSimItem>();
      for (const sim of simsQuery.data?.data?.sims ?? []) {
        if (sim.deviceId) {
          map.set(
            sim.deviceId,
            sim,
          );
        }
      }
      return map;
    },
    [simsQuery.data],
  );
  const tenants = useMemo(
    () => [...new Set(allDevices.filter(device => !!device.tenantId).map(device => device.tenantName).filter((name): name is string => !!name))],
    [allDevices],
  );
  const manufacturers = useMemo(
    () => [...new Set(allDevices.map(device => device.manufacturer))],
    [allDevices],
  );

  const summary = summaryQuery.data?.data;
  const summaryCards = [
    {
      label: "All Devices",
      value: summary?.totalDevices,
      className: "",
    },
    {
      label: "Active",
      value: summary?.activeDevices,
      className: "text-success",
    },
    {
      label: "Inactive",
      value: summary?.inactiveDevices,
      className: "text-muted-foreground",
    },
    {
      label: "Assigned",
      value: summary?.assignedDevices,
      className: "text-primary",
    },
    {
      label: "Unassigned",
      value: summary?.unassignedDevices,
      className: "text-warning",
    },
    {
      label: "Configured",
      value: summary?.configuredDevices,
      className: "text-info",
    },
    {
      label: "Registered",
      value: summary?.registeredDevices,
      className: "text-muted-foreground",
    },
    {
      label: "Unregistered",
      value: summary?.unregisteredDevices,
      className: "text-muted-foreground",
    },
  ];
  const hasActiveFilters = !!debouncedSearch.trim()
    || statusFilter !== "all"
    || Object.values(filters).some(filter => filter.enabled);

  const confirmReinstate = (device: SystemDeviceInventoryItem) => confirm({
    title: "Reinstate Device",
    description: `This brings ${device.manufacturer} ${device.model} (IMEI ${device.imei}) back into service. The device returns as assignable. Its previous vehicle assignment was released when it was suspended and is not restored.`,
    confirmLabel: "Reinstate Device",
    destructive: false,
    onConfirm: () => reinstateMutation.mutateAsync({ id: device.id }).then(
      () => {
        toast.success("Device reinstated");
      },
      deviceActionError,
    ),
  });

  const columns: ColumnDef<SystemDeviceInventoryItem>[] = [
    {
      accessorKey: "imei",
      header: "IMEI",
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.imei}</span>,
    },
    {
      id: "manufacturer",
      header: "Manufacturer / Model",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.manufacturer}</p>
          {row.original.model && <p className="text-xs text-muted-foreground">{row.original.model}</p>}
        </div>
      ),
    },
    {
      accessorKey: "tenantName",
      header: "Tenant",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {row.original.tenantId
            ? (
                <span
                  className="text-sm truncate max-w-[150px]"
                  title={row.original.tenantName ?? row.original.tenantId}
                >
                  {row.original.tenantName ?? "Unknown tenant"}
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
      ),
    },
    {
      id: "sim",
      header: "SIM Card",
      cell: ({ row }) => <SimCell sim={simByDevice.get(row.original.id)} />,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const bucket = normalizeDeviceStatus(row.original);
        return <Badge className={statusClasses[bucket]}>{statusLabels[bucket]}</Badge>;
      },
    },
    {
      accessorKey: "signalStrength",
      header: "Signal",
      cell: ({ row }) => <SignalCell device={row.original} />,
    },
    {
      accessorKey: "lastSeen",
      header: "Last Seen",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatLastSeen(row.original.lastSeen)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-[50px]" },
      cell: ({ row }) => {
        const device = row.original;
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
              <DropdownMenuSeparator />
              {isSuspended
                ? (
                    <DropdownMenuItem
                      className="text-success"
                      onClick={() => confirmReinstate(device)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Reactivate
                    </DropdownMenuItem>
                  )
                : device.lifecycleStatus !== "decommissioned" && (
                  <DropdownMenuItem
                    className="text-warning"
                    onClick={() => setSuspendDevice(device)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Suspend Device
                  </DropdownMenuItem>
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
      const blob = await queryClient.fetchQuery(getSystemDevicesExportQueryOptions(queryPayload));
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "devices.csv";
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
            <CardDescription>
              Platform-wide device overview and management
            </CardDescription>
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
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-4">
                {summaryCards.map(card => (
                  <div
                    key={card.label}
                    className="rounded-lg border bg-card p-3"
                  >
                    {summaryQuery.isLoading
                      ? <Skeleton className="h-8 w-16" />
                      : <p className={`text-2xl font-bold ${card.className}`}>{card.value ?? "N/A"}</p>}
                    <p className="text-xs text-muted-foreground">{card.label}</p>
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
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(status => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DeviceFilterPopover
            value={filters}
            tenants={tenants}
            manufacturers={manufacturers}
            onApply={setFilters}
          />
        </div>

        <div className="overflow-hidden rounded-lg border">
          <DataTable
            columns={columns}
            data={devices}
            isLoading={devicesQuery.isLoading}
            isError={devicesQuery.isError}
            errorMessage="Unable to load devices."
            onRetry={() => devicesQuery.refetch()}
            hasActiveFilters={hasActiveFilters}
            emptyState="No devices registered across tenants."
            filteredEmptyState="No devices match your filters."
          />
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Platform Admin View:</strong>
            {" This is an inventory view. Devices and SIM cards are assigned automatically by the system — platform admins can view details and suspend or reinstate a device. Use the Device Catalog tab to manage supported manufacturers and models."}
          </p>
        </div>
      </CardContent>

      <DeviceDetailSheet
        device={selectedDevice}
        sim={selectedDevice ? simByDevice.get(selectedDevice.id) : undefined}
        onClose={() => setSelectedDevice(null)}
      />
      <SuspendDeviceDialog
        device={suspendDevice}
        onClose={() => setSuspendDevice(null)}
      />
      {confirmDialog}
    </Card>
  );
}
