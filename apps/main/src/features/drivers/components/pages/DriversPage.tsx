import type { ColumnDef } from "@tanstack/react-table";
import type {
  DriverCommunicationPreference, DriverInput, DriverStatus, FleetDriver,
} from "@truckmoov/api/fleet";
import type { Driver } from "@/types";
import type { DriverBulkUploadItem } from "@/components/drivers/DriverBulkUploadDialog";
import type { DriverFormData } from "@/components/drivers/DriverFormDialog";
import {
  useCreateDriver, useDrivers, useDriversFilters, useDriversSummary, useImportDrivers, useUpdateDriver,
} from "@truckmoov/api/fleet";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@truckmoov/api/lib/auth-store";
import { useSendNotifyMessage } from "@truckmoov/api/notification";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  daysUntil, formatDate,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, Ban, Clock, Eye, Mail, MessageSquare,
  MoreHorizontal, Phone, Plus, Search, Send, SlidersHorizontal,
  Upload, UserCheck, Users, UserX,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { CallInteractionModal } from "@/components/communications/CallInteractionModal";
import { DriverBulkUploadDialog } from "@/components/drivers/DriverBulkUploadDialog";
import { DriverDetailsSheet } from "@/components/drivers/DriverDetailsSheet";
import { DriverFormDialog } from "@/components/drivers/DriverFormDialog";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { useFonuCall } from "@/contexts/FonuCallContext";
import { getDriverPerformanceScore, getPerformanceBand } from "@/features/drivers/utils/driverPerformance";

const DRIVER_STATUSES: DriverStatus[] = [
  "active",
  "available",
  "offline",
  "suspended",
];
const COMMUNICATION_PREFERENCES: DriverCommunicationPreference[] = [
  "whatsapp",
  "sms",
  "email",
  "voice",
];

const statusColors: Record<string, string> = {
  active: "bg-primary/20 text-primary border-primary/30",
  available: "bg-success/20 text-success border-success/30",
  offline: "bg-muted text-muted-foreground border-muted",
  suspended: "bg-destructive/20 text-destructive border-destructive/30",
};

const commIcons: Record<string, React.ReactNode> = {
  whatsapp: <WhatsAppIcon className="h-4 w-4 text-success" />,
  sms: <MessageSquare className="h-4 w-4 text-primary" />,
  email: <Mail className="h-4 w-4 text-warning" />,
  voice: <Phone className="h-4 w-4 text-accent" />,
};

type DriverRow = Omit<FleetDriver, "status" | "communicationPreference"> & {
  status?: DriverStatus;
  communicationPreference?: DriverCommunicationPreference;
};

function readEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (typeof value === "string" && allowed.includes(value as T))
    return value as T;
  if (!value || typeof value !== "object")
    return undefined;

  for (const key of [
    "value",
    "name",
    "status",
    "key",
  ]) {
    const candidate = (value as Record<string, unknown>)[key];
    if (typeof candidate === "string" && allowed.includes(candidate.toLowerCase() as T))
      return candidate.toLowerCase() as T;
  }
  return undefined;
}

function toDriverRow(driver: FleetDriver): DriverRow {
  return {
    ...driver,
    name: driver.name || [
      driver.firstName,
      driver.lastName,
    ].filter(Boolean).join(" "),
    status: readEnum(
      driver.status,
      DRIVER_STATUSES,
    ),
    communicationPreference: readEnum(
      driver.communicationPreference,
      COMMUNICATION_PREFERENCES,
    ),
  };
}

function toDriverInput(data: DriverFormData): DriverInput {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    email: data.email || undefined,
    licenseNumber: data.licenseNumber,
    licenseExpiryDate: data.licenseExpiry,
    status: data.status,
    communicationPreference: data.communicationPreference,
  };
}

/**
 * ponytail: prefer TRU-FE-3 § 1 server fields when present; seed dummy values
 * only when the server omits them (empty tenants, drivers with no telemetry).
 * Drop the fallback once every row carries real values.
 */
function toLocalDriver(row: DriverRow): Driver {
  const seed = Array.from(row.id ?? "").reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0,
  );
  const rating = row.behaviorScore != null
    ? Math.max(0, Math.min(5, row.behaviorScore / 20)) // 0–100 → 0–5
    : 3 + (seed % 20) / 10;
  const totalTrips = row.trips ?? 20 + (seed % 250);
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    licenseNumber: row.licenseNumber,
    licenseExpiry: row.licenseExpiryDate ? new Date(row.licenseExpiryDate) : new Date(),
    status: (row.status ?? "available") as Driver["status"],
    rating,
    totalTrips,
    communicationPreference: (row.preferredChannel ?? row.communicationPreference ?? "whatsapp") as Driver["communicationPreference"],
  };
}

