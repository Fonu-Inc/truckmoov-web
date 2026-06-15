import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSystemDeviceSetupRequestsExportQueryOptions,
  getSystemDeviceSetupRequestsQueryOptions,
} from "@truckmoov/api/auth";
import type { SystemDeviceSetupRequest, SystemDeviceSetupRequestsQuery } from "@truckmoov/api/auth";
import { format } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
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

type DeviceSetupStatus = "pending_review" | "in_progress" | "assigned";
type DeviceSetupRow = SystemDeviceSetupRequest & {
  connectionType: string;
  requesterName: string;
  needsSim: boolean;
  vehiclePlate: string;
};

const STATUS_CONFIG: Record<DeviceSetupStatus, { label: string; className: string }> = {
  pending_review: { label: "Pending Review", className: "border-transparent bg-secondary text-secondary-foreground" },
  in_progress: { label: "In Progress", className: "border-transparent bg-primary text-primary-foreground" },
  assigned: { label: "Assigned", className: "border-transparent bg-primary text-primary-foreground" },
};

const CONNECTION_LABELS: Record<string, string> = {
  hardwired: "Hardwired",
  obd: "OBD-II",
  obd2: "OBD-II",
  battery: "Battery",
};

const statusOptions: { value: "all" | DeviceSetupStatus; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "pending_review", label: "Pending Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "assigned", label: "Assigned" },
];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (source: Record<string, unknown> | null, key: string): string | undefined => {
  const value = source?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
};

const readBoolean = (source: Record<string, unknown> | null, key: string): boolean => {
  const value = source?.[key];
  return typeof value === "boolean" ? value : false;
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);

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
    id: readString(raw, "id") ?? "",
    imei: readString(raw, "imei") ?? "",
    manufacturer: readString(raw, "manufacturer") ?? "",
    model: readString(raw, "model") ?? "",
    connectionType: readString(raw, "connectionType") ?? readString(raw, "trackerType") ?? "",
    requesterName: readString(raw, "requesterName") ?? readString(raw, "requester_name") ?? "",
    needsSim: readBoolean(raw, "needsSim") || readBoolean(raw, "needs_sim"),
    vehiclePlate: readString(raw, "vehiclePlate") ?? readString(raw, "vehicle_plate") ?? "",
    location: readString(raw, "location") ?? "",
    tenantId: readString(raw, "tenantId") ?? "",
    status: readString(raw, "status") ?? "pending_review",
    assignedTo: readString(raw, "assignedTo") ?? readString(raw, "assigned_to"),
    notes: readString(raw, "notes") ?? readString(raw, "requesterNotes") ?? readString(raw, "requester_notes"),
    createdAt: readString(raw, "createdAt") ?? new Date().toISOString(),
    updatedAt: readString(raw, "updatedAt") ?? new Date().toISOString(),
  };
}

function extractRequests(response: unknown): DeviceSetupRow[] {
  const root = asRecord(response);
  const data = root?.data;
  const dataRecord = asRecord(data);
  const candidates = Array.isArray(data)
    ? data
    : dataRecord
      ? [dataRecord.requests, dataRecord.items, dataRecord.rows, dataRecord.data].find(Array.isArray)
      : [];

  return (Array.isArray(candidates) ? candidates : [])
    .map(asRecord)
    .filter(Boolean)
    .map(normalizeRequest)
    .filter((request) => request.id);
}

const formatDate = (value: string, pattern: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : format(date, pattern);
};

