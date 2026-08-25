import type {
  SystemDeviceSetupRequest,
  SystemDeviceSetupRequestsQuery,
  SystemDeviceSetupStatus,
} from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemDeviceSetupRequestQueryOptions,
  getSystemDeviceSetupRequestsExportQueryOptions,
  getSystemDeviceSetupRequestsQueryOptions,
  useAssignSystemDeviceSetupRequest,
  useRejectSystemDeviceSetupRequest,
} from "@truckmoov/api/auth";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Calendar,
  Cpu,
  Download,
  Eye,
  Loader2,
  MapPin,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  UserPlus,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import * as z from "zod";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shadcn/data-table";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Textarea } from "@/components/shadcn/textarea";

type DeviceSetupRow = SystemDeviceSetupRequest & {
  connectionType: string;
  requesterName: string;
  needsSim: boolean;
  vehiclePlate: string;
};

type DeviceSetupFilterDraft = {
  status: {
    enabled: boolean;
    value: SystemDeviceSetupStatus;
  };
  manufacturer: {
    enabled: boolean;
    value: string;
  };
  createdAt: {
    enabled: boolean;
    from: string;
    to: string;
  };
};

const REJECT_DEVICE_SETUP_REQUEST_FORM_ID = "reject-device-setup-request-form";

const rejectRequestSchema = z.object({
  reason: z.string().trim().min(
    1,
    "Rejection reason is required.",
  ),
});

type RejectRequestFormValues = z.infer<typeof rejectRequestSchema>;

const emptyFilters: DeviceSetupFilterDraft = {
  status: {
    enabled: false,
    value: "pending_review",
  },
  manufacturer: {
    enabled: false,
    value: "",
  },
  createdAt: {
    enabled: false,
    from: "",
    to: "",
  },
};

const STATUS_CONFIG: Record<SystemDeviceSetupStatus, {
  label: string;
  className: string;
}> = {
  pending_review: {
    label: "Pending Review",
    className: "border-transparent bg-secondary text-secondary-foreground",
  },
  in_progress: {
    label: "In Progress",
    className: "border-transparent bg-primary text-primary-foreground",
  },
  assigned: {
    label: "Assigned",
    className: "border-transparent bg-primary text-primary-foreground",
  },
  rejected: {
    label: "Rejected",
    className: "border-transparent bg-destructive text-destructive-foreground",
  },
};

const CONNECTION_LABELS: Record<string, string> = {
  hardwired: "Hardwired",
  obd: "OBD-II",
  obd2: "OBD-II",
  battery: "Battery",
};

