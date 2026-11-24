import type {
  SystemInstallationJob, SystemInstaller,
} from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import type { FilterValues } from "@/components/shadcn/table-toolbar";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemInstallationJobsQueryOptions,
  useReactivateSystemInstaller,
  useSuspendSystemInstaller,
} from "@truckmoov/api/auth";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { ExportButton } from "@/components/shadcn/export-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { INSTALLATIONS_FETCH_LIMIT } from "@/features/installers/hooks/usePlatformInstallations";
import {
  capabilityLabel,
  fromApiState,
  installerName,
} from "@/features/installers/installerOptions";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";
import {
  InstallerStatusBadge, JobStatusBadge,
} from "./InstallerStatusBadge";

// ponytail: mock data from fleetflow parity port — wire to packages/api
// The API records no supported device / vehicle types per installer; fleetflow
// gives every installer it creates the full lists, so those are shown here.
const DEVICE_TYPE_OPTIONS = [
  "GPS Tracker",
  "Fuel Level Sensor",
  "Dashcam",
  "Temperature Sensor",
  "Driver ID Reader",
];
// ponytail: mock data from fleetflow parity port — wire to packages/api
const VEHICLE_TYPE_OPTIONS = [
  "Car",
  "SUV",
  "Van",
  "Pickup",
  "Truck",
  "Trailer",
  "Bus",
  "Motorcycle",
];

function fmt(iso?: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit", month: "short", year: "numeric",
        },
      )
    : "-";
}

// The API records no tenant type or start time per job yet.
const NOT_RECORDED = "Not recorded";
const vehicleLabel = (j: SystemInstallationJob) => (j.firstVehicle ? `${j.firstVehicle.make} ${j.firstVehicle.model}` : "-");
const deviceLabel = (j: SystemInstallationJob) => (j.firstDevice ? `${j.firstDevice.manufacturer} ${j.firstDevice.model}` : "-");
const locationLabel = (j: SystemInstallationJob) => `${j.location.city}, ${fromApiState(j.location.state)}`;
const completedAt = (j: SystemInstallationJob) => (j.status === "completed" ? j.completedAt : null);

