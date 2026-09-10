import type { ColumnDef } from "@tanstack/react-table";
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
  useApproveSystemDeviceSetupRequest,
  useAssignSystemDeviceSetupRequest,
  useRejectSystemDeviceSetupRequest,
  useSystemDeviceSetupSummary,
} from "@truckmoov/api/auth";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Calendar,
  Boxes,
  CheckCircle2,
  Clock,
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
import { DataTable } from "@/components/shadcn/data-table";
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
import { Skeleton } from "@/components/shadcn/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import { Textarea } from "@/components/shadcn/textarea";

// TRU-FE-5 § 2 — reshaped per spec. `SystemDeviceSetupRequest` now carries all
// new fields directly; the row alias is kept for readability.
type DeviceSetupRow = SystemDeviceSetupRequest;

const TRACKER_TYPE_LABELS: Record<string, string> = {
  hardwired: "Hardwired",
  obd: "OBD-II",
  obd2: "OBD-II",
  asset: "Battery / Portable",
};

const KYC_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  verified: { label: "Verified", className: "border-transparent bg-success/15 text-success" },
  pending: { label: "KYC Pending", className: "border-transparent bg-warning/15 text-warning" },
  rejected: { label: "KYC Rejected", className: "border-transparent bg-destructive/15 text-destructive" },
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
  approved: {
    label: "Approved",
    className: "border-transparent bg-success/15 text-success",
  },
  in_progress: {
    label: "In Progress",
    className: "border-transparent bg-primary text-primary-foreground",
  },
  provisioned: {
    label: "Provisioned",
    className: "border-transparent bg-primary/15 text-primary",
  },
  assigned: {
    label: "Assigned",
    className: "border-transparent bg-primary text-primary-foreground",
  },
  rejected: {
    label: "Rejected",
    className: "border-transparent bg-destructive text-destructive-foreground",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-transparent bg-muted text-muted-foreground",
  },
};