export function DeviceSetupRequestsQueue() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [pendingDeviceFilter, setPendingDeviceFilter] = useState("all");
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);
  const [pendingDateFilterEnabled, setPendingDateFilterEnabled] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DeviceSetupRow | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 350);

  const queryPayload = useMemo<SystemDeviceSetupRequestsQuery>(() => {
    const params: NonNullable<SystemDeviceSetupRequestsQuery["params"]> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (status !== "all") params.status = status;
    return { params };
  }, [debouncedSearch, status]);

  const requestsQuery = useQuery(getSystemDeviceSetupRequestsQueryOptions(queryPayload));
  const requests = useMemo(() => extractRequests(requestsQuery.data), [requestsQuery.data]);
  const deviceOptions = useMemo(
    () => Array.from(new Set(requests.map((request) => request.manufacturer).filter(Boolean))).sort(),
    [requests],
  );

  const visibleRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesDevice = deviceFilter === "all" || request.manufacturer === deviceFilter;
      return matchesDevice;
    });
  }, [deviceFilter, requests]);

  const activeFilterCount = (deviceFilter !== "all" ? 1 : 0) + (dateFilterEnabled ? 1 : 0);

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemDeviceSetupRequestsExportQueryOptions(queryPayload));
      downloadBlob(blob, "device-setup-requests.csv");
      toast.success("Device setup requests exported");
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }

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
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by IMEI, manufacturer, requester..."
                className="h-10 bg-transparent pl-10"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 lg:w-56">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover
              open={filterOpen}
              onOpenChange={(open) => {
                setFilterOpen(open);
                if (open) {
                  setPendingDeviceFilter(deviceFilter);
                  setPendingDateFilterEnabled(dateFilterEnabled);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 font-semibold">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-4">
                <p className="text-sm font-semibold">Only show requests by...</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="device-setup-date-filter"
                      checked={pendingDateFilterEnabled}
                      onCheckedChange={(checked) => setPendingDateFilterEnabled(checked === true)}
                    />
                    <Label htmlFor="device-setup-date-filter" className="font-medium">
                      Date Range
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" disabled className="justify-start text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      From
                    </Button>
                    <Button variant="outline" size="sm" disabled className="justify-start text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      To
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="device-setup-device-filter"
                      checked={pendingDeviceFilter !== "all"}
                      onCheckedChange={(checked) => setPendingDeviceFilter(checked === true ? pendingDeviceFilter : "all")}
                    />
                    <Label htmlFor="device-setup-device-filter" className="font-medium">
                      Device
                    </Label>
                  </div>
                  <Select value={pendingDeviceFilter} onValueChange={setPendingDeviceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All devices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All devices</SelectItem>
                      {deviceOptions.map((device) => (
                        <SelectItem key={device} value={device}>
                          {device}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    size="sm"
                    className="font-semibold"
                    onClick={() => {
                      setDeviceFilter(pendingDeviceFilter);
                      setDateFilterEnabled(pendingDateFilterEnabled);
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
                      setDeviceFilter("all");
                      setPendingDeviceFilter("all");
                      setDateFilterEnabled(false);
                      setPendingDateFilterEnabled(false);
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
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Device</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestsQuery.isLoading || requestsQuery.isFetching || requestsQuery.isError || visibleRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="py-12 text-center">
                        {requestsQuery.isLoading || requestsQuery.isFetching ? (
                          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-muted-foreground" />
                        ) : (
                          <Cpu className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                        )}
                        <p className="font-medium">
                          {requestsQuery.isLoading || requestsQuery.isFetching
                            ? "Loading device setup requests"
                            : "No device setup requests found"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {requestsQuery.isError ? "Unable to load requests right now" : "Try adjusting your search or filters"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRequests.map((request) => {
                    const statusConfig =
                      STATUS_CONFIG[request.status as DeviceSetupStatus] ?? STATUS_CONFIG.pending_review;
                    return (
                      <TableRow key={request.id} className="h-[86px]">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">
                              {[request.manufacturer, request.model].filter(Boolean).join(" ")}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">{request.imei}</p>
                            <Badge variant="outline" className="text-xs">
                              {CONNECTION_LABELS[request.connectionType] ?? request.connectionType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{request.requesterName || "-"}</p>
                            {request.needsSim && (
                              <Badge variant="secondary" className="text-xs">
                                Needs SIM
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{request.vehiclePlate || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {request.location || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            <p>{formatDate(request.createdAt, "dd MMM yyyy")}</p>
                            <div className="mt-1 flex items-center gap-1 text-xs">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(request.updatedAt, "dd MMM")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedRequest(request)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Assign to Me
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled className="text-destructive">
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
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
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription className="sr-only">Device setup request details</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
                <DetailItem label="Manufacturer" value={selectedRequest.manufacturer} />
                <DetailItem label="Model" value={selectedRequest.model} />
                <DetailItem label="IMEI" value={selectedRequest.imei} mono />
                <DetailItem
                  label="Tracker Type"
                  value={CONNECTION_LABELS[selectedRequest.connectionType] ?? selectedRequest.connectionType}
                />
                <DetailItem label="Vehicle" value={selectedRequest.vehiclePlate} />
                <DetailItem label="Requester" value={selectedRequest.requesterName} />
              </div>
              <div className="border-t pt-4">
                <DetailItem label="Installation Location" value={selectedRequest.location} />
              </div>
              <DetailItem label="Preferred Date" value={formatDate(selectedRequest.updatedAt, "dd MMMM yyyy")} />
              {selectedRequest.needsSim && <Badge variant="secondary">SIM Requested</Badge>}
              <DetailItem label="Notes" value={selectedRequest.notes || "No notes provided."} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailItem({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono font-semibold" : "font-semibold"}>{value || "-"}</p>
    </div>
  );
}
