import type { SystemInstaller } from "@truckmoov/api/auth";
import type { InstallationRecord } from "@/features/installers/utils/platformInstallations";
import { formatDateOnlyInTimezone } from "@truckmoov/app-core/utils/time-utils";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
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
  if (!record)
    return null;
  const installer = installers.find(i => i.id === record.installerId);
  const liveCustomer = objectValue(record.liveDetails?.customer);
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
              value={record.customer}
            />
            <Field
              label="Tenant Type"
              value={record.tenantType || "Not recorded"}
            />
            <Field
              label="Fleet / Account"
              value={record.fleet}
            />
            <Field
              label="Customer email"
              value={record.customerEmail}
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
              value={String(liveCustomer.address || "—")}
            />
            <Field
              label="Scheduled date"
              value={record.scheduledDate ? formatDateOnlyInTimezone(
                record.scheduledDate,
                timezone,
              ) : "—"}
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
          <p className="text-sm text-muted-foreground">Individual vehicle and device identifiers have not been recorded for this booking.</p>
        </section>
        <section className="space-y-3 border-b pb-4">
          <h3 className="text-base font-semibold">Progress & Checklist</h3>
          {record.status === "in_progress"
            ? <p className="text-sm text-muted-foreground">No field checklist has been submitted.</p>
            : <p className="text-sm text-muted-foreground">{record.installerId || record.installerName ? "The progress checklist has not been included yet. It will appear once the installation is in progress." : "No installer has been assigned yet, so the progress checklist has not been included. It will appear once the installation is in progress."}</p>}
        </section>
        <section className="space-y-3 border-b pb-4">
          <h3 className="text-base font-semibold">Completion Evidence</h3>
          <p className="text-sm text-muted-foreground">No uploaded completion evidence is recorded.</p>
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
