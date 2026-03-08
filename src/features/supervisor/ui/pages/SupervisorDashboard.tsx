import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertList } from "@/components/alerts/AlertList";
import { LiveTrackingMap } from "@/components/supervisor/LiveTrackingMap";
import { DispatchPanel } from "@/components/supervisor/DispatchPanel";
import { CommunicationsPanel } from "@/components/supervisor/CommunicationsPanel";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useJobs } from "@/hooks/useJobs";
import { useAlerts } from "@/hooks/useAlerts";
import {
  Truck,
  Users,
  AlertTriangle,
  Package,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SupervisorDashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);

  // Use tenant-scoped data hooks instead of mock data
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { drivers, isLoading: driversLoading } = useDrivers();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { alerts, isLoading: alertsLoading, acknowledgeAlert } = useAlerts();

  const isLoading = vehiclesLoading || driversLoading || jobsLoading || alertsLoading;

  // Convert hook data to formats expected by child components
  const vehiclesForMap = vehicles.map((v) => ({
    id: v.id,
    vin: v.vin,
    registrationNumber: v.registrationNumber,
    make: v.make,
    model: v.model,
    year: v.year,
    type: v.type as 'truck' | 'van' | 'trailer',
    status: v.status,
    capacity: v.capacity || 0,
    currentDriver: v.currentDriverId || undefined,
    deviceId: v.deviceId || undefined,
    fuelLevel: v.fuelLevel || undefined,
    location: undefined, // Real location would come from telemetry
  }));

  const driversForPanel = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email || undefined,
    licenseNumber: d.licenseNumber,
    licenseExpiry: new Date(d.licenseExpiry),
    status: d.status as 'active' | 'available' | 'offline' | 'suspended',
    rating: d.rating,
    totalTrips: d.totalTrips,
    currentVehicle: d.currentVehicleId || undefined,
    communicationPreference: d.communicationPreference as 'whatsapp' | 'sms' | 'email' | 'voice',
  }));

  const alertsForList = alerts.map((a) => ({
    id: a.id,
    type: a.type as 'geofence' | 'speed' | 'maintenance' | 'fuel' | 'sos' | 'offline',
    severity: a.severity as 'low' | 'medium' | 'high' | 'critical',
    message: a.message,
    vehicleId: a.vehicleId || '',
    driverId: a.driverId || undefined,
    timestamp: new Date(a.createdAt),
    acknowledged: a.acknowledged,
  }));

  const activeVehicles = vehicles.filter((v) => v.status === "active");
  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  // Count drivers who are currently active (assigned to a vehicle and working)
  const onJobDrivers = drivers.filter((d) => d.status === "active").length;
  const pendingDispatches = jobs.filter((j) => j.status === "created").length;

  if (isLoading) {
    return (
      <DashboardLayout
        title="Operations Center"
        subtitle="Real-time fleet monitoring, dispatch & communications"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Operations Center"
      subtitle="Real-time fleet monitoring, dispatch & communications"
    >
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Vehicles"
            value={activeVehicles.length}
            icon={Truck}
            variant="success"
          />
          <StatCard
            title="Active Drivers"
            value={onJobDrivers}
            icon={Users}
          />
          <StatCard
            title="Active Alerts"
            value={activeAlerts.length}
            icon={AlertTriangle}
            variant={activeAlerts.length > 3 ? "danger" : "warning"}
          />
          <StatCard
            title="Pending Dispatches"
            value={pendingDispatches}
            icon={Package}
          />
        </div>

        {/* Main Content - Map and Communications */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Live Tracking Map */}
          <div className="lg:col-span-2">
            <LiveTrackingMap
              vehicles={vehiclesForMap}
              drivers={driversForPanel}
              jobs={jobs.map(j => ({
                id: j.id,
                vehicleId: j.vehicleId || undefined,
                status: j.status,
                pickup: { address: j.pickupAddress },
                delivery: { address: j.deliveryAddress },
                deadline: new Date(j.deadline),
              }))}
              selectedVehicleId={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
              onDispatchClick={() => setDispatchDialogOpen(true)}
            />
          </div>

          {/* Communications Panel */}
          <div className="lg:col-span-1">
            <CommunicationsPanel
              drivers={driversForPanel}
              selectedDriverId={selectedDriver || undefined}
              onSelectDriver={setSelectedDriver}
            />
          </div>
        </div>

        {/* Bottom Row - Alerts and Driver Status */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Active Alerts
              </CardTitle>
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                {activeAlerts.length} Active
              </span>
            </CardHeader>
            <CardContent>
              {alertsForList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No alerts</p>
                </div>
              ) : (
                <AlertList
                  alerts={alertsForList.filter(a => !a.acknowledged)}
                  maxItems={4}
                  onAcknowledge={(id) => acknowledgeAlert(id)}
                />
              )}
            </CardContent>
          </Card>

          {/* Driver Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Driver Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {drivers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No drivers registered</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {drivers.slice(0, 6).map((driver) => (
                    <div
                      key={driver.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{driver.name.split(" ")[0]}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {driver.status.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          driver.status === "on_trip"
                            ? "bg-success"
                            : driver.status === "available"
                            ? "bg-primary"
                            : "bg-muted-foreground"
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dispatch Dialog */}
      <DispatchPanel
        vehicles={vehiclesForMap}
        drivers={driversForPanel}
        open={dispatchDialogOpen}
        onOpenChange={setDispatchDialogOpen}
        selectedVehicleId={selectedVehicle}
      />
    </DashboardLayout>
  );
}
