import type { ColumnDef } from "@tanstack/react-table";
import {
  formatWithPattern, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  MapPin,
  MoreHorizontal,
  Play,
  Radio,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserPlus,
  Wrench,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Calendar as CalendarPicker } from "@/components/shadcn/calendar";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Textarea } from "@/components/shadcn/textarea";
import { cn } from "@/lib/utils";

type DeviceSetupRequestsQueueProps = {
  requests: any[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateStatus: (
    requestId: string,
    newStatus: string,
    updates?: Record<string, unknown>,
    notes?: string,
  ) => Promise<unknown>;
  onOpenWizard?: (request: any) => void;
  isConfigurator: boolean;
  /** When true, all actions are flagged as support mode with audit logging */
  isSupportMode?: boolean;
};

const STATUS_CONFIG: Record<string, {
  label: string; variant: any; icon: typeof Clock;
}> = {
  pending_review: {
    label: "Pending Review", variant: "secondary", icon: Clock,
  },
  assigned: {
    label: "Assigned", variant: "default", icon: UserPlus,
  },
  in_progress: {
    label: "In Progress", variant: "default", icon: Play,
  },
  awaiting_heartbeat: {
    label: "Awaiting Heartbeat", variant: "outline", icon: Radio,
  },
  active: {
    label: "Active", variant: "default", icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected", variant: "destructive", icon: XCircle,
  },
  cancelled: {
    label: "Cancelled", variant: "secondary", icon: XCircle,
  },
};

const TRACKER_LABELS: Record<string, string> = {
  obd: "OBD-II",
  hardwired: "Hardwired",
  battery: "Battery",
};

export function DeviceSetupRequestsQueue({
  requests,
  loading,
  onRefresh: _onRefresh,
  onUpdateStatus,
  onOpenWizard,
  isConfigurator,
  isSupportMode = false,
}: DeviceSetupRequestsQueueProps) {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    tab,
    setTab,
  ] = useState("all");
  const [
    detailRequest,
    setDetailRequest,
  ] = useState<any | null>(null);
  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");
  const [
    showRejectDialog,
    setShowRejectDialog,
  ] = useState(false);
  const [
    rejectingId,
    setRejectingId,
  ] = useState<string | null>(null);

  // Applied filters
  const [
    dateFrom,
    setDateFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    dateTo,
    setDateTo,
  ] = useState<Date | undefined>(undefined);
  const [
    deviceFilter,
    setDeviceFilter,
  ] = useState<string>("all");

  // Filter popover state
  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);
  const [
    draftDateEnabled,
    setDraftDateEnabled,
  ] = useState(false);
  const [
    draftDateFrom,
    setDraftDateFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    draftDateTo,
    setDraftDateTo,
  ] = useState<Date | undefined>(undefined);
  const [
    draftDeviceEnabled,
    setDraftDeviceEnabled,
  ] = useState(false);
  const [
    draftDevice,
    setDraftDevice,
  ] = useState<string>("all");

  const deviceOptions = Array.from(new Set(requests.map(r => r.manufacturer).filter(Boolean))).sort();
  const activeFilterCount = (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (deviceFilter !== "all" ? 1 : 0);

  const filtered = requests.filter((r) => {
    const matchSearch = !search
      || r.imei.toLowerCase().includes(search.toLowerCase())
      || r.manufacturer.toLowerCase().includes(search.toLowerCase())
      || r.requester_name?.toLowerCase().includes(search.toLowerCase())
      || r.vehicle_name?.toLowerCase().includes(search.toLowerCase());

    const created = new Date(r.created_at);
    const matchFrom = !dateFrom || created >= new Date(dateFrom.setHours(
      0,
      0,
      0,
      0,
    ));
    const matchTo = !dateTo || created <= new Date(new Date(dateTo).setHours(
      23,
      59,
      59,
      999,
    ));
    const matchDevice = deviceFilter === "all" || r.manufacturer === deviceFilter;

    const matchStatus
      = tab === "pending"
        ? r.status === "pending_review"
        : tab === "active"
          ? [
              "assigned",
              "in_progress",
              "awaiting_heartbeat",
            ].includes(r.status)
          : tab === "completed"
            ? [
                "active",
                "rejected",
                "cancelled",
              ].includes(r.status)
            : true;

    return matchSearch && matchFrom && matchTo && matchDevice && matchStatus;
  });

  // Wrap status updates to inject support mode flags
  const handleStatusUpdate = (
    requestId: string,
    newStatus: string,
    extraUpdates?: Record<string, unknown>,
    notes?: string,
  ) => {
    const supportUpdates = isSupportMode
      ? {
          is_support_mode: true, support_actor_id: null, ...extraUpdates,
        }
      : extraUpdates;
    const supportNotes = isSupportMode
      ? `[SUPPORT MODE] ${notes || newStatus}`
      : notes;
    return onUpdateStatus(
      requestId,
      newStatus,
      supportUpdates,
      supportNotes,
    );
  };

  const handleReject = async () => {
    if (!rejectingId)
      return;
    await handleStatusUpdate(
      rejectingId,
      "rejected",
      { rejection_reason: rejectionReason },
      rejectionReason,
    );
    setShowRejectDialog(false);
    setRejectingId(null);
    setRejectionReason("");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Device Setup Requests</CardTitle></CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>
    );
  }

  const requestColumns: ColumnDef<any>[] = [
    {
      id: "device",
      header: "Device",
      enableSorting: false,
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div>
            <p className="font-medium text-sm">
              {req.manufacturer}
              {" "}
              {req.model}
            </p>
            <p className="text-xs text-muted-foreground font-mono">{req.imei}</p>
            <Badge
              variant="outline"
              className="text-xs mt-1"
            >
              {TRACKER_LABELS[req.tracker_type] || req.tracker_type}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "requester",
      header: "Requester",
      accessorFn: req => req.requester_name ?? "",
      cell: ({ row }) => (
        <>
          <p className="text-sm">{row.original.requester_name || "-"}</p>
          {row.original.needs_sim && (
            <Badge
              variant="secondary"
              className="text-xs mt-1"
            >
              Needs SIM
            </Badge>
          )}
        </>
      ),
    },
    {
      id: "vehicle",
      header: "Vehicle",
      accessorFn: req => req.vehicle_name ?? "",
      cell: ({ row }) => <p className="text-sm">{row.original.vehicle_name || "-"}</p>,
    },
    {
      id: "location",
      header: "Location",
      enableSorting: false,
      cell: ({ row }) => {
        const req = row.original;
        return req.installation_state || req.installation_city
          ? (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {[
                  req.installation_city,
                  req.installation_state,
                ].filter(Boolean).join(", ")}
              </div>
            )
          : "-";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusCfg = STATUS_CONFIG[row.original.status] || STATUS_CONFIG.pending_review;
        const StatusIcon = statusCfg.icon;
        return (
          <Badge
            variant={statusCfg.variant}
            className="flex items-center gap-1 w-fit"
          >
            <StatusIcon className="h-3 w-3" />
            {statusCfg.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div className="text-xs text-muted-foreground">
            {formatWithPattern(
              req.created_at,
              "dd MMM yyyy",
            )}
            {req.preferred_date && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {formatWithPattern(
                  req.preferred_date,
                  "dd MMM",
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      meta: { className: "w-[80px]" },
      cell: ({ row }) => {
        const req = row.original;
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
              <DropdownMenuItem onClick={() => setDetailRequest(req)}>
                <Eye className="h-4 w-4 mr-2" />
                {" "}
                View Details
              </DropdownMenuItem>
              {isConfigurator && req.status === "pending_review" && (
                <>
                  <DropdownMenuItem onClick={() => handleStatusUpdate(
                    req.id,
                    "assigned",
                  )}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {" "}
                    Assign to Me
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      setRejectingId(req.id);
                      setShowRejectDialog(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {" "}
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              {isConfigurator && req.status === "assigned" && (
                <DropdownMenuItem onClick={() => {
                  handleStatusUpdate(
                    req.id,
                    "in_progress",
                  );
                  onOpenWizard?.(req);
                }}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  {" "}
                  Start Configuration
                </DropdownMenuItem>
              )}
              {isConfigurator && req.status === "in_progress" && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(
                  req.id,
                  "awaiting_heartbeat",
                )}
                >
                  <Radio className="h-4 w-4 mr-2" />
                  {" "}
                  Mark Awaiting Heartbeat
                </DropdownMenuItem>
              )}
              {isConfigurator && req.status === "awaiting_heartbeat" && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(
                  req.id,
                  "active",
                )}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {" "}
                  Mark Active
                </DropdownMenuItem>
              )}
              {req.status === "pending_review" && !isConfigurator && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleStatusUpdate(
                    req.id,
                    "cancelled",
                  )}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {" "}
                  Cancel Request
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Device Setup Requests
            </CardTitle>
            <CardDescription>Incoming requests to provision and configure new IoT devices for vehicles.</CardDescription>
          </div>
          <ExportButton
            rows={filtered}
            filename="device-setup-requests"
            columns={[
              {
                header: "IMEI", accessor: "imei",
              },
              {
                header: "Manufacturer", accessor: "manufacturer",
              },
              {
                header: "Model", accessor: r => r.model || "",
              },
              {
                header: "Tracker Type", accessor: r => TRACKER_LABELS[r.tracker_type] || r.tracker_type,
              },
              {
                header: "Requester", accessor: r => r.requester_name || "",
              },
              {
                header: "Vehicle", accessor: r => r.vehicle_name || "",
              },
              {
                header: "City", accessor: r => r.installation_city || "",
              },
              {
                header: "State", accessor: r => r.installation_state || "",
              },
              {
                header: "Status", accessor: r => STATUS_CONFIG[r.status]?.label || r.status,
              },
              {
                header: "Needs SIM", accessor: r => (r.needs_sim ? "Yes" : "No"),
              },
              {
                header: "Created", accessor: r => toDateParam(r.created_at),
              },
              {
                header: "Preferred Date", accessor: r => (r.preferred_date ? toDateParam(r.preferred_date) : ""),
              },
            ]}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by IMEI, manufacturer, requester..."
                className="pl-9 bg-card/50 border-border/50"
              />
            </div>
            <Select
              value={tab}
              onValueChange={setTab}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-card/50 border-border/50">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Popover
              open={filterOpen}
              onOpenChange={(open) => {
                setFilterOpen(open);
                if (open) {
                  // Sync drafts with applied filters when opening
                  setDraftDateEnabled(!!(dateFrom || dateTo));
                  setDraftDateFrom(dateFrom);
                  setDraftDateTo(dateTo);
                  setDraftDeviceEnabled(deviceFilter !== "all");
                  setDraftDevice(deviceFilter);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 sm:h-9 bg-card/50 border-border/50"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
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
                className="w-80 p-4 space-y-4"
              >
                <p className="text-sm font-semibold">Only show requests by...</p>

                {/* Date Range */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="filter-date-enabled"
                      checked={draftDateEnabled}
                      onCheckedChange={v => setDraftDateEnabled(!!v)}
                    />
                    <Label
                      htmlFor="filter-date-enabled"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Date Range
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!draftDateEnabled}
                          className={cn(
                            "justify-start font-normal",
                            !draftDateFrom && "text-muted-foreground",
                          )}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {draftDateFrom
                            ? formatWithPattern(
                                draftDateFrom,
                                "dd MMM yy",
                              )
                            : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <CalendarPicker
                          mode="single"
                          selected={draftDateFrom}
                          onSelect={setDraftDateFrom}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!draftDateEnabled}
                          className={cn(
                            "justify-start font-normal",
                            !draftDateTo && "text-muted-foreground",
                          )}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {draftDateTo
                            ? formatWithPattern(
                                draftDateTo,
                                "dd MMM yy",
                              )
                            : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <CalendarPicker
                          mode="single"
                          selected={draftDateTo}
                          onSelect={setDraftDateTo}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Device */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="filter-device-enabled"
                      checked={draftDeviceEnabled}
                      onCheckedChange={v => setDraftDeviceEnabled(!!v)}
                    />
                    <Label
                      htmlFor="filter-device-enabled"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Device
                    </Label>
                  </div>
                  <Select
                    value={draftDevice}
                    onValueChange={setDraftDevice}
                    disabled={!draftDeviceEnabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All devices</SelectItem>
                      {deviceOptions.map(d => (
                        <SelectItem
                          key={d}
                          value={d}
                        >
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setDateFrom(draftDateEnabled ? draftDateFrom : undefined);
                      setDateTo(draftDateEnabled ? draftDateTo : undefined);
                      setDeviceFilter(draftDeviceEnabled ? draftDevice : "all");
                      setFilterOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateFrom(undefined);
                      setDateTo(undefined);
                      setDeviceFilter("all");
                      setDraftDateEnabled(false);
                      setDraftDateFrom(undefined);
                      setDraftDateTo(undefined);
                      setDraftDeviceEnabled(false);
                      setDraftDevice("all");
                      setFilterOpen(false);
                    }}
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="mt-4">
            <div className="rounded-md border overflow-x-auto">
              <DataTable
                columns={requestColumns}
                data={filtered}
                emptyState={(
                  <div className="py-4">
                    <Cpu className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>No requests in this category</p>
                  </div>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!detailRequest}
        onOpenChange={() => setDetailRequest(null)}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription className="sr-only">Device setup request details</DialogDescription>
          </DialogHeader>
          {detailRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Manufacturer</span>
                  <p className="font-medium">{detailRequest.manufacturer}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Model</span>
                  <p className="font-medium">{detailRequest.model || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">IMEI</span>
                  <p className="font-mono">{detailRequest.imei}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tracker Type</span>
                  <p>{TRACKER_LABELS[detailRequest.tracker_type] || detailRequest.tracker_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vehicle</span>
                  <p>{detailRequest.vehicle_name || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Requester</span>
                  <p>{detailRequest.requester_name || "-"}</p>
                </div>
              </div>
              <Separator />
              {(detailRequest.installation_state || detailRequest.installation_city) && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Installation Location</span>
                  <p>
                    {[
                      detailRequest.installation_city,
                      detailRequest.installation_state,
                    ].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
              {detailRequest.preferred_date && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Preferred Date</span>
                  <p>
                    {formatWithPattern(
                      detailRequest.preferred_date,
                      "dd MMMM yyyy",
                    )}
                    {" "}
                    {detailRequest.preferred_time && `(${detailRequest.preferred_time})`}
                  </p>
                </div>
              )}
              {detailRequest.sim_iccid && (
                <div className="text-sm">
                  <span className="text-muted-foreground">SIM ICCID</span>
                  <p className="font-mono">{detailRequest.sim_iccid}</p>
                </div>
              )}
              {detailRequest.needs_sim && (
                <Badge variant="secondary">SIM Requested</Badge>
              )}
              {detailRequest.requester_notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes</span>
                  <p className="whitespace-pre-wrap">{detailRequest.requester_notes}</p>
                </div>
              )}
              {detailRequest.assigned_to_name && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Assigned To</span>
                  <p>{detailRequest.assigned_to_name}</p>
                </div>
              )}
              {detailRequest.rejection_reason && (
                <div className="text-sm">
                  <span className="text-muted-foreground text-destructive">Rejection Reason</span>
                  <p className="text-destructive">{detailRequest.rejection_reason}</p>
                </div>
              )}
              {detailRequest.configurator_notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Configurator Notes</span>
                  <p className="whitespace-pre-wrap">{detailRequest.configurator_notes}</p>
                </div>
              )}
              {detailRequest.is_support_mode && (
                <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Support Mode</p>
                    <p className="text-xs text-muted-foreground">
                      This request was handled via Platform Support with audit logging.
                      {detailRequest.support_actor_id && ` Actor: ${detailRequest.support_actor_id.slice(
                        0,
                        8,
                      )}...`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>Provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