/** Fleetflow's `InstallerProfileSheet` (a dialog despite the name), live-wired to the installer and installation-order APIs. */
export function InstallerProfileSheet({
  installer,
  open,
  onOpenChange,
  onStartEdit,
}: {
  installer: SystemInstaller | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStartEdit?: () => void;
}) {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    filters,
    setFilters,
  ] = useState<FilterValues>({});
  const {
    confirm, confirmDialog,
  } = useConfirmAction();
  const suspend = useSuspendSystemInstaller();
  const reactivate = useReactivateSystemInstaller();
  const { data } = useQuery({
    ...getSystemInstallationJobsQueryOptions({
      installerId: installer?.id, page: 1, limit: INSTALLATIONS_FETCH_LIMIT,
    }),
    enabled: open && !!installer,
  });

  if (!installer)
    return null;

  const myJobs = data?.data.items ?? [];
  const accountStatus = installer.status;
  const run = (action: typeof suspend, done: string) => action.mutate(
    { id: installer.id },
    {
      onSuccess: () => toast.success(done),
      onError: error => toast.error(error.message),
    },
  );
  const filteredJobs = myJobs.filter((job) => {
    const query = search.trim().toLowerCase();
    const text = [
      job.customer,
      job.firstVehicle?.make,
      job.firstVehicle?.model,
      job.firstVehicle?.registrationNumber,
      job.firstDevice?.manufacturer,
      job.firstDevice?.model,
      job.location.city,
      fromApiState(job.location.state),
    ].join(" ").toLowerCase();
    return (!query || text.includes(query)) && (status === "all" || job.status === status)
      && (!filters.tenantType?.enabled || !filters.tenantType.value);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {installerName(installer)}
            <InstallerStatusBadge status={accountStatus} />
          </DialogTitle>
          <DialogDescription>
            {installer.code}
            {" · "}
            {installer.city}
            {", "}
            {fromApiState(installer.state)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onStartEdit?.();
            }}
          >
            Edit installer details
          </Button>
          {accountStatus === "suspended"
            ? (
                <Button
                  onClick={() =>
                    confirm({
                      title: "Reactivate this installer?",
                      description:
                        "They will be able to sign in and receive new installation jobs again.",
                      confirmLabel: "Reactivate Installer",
                      destructive: false,
                      onConfirm: () => run(
                        reactivate,
                        "Installer reactivated.",
                      ),
                    })}
                >
                  Reactivate Installer
                </Button>
              )
            : (
                <Button
                  variant="destructive"
                  onClick={() =>
                    confirm({
                      title: "Suspend this installer?",
                      description:
                        "They will no longer be able to sign in or be assigned new installation jobs.",
                      confirmLabel: "Suspend Installer",
                      onConfirm: () => run(
                        suspend,
                        "Installer suspended.",
                      ),
                    })}
                >
                  Suspend Installer
                </Button>
              )}
        </div>

        <Tabs
          defaultValue="overview"
          className="min-w-0"
        >
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Job History</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <Info
              label="Installer name"
              value={installerName(installer)}
            />
            <Info
              label="Installer ID"
              value={installer.code}
            />
            <Info
              label="Email"
              value={installer.email}
            />
            <Info
              label="Phone number"
              value={installer.phoneNumber}
            />
            <Info
              label="Account status"
              value={<InstallerStatusBadge status={accountStatus} />}
            />
            <Info
              label="Service area"
              value={installer.serviceAreas.map(fromApiState).join(", ")}
            />
            <Info
              label="Capabilities"
              value={installer.capabilities.map(capabilityLabel).join(", ")}
            />
            <Info
              label="Supported devices"
              value={DEVICE_TYPE_OPTIONS.join(", ")}
            />
            <Info
              label="Supported vehicles"
              value={VEHICLE_TYPE_OPTIONS.join(", ")}
            />
            <Info
              label="Date onboarded"
              value={fmt(installer.createdAt)}
            />
            <Info
              label="Last activity"
              value={fmt(installer.lastActivityAt)}
            />
          </TabsContent>

          <TabsContent
            value="history"
            className="mt-4 min-w-0"
          >
            <Card className="min-w-0">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Job History</CardTitle>
                    <CardDescription>Installation work and recorded start and completion dates.</CardDescription>
                  </div>
                  <ExportButton
                    rows={filteredJobs}
                    filename="installer-job-history"
                    columns={[
                      {
                        header: "Tenant", accessor: j => j.customer,
                      },
                      {
                        header: "Tenant Type", accessor: () => NOT_RECORDED,
                      },
                      {
                        header: "Vehicle", accessor: j => `${vehicleLabel(j)} · ${j.firstVehicle?.registrationNumber ?? ""}`,
                      },
                      {
                        header: "Device", accessor: deviceLabel,
                      },
                      {
                        header: "Status", accessor: j => j.status,
                      },
                      {
                        header: "Location", accessor: locationLabel,
                      },
                      {
                        header: "Date Started", accessor: () => fmt(),
                      },
                      {
                        header: "Date Completed", accessor: j => fmt(completedAt(j)),
                      },
                    ]}
                  />
                </div>
                <TableToolbar
                  search={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search tenant, vehicle, device or location…"
                  status={status}
                  onStatusChange={setStatus}
                  statusOptions={Array.from(new Set(myJobs.map(j => j.status))).map(value => ({
                    value, label: value.replace(
                      /_/g,
                      " ",
                    ),
                  }))}
                  filterEntity="jobs"
                  filterValues={filters}
                  onFiltersApply={setFilters}
                  filterFields={[
                    {
                      type: "select",
                      key: "tenantType",
                      label: "Tenant type",
                      options: [
                        {
                          value: "Enterprise", label: "Enterprise",
                        },
                        {
                          value: "Owner-Operator", label: "Owner-Operator",
                        },
                      ],
                    },
                  ]}
                />
              </CardHeader>
              <CardContent className="min-w-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Tenant Type</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date Started</TableHead>
                        <TableHead>Date Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map(j => (
                        <TableRow key={j.id}>
                          <TableCell>{j.customer || "-"}</TableCell>
                          <TableCell>{NOT_RECORDED}</TableCell>
                          <TableCell>
                            <div className="font-medium">{vehicleLabel(j)}</div>
                            <div className="text-xs text-muted-foreground">{j.firstVehicle?.registrationNumber}</div>
                          </TableCell>
                          <TableCell>{deviceLabel(j)}</TableCell>
                          <TableCell><JobStatusBadge status={j.status} /></TableCell>
                          <TableCell>{locationLabel(j)}</TableCell>
                          <TableCell>{fmt()}</TableCell>
                          <TableCell>{fmt(completedAt(j))}</TableCell>
                        </TableRow>
                      ))}
                      {filteredJobs.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="py-8 text-center text-muted-foreground"
                          >
                            No matching installation history.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      {confirmDialog}
    </Dialog>
  );
}

function Info({
  label, value,
}: {
  label: string; value: ReactNode;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{value || "-"}</div>
    </div>
  );
}
