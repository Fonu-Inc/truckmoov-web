import type { SystemSimItem } from "@truckmoov/api/auth";
import type { PlatformDevice } from "./deviceStatus";
import { useQuery } from "@tanstack/react-query";
import { getSystemDeviceQueryOptions } from "@truckmoov/api/auth";
import {
  formatRelative,
  formatWithPattern,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Battery,
  Cpu,
  Signal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog as Sheet,
  DialogContent as SheetContent,
  DialogDescription as SheetDescription,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle,
} from "@/components/shadcn/dialog";
import { Progress } from "@/components/shadcn/progress";
import { DeviceLifecycleBadge } from "../DeviceLifecycleBadge";

type DeviceDetailSheetProps = {
  device: PlatformDevice | null;
  sim: SystemSimItem | undefined;
  simLoading: boolean;
  simError: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function SimCardContent({ sim, loading, error }: {
  sim: SystemSimItem | undefined;
  loading: boolean;
  error: boolean;
}) {
  if (!sim && loading) {
    return <p className="text-sm text-muted-foreground">Loading SIM…</p>;
  }
  if (!sim && error) {
    return <p className="text-sm text-muted-foreground">Unable to load SIM.</p>;
  }
  if (!sim) {
    return (
      <p className="text-sm text-muted-foreground">
        No SIM card is linked to this device yet.
      </p>
    );
  }
  const dataUsedMb = sim.dataUsageMb;
  const dataLimitMb = sim.dataLimitMb;
  return (
    <>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">ICCID</span>
        <span className="font-mono">{sim.iccid || "-"}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Phone Number</span>
        <span className="font-mono">{sim.msisdn || "-"}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Carrier</span>
        <span>{sim.carrier || "-"}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">IMSI</span>
        <span className="font-mono">{sim.imsi || "-"}</span>
      </div>
      {sim.status && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">SIM Status</span>
          <span className="capitalize">
            {String(sim.status).replace(
              /_/g,
              " ",
            )}
          </span>
        </div>
      )}
      <div className="space-y-2 rounded-xl border p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Data Usage</span>
          <span className="font-medium">
            {`${(dataUsedMb / 1024).toFixed(2)} GB of ${(dataLimitMb / 1024).toFixed(2)} GB`}
          </span>
        </div>
        <Progress
          value={dataLimitMb > 0 ? Math.min(
            100,
            Math.round((dataUsedMb / dataLimitMb) * 100),
          ) : 0}
        />
      </div>
      <div className="space-y-3 rounded-xl border p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Connection</p>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Signal Strength</span>
          <span className="font-medium">{`${sim.signalStrength ?? 0}%`}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Network Type</span>
          <span>{sim.networkType ?? "-"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Last Active</span>
          <span>
            {formatWithPattern(
              sim.lastActivity,
              "M/d/yyyy, h:mm:ss a",
            )}
          </span>
        </div>
      </div>
    </>
  );
}

/** Fork's "Device Details Sheet" (a centred Dialog aliased as Sheet). */
export function DeviceDetailSheet({
  device,
  sim,
  simLoading,
  simError,
  open,
  onOpenChange,
}: DeviceDetailSheetProps) {
  const detailQuery = useQuery({
    ...getSystemDeviceQueryOptions(device?.id ?? ""),
    enabled: open && Boolean(device?.id),
  });
  const live = detailQuery.data?.data;
  const selectedDevice: PlatformDevice | null = device && live ? {
    ...device, ...live, tenantId: device.tenantId, tenantName: device.tenantName ?? live.tenantName,
  } : device;
  const lifecycle = selectedDevice ? selectedDevice.lifecycleStatus || selectedDevice.operationalStatus : "";
  const secondary = selectedDevice && selectedDevice.operationalStatus !== lifecycle ? selectedDevice.operationalStatus : null;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span className="block">{`${selectedDevice?.manufacturer ?? ""} ${selectedDevice?.model ?? ""}`}</span>
              <span className="text-sm font-normal text-muted-foreground font-mono">
                {`IMEI: ${selectedDevice?.imei ?? ""}`}
              </span>
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">Device details</SheetDescription>
        </SheetHeader>

        {selectedDevice && (
          <div className="mt-6 space-y-4">
            {/* Status & Basic Info */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Lifecycle / Operational</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <DeviceLifecycleBadge status={lifecycle} />
                      {secondary && (
                        <DeviceLifecycleBadge
                          status={secondary}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Seen</p>
                    <p className="text-sm font-medium mt-1">
                      {formatRelative(
                        selectedDevice.lastSeen,
                        "Never",
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenant assigned to</p>
                    <p className="text-sm font-medium mt-1">
                      {selectedDevice.tenantName || (selectedDevice.tenantId ? `${selectedDevice.tenantId.slice(
                        0,
                        8,
                      )}...` : "-")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Protocol</p>
                    <p className="text-sm font-medium mt-1 uppercase">
                      {selectedDevice.protocol || "HTTP"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SIM Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">SIM Card</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SimCardContent sim={sim} loading={simLoading} error={simError} />
              </CardContent>
            </Card>

            {/* Device Health */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Device Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Signal className="h-4 w-4 text-muted-foreground" />
                      <span>Signal Strength</span>
                    </div>
                    <span className="font-medium">
                      {`${selectedDevice.signalStrength ?? 0}%`}
                    </span>
                  </div>
                  <Progress
                    value={selectedDevice.signalStrength ?? 0}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-muted-foreground" />
                      <span>Battery Level</span>
                    </div>
                    <span className="font-medium">
                      {`${selectedDevice.batteryLevel ?? 0}%`}
                    </span>
                  </div>
                  <Progress
                    value={selectedDevice.batteryLevel ?? 0}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Firmware */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Firmware Version</span>
                  <span className="font-mono">{selectedDevice.firmwareVersion || "Unknown"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Manufacturer</span>
                  <span>{selectedDevice.manufacturer}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Model</span>
                  <span>{selectedDevice.model || "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
