import { formatTime } from "@truckmoov/app-core/utils/time-utils";
import {
  Navigation, RefreshCw, Truck,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { cn } from "@/lib/utils";

type Vehicle = {
  id: string;
  registrationNumber: string;
  status: string;
  location?: {
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
  };
  currentDriver?: string;
};

type Driver = {
  id: string;
  name: string;
  phone?: string;
  status: string;
};

type Job = {
  id: string;
  vehicleId?: string;
  status: string;
  pickup: { address: string };
  delivery: { address: string };
  deadline: Date;
};

type LiveTrackingMapProps = {
  vehicles: Vehicle[];
  drivers: Driver[];
  jobs?: Job[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  onDispatchClick: () => void;
};

export function LiveTrackingMap({
  vehicles,
  drivers,
  jobs = [],
  selectedVehicleId,
  onSelectVehicle,
  onDispatchClick,
}: LiveTrackingMapProps) {
  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);
  const [
    lastUpdate,
    setLastUpdate,
  ] = useState(new Date());

  const activeVehicles = vehicles.filter(v => v.status === "active");

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLastUpdate(new Date());
    setTimeout(
      setIsRefreshing,
      1000,
      false,
    );
  };

  const getDriverName = (driverId?: string) => {
    if (!driverId)
      return "Unassigned";
    const driver = drivers.find(d => d.id === driverId);
    return driver?.name || "Unknown Driver";
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const selectedDriver = selectedVehicle?.currentDriver
    ? drivers.find(d => d.id === selectedVehicle.currentDriver)
    : null;

  // Find active job for selected vehicle
  const selectedVehicleJob = selectedVehicle
    ? jobs.find(j => j.vehicleId === selectedVehicle.id && [
        "assigned",
        "accepted",
        "in_progress",
      ].includes(j.status))
    : null;

  // Calculate ETA (mock calculation based on deadline)
  const getETA = (job: Job | null) => {
    if (!job)
      return null;
    const now = new Date();
    const deadline = new Date(job.deadline);
    const diffMs = deadline.getTime() - now.getTime();
    if (diffMs <= 0)
      return "Arrived";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60)
      return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  // Lagos coordinates for the map center
  const lagosLat = 6.5244;
  const lagosLng = 3.3792;

  // OpenStreetMap embed URL
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lagosLng - 0.15}%2C${lagosLat - 0.1}%2C${lagosLng + 0.15}%2C${lagosLat + 0.1}&layer=mapnik&marker=${lagosLat}%2C${lagosLng}`;

  // Vehicle positions on the map overlay (percentages for positioning)
  const vehiclePositions = [
    {
      left: "35%", top: "45%",
    },
    {
      left: "55%", top: "35%",
    },
    {
      left: "45%", top: "60%",
    },
    {
      left: "65%", top: "50%",
    },
    {
      left: "30%", top: "65%",
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Live Fleet Tracking
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Updated:
              {" "}
              {formatTime(lastUpdate)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isRefreshing && "animate-spin",
              )}
              />
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={onDispatchClick}
            >
              <Truck className="h-4 w-4" />
              Dispatch Job
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[500px]">
          {/* OpenStreetMap Iframe */}
          <iframe
            title="Lagos Fleet Map"
            src={mapUrl}
            className="absolute inset-0 w-full h-full border-0"
            style={{ filter: "saturate(0.9) contrast(1.05)" }}
            loading="lazy"
          />

          {/* Map Overlay for Interactivity */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Vehicle Markers */}
            {activeVehicles.map((vehicle, index) => {
              const pos = vehiclePositions[index] || vehiclePositions[0];
              const isMoving = vehicle.location?.speed && vehicle.location.speed > 0;
              const isSelected = selectedVehicleId === vehicle.id;

              return (
                <button
                  key={vehicle.id}
                  onClick={() => onSelectVehicle(vehicle.id)}
                  className={cn(
                    "pointer-events-auto absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 z-10 group",
                    isSelected && "scale-125 z-20",
                  )}
                  style={{
                    left: pos.left, top: pos.top,
                  }}
                >
                  <div
                    className={cn(
                      "relative flex h-11 w-11 items-center justify-center rounded-full border-3 border-white shadow-xl transition-transform group-hover:scale-110",
                      isMoving ? "bg-success" : "bg-warning",
                    )}
                    style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}
                  >
                    <Truck className="h-5 w-5 text-white" />
                    {isMoving && (
                      <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-md">
                        {vehicle.location?.speed}
                      </div>
                    )}
                  </div>
                  {/* Label */}
                  <div className="mt-1 whitespace-nowrap rounded-md bg-background/95 px-2 py-1 text-xs font-semibold shadow-lg border border-border">
                    {vehicle.registrationNumber}
                  </div>
                  {/* Pulse */}
                  {isMoving && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-11 w-11 rounded-full bg-success animate-ping opacity-30" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Location Info */}
          <div className="absolute top-4 left-4 rounded-lg bg-background/95 backdrop-blur-sm border border-border px-4 py-2 z-20 shadow-lg">
            <p className="text-sm font-semibold">Lagos, Nigeria</p>
            <p className="text-xs text-muted-foreground">
              {activeVehicles.length}
              {" "}
              vehicles active
            </p>
          </div>

          {/* Selected Vehicle Info */}
          {selectedVehicle && (
            <div className="absolute bottom-4 left-4 w-80 z-20">
              <Card className="bg-background/95 backdrop-blur-sm shadow-xl border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full shadow-md",
                        selectedVehicle.location?.speed ? "bg-success" : "bg-warning",
                      )}
                      >
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{selectedVehicle.registrationNumber}</p>
                        <p className="text-xs text-muted-foreground capitalize">{selectedVehicle.status}</p>
                      </div>
                    </div>
                    <Badge
                      variant={selectedVehicle.location?.speed ? "default" : "secondary"}
                      className="text-sm px-3 py-1"
                    >
                      {selectedVehicle.location?.speed ? `${selectedVehicle.location.speed} km/h` : "Idle"}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Driver</span>
                      <span className="font-medium">{getDriverName(selectedVehicle.currentDriver)}</span>
                    </div>
                    {selectedDriver?.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium">{selectedDriver.phone}</span>
                      </div>
                    )}
                    {selectedVehicleJob
                      ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Start</span>
                              <span
                                className="font-medium text-right max-w-[180px] truncate"
                                title={selectedVehicleJob.pickup.address}
                              >
                                {selectedVehicleJob.pickup.address}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">End</span>
                              <span
                                className="font-medium text-right max-w-[180px] truncate"
                                title={selectedVehicleJob.delivery.address}
                              >
                                {selectedVehicleJob.delivery.address}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ETA</span>
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                {getETA(selectedVehicleJob)}
                              </Badge>
                            </div>
                          </>
                        )
                      : (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trip</span>
                            <span className="text-muted-foreground italic">No active trip</span>
                          </div>
                        )}
                    {selectedVehicle.location && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coordinates</span>
                        <span className="font-mono text-xs">
                          {selectedVehicle.location.lat.toFixed(4)}
                          ,
                          {selectedVehicle.location.lng.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 rounded-lg bg-background/95 backdrop-blur-sm border border-border p-3 z-20 shadow-lg">
            <p className="text-xs font-semibold mb-2">Vehicle Status</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-success shadow-sm" />
                <span className="text-xs">Moving</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-warning shadow-sm" />
                <span className="text-xs">Idle</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
