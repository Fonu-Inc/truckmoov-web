import { useState } from "react";
import { Vehicle } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import {
  Truck,
  MapPin,
  Gauge,
  Fuel,
  Calendar,
  Wrench,
  Clock,
  CheckCircle,
  FileText,
  Map as MapIcon,
  Cpu,
  Signal,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { GeofenceManagementDialog } from "./GeofenceManagementDialog";

interface VehicleDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  driverName: string | null;
}

// Mock maintenance history
const mockMaintenanceHistory = [
  {
    id: "m1",
    type: "Oil Change",
    date: new Date("2024-11-15"),
    mileage: 45230,
    cost: 25000,
    status: "completed",
    notes: "Synthetic oil, filter replaced",
  },
  {
    id: "m2",
    type: "Tire Rotation",
    date: new Date("2024-10-28"),
    mileage: 42100,
    cost: 15000,
    status: "completed",
    notes: "All tires rotated, pressure checked",
  },
  {
    id: "m3",
    type: "Brake Inspection",
    date: new Date("2024-10-10"),
    mileage: 40500,
    cost: 8000,
    status: "completed",
    notes: "Brake pads at 60%, good condition",
  },
  {
    id: "m4",
    type: "Scheduled Service",
    date: new Date("2024-12-20"),
    mileage: null,
    cost: null,
    status: "scheduled",
    notes: "60,000 km major service",
  },
];

// Mock trip history
const mockTripHistory = [
  {
    id: "t1",
    date: new Date("2024-12-11"),
    from: "Apapa Port",
    to: "Ikeja Industrial",
    distance: 42,
    duration: "1h 15m",
    status: "completed",
  },
  {
    id: "t2",
    date: new Date("2024-12-10"),
    from: "Lekki Free Zone",
    to: "Victoria Island",
    distance: 28,
    duration: "45m",
    status: "completed",
  },
  {
    id: "t3",
    date: new Date("2024-12-09"),
    from: "Oshodi",
    to: "Ikorodu",
    distance: 35,
    duration: "1h 05m",
    status: "completed",
  },
];

export function VehicleDetailsSheet({
  open,
  onOpenChange,
  vehicle,
  driverName,
}: VehicleDetailsSheetProps) {
  const [isGeofenceOpen, setIsGeofenceOpen] = useState(false);
  if (!vehicle) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <span className="block">{vehicle.registrationNumber}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">Vehicle details and history</DialogDescription>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsGeofenceOpen(true)}>
              <MapIcon className="mr-2 h-4 w-4" />
              Manage Geofencing
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="trips">Trips</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Status Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Status</p>
                      <Badge
                        className={cn(
                          "mt-1",
                          vehicle.status === "active" && "bg-success hover:bg-success",
                          vehicle.status === "maintenance" && "bg-warning hover:bg-warning",
                          vehicle.status === "inactive" && "bg-muted hover:bg-muted"
                        )}
                      >
                        {vehicle.status}
                      </Badge>
                    </div>
                    {vehicle.fuelLevel !== undefined && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Fuel Level</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Fuel className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{vehicle.fuelLevel}%</span>
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
                    <span className="font-mono">{vehicle.vin}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize">{vehicle.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capacity</span>
                    <span>{vehicle.capacity} tons</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Assigned Driver</span>
                    <span>{driverName || "Unassigned"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Location Info */}
              {vehicle.location && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Current Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coordinates</span>
                      <span className="font-mono text-xs">
                        {vehicle.location.lat.toFixed(4)}, {vehicle.location.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Speed</span>
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {vehicle.location.speed} km/h
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Update</span>
                      <span>{format(vehicle.location.lastUpdate, "PPp")}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="devices" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    Devices Attached to this Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: "dev-1", name: "GPS Tracker", model: "Teltonika FMB920", serial: "IMEI 352093085422318", status: "online", lastSeen: "2 mins ago", icon: Radio },
                    { id: "dev-2", name: "OBD-II Reader", model: "Calamp LMU-3030", serial: "SN A4F2-9821", status: "online", lastSeen: "5 mins ago", icon: Cpu },
                    { id: "dev-3", name: "SIM Card", model: "MTN M2M (10GB/mo)", serial: "ICCID 8923440100123456789", status: "active", lastSeen: "Live", icon: Signal },
                  ].map((device) => {
                    const Icon = device.icon;
                    return (
                      <div key={device.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{device.name}</p>
                              <p className="text-xs text-muted-foreground">{device.model}</p>
                              <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{device.serial}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge
                              className={cn(
                                device.status === "online" || device.status === "active"
                                  ? "bg-success hover:bg-success"
                                  : "bg-muted hover:bg-muted"
                              )}
                            >
                              {device.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">{device.lastSeen}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    Maintenance History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockMaintenanceHistory.map((record) => (
                    <div
                      key={record.id}
                      className={cn(
                        "rounded-lg border border-border p-3",
                        record.status === "scheduled" && "border-primary/50 bg-primary/5"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {record.status === "completed" ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <Clock className="h-4 w-4 text-primary" />
                          )}
                          <span className="font-medium">{record.type}</span>
                        </div>
                        <Badge variant={record.status === "scheduled" ? "default" : "secondary"}>
                          {record.status}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(record.date, "PPP")}
                        </div>
                        {record.mileage && (
                          <div>Mileage: {record.mileage.toLocaleString()} km</div>
                        )}
                        {record.cost && (
                          <div>Cost: ₦{record.cost.toLocaleString()}</div>
                        )}
                        {record.notes && (
                          <div className="flex items-start gap-1 mt-2">
                            <FileText className="h-3 w-3 mt-0.5" />
                            {record.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trips" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Recent Trips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockTripHistory.map((trip) => (
                    <div key={trip.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {trip.from} → {trip.to}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(trip.date, "PPP")}
                          </p>
                        </div>
                        <Badge variant="secondary">{trip.status}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{trip.distance} km</span>
                        <span>•</span>
                        <span>{trip.duration}</span>
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



