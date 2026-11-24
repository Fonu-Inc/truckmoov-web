import type { FleetDriver } from "@truckmoov/api/fleet";
import {
  useDriverLicenceReminders, useDrivers,
} from "@truckmoov/api/fleet";
import {
  daysUntil, formatDate, formatDayMonth, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, Bell, CalendarIcon, CheckCircle, Clock, Download, FileText, IdCard, MoreHorizontal, Pencil, Search, Shield, SlidersHorizontal,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Calendar } from "@/components/shadcn/calendar";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { SetLicenceReminderDialog } from "@/features/drivers/components/ui/compliance/SetLicenceReminderDialog";
import { UpdateDriverLicenceDialog } from "@/features/drivers/components/ui/compliance/UpdateDriverLicenceDialog";
import { FleetTablePager } from "@/features/fleet/components/ui/FleetTablePager";
import { useClientPage } from "@/features/fleet/utils/useClientPage";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/layout/PageHeader";

type LicenceStatus = "valid" | "expiring" | "expired";

/** A licence inside this many days is "Expiring Soon". */
const EXPIRING_WITHIN_DAYS = 30;

const statusLabels: Record<LicenceStatus, string> = {
  valid: "Valid",
  expiring: "Expiring Soon",
  expired: "Expired",
};

const statusColors: Record<LicenceStatus, string> = {
  valid: "bg-success/20 text-success border-success/30",
  expiring: "bg-warning/20 text-warning border-warning/30",
  expired: "bg-destructive/20 text-destructive border-destructive/30",
};

type LicenceRow = {
  driver: FleetDriver;
  daysLeft: number | null;
  /** Null when the driver has no licence expiry date on file. */
  status: LicenceStatus | null;
};

function toLicenceRow(driver: FleetDriver): LicenceRow {
  const daysLeft = daysUntil(driver.licenseExpiryDate);
  const status: LicenceStatus | null = daysLeft === null
    ? null
    : daysLeft < 0
      ? "expired"
      : daysLeft <= EXPIRING_WITHIN_DAYS ? "expiring" : "valid";
  return {
    driver,
    daysLeft,
    status,
  };
}

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(
    /"/g,
    "\"\"",
  )}"` : text;
}

const kpiCardClass = "rounded-2xl surface-sleek text-card-foreground bg-card/50 border-border/50";

