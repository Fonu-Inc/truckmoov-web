import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import { cn } from "@/lib/utils";
import { Vehicle } from "@/types";
import { Truck, Navigation, Gauge, Fuel, Clock } from "lucide-react";

interface VehicleMarkerProps {
  vehicle: Vehicle;
  selected?: boolean;
  onClick?: () => void;
}

export function VehicleMarker({ vehicle, selected, onClick }: VehicleMarkerProps) {
  const statusColors = {
    active: "bg-success",
    inactive: "bg-muted-foreground",
    maintenance: "bg-warning",
    decommissioned: "bg-destructive",
  };

  const isMoving = vehicle.location?.speed && vehicle.location.speed > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer transition-all duration-200",
        selected && "scale-110 z-10"
      )}
    >
      {/* Main marker */}
      <div
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-background shadow-lg",
          statusColors[vehicle.status],
          isMoving && "vehicle-active"
        )}
      >
        <Truck className="h-5 w-5 text-success-foreground" />
        {/* Direction indicator */}
        {vehicle.location && isMoving && (
          <div
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary"
            style={{ transform: `rotate(${vehicle.location.heading}deg)` }}
          >
            <Navigation className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Pulse animation for active */}
      {vehicle.status === "active" && (
        <div
          className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-20",
            statusColors[vehicle.status]
          )}
        />
      )}
    </div>
  );
}

interface VehicleInfoCardProps {
  vehicle: Vehicle;
  driverName?: string;
  className?: string;
}

export function VehicleInfoCard({ vehicle, driverName, className }: VehicleInfoCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-xl animate-fade-in",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              vehicle.status === "active" ? "bg-success" : "bg-muted-foreground"
            )}
          />
          <span className="font-semibold">{vehicle.registrationNumber}</span>
        </div>
        <span className="text-xs text-muted-foreground capitalize">{vehicle.status}</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Truck className="h-4 w-4" />
          <span>
            {vehicle.make} {vehicle.model} ({vehicle.year})
          </span>
        </div>

        {driverName && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
              {driverName.charAt(0)}
            </span>
            <span>{driverName}</span>
          </div>
        )}

        {vehicle.location && (
          <>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gauge className="h-4 w-4" />
              <span>{vehicle.location.speed} km/h</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {formatRelative(vehicle.location.lastUpdate)}
              </span>
            </div>
          </>
        )}

        {vehicle.fuelLevel !== undefined && (
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    vehicle.fuelLevel > 50
                      ? "bg-success"
                      : vehicle.fuelLevel > 25
                      ? "bg-warning"
                      : "bg-destructive"
                  )}
                  style={{ width: `${vehicle.fuelLevel}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{vehicle.fuelLevel}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
