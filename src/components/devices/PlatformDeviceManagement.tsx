import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Cpu,
  Search,
  MoreHorizontal,
  Signal,
  SignalLow,
  SignalZero,
  Building2,
  Download,
  RefreshCw,
  Filter,
  Eye,
  FileText,
  AlertTriangle,
  Activity,
  Clock,
  Navigation,
  Fuel,
  Battery,
  Gauge,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { DeviceWithTelemetry, DriverBehaviorEvent } from "@/hooks/useDeviceTelemetry";
import { DeviceLifecycleBadge } from "./DeviceLifecycleBadge";
import { DeviceLifecycleStatus } from "@/hooks/useDeviceLifecycle";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface PlatformDeviceManagementProps {
  devices: DeviceWithTelemetry[];
  loading: boolean;
  onRefresh: () => void;
  tenantNameMap?: Record<string, string>;
}

// All lifecycle statuses for filtering
const lifecycleStatuses = [
  { value: "all", label: "All Statuses" },
  { value: "registered", label: "Registered" },
  { value: "config_pending", label: "Config Pending" },
  { value: "configured", label: "Configured" },
  { value: "verified_online", label: "Verified Online" },
  { value: "assignable", label: "Assignable" },
  { value: "assigned", label: "Assigned" },
  { value: "faulty", label: "Faulty" },
  { value: "decommissioned", label: "Decommissioned" },
  // Legacy statuses
  { value: "active", label: "Active (Legacy)" },
  { value: "inactive", label: "Inactive (Legacy)" },
];