/** `/drivers/compliance` — the design app's driver Compliance tab, derived from GET /fleet/drivers. */
export default function DriverCompliancePage() {
  const driversQuery = useDrivers();
  const isLoading = driversQuery.isLoading && !driversQuery.data;
  const rows = useMemo(
    () => (driversQuery.data?.data ?? []).map(toLicenceRow),
    [driversQuery.data],
  );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    expiryFrom,
    setExpiryFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    expiryTo,
    setExpiryTo,
  ] = useState<Date | undefined>(undefined);
  const [
    isFilterOpen,
    setIsFilterOpen,
  ] = useState(false);
  const [
    draftStatus,
    setDraftStatus,
  ] = useState("all");
  const [
    draftEnableExpiry,
    setDraftEnableExpiry,
  ] = useState(false);
  const [
    draftExpiryFrom,
    setDraftExpiryFrom,
  ] = useState<Date | undefined>(undefined);
  const [
    draftExpiryTo,
    setDraftExpiryTo,
  ] = useState<Date | undefined>(undefined);
  const [
    editingDriver,
    setEditingDriver,
  ] = useState<FleetDriver | null>(null);
  const [
    reminderDriver,
    setReminderDriver,
  ] = useState<FleetDriver | null>(null);
  const remindersQuery = useDriverLicenceReminders();
  const reminderByDriver = useMemo(
    () => new Map((remindersQuery.data?.data ?? []).map(r => [
      r.driverId,
      r,
    ])),
    [remindersQuery.data],
  );

  const stats = useMemo(
    () => {
      const total = rows.length;
      const valid = rows.filter(r => r.status === "valid").length;
      return {
        total,
        valid,
        expiring: rows.filter(r => r.status === "expiring").length,
        expired: rows.filter(r => r.status === "expired").length,
        complianceRate: total ? Math.round((valid / total) * 100) : 0,
      };
    },
    [rows],
  );

  const filteredRows = useMemo(
    () => {
      const q = searchQuery.trim().toLowerCase();
      const from = expiryFrom ? toDateParam(expiryFrom) : null;
      const to = expiryTo ? toDateParam(expiryTo) : null;
      return rows.filter(({
        driver, status,
      }) => {
        if (statusFilter !== "all" && status !== statusFilter)
          return false;
        if (from || to) {
          // An unknown expiry date can't be placed inside a date window.
          if (!driver.licenseExpiryDate)
            return false;
          const expiry = toDateParam(driver.licenseExpiryDate);
          if ((from && expiry < from) || (to && expiry > to))
            return false;
        }
        if (!q)
          return true;
        return [
          driver.name,
          driver.phone,
          driver.email,
          driver.licenseNumber,
        ].some(v => v?.toLowerCase().includes(q));
      });
    },
    [
      rows,
      searchQuery,
      statusFilter,
      expiryFrom,
      expiryTo,
    ],
  );
  const pager = useClientPage(filteredRows);
  const hasActiveFilters = !!searchQuery.trim() || statusFilter !== "all" || !!expiryFrom || !!expiryTo;
  const activeFilterCount = [
    statusFilter !== "all",
    !!(expiryFrom || expiryTo),
  ].filter(Boolean).length;

  const handleExportData = () => {
    if (!filteredRows.length) {
      toast.info("No driver licences to export");
      return;
    }
    const header = [
      "Driver",
      "Phone Number",
      "Email",
      "Licence Number",
      "Status",
      "Expiry Date",
      "Days Until Expiry",
    ];
    const lines = filteredRows.map(({
      driver, status, daysLeft,
    }) => [
      driver.name,
      driver.phone,
      driver.email,
      driver.licenseNumber,
      status ? statusLabels[status] : "",
      driver.licenseExpiryDate ? toDateParam(driver.licenseExpiryDate) : "",
      daysLeft,
    ].map(csvCell).join(","));
    const blob = new Blob(
      [
        [
          header.join(","),
          ...lines,
        ].join("\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driver-licences-${toDateParam(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Exported driver licences");
  };

  const kpiValue = (value: string | number) => (isLoading ? "-" : value);

  return (
    <div>
      <PageHeader
        title="Driver Compliance"
        description="Details and current information your drivers compliance."
      />
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className={kpiCardClass}>
            <div className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Total Driver Licences</p>
                <p className="text-xl font-bold truncate">{kpiValue(stats.total)}</p>
              </div>
            </div>
          </div>
          <div className={kpiCardClass}>
            <div className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Valid</p>
                <p className="text-xl font-bold truncate text-success">{kpiValue(stats.valid)}</p>
              </div>
            </div>
          </div>
          <div className={kpiCardClass}>
            <div className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Expiring Soon</p>
                <p className="text-xl font-bold truncate text-warning">{kpiValue(stats.expiring)}</p>
              </div>
            </div>
          </div>
          <div className={kpiCardClass}>
            <div className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Expired</p>
                <p className="text-xl font-bold truncate text-destructive">{kpiValue(stats.expired)}</p>
              </div>
            </div>
          </div>
          <div className={kpiCardClass}>
            <div className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Compliance Rate</p>
                <p className="text-xl font-bold truncate">{kpiValue(`${stats.complianceRate}%`)}</p>
              </div>
            </div>
          </div>
        </div>

        {stats.expired > 0 && (
          <div className="rounded-2xl surface-sleek text-card-foreground bg-destructive/10 border-destructive/30">
            <div className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">{`${stats.expired} driver licence(s) have expired`}</p>
                <p className="text-sm text-muted-foreground">These drivers should not be dispatched until their licences are renewed.</p>
              </div>
            </div>
          </div>
        )}

        <div className={kpiCardClass}>
          <div className="flex flex-col p-6 pb-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
                  <IdCard className="h-5 w-5 text-primary" />
                  {`Driver Licences (${filteredRows.length})`}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Driver's licence validity and expiry dates.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by driver, phone, email or licence number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setDraftStatus(v);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl px-3.5 w-full sm:w-[170px] bg-card/50 border-border/50">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Popover
                open={isFilterOpen}
                onOpenChange={setIsFilterOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
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
                  className="w-80 space-y-4 max-h-[70vh] overflow-y-auto"
                >
                  <Label className="text-sm font-semibold">Show Driver Licences</Label>
                  <div className="space-y-2">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={draftStatus}
                      onValueChange={setDraftStatus}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="valid">Valid</SelectItem>
                        <SelectItem value="expiring">Expiring Soon</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="drv-cmp-flt-expiry"
                        checked={draftEnableExpiry}
                        onCheckedChange={c => setDraftEnableExpiry(c === true)}
                      />
                      <Label
                        htmlFor="drv-cmp-flt-expiry"
                        className="text-xs cursor-pointer"
                      >
                        Expiry Date
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      {([
                        [
                          draftExpiryFrom,
                          setDraftExpiryFrom,
                          "From",
                        ],
                        [
                          draftExpiryTo,
                          setDraftExpiryTo,
                          "To",
                        ],
                      ] as const).map(([
                        date,
                        setDate,
                        label,
                      ], i) => (
                        <div
                          key={label}
                          className="contents"
                        >
                          {i === 1 && <span className="text-xs text-muted-foreground">to</span>}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!draftEnableExpiry}
                                className={cn(
                                  "h-9 flex-1 justify-start text-left font-normal",
                                  !date && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                {date ? formatDayMonth(date) : label}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setStatusFilter(draftStatus);
                        setExpiryFrom(draftEnableExpiry ? draftExpiryFrom : undefined);
                        setExpiryTo(draftEnableExpiry ? draftExpiryTo : undefined);
                        setIsFilterOpen(false);
                      }}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setStatusFilter("all");
                        setExpiryFrom(undefined);
                        setExpiryTo(undefined);
                        setDraftStatus("all");
                        setDraftEnableExpiry(false);
                        setDraftExpiryFrom(undefined);
                        setDraftExpiryTo(undefined);
                      }}
                    >
                      Show All
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="p-6 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Licence Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Until Expiry</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      // eslint-disable-next-line react/no-array-index-key -- static placeholders
                      <TableRow key={i}>
                        <TableCell colSpan={8}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : driversQuery.isError
                    ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={8}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Failed to load driver licences.
                          </TableCell>
                        </TableRow>
                      )
                    : filteredRows.length === 0
                      ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell
                              colSpan={8}
                              className="text-center py-8 text-muted-foreground"
                            >
                              {hasActiveFilters ? "No driver licences match your filters." : "No driver licences found."}
                            </TableCell>
                          </TableRow>
                        )
                      : pager.pageRows.map(({
                          driver, status, daysLeft,
                        }) => (
                          <TableRow key={driver.id}>
                            <TableCell className="font-medium">{driver.name || "-"}</TableCell>
                            <TableCell>{driver.phone || "-"}</TableCell>
                            <TableCell
                              className="text-muted-foreground max-w-[200px] truncate"
                              title={driver.email ?? undefined}
                            >
                              {driver.email || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{driver.licenseNumber || "-"}</TableCell>
                            <TableCell>
                              {status
                                ? (
                                    <div className={cn(
                                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                      statusColors[status],
                                    )}
                                    >
                                      {statusLabels[status]}
                                    </div>
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell>{formatDate(driver.licenseExpiryDate)}</TableCell>
                            <TableCell className={cn(
                              status === "expired" && "text-destructive",
                              status === "expiring" && "text-warning",
                            )}
                            >
                              {daysLeft === null
                                ? "-"
                                : daysLeft < 0
                                  ? `Expired ${Math.abs(daysLeft)} days ago`
                                  : daysLeft === 0 ? "Expires today" : `${daysLeft} days`}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Actions for ${driver.name}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-popover border-border"
                                >
                                  <DropdownMenuItem onClick={() => setEditingDriver(driver)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Update Licence
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setReminderDriver(driver)}>
                                    <Bell className="h-4 w-4 mr-2" />
                                    {reminderByDriver.has(driver.id) ? "Edit Reminder" : "Set Reminders"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
              </TableBody>
            </Table>
            <FleetTablePager
              page={pager.page}
              pageSize={pager.pageSize}
              total={pager.total}
              onPageChange={pager.setPage}
            />
          </div>
        </div>
      </div>

      <SetLicenceReminderDialog
        driver={reminderDriver}
        reminder={reminderDriver ? reminderByDriver.get(reminderDriver.id) : undefined}
        onOpenChange={(open) => {
          if (!open)
            setReminderDriver(null);
        }}
      />
      <UpdateDriverLicenceDialog
        driver={editingDriver}
        onOpenChange={(open) => {
          if (!open)
            setEditingDriver(null);
        }}
      />
    </div>
  );
}
