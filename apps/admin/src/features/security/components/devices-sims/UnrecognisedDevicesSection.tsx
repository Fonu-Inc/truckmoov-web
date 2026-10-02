import type {
  UnrecognisedDevice, UnrecognisedDevices,
} from "@truckmoov/api/auth";
import type { PendingUnrecognisedAction } from "./UnrecognisedDeviceActionDialog";
import { formatDateInTimezone } from "@truckmoov/app-core/utils/time-utils";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { usePreferences } from "@/contexts/PreferencesContext";
import { SectionCard } from "./SectionCard";
import { UnrecognisedDeviceActionDialog } from "./UnrecognisedDeviceActionDialog";

type Props = {
  report: UnrecognisedDevices | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  canAct: boolean;
};

const HELD_BACK_NOTE = "Messages from these devices are held back. Nothing is stored or shown on any map.";

const STATUS_LABEL = {
  dismissed: "Dismissed", blocked: "Blocked",
} as const;

function UnrecognisedRow({
  device,
  canAct,
  onAct,
}: {
  device: UnrecognisedDevice;
  canAct: boolean;
  onAct: (pending: PendingUnrecognisedAction) => void;
}) {
  const { timezone } = usePreferences();
  const format = (value: string) => formatDateInTimezone(
    value,
    timezone,
    {
      dateStyle: "medium", timeStyle: "short",
    },
  );
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{device.imei}</p>
        {device.status !== "active" && <Badge variant="secondary">{STATUS_LABEL[device.status]}</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">
        {`First message ${format(device.firstSeenAt)} · Last message ${format(device.lastSeenAt)}`}
      </p>
      <p className="text-xs text-warning">{`${device.messageCount} messages held back`}</p>
      {canAct && device.status === "blocked" && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAct({
              device, action: "unblock",
            })}
          >
            Unblock
          </Button>
        </div>
      )}
      {canAct && device.status !== "blocked" && (
        <div className="flex gap-2 pt-1">
          {device.status === "active" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAct({
                device, action: "dismiss",
              })}
            >
              Dismiss
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAct({
              device, action: "block",
            })}
          >
            Block
          </Button>
        </div>
      )}
    </div>
  );
}

export function UnrecognisedDevicesSection({
  report,
  isLoading,
  isError,
  onRetry,
  canAct,
}: Props) {
  const [
    pending,
    setPending,
  ] = useState<PendingUnrecognisedAction | null>(null);
  const unreachable = report?.trackingReachable === false;
  return (
    <>
      <SectionCard
        title="Unrecognised devices sending data"
        description="Devices that are not registered to any company but keep sending messages."
        rows={unreachable ? [] : report?.devices ?? []}
        isLoading={isLoading}
        isError={isError || unreachable}
        errorTitle={unreachable ? "We could not check right now" : undefined}
        onRetry={onRetry}
        emptyText="No unrecognised device has sent data."
        rowKey={d => d.imei}
        footer={!isLoading && !isError && !unreachable && <p className="text-xs text-muted-foreground">{HELD_BACK_NOTE}</p>}
        renderRow={device => (
          <UnrecognisedRow
            device={device}
            canAct={canAct}
            onAct={setPending}
          />
        )}
      />
      <UnrecognisedDeviceActionDialog
        pending={pending}
        onClose={() => setPending(null)}
      />
    </>
  );
}
