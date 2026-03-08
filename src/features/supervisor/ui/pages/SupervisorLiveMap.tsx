import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FleetMap, type FleetMapVehicle } from "@/components/fleet/FleetMap";
import { GeofenceManagementDialog } from "@/components/fleet/GeofenceManagementDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Truck, AlertTriangle, MapPin, Shield, Search,
  RefreshCw, Maximize2, Navigation, Fuel, Phone, Loader2,
  LogIn, LogOut
} from "lucide-react";
import { DriverCommunicationActions } from "@/components/communications/DriverCommunicationActions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useAlerts } from "@/hooks/useAlerts";
import { useGeofenceRealtime } from "@/hooks/useGeofenceRealtime";
import { cn } from "@/lib/utils";

export default function SupervisorLiveMap() {
  const { vehicles, isLoading: vehiclesLoading, refetch: refetchVehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { alerts } = useAlerts();
  const { recentEvents: geofenceEvents, stats: geofenceStats } = useGeofenceRealtime();

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [geofenceDialogOpen, setGeofenceDialogOpen] = useState(false);

  // Map vehicles with driver info
  const vehiclesWithDrivers = vehicles.map(v => {
    const driver = v.currentDriverId ? drivers.find(d => d.id === v.currentDriverId) : null;
    return {
      id: v.registrationNumber || v.id,
      vehicleId: v.id,
      driver: driver?.name || "Unassigned",
      driverId: driver?.id || "",
      phone: driver?.phone || "",
      status: v.status === "active" ? "moving" : v.status === "maintenance" ? "stopped" : "idle",
      speed: 0,
      fuel: v.fuelLevel || 0,
      destination: "—",
    };
  });

  // Build FleetMapVehicle[] for the map
  const mapVehicles: FleetMapVehicle[] = vehiclesWithDrivers.map(v => ({
    id: v.id,
    driver: v.driver,
    phone: v.phone,
    position: [6.5244, 3.3792] as [number, number],
    heading: 0,
    speed: v.speed,
    status: v.status,
    fuel: v.fuel,
    lastUpdate: "—",
    route: [],
    startLocation: "—",
    destination: v.destination,
    eta: "—",
    networkStatus: "offline" as const,
    batteryVoltage: null,
    signalStrength: null,
  }));

  const filteredVehicles = vehiclesWithDrivers.filter(v =>
    v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.driver.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const movingCount = vehiclesWithDrivers.filter(v => v.status === "moving").length;
  const idleCount = vehiclesWithDrivers.filter(v => v.status === "idle").length;
  const stoppedCount = vehiclesWithDrivers.filter(v => v.status === "stopped").length;

  if (vehiclesLoading) {
    return (
      <DashboardLayout title="Live Map" subtitle="Real-time fleet tracking">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (vehicles.length === 0) {
    return (
      <DashboardLayout title="Live Map" subtitle="Real-time fleet tracking">
        <EmptyState
          icon={Truck}
          title="No vehicles to track"
          description="Add vehicles to your fleet to see them on the live map"
          actionLabel="View Fleet"
          actionHref="/admin/fleet"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Live Map" subtitle="Real-time fleet tracking and monitoring">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-success">{movingCount}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-warning">{idleCount}</p>
                <p className="text-xs text-muted-foreground">Idle</p>
              </CardContent>
            </Card>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{stoppedCount}</p>
                <p className="text-xs text-muted-foreground">Stopped</p>
              </CardContent>
            </Card>
          </div>

          {/* Geofence Activity */}
          <Card className="border-border/50">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Geofence Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-2 p-2 bg-success/10 rounded">
                  <LogIn className="h-3 w-3 text-success" />
                  <span className="text-xs">{geofenceStats.entries} entries</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-warning/10 rounded">
                  <LogOut className="h-3 w-3 text-warning" />
                  <span className="text-xs">{geofenceStats.exits} exits</span>
                </div>
              </div>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {geofenceEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center gap-2 text-xs">
                    {event.event_type === 'ENTER' ? (
                      <LogIn className="h-3 w-3 text-success flex-shrink-0" />
                    ) : (
                      <LogOut className="h-3 w-3 text-warning flex-shrink-0" />
                    )}
                    <span className="truncate flex-1">
                      {(event.geofence as any)?.name || 'Unknown zone'}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0">
                      {new Date(event.occurred_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {geofenceEvents.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No recent geofence activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle List */}
          <Card className="border-border/50 flex-1 flex flex-col min-h-0">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Vehicles ({filteredVehicles.length})
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetchVehicles()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  className="pl-8 h-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-1.5 pr-2">
                  {filteredVehicles.map((vehicle) => (
                    <div
                      key={vehicle.vehicleId}
                      className={cn(
                        "p-2.5 rounded-lg cursor-pointer transition-all",
                        selectedVehicle === vehicle.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                      )}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            vehicle.status === "moving" ? "bg-success" :
                            vehicle.status === "idle" ? "bg-warning" : "bg-destructive"
                          )} />
                          <span className="font-medium text-sm">{vehicle.id}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] capitalize",
                            vehicle.status === "moving" ? "border-success/50 text-success" :
                            vehicle.status === "idle" ? "border-warning/50 text-warning" :
                            "border-destructive/50 text-destructive"
                          )}
                        >
                          {vehicle.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1.5">{vehicle.driver}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {vehicle.speed} km/h
                        </span>
                        <span className="flex items-center gap-1">
                          <Fuel className="h-3 w-3" />
                          {vehicle.fuel}%
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {vehicle.destination}
                        </span>
                      </div>
                      {/* Communication Actions */}
                      {selectedVehicle === vehicle.id && vehicle.driverId && (
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <DriverCommunicationActions
                            driverId={vehicle.driverId}
                            driverName={vehicle.driver}
                            driverPhone={vehicle.phone}
                            variant="inline"
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card className="border-border/50">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              {alerts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No recent alerts</p>
              ) : (
                <div className="space-y-1.5">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-2 rounded-lg text-xs",
                        alert.severity === "high" ? "bg-destructive/10" :
                        alert.severity === "medium" ? "bg-warning/10" :
                        "bg-muted/30"
                      )}
                    >
                      <p className="font-medium line-clamp-1">{alert.message}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-3 relative">
          <Card className="h-full border-border/50">
            <CardContent className="p-0 h-full">
              <FleetMap
                selectedVehicle={selectedVehicle}
                onVehicleSelect={setSelectedVehicle}
                showGeofences={true}
                showRoutes={false}
                showAlerts={true}
                externalVehicles={mapVehicles}
              />
            </CardContent>
          </Card>

          {/* Map Actions */}
          <div className="absolute top-4 right-4 z-[1000] flex gap-2">
            {selectedVehicle && (
              <Button
                variant="secondary"
                size="sm"
                className="shadow-lg"
                onClick={() => setSelectedVehicle(null)}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                View All
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="shadow-lg"
              onClick={() => setGeofenceDialogOpen(true)}
            >
              <Shield className="h-4 w-4 mr-2" />
              Geofences
            </Button>
            <Button variant="secondary" size="sm" className="shadow-lg" onClick={() => refetchVehicles()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <GeofenceManagementDialog
        open={geofenceDialogOpen}
        onOpenChange={setGeofenceDialogOpen}
      />
    </DashboardLayout>
  );
}
