import type {
  FleetDevice, Vehicle,
} from "@truckmoov/api/fleet";
import type { VehicleLocation } from "@truckmoov/api/tracking";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useVehicle } from "@truckmoov/api/fleet";
import { getVehicleLocationHistoryQueryOptions } from "@truckmoov/api/tracking";
import {
  formatRelative, formatWithPattern, toDate,
} from "@truckmoov/app-core/utils/time-utils";
import {
  Battery,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  FileText,
  Fuel,
  Gauge,
  Loader2,
  Map as MapIcon,
  MapPin,
  Signal,
  Truck,
  User,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { cn } from "@/lib/utils";
import { GeofenceManagementDialog } from "./GeofenceManagementDialog";

type VehicleDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  driverName: string | null;
};

type SectionState = "loading" | "error" | "ready";

function SectionLoading() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-muted-foreground">We couldn't load this section.</p>
      <Button
        variant="link"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}

function SectionEmpty({
  icon, title, description,
}: {
  icon: LucideIcon; title: string; description: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      className="py-8"
    />
  );
}

const DEVICE_OK: FleetDevice["status"][] = [
  "active",
  "assigned",
  "configured",
];

// The newest fix wins — the history endpoint does not promise an order.
function latestFix(history: VehicleLocation[]): VehicleLocation | null {
  return history.reduce<VehicleLocation | null>(
    (newest, fix) => {
      const at = toDate(fix.fix_time ?? fix.observed_at);
      if (!at)
        return newest;
      const newestAt = newest ? toDate(newest.fix_time ?? newest.observed_at) : null;
      return !newestAt || at > newestAt ? fix : newest;
    },
    null,
  );
}