const statusOptions: {
  value: SystemDeviceSetupStatus;
  label: string;
}[] = [
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "provisioned", label: "Provisioned" },
  { value: "assigned", label: "Assigned" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
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

// TRU-FE-5 § 2 — new payload shape. `?? null` on the string fields so the UI
// falls back to `tenantId` for organisation/email per spec.
function readOptionalString(source: Record<string, unknown> | null, key: string): string | null {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}
function readNumber(source: Record<string, unknown> | null, key: string): number {
  const value = source?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function readTimeline(raw: Record<string, unknown>): SystemDeviceSetupRequest["timeline"] {
  const value = raw.timeline;
  if (!Array.isArray(value))
    return [];
  return value
    .map(asRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map(entry => ({
      status: (readString(entry, "status") ?? "pending_review") as SystemDeviceSetupStatus,
      at: readString(entry, "at") ?? new Date().toISOString(),
      note: readOptionalString(entry, "note"),
    }));
}
function readKycStatus(raw: Record<string, unknown>): SystemDeviceSetupRequest["kycStatus"] {
  const value = raw.kycStatus;
  if (value === "verified" || value === "pending" || value === "rejected")
    return value;
  return null;
}

function normalizeRequest(raw: Record<string, unknown>): DeviceSetupRow {
  return {
    id: readString(raw, "id") ?? "",
    tenantId: readString(raw, "tenantId") ?? readString(raw, "tenant_id") ?? "",
    organisationName: readOptionalString(raw, "organisationName"),
    requestingEmail: readOptionalString(raw, "requestingEmail"),
    manufacturer: readString(raw, "manufacturer") ?? "",
    model: readString(raw, "model") ?? "",
    // Fall back to legacy `connectionType` so a mid-migration row doesn't render blank.
    trackerType: readString(raw, "trackerType") ?? readString(raw, "connectionType") ?? "",
    quantity: readNumber(raw, "quantity") || 1,
    simRequired: readBoolean(raw, "simRequired") || readBoolean(raw, "needsSim"),
    vehicleId: readOptionalString(raw, "vehicleId"),
    state: readOptionalString(raw, "state"),
    city: readOptionalString(raw, "city"),
    preferredInstallDate:
      readOptionalString(raw, "preferredInstallDate")
      ?? readOptionalString(raw, "preferred_install_date")
      ?? readOptionalString(raw, "preferredDate"),
    useCase: readOptionalString(raw, "useCase"),
    notes: readOptionalString(raw, "notes"),
    status: (readString(raw, "status") ?? "pending_review") as SystemDeviceSetupStatus,
    kycStatus: readKycStatus(raw),
    assignedTo: readOptionalString(raw, "assignedTo") ?? readOptionalString(raw, "assigned_to"),
    decidedBy: readOptionalString(raw, "decidedBy"),
    decidedAt: readOptionalString(raw, "decidedAt"),
    // decisionReason replaces rejectedReason (§ 2). Read the legacy key too.
    decisionReason: readOptionalString(raw, "decisionReason") ?? readOptionalString(raw, "rejectedReason"),
    timeline: readTimeline(raw),
    createdAt: readString(raw, "createdAt") ?? readString(raw, "created_at") ?? new Date().toISOString(),
    updatedAt: readString(raw, "updatedAt") ?? readString(raw, "updated_at") ?? new Date().toISOString(),
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
  const approveRequest = useApproveSystemDeviceSetupRequest();
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  // TRU-FE-5 § 3 — Approval Queue cards.
  const summaryQuery = useSystemDeviceSetupSummary();
  const summary = summaryQuery.data?.data;
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

  // TRU-FE-5 § 4 — Approve. Must precede Assign per § 6. Buttons disable on
  // decided requests, per the "don't rely on the 400" note in the spec.
  function handleApprove(request: DeviceSetupRow) {
    setApprovingRequestId(request.id);
    approveRequest.mutate(
      { id: request.id },
      {
        onSuccess: () => toast.success("Device setup request approved"),
        onError: error => toast.error(error.message),
        onSettled: () => setApprovingRequestId(null),
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
        const trackerLabel = TRACKER_TYPE_LABELS[request.trackerType] ?? request.trackerType;
        return (
          <div className="space-y-1">
            <p className="font-semibold">
              {[request.manufacturer, request.model].filter(Boolean).join(" ")}
            </p>
            <div className="flex items-center gap-1.5">
              {trackerLabel && (
                <Badge variant="outline" className="text-xs">
                  {trackerLabel}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                × {request.quantity}
              </span>
              {request.simRequired && (
                <Badge variant="secondary" className="text-xs">
                  SIM
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "organisation",
      header: "Organisation",
      cell: ({ row }) => {
        const request = row.original;
        // TRU-FE-5 § 2 — fall back to tenantId when organisation isn't populated.
        const primary = request.organisationName ?? request.tenantId;
        return (
          <div className="space-y-1">
            <p className="font-semibold">{primary}</p>
            {request.requestingEmail && (
              <p className="text-xs text-muted-foreground">{request.requestingEmail}</p>
            )}
          </div>
        );
      },
    },
    {
      id: "kyc",
      header: "KYC",
      cell: ({ row }) => {
        // TRU-FE-5 § 2 — null kycStatus is "unknown", NOT verified. Render neutral.
        const kyc = row.original.kycStatus;
        if (!kyc)
          return <span className="text-xs text-muted-foreground">Unknown</span>;
        const config = KYC_STATUS_CONFIG[kyc];
        return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
      },
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const parts = [row.original.city, row.original.state].filter(Boolean);
        return (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {parts.length ? parts.join(", ") : "-"}
          </div>
        );
      },
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
        // TRU-FE-5 § 4/§ 5/§ 6 — Approve only on pending_review; Assign only on approved.
        // Disable buttons once decided rather than relying on 400s.
        const isPending = request.status === "pending_review";
        const isApproved = request.status === "approved";
        const anyMutating = assignRequest.isPending || rejectRequest.isPending || approveRequest.isPending;
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
                disabled={!isPending || anyMutating}
                onClick={() => handleApprove(request)}
              >
                {approvingRequestId === request.id
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!isApproved || anyMutating}
                onClick={() => handleAssign(request)}
              >
                {assigningRequestId === request.id
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <UserPlus className="mr-2 h-4 w-4" />}
                Assign to Me
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!isPending || anyMutating}
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
      {/* TRU-FE-5 § 3 — Approval Queue cards. `devicesRequested` counts trackers, not requests. */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Pending Approval"
          icon={Clock}
          variant="warning"
          value={summary?.pendingApproval ?? 0}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          title="Approved"
          icon={CheckCircle2}
          variant="success"
          value={summary?.approved ?? 0}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          title="Rejected"
          icon={XCircle}
          variant="danger"
          value={summary?.rejected ?? 0}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          title="Total Devices Requested"
          icon={Boxes}
          value={summary?.devicesRequested ?? 0}
          loading={summaryQuery.isLoading}
        />
      </div>

      <Card className="mt-4">
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
                placeholder="Search by organisation, email, manufacturer, model or tenant id..."
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
              emptyState={(
                <div>
                  <Cpu className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No device setup requests found</p>
                  <p className="text-sm text-muted-foreground">New requests will appear here.</p>
                </div>
              )}
              filteredEmptyState={(
                <div>
                  <Cpu className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No device setup requests found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
              )}
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
                  label="Organisation"
                  value={detailRequest.organisationName ?? detailRequest.tenantId}
                />
                <DetailItem
                  label="Request Email"
                  value={detailRequest.requestingEmail ?? "-"}
                />
                <DetailItem
                  label="Manufacturer"
                  value={detailRequest.manufacturer}
                />
                <DetailItem
                  label="Model"
                  value={detailRequest.model}
                />
                <DetailItem
                  label="Tracker Type"
                  value={TRACKER_TYPE_LABELS[detailRequest.trackerType] ?? detailRequest.trackerType}
                />
                <DetailItem
                  label="Quantity"
                  value={String(detailRequest.quantity)}
                />
                <DetailItem
                  label="KYC"
                  value={detailRequest.kycStatus ? KYC_STATUS_CONFIG[detailRequest.kycStatus].label : "Unknown"}
                />
                <DetailItem
                  label="SIM Required"
                  value={detailRequest.simRequired ? "Yes" : "No"}
                />
              </div>
              <div className="border-t pt-4">
                <DetailItem
                  label="Installation Location"
                  value={[detailRequest.city, detailRequest.state].filter(Boolean).join(", ") || "-"}
                />
              </div>
              <DetailItem
                label="Preferred Date"
                value={detailRequest.preferredInstallDate
                  ? formatWithPattern(detailRequest.preferredInstallDate, "dd MMMM yyyy")
                  : "-"}
              />
              <DetailItem
                label="Use Case"
                value={detailRequest.useCase || "-"}
              />
              <DetailItem
                label="Notes"
                value={detailRequest.notes || "No notes provided."}
              />
              {detailRequest.decisionReason && (
                <DetailItem
                  label={detailRequest.status === "rejected" ? "Rejection Reason" : "Decision Note"}
                  value={detailRequest.decisionReason}
                />
              )}
              {/* TRU-FE-5 § 2 — timeline drives the audit trail below the details. */}
              {detailRequest.timeline.length > 0 && (
                <div className="border-t pt-4">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Timeline</p>
                  <ol className="space-y-2">
                    {detailRequest.timeline.map((entry, idx) => (
                      <li key={`${entry.status}-${entry.at}-${idx}`} className="flex items-start gap-2 text-xs">
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <div className="flex-1">
                          <p className="font-medium capitalize">
                            {entry.status.replace(/_/g, " ")}
                          </p>
                          {entry.note && <p className="text-muted-foreground">{entry.note}</p>}
                        </div>
                        <span className="text-muted-foreground">
                          {formatWithPattern(entry.at, "dd MMM yyyy HH:mm")}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
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
