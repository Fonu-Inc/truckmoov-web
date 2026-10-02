import type { UnrecognisedDevice, UnrecognisedDevices } from "@truckmoov/api/auth";
import { formatDateInTimezone } from "@truckmoov/app-core/utils/time-utils";
import { usePreferences } from "@/contexts/PreferencesContext";
import { SectionCard } from "./SectionCard";

type Props = {
  report: UnrecognisedDevices | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

const HELD_BACK_NOTE = "Messages from these devices are held back. Nothing is stored or shown on any map.";

function UnrecognisedRow({ device }: { device: UnrecognisedDevice }) {
  const { timezone } = usePreferences();
  const format = (value: string) => formatDateInTimezone(value, timezone, { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{device.imei}</p>
      <p className="text-xs text-muted-foreground">
        {`First message ${format(device.firstSeenAt)} · Last message ${format(device.lastSeenAt)}`}
      </p>
      <p className="text-xs text-warning">{`${device.messageCount} messages held back`}</p>
    </div>
  );
}

export function UnrecognisedDevicesSection({
  report,
  isLoading,
  isError,
  onRetry,
}: Props) {
  const unreachable = report?.trackingReachable === false;
  return (
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
      renderRow={device => <UnrecognisedRow device={device} />}
    />
  );
}