export function VehicleDetailsSheet({
  open,
  onOpenChange,
  vehicle,
  driverName,
}: VehicleDetailsSheetProps) {
  const [
    isGeofenceOpen,
    setIsGeofenceOpen,
  ] = useState(false);

  // Same query key as the fleet list's useVehicle call, so this is a cache hit
  // rather than a second request.
  const detailsQuery = useVehicle(open ? vehicle?.id ?? "" : "");
  const locationQuery = useQuery(getVehicleLocationHistoryQueryOptions(
    open ? vehicle?.id ?? "" : "",
    1,
  ));

  if (!vehicle)
    return null;

  const details = detailsQuery.data?.data ?? vehicle;
  const devices = details.devices ?? [];
  const maintenanceRecords = details.maintenanceRecords ?? [];
  const trips = details.trips ?? [];

  const detailsState: SectionState = detailsQuery.isPending
    ? "loading"
    : detailsQuery.isError ? "error" : "ready";
  const locationState: SectionState = locationQuery.isPending
    ? "loading"
    : locationQuery.isError ? "error" : "ready";
  const location = latestFix(locationQuery.data?.history ?? []);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <span className="block">{details.registrationNumber}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {details.make}
                  {" "}
                  {details.model}
                  {details.year ? ` (${details.year})` : ""}
                </span>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Vehicle details and history</DialogDescription>
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGeofenceOpen(true)}
              >
                <MapIcon className="mr-2 h-4 w-4" />
                Manage Geofencing
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-4">
            <Tabs
              defaultValue="overview"
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="trips">Trips</TabsTrigger>
              </TabsList>

              <TabsContent
                value="overview"
                className="mt-4 space-y-4"
              >
                {/* Status Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Status</p>
                        <Badge
                          className={cn(
                            "mt-1",
                            details.status === "active" && "bg-success hover:bg-success",
                            details.status === "maintenance" && "bg-warning hover:bg-warning",
                            details.status === "inactive" && "bg-muted hover:bg-muted",
                          )}
                        >
                          {details.status}
                        </Badge>
                      </div>
                      {details.fuelLevelPercent !== null && details.fuelLevelPercent !== undefined && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Fuel Level</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {details.fuelLevelPercent}
                              %
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Vehicle Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VIN</span>
                      <span className="font-mono">{details.vin ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="capitalize">{details.type ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capacity</span>
                      <span>
                        {details.capacity === null ? "—" : `${details.capacity} tons`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Assigned Driver</span>
                      <span>{driverName || details.assignedDriverName || "Unassigned"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Current Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {locationState === "loading" && <SectionLoading />}
                    {locationState === "error" && (
                      <SectionError onRetry={() => void locationQuery.refetch()} />
                    )}
                    {locationState === "ready" && !location && (
                      <SectionEmpty
                        icon={MapPin}
                        title="No location reported"
                        description="This vehicle hasn't sent a GPS fix yet."
                      />
                    )}
                    {locationState === "ready" && location && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Coordinates</span>
                          <span className="font-mono text-xs">
                            {location.latitude?.toFixed(4) ?? "—"}
                            ,
                            {location.longitude?.toFixed(4) ?? "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Speed</span>
                          <span className="flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            {location.speed_kph ?? 0}
                            {" "}
                            km/h
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Update</span>
                          <span>
                            {formatWithPattern(
                              location.fix_time ?? location.observed_at,
                              "PPp",
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="devices"
                className="mt-4 space-y-4"
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" />
                      Devices Attached to this Vehicle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detailsState === "loading" && <SectionLoading />}
                    {detailsState === "error" && (
                      <SectionError onRetry={() => void detailsQuery.refetch()} />
                    )}
                    {detailsState === "ready" && devices.length === 0 && (
                      <SectionEmpty
                        icon={Cpu}
                        title="No devices attached"
                        description="Assign a tracker to this vehicle to see it here."
                      />
                    )}
                    {detailsState === "ready" && devices.map(device => (
                      <div
                        key={device.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                              <Cpu className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">
                                {device.manufacturer}
                                {" "}
                                {device.model}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {device.lifecycleStatus.replace(
                                  /_/g,
                                  " ",
                                )}
                              </p>
                              <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                                IMEI
                                {" "}
                                {device.imei}
                              </p>
                              {(device.signalStrength !== null || device.batteryLevel !== null) && (
                                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                  {device.signalStrength !== null && (
                                    <span className="flex items-center gap-1">
                                      <Signal className="h-3 w-3" />
                                      {device.signalStrength}
                                    </span>
                                  )}
                                  {device.batteryLevel !== null && (
                                    <span className="flex items-center gap-1">
                                      <Battery className="h-3 w-3" />
                                      {device.batteryLevel}
                                      %
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge
                              className={cn(
                                "capitalize",
                                device.status === "faulty" && "bg-destructive hover:bg-destructive",
                                DEVICE_OK.includes(device.status) && "bg-success hover:bg-success",
                                !DEVICE_OK.includes(device.status) && device.status !== "faulty" && "bg-muted hover:bg-muted",
                              )}
                            >
                              {device.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {device.lastSeen ? formatRelative(device.lastSeen) : "Never seen"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="maintenance"
                className="mt-4 space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Maintenance History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detailsState === "loading" && <SectionLoading />}
                    {detailsState === "error" && (
                      <SectionError onRetry={() => void detailsQuery.refetch()} />
                    )}
                    {detailsState === "ready" && maintenanceRecords.length === 0 && (
                      <SectionEmpty
                        icon={Wrench}
                        title="No maintenance records"
                        description="Servicing logged against this vehicle will appear here."
                      />
                    )}
                    {detailsState === "ready" && maintenanceRecords.map(record => (
                      <div
                        key={record.id}
                        className={cn(
                          "rounded-lg border border-border p-3",
                          record.status === "scheduled" && "border-primary/50 bg-primary/5",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {record.status === "completed"
                              ? (
                                  <CheckCircle className="h-4 w-4 text-success" />
                                )
                              : (
                                  <Clock className="h-4 w-4 text-primary" />
                                )}
                            <span className="font-medium">{record.maintenanceType}</span>
                          </div>
                          <Badge
                            variant={record.status === "scheduled" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {record.status.replace(
                              /_/g,
                              " ",
                            )}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatWithPattern(
                              record.completedDate ?? record.scheduledDate,
                              "PPP",
                            )}
                          </div>
                          {record.cost !== null && (
                            <div>
                              Cost:
                              {" "}
                              {record.currency}
                              {" "}
                              {record.cost.toLocaleString()}
                            </div>
                          )}
                          {record.technician && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {record.technician}
                            </div>
                          )}
                          {(record.notes ?? record.description) && (
                            <div className="flex items-start gap-1 mt-2">
                              <FileText className="h-3 w-3 mt-0.5" />
                              {record.notes ?? record.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="trips"
                className="mt-4 space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Recent Trips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detailsState === "loading" && <SectionLoading />}
                    {detailsState === "error" && (
                      <SectionError onRetry={() => void detailsQuery.refetch()} />
                    )}
                    {detailsState === "ready" && trips.length === 0 && (
                      <SectionEmpty
                        icon={MapPin}
                        title="No trips recorded"
                        description="Completed journeys for this vehicle will appear here."
                      />
                    )}
                    {detailsState === "ready" && trips.map((trip, index) => (
                      <div
                        // ponytail: VehicleTrip carries no id and the list is
                        // read-only, so the index is a legitimate key here.
                        // eslint-disable-next-line react/no-array-index-key
                        key={`${trip.date ?? "trip"}-${index}`}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {trip.from ?? "Unknown"}
                              {" → "}
                              {trip.to ?? "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatWithPattern(
                                trip.date,
                                "PPP",
                              )}
                            </p>
                          </div>
                          {trip.status && (
                            <Badge
                              variant="secondary"
                              className="capitalize"
                            >
                              {trip.status}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          {trip.distanceKm !== undefined && (
                            <span>
                              {trip.distanceKm}
                              {" "}
                              km
                            </span>
                          )}
                          {trip.distanceKm !== undefined && trip.durationMinutes !== undefined && (
                            <span>•</span>
                          )}
                          {trip.durationMinutes !== undefined && (
                            <span>
                              {trip.durationMinutes}
                              {" "}
                              min
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
      <GeofenceManagementDialog
        open={isGeofenceOpen}
        onOpenChange={setIsGeofenceOpen}
        preselectedVehicleId={vehicle.id}
      />
    </>
  );
}
