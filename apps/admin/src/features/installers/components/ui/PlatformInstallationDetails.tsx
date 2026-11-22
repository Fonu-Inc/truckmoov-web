import type { SystemInstaller } from "@truckmoov/api/auth";
import type { InstallationRecord } from "@/features/installers/utils/platformInstallations";
import { useQuery } from "@tanstack/react-query";
import { getSystemInstallationJobQueryOptions } from "@truckmoov/api/auth";
import { formatDateOnlyInTimezone } from "@truckmoov/app-core/utils/time-utils";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { usePreferences } from "@/contexts/PreferencesContext";
import {
  capabilityLabel, fromApiState, installerName,
} from "@/features/installers/installerOptions";
import { objectValue } from "@/features/installers/utils/platformInstallations";
import { InstallationStatusBadge } from "./InstallationStatusBadge";

/**
 * Fleetflow's `PlatformInstallationDetails` for live records. The installer job,
 * customer booking and procurement request it can also show are fleetflow demo
 * stores with no API here, so their checklist / units / evidence sections fall
 * back to the copy fleetflow shows for a live record.
 *
 * `onAssign` opens fleetflow's "Installation Assignment" dialog. Fleetflow
 * defines that dialog but wires no button to it; the trigger sits on the
 * Assigned Installer heading because opening it closes this dialog, as in
 * fleetflow's `openAssignment`.
 */