const statusOptions: {
  value: SystemDeviceSetupStatus;
  label: string;
}[] = [
  {
    value: "pending_review",
    label: "Pending Review",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "assigned",
    label: "Assigned",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readString(source: Record<string, unknown> | null, key: string): string | undefined {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readBoolean(source: Record<string, unknown> | null, key: string): boolean {
  const value = source?.[key];
  return typeof value === "boolean" ? value : false;
}

function cloneFilters(filters: DeviceSetupFilterDraft): DeviceSetupFilterDraft {
  return {
    status: { ...filters.status },
    manufacturer: { ...filters.manufacturer },
    createdAt: { ...filters.createdAt },
  };
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [
    debounced,
    setDebounced,
  ] = useState(value);

  useEffect(
    () => {
      const timeout = window.setTimeout(
        setDebounced,
        delayMs,
        value,
      );
      return () => window.clearTimeout(timeout);
    },
    [
      delayMs,
      value,
    ],
  );

  return debounced;
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

function normalizeRequest(raw: Record<string, unknown>): DeviceSetupRow {
  return {
    id: readString(
      raw,
      "id",
    ) ?? "",
    imei: readString(
      raw,
      "imei",
    ) ?? "",
    manufacturer: readString(
      raw,
      "manufacturer",
    ) ?? "",
    model: readString(
      raw,
      "model",
    ) ?? "",
    connectionType: readString(
      raw,
      "connectionType",
    ) ?? readString(
      raw,
      "trackerType",
    ) ?? "",
    requesterName: readString(
      raw,
      "requesterName",
    ) ?? readString(
      raw,
      "requester_name",
    ) ?? "",
    needsSim: readBoolean(
      raw,
      "needsSim",
    ) || readBoolean(
      raw,
      "needs_sim",
    ),
    vehiclePlate: readString(
      raw,
      "vehiclePlate",
    ) ?? readString(
      raw,
      "vehicle_plate",
    ) ?? "",
    location: readString(
      raw,
      "location",
    ) ?? "",
    tenantId: readString(
      raw,
      "tenantId",
    ) ?? readString(
      raw,
      "tenant_id",
    ) ?? "",
    status: readString(
      raw,
      "status",
    ) ?? "pending_review",
    assignedTo: readString(
      raw,
      "assignedTo",
    ) ?? readString(
      raw,
      "assigned_to",
    ),
    notes: readString(
      raw,
      "notes",
    ) ?? readString(
      raw,
      "requesterNotes",
    ) ?? readString(
      raw,
      "requester_notes",
    ),
    preferredInstallDate:
      readString(
        raw,
        "preferredInstallDate",
      ) ?? readString(
        raw,
        "preferred_install_date",
      ) ?? readString(
        raw,
        "preferredDate",
      ),
    rejectedReason: readString(
      raw,
      "rejectedReason",
    ) ?? readString(
      raw,
      "rejected_reason",
    ),
    createdAt: readString(
      raw,
      "createdAt",
    ) ?? readString(
      raw,
      "created_at",
    ) ?? new Date().toISOString(),
    updatedAt: readString(
      raw,
      "updatedAt",
    ) ?? readString(
      raw,
      "updated_at",
    ) ?? new Date().toISOString(),
  };
}

function extractRequests(response: unknown): DeviceSetupRow[] {
  const root = asRecord(response);
  const data = root?.data;
  const dataRecord = asRecord(data);
  const candidates = Array.isArray(data)
    ? data
    : dataRecord
      ? [
          dataRecord.requests,
          dataRecord.items,
          dataRecord.rows,
          dataRecord.data,
        ].find(Array.isArray)
      : [];

  return (Array.isArray(candidates) ? candidates : [])
    .map(asRecord)
    .filter(Boolean)
    .map(normalizeRequest)
    .filter(request => request.id);
}

function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DeviceSetupRequestsQueue() {
  const queryClient = useQueryClient();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);
  const [
    filterDraft,
    setFilterDraft,
  ] = useState<DeviceSetupFilterDraft>(() => cloneFilters(emptyFilters));
  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState<DeviceSetupFilterDraft>(() => cloneFilters(emptyFilters));
  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState<DeviceSetupRow | null>(null);
  const [
    selectedRejectRequest,
    setSelectedRejectRequest,
  ] = useState<DeviceSetupRow | null>(null);
  const [
    assigningRequestId,
    setAssigningRequestId,
  ] = useState<string | null>(null);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const debouncedSearch = useDebouncedValue(
    search.trim(),
    350,
  );

  const assignRequest = useAssignSystemDeviceSetupRequest();
  const rejectRequest = useRejectSystemDeviceSetupRequest();
  const rejectForm = useForm<RejectRequestFormValues>({
    resolver: zodResolver(rejectRequestSchema),
    defaultValues: { reason: "" },
  });

  const queryPayload = useMemo<SystemDeviceSetupRequestsQuery>(
    () => {
      const params: NonNullable<SystemDeviceSetupRequestsQuery["params"]> = {};
      const manufacturer = appliedFilters.manufacturer.value.trim();

      if (debouncedSearch)
        params.search = debouncedSearch;
      if (appliedFilters.status.enabled)
        params.status = appliedFilters.status.value;
      if (appliedFilters.manufacturer.enabled && manufacturer)
        params.manufacturer = manufacturer;
      if (appliedFilters.createdAt.enabled && appliedFilters.createdAt.from)
        params.dateFrom = appliedFilters.createdAt.from;
      if (appliedFilters.createdAt.enabled && appliedFilters.createdAt.to)
        params.dateTo = appliedFilters.createdAt.to;

      return { params };
    },
    [
      appliedFilters,
      debouncedSearch,
    ],
  );

  const requestsQuery = useQuery(getSystemDeviceSetupRequestsQueryOptions(queryPayload));
  const selectedRequestDetailQuery = useQuery({
    ...getSystemDeviceSetupRequestQueryOptions(selectedRequest?.id ?? ""),
    enabled: Boolean(selectedRequest?.id),
  });

  const requests = useMemo(
    () => extractRequests(requestsQuery.data),
    [requestsQuery.data],
  );
  const detailRequest = useMemo(
    () => {
      const detailRecord = asRecord(selectedRequestDetailQuery.data?.data);
      return detailRecord ? normalizeRequest(detailRecord) : selectedRequest;
    },
    [
      selectedRequest,
      selectedRequestDetailQuery.data,
    ],
  );

  const activeFilterCount = useMemo(
    () => {
      let count = 0;
      if (appliedFilters.status.enabled)
        count += 1;
      if (appliedFilters.manufacturer.enabled && appliedFilters.manufacturer.value.trim())
        count += 1;
      if (appliedFilters.createdAt.enabled && (appliedFilters.createdAt.from || appliedFilters.createdAt.to))
        count += 1;
      return count;
    },
    [appliedFilters],
  );

  function closeRejectDialog() {
    setSelectedRejectRequest(null);
    rejectForm.reset();
  }

  function handleAssign(request: DeviceSetupRow) {
    setAssigningRequestId(request.id);
    assignRequest.mutate(
      { id: request.id },
      {
        onSuccess: () => toast.success("Device setup request assigned"),
        onError: error => toast.error(error.message),
        onSettled: () => setAssigningRequestId(null),
      },
    );
  }

  function handleRejectSubmit(values: RejectRequestFormValues) {
    if (!selectedRejectRequest)
      return;

    rejectRequest.mutate(
      {
        id: selectedRejectRequest.id,
        data: { reason: values.reason.trim() },
      },
      {
        onSuccess: () => {
          toast.success("Device setup request rejected");
          closeRejectDialog();
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemDeviceSetupRequestsExportQueryOptions(queryPayload));
      downloadBlob(
        blob,
        "device-setup-requests.csv",
      );
      toast.success("Device setup requests exported");
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  }

  const requestColumns: ColumnDef<DeviceSetupRow>[] = [
    {
      id: "device",
      header: "Device",
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div className="space-y-1">
            <p className="font-semibold">
              {[
                request.manufacturer,
                request.model,
              ].filter(Boolean).join(" ")}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{request.imei}</p>
            <Badge
              variant="outline"
              className="text-xs"
            >
              {CONNECTION_LABELS[request.connectionType] ?? request.connectionType}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "requester",
      header: "Requester",
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div className="space-y-1">
            <p className="font-semibold">{request.requesterName || "-"}</p>
            {request.needsSim && (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                Needs SIM
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "vehiclePlate",
      header: "Vehicle",
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.vehiclePlate || "-"}</span>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {row.original.location || "-"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusConfig
          = STATUS_CONFIG[row.original.status as SystemDeviceSetupStatus] ?? {
            label: formatStatusLabel(row.original.status),
            className: "border-transparent bg-secondary text-secondary-foreground",
          };
        return (
          <Badge
            variant="outline"
            className={statusConfig.className}
          >
            {statusConfig.label}
          </Badge>
        );
      },
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          <p>
            {formatWithPattern(
              row.original.createdAt,
              "dd MMM yyyy",
            )}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            {formatWithPattern(
              row.original.updatedAt,
              "dd MMM",
            )}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-16" },
      cell: ({ row }) => {
        const request = row.original;
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
              <DropdownMenuItem onClick={() => setSelectedRequest(request)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={assignRequest.isPending || rejectRequest.isPending}
                onClick={() => handleAssign(request)}
              >
                {assigningRequestId === request.id
                  ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )
                  : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                Assign to Me
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={rejectRequest.isPending || assignRequest.isPending}
                className="text-destructive"
                onClick={() => setSelectedRejectRequest(request)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Device Setup Requests
            </CardTitle>
            <CardDescription>Incoming requests to provision and configure new IoT devices for vehicles.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={requestsQuery.isLoading || isExporting}
            className="bg-transparent"
          >
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export Data
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search by IMEI, manufacturer, requester..."
                className="h-10 bg-transparent pl-10"
              />
            </div>
            <Popover
              open={filterOpen}
              onOpenChange={(open) => {
                setFilterOpen(open);
                if (open)
                  setFilterDraft(cloneFilters(appliedFilters));
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 font-semibold"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-1.5"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 space-y-4"
              >
                <p className="text-sm font-semibold">Only show requests by...</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="device-setup-status-filter"
                      checked={filterDraft.status.enabled}
                      onCheckedChange={checked =>
                        setFilterDraft(current => ({
                          ...current,
                          status: {
                            ...current.status,
                            enabled: checked === true,
                          },
                        }))}
                    />
                    <Label
                      htmlFor="device-setup-status-filter"
                      className="font-medium"
                    >
                      Status
                    </Label>
                  </div>
                  <Select
                    value={filterDraft.status.value}
                    disabled={!filterDraft.status.enabled}
                    onValueChange={value =>
                      setFilterDraft(current => ({
                        ...current,
                        status: {
                          ...current.status,
                          value: value as SystemDeviceSetupStatus,
                        },
                      }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="device-setup-manufacturer-filter"
                      checked={filterDraft.manufacturer.enabled}
                      onCheckedChange={checked =>
                        setFilterDraft(current => ({
                          ...current,
                          manufacturer: {
                            ...current.manufacturer,
                            enabled: checked === true,
                          },
                        }))}
                    />
                    <Label
                      htmlFor="device-setup-manufacturer-filter"
                      className="font-medium"
                    >
                      Manufacturer
                    </Label>
                  </div>
                  <Input
                    value={filterDraft.manufacturer.value}
                    disabled={!filterDraft.manufacturer.enabled}
                    onChange={event =>
                      setFilterDraft(current => ({
                        ...current,
                        manufacturer: {
                          ...current.manufacturer,
                          value: event.target.value,
                        },
                      }))}
                    placeholder="Enter manufacturer"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="device-setup-date-filter"
                      checked={filterDraft.createdAt.enabled}
                      onCheckedChange={checked =>
                        setFilterDraft(current => ({
                          ...current,
                          createdAt: {
                            ...current.createdAt,
                            enabled: checked === true,
                          },
                        }))}
                    />
                    <Label
                      htmlFor="device-setup-date-filter"
                      className="font-medium"
                    >
                      Date Range
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={filterDraft.createdAt.from}
                      disabled={!filterDraft.createdAt.enabled}
                      onChange={event =>
                        setFilterDraft(current => ({
                          ...current,
                          createdAt: {
                            ...current.createdAt,
                            from: event.target.value,
                          },
                        }))}
                      className="h-9 text-sm"
                    />
                    <Input
                      type="date"
                      value={filterDraft.createdAt.to}
                      disabled={!filterDraft.createdAt.enabled}
                      onChange={event =>
                        setFilterDraft(current => ({
                          ...current,
                          createdAt: {
                            ...current.createdAt,
                            to: event.target.value,
                          },
                        }))}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    size="sm"
                    className="font-semibold"
                    onClick={() => {
                      setAppliedFilters(cloneFilters(filterDraft));
                      setFilterOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-semibold"
                    onClick={() => {
                      const next = cloneFilters(emptyFilters);
                      setFilterDraft(next);
                      setAppliedFilters(next);
                      setFilterOpen(false);
                    }}
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="overflow-hidden rounded-md border">
            <DataTable
              columns={requestColumns}
              data={requests}
              isLoading={requestsQuery.isLoading}
              isError={requestsQuery.isError}
              errorMessage="Unable to load setup requests."
              onRetry={() => requestsQuery.refetch()}
              hasActiveFilters={!!debouncedSearch || activeFilterCount > 0}
              emptyState={
                <div>
                  <Cpu className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No device setup requests found</p>
                  <p className="text-sm text-muted-foreground">New requests will appear here.</p>
                </div>
              }
              filteredEmptyState={
                <div>
                  <Cpu className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No device setup requests found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
              }
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedRequest}
        onOpenChange={open => !open && setSelectedRequest(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription className="sr-only">Device setup request details</DialogDescription>
          </DialogHeader>
          {detailRequest && (
            <div className="space-y-5">
              {selectedRequestDetailQuery.isLoading && (
                <Skeleton className="h-4 w-56" />
              )}
              {selectedRequestDetailQuery.isError && (
                <div className="rounded-lg border border-border/50 bg-card/50 py-4 text-center">
                  <p className="text-destructive">Unable to load latest request details.</p>
                  <Button
                    variant="link"
                    className="mt-1"
                    onClick={() => selectedRequestDetailQuery.refetch()}
                  >
                    Try again
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
                <DetailItem
                  label="Manufacturer"
                  value={detailRequest.manufacturer}
                />
                <DetailItem
                  label="Model"
                  value={detailRequest.model}
                />
                <DetailItem
                  label="IMEI"
                  value={detailRequest.imei}
                  mono
                />
                <DetailItem
                  label="Tracker Type"
                  value={CONNECTION_LABELS[detailRequest.connectionType] ?? detailRequest.connectionType}
                />
                <DetailItem
                  label="Vehicle"
                  value={detailRequest.vehiclePlate}
                />
                <DetailItem
                  label="Requester"
                  value={detailRequest.requesterName}
                />
              </div>
              <div className="border-t pt-4">
                <DetailItem
                  label="Installation Location"
                  value={detailRequest.location}
                />
              </div>
              <DetailItem
                label="Preferred Date"
                value={formatWithPattern(
                  detailRequest.preferredInstallDate ?? detailRequest.updatedAt,
                  "dd MMMM yyyy",
                )}
              />
              {detailRequest.needsSim && <Badge variant="secondary">SIM Requested</Badge>}
              <DetailItem
                label="Notes"
                value={detailRequest.notes || "No notes provided."}
              />
              {detailRequest.rejectedReason && (
                <DetailItem
                  label="Rejection Reason"
                  value={detailRequest.rejectedReason}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedRejectRequest}
        onOpenChange={(open) => {
          if (!open && !rejectRequest.isPending)
            closeRejectDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Device Setup Request</DialogTitle>
            <DialogDescription>Provide a reason before rejecting this device setup request.</DialogDescription>
          </DialogHeader>

          <Form {...rejectForm}>
            <form
              id={REJECT_DEVICE_SETUP_REQUEST_FORM_ID}
              onSubmit={rejectForm.handleSubmit(handleRejectSubmit)}
              className="space-y-4"
            >
              <FormField
                control={rejectForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Explain why this request is being rejected."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeRejectDialog}
              disabled={rejectRequest.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={REJECT_DEVICE_SETUP_REQUEST_FORM_ID}
              variant="destructive"
              loading={rejectRequest.isPending}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailItem({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono font-semibold" : "font-semibold"}>{value || "-"}</p>
    </div>
  );
}
