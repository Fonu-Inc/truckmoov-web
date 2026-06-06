import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Separator } from '@/components/shadcn/separator';
import { Skeleton } from '@/components/shadcn/skeleton';
import { DeviceHealthBadge } from '@/components/devices/DeviceHealthBadge';
import {
  ArrowLeft,
  Truck,
  Cpu,
  MapPin,
  Gauge,
  Fuel,
  Clock,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Package,
  FileWarning,
  Activity,
  Signal,
  Battery,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format, differenceInDays, isBefore, addDays } from 'date-fns';
import { VehicleLiveMap } from '@/components/owner-operator/VehicleLiveMap';

export default function OwnerOperatorVehicleDetail() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { format: formatCurrency } = useCurrency();

  // Fetch vehicle
  const { data: vehicle, isLoading: vehicleLoading } = useQuery({
    queryKey: ['oo-vehicle-detail', vehicleId],
    queryFn: async () => null,
    enabled: !!vehicleId,
  });

  // Fetch assigned device
  const { data: device } = useQuery({
    queryKey: ['oo-vehicle-device', vehicleId],
    queryFn: async () => null,
    enabled: !!vehicleId,
  });

  // Fetch latest telemetry for device
  const { data: latestTelemetry } = useQuery({
    queryKey: ['oo-device-telemetry', device?.id],
    queryFn: async () => null,
    enabled: !!device?.id,
    refetchInterval: 30000,
  });

  // Fetch recent jobs for this vehicle
  const { data: recentJobs = [] } = useQuery({
    queryKey: ['oo-vehicle-jobs', vehicleId],
    queryFn: async () => [] as never[],
    enabled: !!vehicleId,
  });

  // Fetch compliance docs for this vehicle
  const { data: complianceDocs = [] } = useQuery({
    queryKey: ['oo-vehicle-compliance', vehicleId],
    queryFn: async () => [] as never[],
    enabled: !!vehicleId,
  });

  const now = new Date();
  const expiringDocs = complianceDocs.filter(d => isBefore(new Date(d.expiry_date), addDays(now, 30)));
  const expiredDocs = complianceDocs.filter(d => isBefore(new Date(d.expiry_date), now));
  const validDocs = complianceDocs.filter(d => !isBefore(new Date(d.expiry_date), now));

  const completedTrips = recentJobs.filter(j => j.status === 'completed');
  const totalRevenue = completedTrips.reduce((s, j) => s + (j.revenue_ngn || j.amount_ngn || 0), 0);

  // Battery voltage to percentage
  const batteryPercent = latestTelemetry?.battery_voltage
    ? Math.min(100, Math.max(0, Math.round(((latestTelemetry.battery_voltage - 10.5) / (14.4 - 10.5)) * 100)))
    : null;
  const batteryColor = batteryPercent !== null
    ? batteryPercent >= 60 ? 'text-green-500' : batteryPercent >= 30 ? 'text-amber-500' : 'text-red-500'
    : 'text-muted-foreground';

  if (vehicleLoading) {
    return (
      <DashboardLayout title="Vehicle Details" subtitle="Loading...">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!vehicle) {
    return (
      <DashboardLayout title="Vehicle Not Found" subtitle="">
        <div className="text-center py-20">
          <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">Vehicle not found or you don't have access.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/owner-operator')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getJobStatusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': case 'arrived_pickup': case 'arrived_dropoff': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout
      title={vehicle.registration_number || 'Vehicle'}
      subtitle={`${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.year || ''}`}
    >
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/owner-operator')} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        {/* Vehicle Info + Device Status */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Vehicle Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-5 w-5 text-primary" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Registration</p>
                  <p className="font-medium">{vehicle.registration_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>{vehicle.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Make / Model</p>
                  <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Year</p>
                  <p className="font-medium">{vehicle.year || '—'}</p>
                </div>
                {vehicle.current_mileage && (
                  <div>
                    <p className="text-muted-foreground text-xs">Mileage</p>
                    <p className="font-medium flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5" />
                      {vehicle.current_mileage.toLocaleString()} km
                    </p>
                  </div>
                )}
                {vehicle.capacity > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs">Capacity</p>
                    <p className="font-medium flex items-center gap-1">
                      <Fuel className="h-3.5 w-3.5" />
                      {vehicle.capacity} tons
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Device & Tracking Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="h-5 w-5 text-primary" />
                Tracking Device
              </CardTitle>
            </CardHeader>
            <CardContent>
              {device ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{device.manufacturer} {device.model}</p>
                      <p className="text-xs text-muted-foreground font-mono">{device.imei}</p>
                    </div>
                    <DeviceHealthBadge
                      healthStatus={device.health_status as any}
                      lastSeen={device.last_seen}
                    />
                  </div>

                  <Separator />

                  {latestTelemetry ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {latestTelemetry.speed !== null && (
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Speed</p>
                            <p className="font-medium">{latestTelemetry.speed} km/h</p>
                          </div>
                        </div>
                      )}
                      {latestTelemetry.latitude && latestTelemetry.longitude && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="font-medium font-mono text-xs">
                              {latestTelemetry.latitude.toFixed(4)}, {latestTelemetry.longitude.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      )}
                      {latestTelemetry.fuel_level !== null && (
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Fuel Level</p>
                            <p className="font-medium">{latestTelemetry.fuel_level}%</p>
                          </div>
                        </div>
                      )}
                      {batteryPercent !== null && (
                        <div className="flex items-center gap-2">
                          <Battery className={`h-4 w-4 ${batteryColor}`} />
                          <div>
                            <p className="text-xs text-muted-foreground">Battery</p>
                            <p className={`font-medium ${batteryColor}`}>
                              {batteryPercent}% ({latestTelemetry.battery_voltage?.toFixed(1)}V)
                            </p>
                          </div>
                        </div>
                      )}
                      {device.signal_strength !== null && (
                        <div className="flex items-center gap-2">
                          <Signal className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Signal</p>
                            <p className="font-medium">{device.signal_strength}%</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Last Update</p>
                          <p className="font-medium text-xs">
                            {format(new Date(latestTelemetry.timestamp), 'dd MMM, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      No telemetry data yet. Device will report once active.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Cpu className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No device assigned</p>
                  <p className="text-xs mt-1">Request a device setup from your dashboard.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/owner-operator')}>
                    Request Setup
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Location Map */}
        {latestTelemetry?.latitude && latestTelemetry?.longitude && (
          <VehicleLiveMap
            latitude={latestTelemetry.latitude}
            longitude={latestTelemetry.longitude}
            speed={latestTelemetry.speed}
            heading={latestTelemetry.heading}
            registrationNumber={vehicle.registration_number || 'Vehicle'}
            lastUpdate={format(new Date(latestTelemetry.timestamp), 'dd MMM, HH:mm')}
          />
        )}

        {/* Compliance Documents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Compliance Documents
              {expiredDocs.length > 0 && (
                <Badge variant="destructive">{expiredDocs.length} expired</Badge>
              )}
              {expiringDocs.length > 0 && expiredDocs.length === 0 && (
                <Badge variant="outline" className="border-amber-500 text-amber-500">{expiringDocs.length} expiring</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {complianceDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No compliance documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {complianceDocs.map(doc => {
                  const expiry = new Date(doc.expiry_date);
                  const isExpired = isBefore(expiry, now);
                  const daysLeft = differenceInDays(expiry, now);
                  const isExpiringSoon = daysLeft <= 30 && daysLeft >= 0;

                  return (
                    <div key={doc.id} className={`flex items-center justify-between rounded-lg border p-3 ${
                      isExpired ? 'border-destructive/20 bg-destructive/5' :
                      isExpiringSoon ? 'border-amber-500/20 bg-amber-50/5' : ''
                    }`}>
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">{doc.document_name}</p>
                        <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                      </div>
                      <div className="text-right">
                        {isExpired ? (
                          <Badge variant="destructive" className="gap-1">
                            <FileWarning className="h-3 w-3" />
                            Expired {format(expiry, 'dd MMM')}
                          </Badge>
                        ) : isExpiringSoon ? (
                          <Badge variant="outline" className="border-warning text-warning gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {daysLeft}d left
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(expiry, 'dd MMM yyyy')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trips */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-primary" />
              Recent Trips
              {completedTrips.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-auto">
                  Total: {formatCurrency(totalRevenue)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No trips recorded for this vehicle.</p>
            ) : (
              <div className="space-y-2">
                {recentJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{job.reference || job.id.slice(0, 8)}</p>
                        <Badge variant={getJobStatusVariant(job.status)} className="text-[10px]">
                          {job.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {(job.pickup_address || job.delivery_address) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {job.pickup_address?.split(',')[0]} → {job.delivery_address?.split(',')[0]}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-medium text-sm">{formatCurrency(job.revenue_ngn || job.amount_ngn || 0)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(job.created_at), 'dd MMM')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