export function PlatformDeviceManagement({ devices, loading, onRefresh, tenantNameMap: externalTenantMap }: PlatformDeviceManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [manufacturerFilter, setManufacturerFilter] = useState("all");
  const [internalTenantNames, setInternalTenantNames] = useState<Record<string, string>>({});
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithTelemetry | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showTelemetrySheet, setShowTelemetrySheet] = useState(false);

  // Use external tenant map if provided, otherwise use internal state
  const tenantNames = externalTenantMap && Object.keys(externalTenantMap).length > 0 
    ? externalTenantMap 
    : internalTenantNames;

  const resolveTenantName = useMemo(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const demoTenantName =
      tenantNames["lagos-express-logistics"] ||
      tenantNames["f7f5af88-fd76-4439-aae3-0461be52f63f"]; // demo tenant fallback

    // Collect unique slug->name entries from the tenantNames map
    const slugEntries = new Map<string, string>();
    for (const [key, name] of Object.entries(tenantNames)) {
      if (!key) continue;
      if (uuidRegex.test(key)) continue; // ignore UUID keys
      slugEntries.set(key, name);
    }

    return (tenantId: string | null | undefined) => {
      const raw = tenantId ?? "";

      if (!raw) {
        return { name: "Unknown tenant", resolved: false, raw } as const;
      }

      // 1) Exact match by tenant UUID or slug
      const exact = tenantNames[raw];
      if (exact) return { name: exact, resolved: true, raw } as const;

      // 2) Best-effort match by slug prefix (e.g. "lagos-express" => "lagos-express-logistics")
      if (!uuidRegex.test(raw)) {
        const matches: string[] = [];
        for (const [slug, name] of slugEntries.entries()) {
          if (slug === raw || slug.startsWith(raw) || raw.startsWith(slug)) {
            matches.push(name);
          }
        }

        const uniqueNames = Array.from(new Set(matches));
        if (uniqueNames.length === 1) {
          return { name: uniqueNames[0], resolved: true, raw } as const;
        }
      }

      // 3) Legacy demo placeholders (only if we can resolve a real demo tenant name)
      if (demoTenantName && (raw === "simulator-test" || /^tenant-\d+$/i.test(raw))) {
        return { name: demoTenantName, resolved: true, raw } as const;
      }

      return { name: "Unknown tenant", resolved: false, raw } as const;
    };
  }, [tenantNames]);

  // Fetch tenant names for all devices - only if external map not provided
  useEffect(() => {
    // Skip if external map is provided
    if (externalTenantMap && Object.keys(externalTenantMap).length > 0) return;
    
    let isMounted = true;

    const fetchTenantNames = async () => {
      const uniqueTenantIds = [...new Set(devices.map(d => d.tenant_id))];
      if (uniqueTenantIds.length === 0) return;

      // Fetch all tenants and match by both id and slug since devices may use either
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug");

      if (!isMounted) return;

      if (error) {
        console.error("Error fetching tenants:", error);
      }

      if (data && data.length > 0) {
        const nameMap: Record<string, string> = {};
        
        // Build a lookup that works for both UUID ids and slug-based tenant_ids
        data.forEach(tenant => {
          nameMap[tenant.id] = tenant.name;
          if (tenant.slug) {
            nameMap[tenant.slug] = tenant.name;
          }
        });
        
        setInternalTenantNames(nameMap);
      } else {
        // Fallback: Convert slug-like IDs to readable names
        const nameMap: Record<string, string> = {};
        uniqueTenantIds.forEach(tid => {
          if (tid) {
            // Check if it's a slug (contains hyphens but not UUID length)
            if (tid.length !== 36 && tid.includes('-')) {
              const readableName = tid
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              nameMap[tid] = readableName;
            }
          }
        });
        if (Object.keys(nameMap).length > 0) {
          setInternalTenantNames(nameMap);
        }
      }
    };

    // Listen for auth state changes and fetch when authenticated
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && devices.length > 0) {
        fetchTenantNames();
      }
    });

    // Also try fetching immediately if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && devices.length > 0) {
        fetchTenantNames();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [devices, externalTenantMap]);

  // Get unique manufacturers from devices
  const manufacturers = ["all", ...new Set(devices.map(d => d.manufacturer))];

  const filteredDevices = devices.filter((device) => {
    const tenantName = resolveTenantName(device.tenant_id).name;
    const matchesSearch =
      device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.imei.includes(searchQuery) ||
      tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.tenant_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Get lifecycle status for filtering
    const lifecycleStatus = (device as any).lifecycle_status || device.status;
    
    // Special handling for "active" filter - check operational status field
    let matchesStatus = false;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "active") {
      // "Active" means operationally running (status = 'active')
      matchesStatus = device.status === "active";
    } else if (statusFilter === "assigned") {
      // "Assigned" means lifecycle assigned but NOT operationally active
      matchesStatus = lifecycleStatus === "assigned" && device.status !== "active";
    } else {
      matchesStatus = lifecycleStatus === statusFilter;
    }
    
    const matchesManufacturer = manufacturerFilter === "all" || device.manufacturer === manufacturerFilter;
    
    return matchesSearch && matchesStatus && matchesManufacturer;
  });

  const getSignalIcon = (strength: number | null, status: string) => {
    // Only show signal for active/online devices
    if (!["active", "assigned", "verified_online", "assignable"].includes(status) || !strength) {
      return <SignalZero className="h-4 w-4 text-muted-foreground" />;
    }
    if (strength >= 70) return <Signal className="h-4 w-4 text-success" />;
    if (strength >= 30) return <SignalLow className="h-4 w-4 text-warning" />;
    return <SignalZero className="h-4 w-4 text-destructive" />;
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Never";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const handleViewDetails = (device: DeviceWithTelemetry) => {
    setSelectedDevice(device);
    setShowDetailsSheet(true);
  };

  const handleViewTelemetry = (device: DeviceWithTelemetry) => {
    setSelectedDevice(device);
    setShowTelemetrySheet(true);
  };

  // Summary stats - aligned with Tenant Admin view
  const getLifecycleStatus = (d: DeviceWithTelemetry) => (d as any).lifecycle_status || d.status;
  const stats = {
    all: devices.length,
    registered: devices.filter(d => getLifecycleStatus(d) === "registered").length,
    configured: devices.filter(d => getLifecycleStatus(d) === "configured").length,
    assignable: devices.filter(d => getLifecycleStatus(d) === "assignable").length,
    // Assigned: lifecycle assigned but NOT operationally active (e.g., vehicle in maintenance)
    assigned: devices.filter(d => getLifecycleStatus(d) === "assigned" && d.status !== "active").length,
    // Active: devices with operational status 'active' (assigned devices that are running)
    active: devices.filter(d => d.status === "active").length,
    faulty: devices.filter(d => getLifecycleStatus(d) === "faulty").length,
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Device Inventory
            </CardTitle>
            <CardDescription>
              Platform-wide device overview (read-only)
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Stats - aligned with Tenant Admin */}
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-4 mt-4">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-2xl font-bold">{stats.all}</p>
            <p className="text-xs text-muted-foreground">All Devices</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-2xl font-bold text-muted-foreground">{stats.registered}</p>
            <p className="text-xs text-muted-foreground">Registered</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-2xl font-bold text-info">{stats.configured}</p>
            <p className="text-xs text-muted-foreground">Configured</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-2xl font-bold text-success">{stats.assignable}</p>
            <p className="text-xs text-muted-foreground">Assignable</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-2xl font-bold text-primary">{stats.assigned}</p>
            <p className="text-xs text-muted-foreground">Assigned</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-2xl font-bold text-success">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-2xl font-bold text-destructive">{stats.faulty}</p>
            <p className="text-xs text-muted-foreground">Faulty</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ID, IMEI, or tenant..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Manufacturer" />
            </SelectTrigger>
            <SelectContent>
              {manufacturers.map((m) => (
                <SelectItem key={m} value={m}>
                  {m === "all" ? "All Manufacturers" : m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {lifecycleStatuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IMEI</TableHead>
                <TableHead>Manufacturer / Model</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Lifecycle / Operational</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {devices.length === 0 
                      ? "No devices registered across tenants."
                      : "No devices match your filters."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => {
                  const lifecycleStatus = (device as any).lifecycle_status || device.status;
                  const tenantResolved = resolveTenantName(device.tenant_id);
                  const showOperationalFirst = statusFilter === "active";
                  const primaryStatus = showOperationalFirst ? device.status : lifecycleStatus;
                  const secondaryStatus = showOperationalFirst
                    ? lifecycleStatus
                    : (device.status && device.status !== lifecycleStatus ? device.status : null);
                  
                  return (
                    <TableRow key={device.id}>
                      <TableCell className="font-mono text-sm">{device.imei}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{device.manufacturer}</p>
                          {device.model && (
                            <p className="text-xs text-muted-foreground">{device.model}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span
                            className="text-sm truncate max-w-[150px]"
                            title={tenantResolved.resolved ? tenantResolved.name : tenantResolved.raw}
                          >
                            {tenantResolved.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <DeviceLifecycleBadge status={primaryStatus as DeviceLifecycleStatus} />
                          {secondaryStatus && (
                            <DeviceLifecycleBadge status={secondaryStatus as DeviceLifecycleStatus} size="sm" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSignalIcon(device.signal_strength, lifecycleStatus)}
                          {device.signal_strength !== null && (
                            <span className="text-sm">{device.signal_strength}%</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLastSeen(device.last_seen)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(device)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewTelemetry(device)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View Telemetry Log
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {lifecycleStatus === "faulty" && (
                              <DropdownMenuItem className="text-warning" onClick={() => handleViewDetails(device)}>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                View Fault Details
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Platform Admin Note */}
        <div className="mt-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Platform Admin View:</strong> This is a read-only overview. 
            Device registration, configuration, and vehicle assignment are managed by tenant administrators.
            Use the Device Catalog tab to manage supported manufacturers and models.
          </p>
        </div>
      </CardContent>

      {/* Device Details Sheet */}
      <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="block">{selectedDevice?.manufacturer} {selectedDevice?.model}</span>
                <span className="text-sm font-normal text-muted-foreground font-mono">
                  IMEI: {selectedDevice?.imei}
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
                        {(() => {
                          const lifecycle = (selectedDevice as any).lifecycle_status || selectedDevice.status;
                          const secondary = selectedDevice.status !== lifecycle ? selectedDevice.status : null;

                          return (
                            <>
                              <DeviceLifecycleBadge status={lifecycle} />
                              {secondary && <DeviceLifecycleBadge status={secondary} size="sm" />}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Seen</p>
                      <p className="text-sm font-medium mt-1">
                        {selectedDevice.last_seen ? formatDistanceToNow(new Date(selectedDevice.last_seen), { addSuffix: true }) : "Never"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tenant</p>
                      <p className="text-sm font-medium mt-1">
                        {tenantNames[selectedDevice.tenant_id] || selectedDevice.tenant_id.slice(0, 8) + "..."}
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
                        {selectedDevice.signal_strength ?? 0}%
                      </span>
                    </div>
                    <Progress value={selectedDevice.signal_strength ?? 0} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4 text-muted-foreground" />
                        <span>Battery Level</span>
                      </div>
                      <span className="font-medium">
                        {selectedDevice.battery_level ?? 0}%
                      </span>
                    </div>
                    <Progress value={selectedDevice.battery_level ?? 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              {selectedDevice.latitude && selectedDevice.longitude && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-primary" />
                      Current Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-sm">
                      {selectedDevice.latitude.toFixed(6)}, {selectedDevice.longitude.toFixed(6)}
                    </div>
                    {selectedDevice.speed !== undefined && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Speed: {selectedDevice.speed?.toFixed(0) || 0} km/h
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Firmware */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Firmware Version</span>
                    <span className="font-mono">{(selectedDevice as any).firmware_version || "Unknown"}</span>
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

      {/* Telemetry Log Sheet */}
      <Sheet open={showTelemetrySheet} onOpenChange={setShowTelemetrySheet}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="block">Telemetry Log</span>
                <span className="text-sm font-normal text-muted-foreground font-mono">
                  {selectedDevice?.imei}
                </span>
              </div>
            </SheetTitle>
            <SheetDescription className="sr-only">Device telemetry data</SheetDescription>
          </SheetHeader>

          {selectedDevice && (
            <div className="mt-6 space-y-4">
              {/* Live Metrics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Live Telemetry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-primary" />
                      <span className="text-sm">Speed</span>
                    </div>
                    <span className="font-mono text-lg">
                      {selectedDevice.speed?.toFixed(0) || '0'} <span className="text-sm text-muted-foreground">km/h</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-success" />
                      <span className="text-sm">Heading</span>
                    </div>
                    <span className="font-mono text-lg">
                      {selectedDevice.heading || 0}°
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-warning" />
                        <span className="text-sm">Fuel Level</span>
                      </div>
                      <span className="font-mono">{selectedDevice.fuel_level?.toFixed(0) || 0}%</span>
                    </div>
                    <Progress value={selectedDevice.fuel_level || 0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4 text-success" />
                        <span className="text-sm">Device Battery</span>
                      </div>
                      <span className="font-mono">{selectedDevice.battery_level || 0}%</span>
                    </div>
                    <Progress value={selectedDevice.battery_level || 0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Signal className="h-4 w-4 text-primary" />
                        <span className="text-sm">Signal Strength</span>
                      </div>
                      <span className="font-mono">{selectedDevice.signal_strength || 0}%</span>
                    </div>
                    <Progress value={selectedDevice.signal_strength || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Location Data */}
              {selectedDevice.latitude && selectedDevice.longitude && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">GPS Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Latitude</span>
                      <span className="font-mono">{selectedDevice.latitude.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Longitude</span>
                      <span className="font-mono">{selectedDevice.longitude.toFixed(6)}</span>
                    </div>
                    {(selectedDevice as any).altitude && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Altitude</span>
                        <span className="font-mono">{(selectedDevice as any).altitude.toFixed(1)} m</span>
                      </div>
                    )}
                    {(selectedDevice as any).accuracy && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Accuracy</span>
                        <span className="font-mono">{(selectedDevice as any).accuracy.toFixed(1)} m</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Last Update */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last telemetry received {selectedDevice.last_seen ? formatDistanceToNow(new Date(selectedDevice.last_seen), { addSuffix: true }) : "never"}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
