import type { DriverInput } from "@truckmoov/api/fleet";
import type { DriverFormData } from "@/components/drivers/DriverFormDialog";
import type { DriverRow } from "@/features/drivers/utils/driverRows";
import {
  useCreateDriver, useDriverGroups, useDrivers, useDriversFilters, useDriversSummary, useReinstateDriver, useSuspendDriver, useUpdateDriver,
} from "@truckmoov/api/fleet";
import { useAuthStore } from "@truckmoov/api/lib/auth-store";
import { useSendNotifyMessage } from "@truckmoov/api/notification";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  daysUntil, formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, Ban, Clock, Eye, Mail, MessageSquare,
  MoreHorizontal, Phone, Plus, RotateCcw, Search, Send, SlidersHorizontal,
  Upload, UserCheck, Users, UserX,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { CallInteractionModal } from "@/components/communications/CallInteractionModal";
import { DriverDetailsSheet } from "@/components/drivers/DriverDetailsSheet";
import { DriverFormDialog } from "@/components/drivers/DriverFormDialog";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
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
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { Textarea } from "@/components/shadcn/textarea";
import { useFonuCall } from "@/contexts/FonuCallContext";
import { getPerformanceBand } from "@/features/drivers/utils/driverPerformance";
import {
  DRIVER_STATUSES, driverScore, formatScore, toDriverRow, toLocalDriver,
} from "@/features/drivers/utils/driverRows";
import { BulkUploadDialog } from "@/features/fleet/components/ui/BulkUploadDialog";
import { FleetTablePager } from "@/features/fleet/components/ui/FleetTablePager";
import { useClientPage } from "@/features/fleet/utils/useClientPage";
import { PageHeader } from "@/shared/components/layout/PageHeader";

// Classes copied from the design app's rendered DOM (shadcn Card / Badge bases
// there differ from packages/reusables, so these are plain elements).
const TILE_CLASS = "rounded-2xl surface-sleek text-card-foreground";
const STATUS_BADGE_CLASS = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm hover:bg-primary/90";
const BAND_BADGE_CLASS = "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[10px]";
const CONTACT_LINK_CLASS = "h-auto justify-start p-0 text-sm font-normal whitespace-nowrap";
const COLUMN_COUNT = 10;
const LOADING_ROWS = [
  "a",
  "b",
  "c",
  "d",
  "e",
];

const statusColors: Record<string, string> = {
  active: "bg-primary/20 text-primary border-primary/30",
  available: "bg-success/20 text-success border-success/30",
  offline: "bg-muted text-muted-foreground border-muted",
  suspended: "bg-destructive/20 text-destructive border-destructive/30",
};

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

