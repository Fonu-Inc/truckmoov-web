import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FleetMap, type FleetMapVehicle } from "@/components/fleet/FleetMap";
import { GeofenceManagementDialog } from "@/components/fleet/GeofenceManagementDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Truck, AlertTriangle, MapPin, Route, Shield, Search,
  RefreshCw, Maximize2, SlidersHorizontal as Filter, Navigation, Clock, Fuel, Settings2, Loader2, ExternalLink, Plus,
  Map as MapIcon, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { DriverCommunicationActions } from "@/components/communications/DriverCommunicationActions";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useAlerts } from "@/hooks/useAlerts";
import { useAuthStore } from "@/stores/authStore";
import { isFreshActivation } from "@/lib/freshActivation";

const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1"];

export default function LiveMap() {
  const { vehicles, isLoading: vehiclesLoading, refetch: refetchVehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { alerts } = useAlerts();
  const { user } = useAuthStore();
  const isDemoUser = user?.id ? DEMO_USER_IDS.includes(user.id) && !isFreshActivation() : false;
  
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [geofenceDialogOpen, setGeofenceDialogOpen] = useState(false);

  // For demo users, use mock vehicle data that matches FleetMap's internal mock
  const demoSidebarVehicles = [
    { id: "LAG-234-XY", vehicleId: "LAG-234-XY", model: "Mercedes Actros 2545", driver: "Chukwuemeka Okafor", driverId: "", phone: "+234 801 234 5678", status: "moving", speed: 45, fuel: 72, destination: "Victoria Island" },
    { id: "LAG-567-AB", vehicleId: "LAG-567-AB", model: "MAN TGS 33.480", driver: "Adebayo Johnson", driverId: "", phone: "+234 802 345 6789", status: "moving", speed: 62, fuel: 45, destination: "Lekki Phase 1" },
    { id: "LAG-890-CD", vehicleId: "LAG-890-CD", model: "Volvo FH16 750", driver: "Unassigned", driverId: "", phone: "", status: "stopped", speed: 0, fuel: 30, destination: "Maintenance Bay" },
    { id: "LAG-112-EF", vehicleId: "LAG-112-EF", model: "Scania R500 6x4", driver: "Ngozi Obi", driverId: "", phone: "+234 804 567 8901", status: "moving", speed: 28, fuel: 92, destination: "Ajah" },
    { id: "LAG-445-GH", vehicleId: "LAG-445-GH", model: "DAF XF 480 FT", driver: "Tunde Bakare", driverId: "", phone: "+234 805 678 9012", status: "moving", speed: 55, fuel: 65, destination: "Agege" },
  ];

  // Map real vehicles with driver info for the map component
  const realVehiclesWithDrivers = vehicles.map(v => {
    const driver = v.currentDriverId ? drivers.find(d => d.id === v.currentDriverId) : null;
    const modelParts = [v.make, v.model, v.year ? `(${v.year})` : null].filter(Boolean).join(" ");
    return {
      id: v.registrationNumber || v.id,
      vehicleId: v.id,
      model: modelParts || "—",
      driver: driver?.name || "Unassigned",
      driverId: driver?.id || "",
      phone: driver?.phone || "",
      status: v.status === "active" ? "moving" : v.status === "maintenance" ? "stopped" : "idle",
      speed: 0,
      fuel: v.fuelLevel || 0,
      destination: "—",
    };
  });

  const vehiclesWithDrivers = isDemoUser ? demoSidebarVehicles : realVehiclesWithDrivers;

  // Build FleetMapVehicle[] for the map (with position placeholders — real positions come from telemetry)
  const mapVehicles: FleetMapVehicle[] = vehiclesWithDrivers.map(v => ({
    id: v.id,
    driver: v.driver,
    phone: v.phone,
    position: [6.5244, 3.3792] as [number, number], // Default Lagos; overridden by telemetry
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

  const recentAlerts = alerts.slice(0, 4).map(a => ({
    id: a.id,
    type: a.type,
    message: a.message,
    time: new Date(a.createdAt).toLocaleTimeString(),
    severity: a.severity === "high" ? "error" : a.severity === "medium" ? "warning" : "info",
  }));

  if (vehiclesLoading && !isDemoUser) {
    return (
      <DashboardLayout title="Live Fleet Map" subtitle="Real-time vehicle tracking and monitoring">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (vehicles.length === 0 && !isDemoUser) {
    return (
      <DashboardLayout title="Live Fleet Map" subtitle="Real-time vehicle tracking and monitoring">
        <EmptyState
          icon={Truck}
          title="No vehicles to track"
          description="Add vehicles to your fleet to see them on the live map"
          actionLabel="Add Vehicle"
          actionHref="/admin/fleet"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Live Fleet Map" subtitle="Real-time vehicle tracking and monitoring" fullWidth>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-4rem)] p-4 overflow-hidden">
        {/* Sidebar — only this scrolls */}
        <div className="lg:col-span-1 space-y-4 flex flex-col h-full overflow-y-auto pr-1">
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

          {/* Map Controls */}
          <Card className="border-border/50">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Map Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="geofences" className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Geofences
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setGeofenceDialogOpen(true)}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                  <Switch id="geofences" checked={showGeofences} onCheckedChange={setShowGeofences} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="routes" className="text-sm flex items-center gap-2">
                  <Route className="h-4 w-4 text-muted-foreground" />
                  Routes
                </Label>
                <Switch id="routes" checked={showRoutes} onCheckedChange={setShowRoutes} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="alerts" className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Alerts
                </Label>
                <Switch id="alerts" checked={showAlerts} onCheckedChange={setShowAlerts} />
              </div>
            </CardContent>
          </Card>

          {/* Vehicle List */}
          <Card className="border-border/50 flex flex-col">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Vehicles ({filteredVehicles.length})
                </CardTitle>
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
            <CardContent className="p-2 pt-0">
              <div className="space-y-1.5 pr-1">
                  {filteredVehicles.map((vehicle) => (
                    <div
                      key={vehicle.vehicleId}
                      className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                        selectedVehicle === vehicle.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                      }`}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            vehicle.status === "moving" ? "bg-success" :
                            vehicle.status === "idle" ? "bg-warning" : "bg-destructive"
                          }`} />
                          <div className="min-w-0">
                            <span className="font-medium text-sm block truncate">{vehicle.id}</span>
                            <span className="text-[10px] text-muted-foreground block truncate">{vehicle.model}</span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            vehicle.status === "moving" ? "border-success/50 text-success" :
                            vehicle.status === "idle" ? "border-warning/50 text-warning" :
                            "border-destructive/50 text-destructive"
                          }`}
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
                      {/* Actions for selected vehicle */}
                      {selectedVehicle === vehicle.id && (
                        <div className="mt-2 pt-2 border-t border-border/30 space-y-2">
                          {vehicle.driverId && (
                            <DriverCommunicationActions
                              driverId={vehicle.driverId}
                              driverName={vehicle.driver}
                              driverPhone={vehicle.phone}
                              variant="inline"
                              size="sm"
                            />
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              const pos = mapVehicles.find(mv => mv.id === vehicle.id)?.position
                                ?? (isDemoUser ? demoSidebarVehicles.find(dv => dv.id === vehicle.id) ? undefined : undefined : undefined);
                              const demoPositions: Record<string, [number, number]> = {
                                "LAG-234-XY": [6.5244, 3.3792],
                                "LAG-567-AB": [6.4550, 3.3941],
                                "LAG-890-CD": [6.5833, 3.3500],
                                "LAG-112-EF": [6.4698, 3.5852],
                                "LAG-445-GH": [6.6018, 3.3515],
                              };
                              const coords = pos ?? demoPositions[vehicle.id] ?? [6.5244, 3.3792];
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`,
                                "_blank"
                              );
                            }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Navigate to Vehicle
                          </Button>
                          {/* US-E03-006 — Share Vehicle Location via WhatsApp */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              const trackingId = `trk_${vehicle.id.toLowerCase().replace(/-/g, "")}_${Date.now().toString(36)}`;
                              const link = `${window.location.origin}/track/${trackingId}`;
                              navigator.clipboard?.writeText(link).catch(() => {});
                              const wa = `https://wa.me/?text=${encodeURIComponent(
                                `Track your delivery (${vehicle.id}) live: ${link} — link expires in 24h.`
                              )}`;
                              window.open(wa, "_blank");
                              toast.success("Tracking link copied & WhatsApp opened (valid 24h)");
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Share location via WhatsApp
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card className="border-border/50">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Recent Alerts
              </CardTitle>
              <CardDescription className="text-xs">Latest geofence, telemetry, and behavior alerts from your live fleet.</CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              {recentAlerts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No recent alerts</p>
              ) : (
                <div className="space-y-1.5">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-2 rounded-lg text-xs ${
                        alert.severity === "error" ? "bg-destructive/10" :
                        alert.severity === "warning" ? "bg-warning/10" :
                        "bg-muted/30"
                      }`}
                    >
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {alert.time}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map — fills its column, no scroll */}
        <div className="md:col-span-1 lg:col-span-3 relative min-h-[400px] h-full">
          <Card className="h-full border-border/50">
            <CardContent className="p-0 h-full">
              <FleetMap
                selectedVehicle={selectedVehicle}
                onVehicleSelect={setSelectedVehicle}
                showGeofences={showGeofences}
                showRoutes={showRoutes}
                showAlerts={showAlerts}
                externalVehicles={isDemoUser ? undefined : mapVehicles}
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
              <MapIcon className="h-4 w-4 mr-2" />
              Manage Geofences
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



