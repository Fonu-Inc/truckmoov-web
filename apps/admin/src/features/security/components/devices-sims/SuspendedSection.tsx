import type {
  SystemAuditLogEntry,
  SystemDeviceInventoryItem,
  SystemSimItem,
} from "@truckmoov/api/auth";
import {
  useReinstateSystemDevice,
  useSuspendSystemSim,
} from "@truckmoov/api/auth";
import { formatDateInTimezone } from "@truckmoov/app-core/utils/time-utils";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";
import {
  actorName,
  deviceLabel,
  latestByResource,
  reasonText,
  simLabel,
} from "./devicesSimsData";
import { SectionCard } from "./SectionCard";

type Base = {
  names: Map<string, string>;
  history: SystemAuditLogEntry[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  canAct: boolean;
};

const DEVICE_EFFECT = "Marked suspended and removed from its vehicle; it may still send locations.";
const SIM_EFFECT = "Marked suspended in our system. The mobile network has not been told, so the SIM can still use data.";

function RowText({
  title,
  company,
  since,
  by,
  reason,
  effect,
}: {
  title: string;
  company: string;
  since: string;
  by: string;
  reason: string;
  effect: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">
        {company}
        {" · "}
        {since}
        {" · By "}
        {by}
        {" · "}
        {reason}
      </p>
      <p className="text-xs text-warning">{effect}</p>
    </div>
  );
}

function useWhen() {
  const { timezone } = usePreferences();
  return (iso: string | null | undefined) =>
    iso
      ? formatDateInTimezone(
          iso,
          timezone,
          { dateStyle: "medium" },
        )
      : "Date not recorded";
}

export function SuspendedDevicesSection({
  devices,
  names,
  history,
  isLoading,
  isError,
  onRetry,
  canAct,
}: Base & { devices: SystemDeviceInventoryItem[] }) {
  const when = useWhen();
  const reinstate = useReinstateSystemDevice();
  const { confirm, confirmDialog } = useConfirmAction();
  const suspendedBy = latestByResource(
    history,
    "system.device.suspended",
  );

  const askReinstate = (device: SystemDeviceInventoryItem) => confirm({
    title: "Reinstate this tracker?",
    description: `${deviceLabel(device)} goes back to being available. It will not be put back on its vehicle; someone must attach it again.`,
    confirmLabel: "Reinstate",
    destructive: false,
    onConfirm: async () => {
      try {
        await reinstate.mutateAsync({ id: device.id });
        toast.success("Tracker reinstated");
      }
      catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not reinstate");
      }
    },
  });

  return (
    <>
      <SectionCard
        title="Suspended devices"
        description="Trackers staff have marked as suspended."
        rows={devices}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        emptyText="No suspended devices."
        rowKey={d => d.id}
        renderRow={(device) => {
          const entry = suspendedBy.get(device.id);
          return (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <RowText
                title={deviceLabel(device)}
                company={device.tenantName ?? names.get(device.tenantId ?? "") ?? "No company"}
                since={`Since ${when(entry?.occurredAt ?? device.updatedAt)}`}
                by={actorName(entry)}
                reason={reasonText(entry)}
                effect={DEVICE_EFFECT}
              />
              {canAct && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reinstate.isPending}
                  onClick={() => askReinstate(device)}
                >
                  Reinstate
                </Button>
              )}
            </div>
          );
        }}
      />
      {confirmDialog}
    </>
  );
}

export function SuspendedSimsSection({
  sims,
  names,
  history,
  isLoading,
  isError,
  onRetry,
  canAct,
}: Base & { sims: SystemSimItem[] }) {
  const when = useWhen();
  const toggle = useSuspendSystemSim();
  const { confirm, confirmDialog } = useConfirmAction();
  const suspendedBy = latestByResource(
    history,
    "system.sim.suspension_changed",
  );

  const askReinstate = (sim: SystemSimItem) => confirm({
    title: "Reinstate this SIM?",
    description: `${simLabel(sim)} will be marked active again in our system.`,
    confirmLabel: "Reinstate",
    destructive: false,
    onConfirm: async () => {
      try {
        await toggle.mutateAsync({
          id: sim.id, data: { suspend: false },
        });
        toast.success("SIM reinstated");
      }
      catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not reinstate");
      }
    },
  });

  return (
    <>
      <SectionCard
        title="Suspended SIMs"
        description="SIM cards staff have marked as suspended."
        rows={sims}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        emptyText="No suspended SIMs."
        rowKey={s => s.id}
        renderRow={(sim) => {
          const entry = suspendedBy.get(sim.id);
          return (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <RowText
                title={simLabel(sim)}
                company={sim.tenantId ? names.get(sim.tenantId) ?? "Unknown company" : "No company"}
                since={`Since ${when(entry?.occurredAt ?? sim.updatedAt)}`}
                by={actorName(entry)}
                reason={reasonText(entry)}
                effect={SIM_EFFECT}
              />
              {canAct && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={toggle.isPending}
                  onClick={() => askReinstate(sim)}
                >
                  Reinstate
                </Button>
              )}
            </div>
          );
        }}
      />
      {confirmDialog}
    </>
  );
}