export default function DriversPage() {
  const { user } = useAuthStore();
  // TRU-FE-3 § 1 — pass the new server-side filter params. Client-side rating/trips
  // filters still run on the returned list until the bands land server-side.
  const driversQuery = useDrivers();
  const driverGroupsQuery = useDriverGroups();
  const groupNameByDriver = useMemo(
    () => new Map((driverGroupsQuery.data?.data ?? []).flatMap(g => g.driverIds.map(id => [
      id,
      g.name,
    ] as const))),
    [driverGroupsQuery.data],
  );
  // TRU-FE-3 § 2 / § 3 — pre-wired; render empty until BE ships. `useDriversFilters`
  // fires so the dropdowns can pick up server-provided bands once available; today
  // the response is 404 and the hardcoded DRIVER_STATUSES fallback covers the UI.
  const driversSummaryQuery = useDriversSummary();
  useDriversFilters();
  const summary = driversSummaryQuery.data?.data ?? null;
  const kpiPending = !summary && (driversSummaryQuery.isLoading || driversQuery.isLoading);
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const suspendDriver = useSuspendDriver();
  const reinstateDriver = useReinstateDriver();
  const [
    driverPendingSuspend,
    setDriverPendingSuspend,
  ] = useState<DriverRow | null>(null);
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
    [
      drivers,
      summary,
    ],
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

        const score = driverScore(driver);
        const matchesRating = ratingFilter === "all"
          || (score !== null && (
            (ratingFilter === "5" && score >= 85)
            || (ratingFilter === "4" && score >= 70 && score < 85)
            || (ratingFilter === "3" && score >= 50 && score < 70)
            || (ratingFilter === "below3" && score < 50)
          ));

        const trips = driver.trips ?? 0;
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

  const handleSuspend = (driver: DriverRow) => {
    suspendDriver.mutate(
      { id: driver.id },
      {
        onSuccess: () => {
          toast.success(`${driver.name} suspended`);
          setDriverPendingSuspend(null);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const handleReinstate = (driver: DriverRow) => {
    reinstateDriver.mutate(
      { id: driver.id },
      {
        onSuccess: () => toast.success(`${driver.name} reinstated`),
        onError: error => toast.error(error.message),
      },
    );
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

  const driverPage = useClientPage(filteredDrivers);
  const callBusy = [
    "connecting",
    "ringing",
    "connected",
  ].includes(callStatus);

  const kpiTiles = [
    {
      label: "All Drivers",
      value: stats.total,
      icon: Users,
      chip: "bg-primary/10",
      iconClass: "text-primary",
      valueClass: "",
    },
    {
      label: "Active",
      value: stats.onJob,
      icon: UserCheck,
      chip: "bg-success/10",
      iconClass: "text-success",
      valueClass: " text-success",
    },
    {
      label: "Available",
      value: stats.available,
      icon: Clock,
      chip: "bg-warning/10",
      iconClass: "text-warning",
      valueClass: " text-warning",
    },
    {
      label: "Offline",
      value: stats.offline,
      icon: UserX,
      chip: "bg-muted",
      iconClass: "text-muted-foreground",
      valueClass: " text-muted-foreground",
    },
    {
      label: "Suspended",
      value: stats.suspended,
      icon: Ban,
      chip: "bg-destructive/10",
      iconClass: "text-destructive",
      valueClass: " text-destructive",
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

  const renderRow = (driver: DriverRow) => {
    const remainingDays = daysUntil(driver.licenseExpiryDate);
    const licenseWarning = remainingDays !== null && remainingDays <= 30;
    const score = driverScore(driver);
    const band = score === null ? null : getPerformanceBand(score);
    return (
      <TableRow
        key={driver.id}
        className="hover:bg-muted/50 border-border/50"
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium text-primary-foreground">
              {getInitials(driver.name)}
            </div>
            <div>
              <p className="font-medium">{driver.name || "-"}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {driver.phone
            ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="link"
                      className={CONTACT_LINK_CLASS}
                      aria-label={`phone number: ${driver.phone}`}
                    >
                      {driver.phone}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      disabled={callBusy}
                      onClick={() => void handleCall(driver)}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openSms(driver)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send SMS
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openWhatsApp(driver)}>
                      <WhatsAppIcon className="mr-2 h-4 w-4" />
                      WhatsApp
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            : <span className="text-sm text-muted-foreground">-</span>}
        </TableCell>
        <TableCell>
          {driver.email
            ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="link"
                      className={CONTACT_LINK_CLASS}
                      aria-label={`email address: ${driver.email}`}
                    >
                      {driver.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <a href={`mailto:${driver.email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            : <span className="text-sm text-muted-foreground">-</span>}
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <p className="font-mono">{driver.licenseNumber || "-"}</p>
            <p className={licenseWarning ? "text-xs text-warning" : "text-xs text-muted-foreground"}>
              {licenseWarning && <AlertTriangle className="h-3 w-3 inline mr-1" />}
              {`Exp: ${formatWithPattern(
                driver.licenseExpiryDate,
                "MMM dd, yyyy",
              )}`}
            </p>
          </div>
        </TableCell>
        <TableCell>
          {driver.status
            ? (
                <div className={`${STATUS_BADGE_CLASS} ${statusColors[driver.status]}`}>
                  {driver.status.replace(
                    "_",
                    " ",
                  )}
                </div>
              )
            : <span className="text-sm text-muted-foreground">-</span>}
        </TableCell>
        <TableCell>
          {score === null || !band
            ? <span className="text-sm text-muted-foreground">-</span>
            : (
                <div className="min-w-[120px] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{`${Math.round(score)}%`}</span>
                    <div className={`${BAND_BADGE_CLASS} ${band.className}`}>
                      {band.label}
                    </div>
                  </div>
                  <Progress
                    value={score}
                    className="h-1.5"
                  />
                </div>
              )}
        </TableCell>
        <TableCell>{driver.trips ?? "-"}</TableCell>
        <TableCell>
          <span className="text-sm text-foreground">{groupNameByDriver.get(driver.id) ?? "-"}</span>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">
            {formatWithPattern(
              driver.createdAt,
              "MMM dd, yyyy HH:mm",
            )}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="More"
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
                {driver.status === "suspended"
                  ? (
                      <DropdownMenuItem onClick={() => handleReinstate(driver)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reinstate Driver
                      </DropdownMenuItem>
                    )
                  : (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDriverPendingSuspend(driver)}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Suspend Driver
                      </DropdownMenuItem>
                    )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderBody = () => {
    if (driversQuery.isLoading) {
      return LOADING_ROWS.map(key => (
        <TableRow
          key={key}
          className="hover:bg-muted/50 border-border/50"
        >
          <TableCell colSpan={COLUMN_COUNT}>
            <Skeleton className="h-4 w-full" />
          </TableCell>
        </TableRow>
      ));
    }
    if (driversQuery.isError) {
      return (
        <TableRow className="hover:bg-muted/50 border-border/50">
          <TableCell
            colSpan={COLUMN_COUNT}
            className="text-center text-muted-foreground"
          >
            {driversQuery.error?.message || "Unable to load drivers."}
            {" "}
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={() => void driversQuery.refetch()}
            >
              Try again
            </Button>
          </TableCell>
        </TableRow>
      );
    }
    if (filteredDrivers.length === 0) {
      return (
        <TableRow className="hover:bg-muted/50 border-border/50">
          <TableCell
            colSpan={COLUMN_COUNT}
            className="text-center text-muted-foreground"
          >
            {hasActiveFilters ? "No drivers match your filters." : "No drivers have been added yet."}
          </TableCell>
        </TableRow>
      );
    }
    return driverPage.pageRows.map(renderRow);
  };

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Driver records, contact details, and driving activity."
        align="start"
        actions={(
          <>
            <Button
              variant="outline"
              onClick={() => setIsBulkUploadOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Drivers
            </Button>
            <Button
              variant="gradient"
              onClick={openAdd}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </>
        )}
      />

      <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-0 space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
          {kpiTiles.map(tile => (
            <div
              key={tile.label}
              className={TILE_CLASS}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tile.chip} shrink-0`}>
                    <tile.icon className={`h-5 w-5 ${tile.iconClass}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">{tile.label}</p>
                    {kpiPending
                      ? <Skeleton className="mt-1 h-7 w-12" />
                      : <p className={`text-xl font-bold mt-1${tile.valueClass} truncate`}>{tile.value}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`${TILE_CLASS} bg-card/50 border-border/50`}>
          <div className="flex flex-col p-6 pb-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Drivers
                  {driversQuery.isLoading ? <Skeleton className="h-4 w-8" /> : ` (${filteredDrivers.length})`}
                </h3>
                <p className="text-sm text-muted-foreground">Roster of drivers with licence, status and performance details.</p>
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
                    header: "Performance Score", accessor: row => formatScore(driverScore(row)),
                  },
                  {
                    header: "Trips", accessor: row => row.trips ?? "",
                  },
                  {
                    header: "Group", accessor: row => groupNameByDriver.get(row.id) ?? "",
                  },
                  {
                    header: "Date Added", accessor: row => row.createdAt ?? "",
                  },
                ]}
              />
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Search drivers"
                  placeholder="Search by name, phone, or license..."
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  className="pl-10 bg-card/50 border-border/50"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger
                  aria-label="Filter by status"
                  className="h-10 rounded-xl px-3.5 w-full sm:w-[170px] bg-card/50 border-border/50"
                >
                  <SelectValue placeholder="All Statuses" />
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
                    className="bg-card/50 border-border/50 relative"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
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
          </div>
          <div className="p-0">
            <Table className="min-w-[1680px] [&_th]:px-6 [&_td]:px-6 [&_td]:py-5 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Driver</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance Score</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>{renderBody()}</TableBody>
            </Table>
            {driverPage.total > driverPage.pageSize && (
              <div className="px-6 pb-4">
                <FleetTablePager
                  page={driverPage.page}
                  pageSize={driverPage.pageSize}
                  total={driverPage.total}
                  onPageChange={driverPage.setPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <DriverFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        driver={formDriver}
        onSubmit={handleFormSubmit}
        isSubmitting={createDriver.isPending || updateDriver.isPending}
      />
      <BulkUploadDialog
        kind="driver"
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
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
              <Label
                htmlFor="driver-message"
                required
              >
                Message
              </Label>
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

      <AlertDialog
        open={Boolean(driverPendingSuspend)}
        onOpenChange={(open) => {
          if (!open && !suspendDriver.isPending)
            setDriverPendingSuspend(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend this driver?</AlertDialogTitle>
            <AlertDialogDescription>
              {driverPendingSuspend?.name}
              {" "}
              will be set to suspended and cannot be assigned to new jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={suspendDriver.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={suspendDriver.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (driverPendingSuspend)
                  handleSuspend(driverPendingSuspend);
              }}
            >
              Suspend Driver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