export function PlatformInstallationDetails({
  record, onClose, profileOnly = false, installers, onAssign,
}: {
  record: InstallationRecord | null;
  onClose: () => void;
  profileOnly?: boolean;
  installers: SystemInstaller[];
  onAssign?: () => void;
}) {
  const { timezone } = usePreferences();
  const detailQuery = useQuery({
    ...getSystemInstallationJobQueryOptions(record?.id ?? ""),
    enabled: !!record,
  });
  const detail = detailQuery.data?.data;
  if (!record)
    return null;
  const installer = installers.find(i => i.id === record.installerId);
  const liveCustomer = objectValue(record.liveDetails?.customer);
  const customer = detail?.customer;
  const units = detail?.units ?? [];
  const checklist = detail?.checklist;
  const evidence = detail?.evidence ?? [];
  const progress = checklist && checklist.total > 0
    ? Math.round((checklist.completed / checklist.total) * 100)
    : 0;
  return (
    <Dialog
      open={!!record}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{profileOnly ? "Installation Profile" : "Installation Details"}</DialogTitle>
          <DialogDescription>
            {record.reference}
            {" · "}
            {record.customer}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <InstallationStatusBadge status={record.status} />
        </div>
        <section className="space-y-3 border-b pb-4">
          <h3 className="text-base font-semibold">Customer & Fleet</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Customer / Organisation"
              value={customer?.customerName || record.customer}
            />
            <Field
              label="Tenant Type"
              value={customer?.customerType || record.tenantType || "Not recorded"}
            />
            <Field
              label="Fleet / Account"
              value={record.fleet}
            />
            <Field
              label="Customer email"
              value={customer?.email || record.customerEmail}
            />
            <Field
              label="Vehicles included"
              value={record.vehicleCount === null ? "Not recorded" : String(record.vehicleCount)}
            />
            <Field
              label="Devices included"
              value={record.deviceCount == null ? "Not recorded" : String(record.deviceCount)}
            />
            <Field
              label="Site address"
              value={customer?.address || String(liveCustomer.address || "—")}
            />
            <Field
              label="Scheduled date"
              value={customer?.scheduledDate || record.scheduledDate
                ? formatDateOnlyInTimezone(
                    customer?.scheduledDate || record.scheduledDate,
                    timezone,
                  )
                : "—"}
            />
          </dl>
        </section>
        {!profileOnly && (
          <>
            <section className="space-y-3 border-b pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold">Assigned Installer</h3>
                {onAssign && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAssign}
                  >
                    {record.installerId || record.installerName ? "Reassign Installer" : "Assign Installer"}
                  </Button>
                )}
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Installer"
                  value={installer ? installerName(installer) : record.installerName || (record.installerId ? record.installerId : "Awaiting assignment")}
                />
                <Field
                  label="Phone"
                  value={installer?.phoneNumber}
                />
                <Field
                  label="Email"
                  value={installer?.email}
                />
                <Field
                  label="Location"
                  value={installer ? `${installer.city}, ${fromApiState(installer.state)}` : undefined}
                />
                <Field
                  label="Capabilities"
                  value={installer?.capabilities.map(capabilityLabel).join(", ")}
                />
              </dl>
            </section>
            <section className="space-y-3 border-b pb-4">
              <h3 className="text-base font-semibold">Vehicles & Devices</h3>
              {detailQuery.isLoading
                ? <Skeleton className="h-24 w-full" />
                : units.length === 0
                  ? <p className="text-sm text-muted-foreground">Individual vehicle and device identifiers have not been recorded for this booking.</p>
                  : (
                      <Tabs defaultValue="vehicles">
                        <TabsList className="h-auto flex-wrap">
                          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                          <TabsTrigger value="devices">Devices</TabsTrigger>
                          <TabsTrigger value="sims">SIMs</TabsTrigger>
                        </TabsList>
                        <TabsContent value="vehicles">
                          <div className="overflow-x-auto rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Registration</TableHead>
                                  <TableHead>Make / Model</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Device to fit</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {units.map(unit => (
                                  <TableRow key={unit.index}>
                                    <TableCell className="font-mono">{unit.vehicle?.registrationNumber ?? "—"}</TableCell>
                                    <TableCell>
                                      {unit.vehicle
                                        ? `${unit.vehicle.make} ${unit.vehicle.model}`.trim() || "—"
                                        : "—"}
                                    </TableCell>
                                    <TableCell>{unit.vehicle?.vehicleType || "—"}</TableCell>
                                    <TableCell>
                                      {unit.device
                                        ? `${unit.device.manufacturer} ${unit.device.model}`.trim()
                                        : "—"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        <TabsContent value="devices">
                          <div className="overflow-x-auto rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Device</TableHead>
                                  <TableHead>IMEI</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {units.map(unit => (
                                  <TableRow key={unit.index}>
                                    <TableCell>
                                      {unit.device
                                        ? `${unit.device.manufacturer} ${unit.device.model}`.trim()
                                        : "—"}
                                    </TableCell>
                                    <TableCell className="font-mono">{unit.device?.imei ?? "—"}</TableCell>
                                    <TableCell>{unit.device?.statusLabel ?? "—"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        <TabsContent value="sims">
                          <div className="overflow-x-auto rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ICCID</TableHead>
                                  <TableHead>IMSI</TableHead>
                                  <TableHead>Phone number</TableHead>
                                  <TableHead>Carrier</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {units.map(unit => (
                                  <TableRow key={unit.index}>
                                    <TableCell className="font-mono">{unit.sim?.iccid ?? "—"}</TableCell>
                                    <TableCell className="font-mono">{unit.sim?.imsi ?? "—"}</TableCell>
                                    <TableCell className="font-mono">{unit.sim?.msisdn ?? "—"}</TableCell>
                                    <TableCell>{unit.sim?.carrier ?? "—"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
            </section>
            <section className="space-y-3 border-b pb-4">
              <h3 className="text-base font-semibold">Progress & Checklist</h3>
              {checklist
                ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Overall progress</span>
                        <span className="font-medium">{`${checklist.completed}/${checklist.total}`}</span>
                      </div>
                      <Progress
                        value={progress}
                        className="h-2"
                      />
                      <div className="space-y-2">
                        {checklist.groups.flatMap(group => group.items).map(item => (
                          <div
                            key={item.key}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm"
                          >
                            <span>{item.label}</span>
                            <Badge variant={item.checked ? "default" : "outline"}>
                              {item.checked ? "Completed" : "Pending"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                : record.status === "in_progress"
                  ? <p className="text-sm text-muted-foreground">No field checklist has been submitted.</p>
                  : <p className="text-sm text-muted-foreground">{record.installerId || record.installerName ? "The progress checklist has not been included yet. It will appear once the installation is in progress." : "No installer has been assigned yet, so the progress checklist has not been included. It will appear once the installation is in progress."}</p>}
            </section>
            <section className="space-y-3 border-b pb-4">
              <h3 className="text-base font-semibold">Completion Evidence</h3>
              {evidence.length === 0
                ? <p className="text-sm text-muted-foreground">No uploaded completion evidence is recorded.</p>
                : (
                    <ul className="space-y-2">
                      {evidence.map(item => (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 text-sm"
                        >
                          <span>
                            <span className="font-medium">{item.label}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{item.fileName}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateOnlyInTimezone(
                              item.createdAt,
                              timezone,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, value,
}: {
  label: string; value?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}
