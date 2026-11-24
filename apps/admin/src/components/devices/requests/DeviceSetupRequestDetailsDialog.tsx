import type { SystemDeviceSetupRequest } from "@truckmoov/api/auth";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import {
  Building2,
  Calendar,
  Cpu,
  FileText,
  Hash,
  User,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Textarea } from "@/components/shadcn/textarea";
import {
  DeviceSetupKycBadge, DeviceSetupStatusBadge,
} from "./DeviceSetupBadges";
import { TRACKER_TYPE_LABELS } from "./deviceSetupConfig";

type Props = {
  request: SystemDeviceSetupRequest | null;
  isLoading: boolean;
  isError: boolean;
  isBusy: boolean;
  onRetry: () => void;
  onClose: () => void;
  onApprove: (request: SystemDeviceSetupRequest, note: string) => void;
  onReject: (request: SystemDeviceSetupRequest) => void;
};

function Field({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  icon?: typeof Hash;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <div className="font-medium">{children}</div>
    </div>
  );
}

function getUseCaseLabel(request: SystemDeviceSetupRequest) {
  if (request.useCase) {
    return request.useCase.replace(
      /_/g,
      " ",
    );
  }
  return request.simRequired ? "Telemetry + SIM provisioning" : "Telemetry only";
}

export function DeviceSetupRequestDetailsDialog({
  request,
  isLoading,
  isError,
  isBusy,
  onRetry,
  onClose,
  onApprove,
  onReject,
}: Props) {
  const [
    note,
    setNote,
  ] = useState("");

  function close() {
    setNote("");
    onClose();
  }

  const isPending = request?.status === "pending_review";
  const location = [
    request?.city,
    request?.state,
  ].filter(Boolean).join(", ");

  return (
    <Dialog
      open={!!request}
      onOpenChange={(open) => {
        if (!open)
          close();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {request && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Device Request Details
              </DialogTitle>
              <DialogDescription>
                {`Request #${request.id.slice(
                  0,
                  8,
                )} • Submitted ${formatWithPattern(
                  request.createdAt,
                  "MMM d, yyyy 'at' HH:mm",
                )}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {isLoading && <Skeleton className="h-4 w-56" />}
              {isError && (
                <div className="rounded-lg border border-border/50 bg-card/50 py-4 text-center">
                  <p className="text-destructive">Unable to load latest request details.</p>
                  <Button
                    variant="link"
                    className="mt-1"
                    onClick={onRetry}
                  >
                    Try again
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <DeviceSetupStatusBadge
                  status={request.status}
                  withIcon
                />
                <DeviceSetupKycBadge
                  status={request.kycStatus}
                  prefix="KYC"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Organisation"
                  icon={Building2}
                >
                  {request.organisationName ?? request.tenantId}
                </Field>
                <Field
                  label="Requesting Email"
                  icon={User}
                >
                  <span className="break-all text-sm">{request.requestingEmail ?? "-"}</span>
                </Field>
                <Field
                  label="Manufacturer"
                  icon={Cpu}
                >
                  {request.manufacturer}
                </Field>
                <Field
                  label="Number of Devices"
                  icon={Hash}
                >
                  <span className="text-lg">{request.quantity}</span>
                </Field>
                <Field
                  label="Use Case"
                  icon={Wifi}
                >
                  <span className="capitalize">{getUseCaseLabel(request)}</span>
                </Field>
                <Field
                  label="Date Submitted"
                  icon={Calendar}
                  className="col-span-2"
                >
                  {formatWithPattern(
                    request.createdAt,
                    "MMM d, yyyy HH:mm",
                  )}
                </Field>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Model">{request.model}</Field>
                <Field label="Tracker Type">
                  {TRACKER_TYPE_LABELS[request.trackerType] ?? request.trackerType}
                </Field>
                <Field label="SIM Required">{request.simRequired ? "Yes" : "No"}</Field>
                <Field label="Installation Location">{location || "-"}</Field>
                <Field label="Preferred Date">
                  {request.preferredInstallDate
                    ? formatWithPattern(
                        request.preferredInstallDate,
                        "dd MMMM yyyy",
                      )
                    : "-"}
                </Field>
                <Field label="Decided By">{request.decidedBy ?? "-"}</Field>
                <Field label="Decided">
                  {request.decidedAt ? formatWithPattern(
                    request.decidedAt,
                    "dd MMM yyyy HH:mm",
                  ) : "-"}
                </Field>
                <Field label="Assigned To">{request.assignedTo ?? "-"}</Field>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                  {request.notes || (
                    <span className="italic text-muted-foreground">No additional notes provided.</span>
                  )}
                </p>
              </div>

              {request.decisionReason && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {request.status === "rejected" ? "Rejection Reason" : "Decision Note"}
                    </p>
                    <p
                      className={
                        request.status === "rejected"
                          ? "rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                          : "rounded-md bg-muted p-3 text-sm"
                      }
                    >
                      {request.decisionReason}
                    </p>
                  </div>
                </>
              )}

              {(request.timeline ?? []).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Timeline</p>
                    <ol className="space-y-2">
                      {request.timeline.map((entry, index) => (
                        <li
                          key={`${entry.status}-${entry.at}-${index}`}
                          className="flex items-start gap-2 text-xs"
                        >
                          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          <div className="flex-1">
                            <p className="font-medium capitalize">
                              {entry.status.replace(
                                /_/g,
                                " ",
                              )}
                            </p>
                            {entry.note && <p className="text-muted-foreground">{entry.note}</p>}
                          </div>
                          <span className="text-muted-foreground">
                            {formatWithPattern(
                              entry.at,
                              "dd MMM yyyy HH:mm",
                            )}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}

              {isPending && (
                <div className="space-y-2">
                  <Label htmlFor="approve-note">Approval note (optional)</Label>
                  <Textarea
                    id="approve-note"
                    value={note}
                    onChange={event => setNote(event.target.value)}
                    placeholder="Shared with the tenant as the decision note"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={close}
              >
                Close
              </Button>
              {isPending && (
                <>
                  <Button
                    variant="destructive"
                    disabled={isBusy}
                    onClick={() => onReject(request)}
                  >
                    Reject
                  </Button>
                  <Button
                    disabled={isBusy}
                    onClick={() => {
                      onApprove(
                        request,
                        note,
                      );
                      setNote("");
                    }}
                  >
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
