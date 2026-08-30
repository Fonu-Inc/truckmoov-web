import type { ColumnDef } from "@tanstack/react-table";
import type {
  DriverCommunicationPreference, DriverInput, DriverStatus, FleetDriver,
} from "@truckmoov/api/fleet";
import type { DriverBulkUploadItem } from "@/components/drivers/DriverBulkUploadDialog";
import type { DriverFormData } from "@/components/drivers/DriverFormDialog";
import {
  useCreateDriver, useDeleteDriver, useDrivers, useImportDrivers, useUpdateDriver,
} from "@truckmoov/api/fleet";
import { useAuthStore } from "@truckmoov/api/lib/auth-store";
import { useSendNotifyMessage } from "@truckmoov/api/notification";
import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  daysUntil, formatDate,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, Eye, Inbox, Mail, MessageSquare,
  MoreHorizontal, Pencil, Phone, Plus, Search, Send, Trash2, Upload, Users,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import { CallInteractionModal } from "@/components/communications/CallInteractionModal";
import { DriverBulkUploadDialog } from "@/components/drivers/DriverBulkUploadDialog";
import { DriverFormDialog } from "@/components/drivers/DriverFormDialog";
import { DriverMessagesInbox } from "@/components/drivers/DriverMessagesInbox";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { useFonuCall } from "@/contexts/FonuCallContext";

const DRIVER_STATUSES: DriverStatus[] = [
  "active",
  "available",
  "offline",
  "suspended",
  "inactive",
];
const COMMUNICATION_PREFERENCES: DriverCommunicationPreference[] = [
  "whatsapp",
  "sms",
  "email",
  "voice",
];

const statusColors: Record<DriverStatus, string> = {
  active: "bg-primary/20 text-primary border-primary/30",
  available: "bg-success/20 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground border-muted",
  offline: "bg-muted text-muted-foreground border-muted",
  suspended: "bg-destructive/20 text-destructive border-destructive/30",
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

export default function DriversPage() {
  const { user } = useAuthStore();
  const driversQuery = useDrivers();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();
  const importDrivers = useImportDrivers();
  const sendMessage = useSendNotifyMessage();
  const {
    startCall, endCall, status: callStatus, durationSeconds,
  } = useFonuCall();

  const [
    showInbox,
    setShowInbox,
  ] = useState(false);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    channelFilter,
    setChannelFilter,
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
  const [
    driverToDelete,
    setDriverToDelete,
  ] = useState<DriverRow | null>(null);

  const drivers = useMemo(
    () => (driversQuery.data?.data ?? []).map(toDriverRow),
    [driversQuery.data?.data],
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
        const matchesChannel = channelFilter === "all"
          || driver.communicationPreference === channelFilter;
        return matchesSearch && matchesStatus && matchesChannel;
      });
    },
    [
      channelFilter,
      drivers,
      searchQuery,
      statusFilter,
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
  const openEdit = (driver: DriverRow) => {
    setSelectedDriver(driver);
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

  const handleDelete = async () => {
    if (!driverToDelete)
      return;
    try {
      await deleteDriver.mutateAsync({ id: driverToDelete.id });
      toast.success("Driver deleted");
      setDriverToDelete(null);
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete driver");
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
    const message = encodeURIComponent(`Hello ${driver.name}, this is Fleet Management.`);
    window.open(
      `https://wa.me/${phone}?text=${message}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

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
            <p className="max-w-40 truncate text-xs text-muted-foreground">
              ID:
              {row.original.id}
            </p>
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
          <p className="max-w-44 truncate text-muted-foreground">{row.original.email || "—"}</p>
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
      accessorKey: "communicationPreference",
      header: "Preferred Channel",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.communicationPreference || "Unknown"}</span>
      ),
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
                  title="More actions"
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
                <DropdownMenuItem onClick={() => openEdit(driver)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDriverToDelete(driver)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
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
  const hasActiveFilters = Boolean(searchQuery.trim())
    || statusFilter !== "all"
    || channelFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setShowInbox(value => !value)}
        >
          <Inbox className="mr-2 h-4 w-4" />
          {showInbox ? "Hide Inbox" : "Message Inbox"}
        </Button>
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

      {showInbox && <DriverMessagesInbox />}

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
              <CardDescription>Roster of drivers with licence, status, and contact details.</CardDescription>
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
            <Select
              value={channelFilter}
              onValueChange={setChannelFilter}
            >
              <SelectTrigger
                aria-label="Filter by preferred channel"
                className="w-full border-border/50 bg-card/50 sm:w-[190px]"
              >
                <SelectValue placeholder="Preferred channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {COMMUNICATION_PREFERENCES.map(channel => (
                  <SelectItem
                    key={channel}
                    value={channel}
                    className="capitalize"
                  >
                    {channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      <Dialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDriver?.name || "Driver details"}</DialogTitle>
            <DialogDescription>Current driver information from the fleet service.</DialogDescription>
          </DialogHeader>
          {selectedDriver && (
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {[
                [
                  "Phone",
                  selectedDriver.phone,
                ],
                [
                  "Email",
                  selectedDriver.email,
                ],
                [
                  "License number",
                  selectedDriver.licenseNumber,
                ],
                [
                  "License expiry",
                  formatDate(selectedDriver.licenseExpiryDate),
                ],
                [
                  "Status",
                  selectedDriver.status,
                ],
                [
                  "Preferred channel",
                  selectedDriver.communicationPreference,
                ],
                [
                  "Assigned vehicle",
                  selectedDriver.assignedVehicleId,
                ],
              ].map(([
                label,
                value,
              ]) => (
                <div
                  key={label}
                  className="rounded-lg border border-border/50 p-3"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium capitalize">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>

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

      <AlertDialog
        open={!!driverToDelete}
        onOpenChange={open => !open && setDriverToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete driver?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes
              {driverToDelete?.name || "this driver"}
              {" "}
              from the fleet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDriver.isPending}>Cancel</AlertDialogCancel>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              loading={deleteDriver.isPending}
              disabled={deleteDriver.isPending}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
