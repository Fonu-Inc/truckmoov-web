import type { SystemInstaller } from "@truckmoov/api/auth";
import type { ReactNode } from "react";
import {
  useReactivateSystemInstaller,
  useResendSystemInstallerInvite,
  useSuspendSystemInstaller,
} from "@truckmoov/api/auth";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import {
  AVAILABILITY_LABEL,
  capabilityLabel,
  fromApiState,
  installerName,
} from "@/features/installers/installerOptions";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";
import { InstallerJobHistory } from "./InstallerJobHistory";
import { InstallerStatusBadge } from "./InstallerStatusBadge";

function fmt(iso?: string | null) {
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
  installer: SystemInstaller | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStartEdit?: () => void;
};

export function InstallerProfileDialog({
  installer,
  open,
  onOpenChange,
  onStartEdit,
}: Props) {
  const {
    confirm, confirmDialog,
  } = useConfirmAction();
  const suspend = useSuspendSystemInstaller();
  const reactivate = useReactivateSystemInstaller();
  const resendInvite = useResendSystemInstallerInvite();

  const run = (
    action: typeof suspend,
    id: string,
    done: string,
  ) => action.mutate(
    { id },
    {
      onSuccess: () => {
        toast.success(done);
        onOpenChange(false);
      },
      onError: error => toast.error(error.message),
    },
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
            {installer.code}
            {" · "}
            {installer.city}
            ,
            {" "}
            {fromApiState(installer.state)}
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
              value={installer.code}
            />
            <Info
              label="Email"
              value={installer.email}
            />
            <Info
              label="Phone"
              value={installer.phoneNumber}
            />
            <Info
              label="Status"
              value={<InstallerStatusBadge status={installer.status} />}
            />
            <Info
              label="Availability"
              value={AVAILABILITY_LABEL[installer.availability]}
            />
            <Info
              label="Service areas"
              value={installer.serviceAreas.map(fromApiState).join(", ")}
            />
            <Info
              label="Capabilities"
              value={installer.capabilities.map(capabilityLabel).join(", ")}
            />
            <Info
              label="Current workload"
              value={`${installer.activeJobs} of ${installer.maxActiveJobs} active jobs`}
            />
            <Info
              label="Jobs completed"
              value={installer.jobsCompleted}
            />
            <Info
              label="Date added"
              value={fmt(installer.createdAt)}
            />
            <Info
              label="Last activity"
              value={fmt(installer.lastActivityAt)}
            />
          </TabsContent>

          <TabsContent
            value="history"
            className="mt-4"
          >
            <InstallerJobHistory installerId={installer.id} />
          </TabsContent>

          <TabsContent
            value="access"
            className="mt-4 space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Info
                label="Login email"
                value={installer.email}
              />
              <Info
                label="Account status"
                value={<InstallerStatusBadge status={installer.status} />}
              />
              <Info
                label="Last activity"
                value={fmt(installer.lastActivityAt)}
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
              {installer.status === "invited" && (
                <Button
                  variant="outline"
                  loading={resendInvite.isPending}
                  onClick={() => run(
                    resendInvite,
                    installer.id,
                    "Invite resent.",
                  )}
                >
                  Resend invite
                </Button>
              )}
              {installer.status === "suspended"
                ? (
                    <Button
                      onClick={() =>
                        confirm({
                          title: "Reactivate this installer?",
                          description: "They will be able to sign in and receive new installation jobs again.",
                          confirmLabel: "Reactivate account",
                          destructive: false,
                          onConfirm: () => run(
                            reactivate,
                            installer.id,
                            "Installer reactivated.",
                          ),
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
                          onConfirm: () => run(
                            suspend,
                            installer.id,
                            "Installer suspended.",
                          ),
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
