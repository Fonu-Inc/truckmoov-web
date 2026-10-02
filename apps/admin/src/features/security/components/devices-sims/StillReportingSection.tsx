import type { StillReportingDevice, StillReportingDevices } from "@truckmoov/api/auth";
import { formatDateInTimezone } from "@truckmoov/app-core/utils/time-utils";
import { usePreferences } from "@/contexts/PreferencesContext";
import { SectionCard } from "./SectionCard";

type Props = {
  report: StillReportingDevices | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

const BLOCKING_NOTE = "Our system is blocking these messages; they are not stored.";

export function countsLabel(countsSince: string | null | undefined) {
  return countsSince === "service_restart" ? "since restart" : "in total";
}

function StillReportingRow({ device, since }: { device: StillReportingDevice; since: string }) {
  const { timezone } = usePreferences();
  const lastMessage = formatDateInTimezone(
    device.lastSeenAt,
    timezone,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{device.deviceName}</p>
      <p className="text-xs text-muted-foreground">
        {device.companyName}
        {" · Last message "}
        {lastMessage}
      </p>
      <p className="text-xs text-warning">
        {`${device.droppedToday} blocked today · ${device.droppedTotal} blocked ${since}`}
      </p>
    </div>
  );
}

export function StillReportingSection({
  report,
  isLoading,
  isError,
  onRetry,
}: Props) {
  const unreachable = report?.gateReachable === false;
  const since = countsLabel(report?.countsSince);
  return (
    <SectionCard
      title="Still sending data while suspended"
      description="Suspended trackers that have kept sending messages."
      rows={unreachable ? [] : report?.devices ?? []}
      isLoading={isLoading}
      isError={isError || unreachable}
      errorTitle={unreachable ? "We could not check right now" : undefined}
      onRetry={onRetry}
      emptyText="No suspended device has sent data recently."
      rowKey={d => `${d.imei}-${d.tenantId}`}
      footer={!isLoading && !isError && !unreachable && <p className="text-xs text-muted-foreground">{BLOCKING_NOTE}</p>}
      renderRow={device => <StillReportingRow device={device} since={since} />}
    />
  );
}
