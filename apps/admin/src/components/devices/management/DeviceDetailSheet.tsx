import type {
  SystemDeviceInventoryItem,
  SystemSimItem,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import { getSystemDeviceQueryOptions } from "@truckmoov/api/auth";
import {
  Battery,
  Cpu,
  Signal,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Progress } from "@/components/shadcn/progress";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  formatLastSeen,
  formatStatusLabel,
  getStatusBadgeClass,
} from "./deviceStatus";

type DeviceDetailSheetProps = {
  device: SystemDeviceInventoryItem | null;
  sim: SystemSimItem | undefined;
  onClose: () => void;
};

function Row({
  label, value, mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono" : undefined}>{value}</span>
    </div>
  );
}

function MeterRow({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null | undefined;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-medium">{value === null || value === undefined ? "N/A" : `${value}%`}</span>
      </div>
      <Progress
        value={value ?? 0}
        className="h-2"
      />
    </div>
  );
}

function SimCard({ sim }: { sim: SystemSimItem | undefined }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">SIM Card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sim
          ? (
              <>
                <Row
                  label="ICCID"
                  value={sim.iccid}
                  mono
                />
                <Row
                  label="Phone Number"
                  value={sim.msisdn ?? "—"}
                  mono
                />
                <Row
                  label="Carrier"
                  value={sim.carrier}
                />
                <Row
                  label="IMSI"
                  value={sim.imsi ?? "—"}
                  mono
                />
                <Row
                  label="SIM Status"
                  value={formatStatusLabel(sim.status)}
                />
                <div className="space-y-2 rounded-xl border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Data Usage</span>
                    <span className="font-medium">
                      {`${(sim.dataUsageMb / 1024).toFixed(2)} GB of ${(sim.dataLimitMb / 1024).toFixed(2)} GB`}
                    </span>
                  </div>
                  <Progress value={sim.dataLimitMb > 0 ? Math.min(
                    100,
                    Math.round((sim.dataUsageMb / sim.dataLimitMb) * 100),
                  ) : 0}
                  />
                </div>
                <div className="space-y-3 rounded-xl border p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Connection</p>
                  <Row
                    label="Signal Strength"
                    value={sim.signalStrength === null ? "N/A" : `${sim.signalStrength}%`}
                  />
                  <Row
                    label="Network Type"
                    value={sim.networkType ?? "N/A"}
                  />
                </div>
              </>
            )
          : <p className="text-sm text-muted-foreground">No SIM card is linked to this device yet.</p>}
      </CardContent>
    </Card>
  );
}

export function DeviceDetailSheet({
  device,
  sim,
  onClose,
}: DeviceDetailSheetProps) {
  const detailQuery = useQuery({
    ...getSystemDeviceQueryOptions(device?.id ?? ""),
    enabled: Boolean(device?.id),
  });
  const detail = detailQuery.data?.data ?? device;

  return (
    <Dialog
      open={!!device}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span className="block">{`${detail?.manufacturer ?? ""} ${detail?.model ?? ""}`}</span>
              <span className="text-sm font-normal text-muted-foreground font-mono">
                {`IMEI: ${detail?.imei ?? ""}`}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">Device details</DialogDescription>
        </DialogHeader>

        {detail && (
          <div className="mt-6 space-y-4">
            {detailQuery.isLoading && <Skeleton className="h-4 w-56" />}
            {detailQuery.isError && (
              <div className="rounded-lg border border-border/50 bg-card/50 py-4 text-center">
                <p className="text-destructive">Unable to load latest device details.</p>
                <Button
                  variant="link"
                  className="mt-1"
                  onClick={() => detailQuery.refetch()}
                >
                  Try again
                </Button>
              </div>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Lifecycle / Operational</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge className={getStatusBadgeClass(detail.lifecycleStatus)}>
                        {formatStatusLabel(detail.lifecycleStatus)}
                      </Badge>
                      {detail.operationalStatus && detail.operationalStatus !== detail.lifecycleStatus && (
                        <Badge className={getStatusBadgeClass(detail.operationalStatus)}>
                          {formatStatusLabel(detail.operationalStatus)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Seen</p>
                    <p className="text-sm font-medium mt-1">{formatLastSeen(detail.lastSeen)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenant assigned to</p>
                    <p className="text-sm font-medium mt-1 max-w-[220px] truncate">
                      {detail.tenantName ?? "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Protocol</p>
                    <p className="text-sm font-medium mt-1 uppercase">{detail.protocol ?? "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <SimCard sim={sim} />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Device Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <MeterRow
                  icon={<Signal className="h-4 w-4 text-muted-foreground" />}
                  label="Signal Strength"
                  value={detail.signalStrength}
                />
                <MeterRow
                  icon={<Battery className="h-4 w-4 text-muted-foreground" />}
                  label="Battery Level"
                  value={detail.batteryLevel}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row
                  label="Firmware Version"
                  value={detail.firmwareVersion ?? "Unknown"}
                  mono
                />
                <Row
                  label="Manufacturer"
                  value={detail.manufacturer}
                />
                <Row
                  label="Model"
                  value={detail.model || "N/A"}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
