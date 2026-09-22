import type { ReactNode } from "react";
import type {
  InstallationJob,
  Installer,
  InstallerStatus,
} from "@/features/installers/demoData";
import { useMemo } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { installerName } from "@/features/installers/demoData";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";
import {
  InstallerStatusBadge,
  JobStatusBadge,
} from "./InstallerStatusBadge";

function fmt(iso?: string) {
  return iso
    ? new Date(iso).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      )
    : "—";
}

type Props = {
  installer: Installer | null;
  jobs: InstallationJob[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStartEdit?: () => void;
  onStatusChange: (id: string, status: InstallerStatus) => void;
};

export function InstallerProfileDialog({
  installer,
  jobs,
  open,
  onOpenChange,
  onStartEdit,
  onStatusChange,
}: Props) {
  const {
    confirm, confirmDialog,
  } = useConfirmAction();

  const myJobs = useMemo(
    () => (installer ? jobs.filter(j => j.installerId === installer.id) : []),
    [
      jobs,
      installer,
    ],
  );

  if (!installer)
    return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {installerName(installer)}
            <InstallerStatusBadge status={installer.status} />
          </DialogTitle>
          <DialogDescription>
            {installer.id}
            {" · "}
            {installer.city}
            ,
            {" "}
            {installer.state}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Job History</TabsTrigger>
            <TabsTrigger value="access">Account &amp; Access</TabsTrigger>
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
              value={installer.id}
            />
            <Info
              label="Email"
              value={installer.email}
            />
            <Info
              label="Phone number"
              value={installer.phone}
            />
            <Info
              label="Account status"
              value={<InstallerStatusBadge status={installer.status} />}
            />
            <Info
              label="Service area"
              value={installer.serviceAreas.join(", ")}
            />
            <Info
              label="Capabilities"
              value={installer.capabilities.join(", ")}
            />
            <Info
              label="Supported devices"
              value={installer.deviceTypes.join(", ")}
            />
            <Info
              label="Supported vehicles"
              value={installer.vehicleTypes.join(", ")}
            />
            <Info
              label="Date onboarded"
              value={fmt(installer.dateAdded)}
            />
            <Info
              label="Last activity"
              value={fmt(installer.lastActivity)}
            />
          </TabsContent>

          <TabsContent
            value="history"
            className="mt-4"
          >
            <div className="overflow-x-auto rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myJobs.map(j => (
                    <TableRow key={j.id}>
                      <TableCell className="font-medium">{j.id}</TableCell>
                      <TableCell>{j.customer.name}</TableCell>
                      <TableCell>{j.vehicle.registration}</TableCell>
                      <TableCell>
                        {j.device.manufacturer}
                        {" "}
                        {j.device.model}
                      </TableCell>
                      <TableCell>{j.scheduledDate}</TableCell>
                      <TableCell>
                        {j.customer.city}
                        ,
                        {" "}
                        {j.customer.state}
                      </TableCell>
                      <TableCell><JobStatusBadge status={j.status} /></TableCell>
                      <TableCell>{fmt(j.completedAt)}</TableCell>
                    </TableRow>
                  ))}
                  {myJobs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No installation history for this installer.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent
            value="access"
            className="mt-4 space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Info
                label="Login email"
                value={installer.loginEmail}
              />
              <Info
                label="Account setup"
                value={
                  installer.accountSetup === "activation_email"
                    ? "Activation email"
                    : "Temporary password"
                }
              />
              <Info
                label="Account status"
                value={<InstallerStatusBadge status={installer.status} />}
              />
              <Info
                label="Last activity"
                value={fmt(installer.lastActivity)}
              />
            </div>

            <Badge
              variant="secondary"
              className="rounded-full"
            >
              Installation jobs are assigned automatically by the system
            </Badge>

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
              {installer.status === "suspended"
                ? (
                    <Button
                      onClick={() =>
                        confirm({
                          title: "Reactivate this installer?",
                          description: "They will be able to sign in and receive new installation jobs again.",
                          confirmLabel: "Reactivate account",
                          destructive: false,
                          onConfirm: () => {
                            onStatusChange(
                              installer.id,
                              "active",
                            );
                            toast.success("Installer reactivated.");
                          },
                        })}
                    >
                      Reactivate account
                    </Button>
                  )
                : (
                    <Button
                      variant="destructive"
                      onClick={() =>
                        confirm({
                          title: "Suspend this installer?",
                          description: "They will no longer be able to sign in or be assigned new installation jobs.",
                          confirmLabel: "Suspend account",
                          onConfirm: () => {
                            onStatusChange(
                              installer.id,
                              "suspended",
                            );
                            toast.success("Installer suspended.");
                          },
                        })}
                    >
                      Suspend account
                    </Button>
                  )}
            </div>
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
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{value || "—"}</div>
    </div>
  );
}