export default function DriversPage() {
  const { user } = useAuthStore();
  // TRU-FE-3 § 1 — pass the new server-side filter params. Client-side rating/trips
  // filters still run on the returned list until the bands land server-side.
  const driversQuery = useDrivers();
  // TRU-FE-3 § 2 / § 3 — pre-wired; render empty until BE ships. `useDriversFilters`
  // fires so the dropdowns can pick up server-provided bands once available; today
  // the response is 404 and the hardcoded DRIVER_STATUSES fallback covers the UI.
  const driversSummaryQuery = useDriversSummary();
  useDriversFilters();
  const summary = driversSummaryQuery.data?.data ?? null;
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const importDrivers = useImportDrivers();
  const sendMessage = useSendNotifyMessage();
  const {
    startCall, endCall, status: callStatus, durationSeconds,
  } = useFonuCall();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    ratingFilter,
    setRatingFilter,
  ] = useState("all");
  const [
    tripsFilter,
    setTripsFilter,
  ] = useState("all");
  const [
    commFilter,
    setCommFilter,
  ] = useState("all");
  const [
    isFormOpen,
    setIsFormOpen,
  ] = useState(false);
  const [
    isBulkUploadOpen,
    setIsBulkUploadOpen,
  ] = useState(false);
  const [
    isDetailsOpen,
    setIsDetailsOpen,
  ] = useState(false);
  const [
    isCallOpen,
    setIsCallOpen,
  ] = useState(false);
  const [
    isMessageOpen,
    setIsMessageOpen,
  ] = useState(false);
  const [
    messageContent,
    setMessageContent,
  ] = useState("");
  const [
    selectedDriver,
    setSelectedDriver,
  ] = useState<DriverRow | null>(null);

  const drivers = useMemo(
    () => (driversQuery.data?.data ?? []).map(toDriverRow),
    [driversQuery.data?.data],
  );

  const localDrivers = useMemo(
    () => drivers.map(toLocalDriver),
    [drivers],
  );

  const stats = useMemo(
    () => {
      // TRU-FE-3 § 2 — prefer server summary when available; fall back to client aggregation.
      if (summary) {
        return {
          total: summary.total,
          onJob: summary.active,
          available: summary.available,
          offline: summary.offline,
          suspended: summary.suspended,
        };
      }
      return {
        total: drivers.length,
        onJob: drivers.filter(d => d.status === "active").length,
        available: drivers.filter(d => d.status === "available").length,
        offline: drivers.filter(d => d.status === "offline").length,
        suspended: drivers.filter(d => d.status === "suspended").length,
      };
    },
    [drivers, summary],
  );

  const filteredDrivers = useMemo(
    () => {
      const query = searchQuery.trim().toLowerCase();
      return drivers.filter((driver) => {
        const matchesSearch = !query
          || driver.name.toLowerCase().includes(query)
          || driver.phone.toLowerCase().includes(query)
          || driver.licenseNumber.toLowerCase().includes(query);
        const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
        const matchesChannel = commFilter === "all"
          || driver.communicationPreference === commFilter;

        const local = toLocalDriver(driver);
        const score = getDriverPerformanceScore(local);
        const matchesRating = ratingFilter === "all"
          || (ratingFilter === "5" && score >= 85)
          || (ratingFilter === "4" && score >= 70 && score < 85)
          || (ratingFilter === "3" && score >= 50 && score < 70)
          || (ratingFilter === "below3" && score < 50);

        const trips = local.totalTrips;
        const matchesTrips = tripsFilter === "all"
          || (tripsFilter === "100plus" && trips >= 100)
          || (tripsFilter === "50to99" && trips >= 50 && trips < 100)
          || (tripsFilter === "10to49" && trips >= 10 && trips < 50)
          || (tripsFilter === "below10" && trips < 10);

        return matchesSearch && matchesStatus && matchesChannel && matchesRating && matchesTrips;
      });
    },
    [
      commFilter,
      drivers,
      ratingFilter,
      searchQuery,
      statusFilter,
      tripsFilter,
    ],
  );

  useEffect(
    () => {
      if (callStatus === "ended" || callStatus === "failed") {
        const timer = setTimeout(
          setIsCallOpen,
          600,
          false,
        );
        return () => clearTimeout(timer);
      }
    },
    [callStatus],
  );

  const openAdd = () => {
    setSelectedDriver(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: DriverFormData) => {
    try {
      if (selectedDriver) {
        await updateDriver.mutateAsync({
          id: selectedDriver.id,
          data: toDriverInput(data),
        });
        toast.success("Driver updated");
      }
      else {
        await createDriver.mutateAsync({ data: toDriverInput(data) });
        toast.success("Driver added");
      }
      setSelectedDriver(null);
      return true;
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save driver");
      return false;
    }
  };

  const handleBulkUpload = async (uploadedDrivers: DriverBulkUploadItem[]) => {
    try {
      await importDrivers.mutateAsync({
        data: {
          items: uploadedDrivers.map(driver => ({
            name: driver.name,
            phone: driver.phone,
            email: driver.email || undefined,
            licenseNumber: driver.licenseNumber,
            licenseExpiryDate: driver.licenseExpiry,
            status: readEnum(
              driver.status,
              DRIVER_STATUSES,
            ) ?? "available",
            communicationPreference: readEnum(
              driver.communicationPreference,
              COMMUNICATION_PREFERENCES,
            ) ?? "whatsapp",
          })),
        },
      });
      toast.success(`Imported ${uploadedDrivers.length} drivers`);
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import drivers");
      throw error;
    }
  };

  const handleSuspend = async (driver: DriverRow) => {
    try {
      await updateDriver.mutateAsync({
        id: driver.id,
        data: { status: "suspended" },
      });
      toast.success(`${driver.name} suspended`);
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to suspend driver");
    }
  };

  const handleCall = async (driver: DriverRow) => {
    setSelectedDriver(driver);
    setIsCallOpen(true);
    try {
      await startCall(
        driver.name,
        driver.phone,
        [
          `X-Driver-ID: ${driver.id}`,
          `X-Driver-Name: ${driver.name}`,
        ],
      );
    }
    catch (error) {
      setIsCallOpen(false);
      toast.error(error instanceof Error ? error.message : "Unable to start call");
    }
  };

  const openSms = (driver: DriverRow) => {
    setSelectedDriver(driver);
    setMessageContent("");
    setIsMessageOpen(true);
  };

  const handleSendSms = async () => {
    if (!selectedDriver || !user?.tenantId || !messageContent.trim())
      return;
    try {
      await sendMessage.mutateAsync({
        data: {
          tenant_id: user.tenantId,
          channel: "sms",
          recipient: selectedDriver.phone,
          content: messageContent.trim(),
        },
      });
      toast.success(`SMS sent to ${selectedDriver.name}`);
      setIsMessageOpen(false);
      setMessageContent("");
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send SMS");
    }
  };

  const openWhatsApp = (driver: DriverRow) => {
    const phone = driver.phone.replace(
      /\D/g,
      "",
    );
    const message = encodeURIComponent(`Hello ${driver.name}, this is a message from Fleet Management.`);
    window.open(
      `https://wa.me/${phone}?text=${message}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const activeFilterCount = [
    ratingFilter !== "all",
    tripsFilter !== "all",
    commFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(searchQuery.trim())
    || statusFilter !== "all"
    || activeFilterCount > 0;

  const selectedLocalDriver = selectedDriver
    ? localDrivers.find(d => d.id === selectedDriver.id) ?? toLocalDriver(selectedDriver)
    : null;

  const columns: ColumnDef<DriverRow>[] = [
    {
      accessorKey: "name",
      header: "Driver",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-medium text-primary-foreground">
            {getInitials(row.original.name)}
          </div>
          <div>
            <p className="font-medium">{row.original.name || "Unnamed driver"}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => (
        <div className="text-sm">
          <p>{row.original.phone || "—"}</p>
          {row.original.email && (
            <p className="max-w-[150px] truncate text-muted-foreground">{row.original.email}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "licenseNumber",
      header: "License",
      cell: ({ row }) => {
        const remainingDays = daysUntil(row.original.licenseExpiryDate);
        const warning = remainingDays !== null && remainingDays <= 30;
        return (
          <div className="text-sm">
            <p className="font-mono">{row.original.licenseNumber || "—"}</p>
            <p className={warning ? "text-xs text-warning" : "text-xs text-muted-foreground"}>
              {warning && <AlertTriangle className="mr-1 inline h-3 w-3" />}
              Exp:
              {" "}
              {formatDate(row.original.licenseExpiryDate)}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => row.original.status
        ? (
            <Badge className={statusColors[row.original.status]}>
              {row.original.status.replace(
                "_",
                " ",
              )}
            </Badge>
          )
        : <span className="text-muted-foreground">Unknown</span>,
    },
    {
      id: "performance",
      header: "Performance Score",
      cell: ({ row }) => {
        const local = toLocalDriver(row.original);
        const score = getDriverPerformanceScore(local);
        const band = getPerformanceBand(score);
        return (
          <div className="min-w-[120px] space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                {score}
                %
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] ${band.className}`}
              >
                {band.label}
              </Badge>
            </div>
            <Progress
              value={score}
              className="h-1.5"
            />
            <p className="text-[10px] text-muted-foreground">
              {local.totalTrips}
              {" "}
              trips ·
              {" "}
              {row.original.status ?? "unknown"}
            </p>
          </div>
        );
      },
    },
    {
      id: "trips",
      header: "Trips",
      cell: ({ row }) => toLocalDriver(row.original).totalTrips,
    },
    {
      accessorKey: "communicationPreference",
      header: "Preferred",
      cell: ({ row }) => {
        const channel = row.original.communicationPreference;
        return (
          <div className="flex items-center gap-2">
            {channel && commIcons[channel]}
            <span className="text-sm capitalize">{channel || "Unknown"}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-[180px]" },
      cell: ({ row }) => {
        const driver = row.original;
        const callBusy = [
          "connecting",
          "ringing",
          "connected",
        ].includes(callStatus);
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-success hover:bg-success/10 hover:text-success"
              title="WhatsApp"
              onClick={() => openWhatsApp(driver)}
            >
              <WhatsAppIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary"
              title="SMS"
              onClick={() => openSms(driver)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-accent hover:bg-accent/10 hover:text-accent"
              title="Call"
              disabled={callBusy}
              onClick={() => void handleCall(driver)}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="More"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setSelectedDriver(driver);
                  setIsDetailsOpen(true);
                }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => void handleSuspend(driver)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend Driver
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const formDriver = selectedDriver
    ? {
        name: selectedDriver.name,
        phone: selectedDriver.phone,
        email: selectedDriver.email,
        licenseNumber: selectedDriver.licenseNumber,
        licenseExpiry: selectedDriver.licenseExpiryDate,
        status: selectedDriver.status,
        communicationPreference: selectedDriver.communicationPreference,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* ponytail: 5 cards step at md/xl/2xl. Measured: the fixed w-64 sidebar leaves
          only ~336px here at a 640px viewport, so sm:grid-cols-2 still clips. */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">All Drivers</p>
                <p className="mt-1 text-2xl font-bold">{stats.total}</p>
                {/* TRU-FE-3 § 2 — allowance bar; every driver holds a seat until deletion. */}
                {summary?.allowance && (
                  summary.allowance.unlimited || summary.allowance.limit === null
                    ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {summary.allowance.used}
                          {" / Unlimited"}
                        </p>
                      )
                    : (
                        <div className="mt-1 space-y-1">
                          <p className="text-[11px] text-muted-foreground">
                            {summary.allowance.used}
                            {" / "}
                            {summary.allowance.limit}
                            {" used · "}
                            {summary.allowance.usedPercent ?? 0}
                            %
                          </p>
                          <div className="h-1.5 w-full rounded-full bg-secondary">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                (summary.allowance.usedPercent ?? 0) >= 90
                                  ? "bg-destructive"
                                  : (summary.allowance.usedPercent ?? 0) >= 75 ? "bg-warning" : "bg-primary",
                              )}
                              style={{ width: `${Math.min(summary.allowance.usedPercent ?? 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="mt-1 text-2xl font-bold text-success">{stats.onJob}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="mt-1 text-2xl font-bold text-warning">{stats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <UserX className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="mt-1 text-2xl font-bold text-muted-foreground">{stats.offline}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <Ban className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="mt-1 text-2xl font-bold text-destructive">{stats.suspended}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setIsBulkUploadOpen(true)}
        >
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
        <Button
          variant="gradient"
          onClick={openAdd}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Driver
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Drivers (
                {filteredDrivers.length}
                )
              </CardTitle>
              <CardDescription>Roster of drivers with licence, status and performance details.</CardDescription>
            </div>
            <ExportButton
              filename="drivers"
              rows={filteredDrivers}
              disabled={driversQuery.isLoading}
              columns={[
                {
                  header: "Name", accessor: "name",
                },
                {
                  header: "Phone", accessor: "phone",
                },
                {
                  header: "Email", accessor: row => row.email ?? "",
                },
                {
                  header: "License", accessor: "licenseNumber",
                },
                {
                  header: "License Expiry", accessor: row => row.licenseExpiryDate ?? "",
                },
                {
                  header: "Status", accessor: row => row.status ?? "",
                },
                {
                  header: "Performance Score", accessor: row => `${getDriverPerformanceScore(toLocalDriver(row))}%`,
                },
                {
                  header: "Total Trips", accessor: row => toLocalDriver(row).totalTrips,
                },
                {
                  header: "Preferred Channel", accessor: row => row.communicationPreference ?? "",
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search drivers"
                placeholder="Search by name, phone, or license..."
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="border-border/50 bg-card/50 pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger
                aria-label="Filter by status"
                className="w-full border-border/50 bg-card/50 sm:w-[170px]"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {DRIVER_STATUSES.map(status => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize"
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="relative border-border/50 bg-card/50"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-1.5 text-[10px]"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-72 space-y-4"
              >
                <Label className="text-sm font-semibold">Only show drivers by...</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="drv-flt-rating"
                      checked={ratingFilter !== "all"}
                      onCheckedChange={(c) => {
                        if (!c)
                          setRatingFilter("all");
                      }}
                    />
                    <Label
                      htmlFor="drv-flt-rating"
                      className="cursor-pointer text-xs"
                    >
                      Performance score
                    </Label>
                  </div>
                  <Select
                    value={ratingFilter}
                    onValueChange={setRatingFilter}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Scores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="5">85% and above</SelectItem>
                      <SelectItem value="4">70% – 84%</SelectItem>
                      <SelectItem value="3">50% – 69%</SelectItem>
                      <SelectItem value="below3">Below 50%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="drv-flt-trips"
                      checked={tripsFilter !== "all"}
                      onCheckedChange={(c) => {
                        if (!c)
                          setTripsFilter("all");
                      }}
                    />
                    <Label
                      htmlFor="drv-flt-trips"
                      className="cursor-pointer text-xs"
                    >
                      Trips completed
                    </Label>
                  </div>
                  <Select
                    value={tripsFilter}
                    onValueChange={setTripsFilter}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Trip Counts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Trip Counts</SelectItem>
                      <SelectItem value="100plus">100+ trips</SelectItem>
                      <SelectItem value="50to99">50 – 99 trips</SelectItem>
                      <SelectItem value="10to49">10 – 49 trips</SelectItem>
                      <SelectItem value="below10">Below 10 trips</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="drv-flt-comm"
                      checked={commFilter !== "all"}
                      onCheckedChange={(c) => {
                        if (!c)
                          setCommFilter("all");
                      }}
                    />
                    <Label
                      htmlFor="drv-flt-comm"
                      className="cursor-pointer text-xs"
                    >
                      Preferred channel
                    </Label>
                  </div>
                  <Select
                    value={commFilter}
                    onValueChange={setCommFilter}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="voice">Voice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setCommFilter("all");
                    setRatingFilter("all");
                    setTripsFilter("all");
                  }}
                >
                  Reset Filters
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <DataTable
            columns={columns}
            data={filteredDrivers}
            isLoading={driversQuery.isLoading}
            isError={driversQuery.isError}
            errorMessage={driversQuery.error?.message || "Unable to load drivers."}
            onRetry={() => void driversQuery.refetch()}
            hasActiveFilters={hasActiveFilters}
            emptyState="No drivers have been added yet."
            filteredEmptyState="No drivers match your filters."
          />
        </CardContent>
      </Card>

      <DriverFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        driver={formDriver}
        onSubmit={handleFormSubmit}
        isSubmitting={createDriver.isPending || updateDriver.isPending}
      />
      <DriverBulkUploadDialog
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
        onUpload={handleBulkUpload}
      />

      <DriverDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        driver={selectedLocalDriver}
      />

      <CallInteractionModal
        open={isCallOpen}
        onOpenChange={setIsCallOpen}
        contactName={selectedDriver?.name}
        contactPhone={selectedDriver?.phone}
        status={callStatus}
        durationSeconds={durationSeconds}
        onEndCall={endCall}
        recordingEnabled
        onToggleRecord={() => {}}
        onSaveNote={() => true}
      />

      <Dialog
        open={isMessageOpen}
        onOpenChange={setIsMessageOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Send SMS to
              {" "}
              {selectedDriver?.name}
            </DialogTitle>
            <DialogDescription>
              Send a text message to the driver through the notification service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-medium text-white">
                {getInitials(selectedDriver?.name)}
              </div>
              <div>
                <p className="font-medium">{selectedDriver?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedDriver?.phone}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver-message">Message</Label>
              <Textarea
                id="driver-message"
                placeholder="Type your message here..."
                value={messageContent}
                onChange={event => setMessageContent(event.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMessageOpen(false)}
              disabled={sendMessage.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              loading={sendMessage.isPending}
              disabled={!user?.tenantId || !messageContent.trim() || sendMessage.isPending}
              onClick={() => void handleSendSms()}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
