import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FleetMap, type FleetMapVehicle } from "@/components/fleet/FleetMap";
import { GeofenceManagementDialog } from "@/components/fleet/GeofenceManagementDialog";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Truck, AlertTriangle, MapPin, Shield, Search, RefreshCw, Navigation,
  Loader2, X, Clock, User, Package, Route, MessageSquarePlus, UserPlus,
  CheckCircle2, CircleDot, Wifi, WifiOff, Radio,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useVehicles } from "@/hooks/useVehicles";
import { useDrivers } from "@/hooks/useDrivers";
import { useAlerts } from "@/hooks/useAlerts";
import { useJobs, type JobData } from "@/hooks/useJobs";
import { useGeofenceRealtime } from "@/hooks/useGeofenceRealtime";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type WaybillStatusKey = "all" | "created" | "assigned" | "in_progress" | "delayed" | "completed";

const STATUS_FILTERS: { key: WaybillStatusKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "created", label: "Awaiting" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Transit" },
  { key: "delayed", label: "Delayed" },
  { key: "completed", label: "Completed" },
];

const isDelayed = (j: JobData) =>
  j.status !== "completed" &&
  j.status !== "cancelled" &&
  ((j.deadline && new Date(j.deadline).getTime() < Date.now()) ||
    /\[delayed\]/i.test(j.notes || ""));

const statusTone = (j: JobData) => {
  if (j.status === "completed") return "border-success/50 text-success bg-success/10";
  if (j.status === "cancelled") return "border-muted-foreground/40 text-muted-foreground bg-muted/30";
  if (isDelayed(j)) return "border-destructive/50 text-destructive bg-destructive/10";
  if (j.status === "in_progress") return "border-primary/50 text-primary bg-primary/10";
  if (j.status === "assigned") return "border-warning/50 text-warning bg-warning/10";
  return "border-border text-muted-foreground bg-muted/20";
};

const statusLabel = (j: JobData) => {
  if (isDelayed(j) && j.status !== "completed") return "Delayed";
  if (j.status === "in_progress") return "In Transit";
  if (j.status === "created") return "Awaiting";
  return j.status.charAt(0).toUpperCase() + j.status.slice(1);
};

export default function DispatcherLiveMap() {
  const navigate = useNavigate();
  const { vehicles, isLoading: vehiclesLoading, refetch: refetchVehicles } = useVehicles();
  const { drivers } = useDrivers();
  const { alerts } = useAlerts();
  const { jobs, addJob, updateJob } = useJobs();
  const { recentEvents: geofenceEvents } = useGeofenceRealtime();

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WaybillStatusKey>("all");
  const [activeTab, setActiveTab] = useState<"waybills" | "vehicles">("waybills");
  const [geofenceDialogOpen, setGeofenceDialogOpen] = useState(false);
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobData | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDriverId, setAssignDriverId] = useState<string>("");
  const [assignVehicleId, setAssignVehicleId] = useState<string>("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshTimer = useRef<number | null>(null);

  // Auto-refresh every 15s
  useEffect(() => {
    if (!autoRefresh) return;
    refreshTimer.current = window.setInterval(() => {
      refetchVehicles();
      setLastRefresh(new Date());
    }, 15000);
    return () => {
      if (refreshTimer.current) window.clearInterval(refreshTimer.current);
    };
  }, [autoRefresh, refetchVehicles]);

  const driverById = useMemo(
    () => Object.fromEntries(drivers.map((d) => [d.id, d])),
    [drivers],
  );
  const vehicleById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v])),
    [vehicles],
  );

  // Active = not completed/cancelled
  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status !== "completed" && j.status !== "cancelled"),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    let list = jobs;
    if (statusFilter !== "all") {
      list = list.filter((j) => {
        if (statusFilter === "delayed") return isDelayed(j);
        return j.status === statusFilter;
      });
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((j) => {
        const driver = j.driverId ? driverById[j.driverId] : null;
        const veh = j.vehicleId ? vehicleById[j.vehicleId] : null;
        return (
          j.reference.toLowerCase().includes(q) ||
          (driver?.name || "").toLowerCase().includes(q) ||
          (veh?.registrationNumber || "").toLowerCase().includes(q) ||
          j.deliveryAddress.toLowerCase().includes(q)
        );
      });
    }
    return list.sort((a, b) => +isDelayed(b) - +isDelayed(a));
  }, [jobs, statusFilter, search, driverById, vehicleById]);

  const counts = useMemo(
    () => ({
      total: activeJobs.length,
      transit: activeJobs.filter((j) => j.status === "in_progress").length,
      delayed: activeJobs.filter(isDelayed).length,
      awaiting: activeJobs.filter((j) => j.status === "created").length,
    }),
    [activeJobs],
  );

  const selectedJob = useMemo(
    () => (selectedJobId ? jobs.find((j) => j.id === selectedJobId) || null : null),
    [jobs, selectedJobId],
  );

  // Map vehicles. Highlight vehicle of selected job.
  const mapVehicles: FleetMapVehicle[] = useMemo(
    () =>
      vehicles.map((v) => {
        const driver = v.currentDriverId ? driverById[v.currentDriverId] : null;
        const status: FleetMapVehicle["status"] =
          v.status === "active"
            ? "moving"
            : v.status === "maintenance"
              ? "stopped"
              : v.status === "inactive"
                ? "stopped"
                : "idle";
        return {
          id: v.registrationNumber || v.id,
          driver: driver?.name || "Unassigned",
          phone: driver?.phone || "",
          position: [6.5244, 3.3792],
          heading: 0,
          speed: 0,
          status,
          fuel: v.fuelLevel ?? 0,
          lastUpdate: "—",
          route: [],
          startLocation: "—",
          destination: "—",
          eta: "—",
          networkStatus: v.status === "inactive" ? "offline" : "online",
          batteryVoltage: null,
          signalStrength: null,
        };
      }),
    [vehicles, driverById],
  );

  const selectedJobVehicleReg = selectedJob?.vehicleId
    ? vehicleById[selectedJob.vehicleId]?.registrationNumber || null
    : null;

  // ---- Actions ----
  const handleAssign = async () => {
    if (!selectedJob) return;
    if (!assignDriverId || !assignVehicleId) {
      toast.error("Select a driver and a vehicle");
      return;
    }
    const ok = await updateJob(selectedJob.id, {
      driverId: assignDriverId,
      vehicleId: assignVehicleId,
      assignedVehicleId: assignVehicleId,
      status: selectedJob.status === "created" ? "assigned" : selectedJob.status,
      assignedByRole: "Dispatcher",
    });
    if (ok) {
      toast.success(selectedJob.driverId ? "Driver reassigned" : "Driver assigned");
      setAssignOpen(false);
    }
  };

  const openAssign = () => {
    if (!selectedJob) return;
    setAssignDriverId(selectedJob.driverId || "");
    setAssignVehicleId(selectedJob.vehicleId || "");
    setAssignOpen(true);
  };

  const markDelayed = async () => {
    if (!selectedJob) return;
    if (isDelayed(selectedJob)) {
      // un-flag
      const cleaned = (selectedJob.notes || "").replace(/\[delayed\][^\n]*\n?/i, "").trim();
      const ok = await updateJob(selectedJob.id, { notes: cleaned || null });
      if (ok) toast.success("Delay flag cleared");
    } else {
      const stamped = `[delayed] ${new Date().toLocaleString()} — flagged by Dispatcher\n${selectedJob.notes || ""}`.trim();
      const ok = await updateJob(selectedJob.id, { notes: stamped });
      if (ok) toast.success("Job marked as delayed");
    }
  };

  const handleAddNote = async () => {
    if (!selectedJob || !noteText.trim()) return;
    const stamped = `[${new Date().toLocaleString()}] ${noteText.trim()}\n${selectedJob.notes || ""}`.trim();
    const ok = await updateJob(selectedJob.id, { notes: stamped });
    if (ok) {
      toast.success("Note added");
      setNoteText("");
      setNoteOpen(false);
    }
  };

  const handleReroute = () => {
    if (!selectedJob) return;
    setEditingJob(selectedJob);
    setIsJobFormOpen(true);
  };

  const handleManualRefresh = () => {
    refetchVehicles();
    setLastRefresh(new Date());
    toast.success("Refreshed");
  };

  const handleJobSubmit = async (data: any) => {
    if (editingJob) {
      const ok = await updateJob(editingJob.id, {
        reference: data.reference,
        pickupAddress: data.pickupAddress,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        deliveryAddress: data.deliveryAddress,
        deliveryLat: data.deliveryLat,
        deliveryLng: data.deliveryLng,
        cargoType: data.cargoType,
        cargoWeight: data.cargoWeight,
        cargoDescription: data.cargoDescription,
        amountNgn: data.amount,
        deadline: data.deadline,
      });
      if (ok) {
        toast.success("Trip updated");
        setIsJobFormOpen(false);
        setEditingJob(null);
      }
    } else {
      const ok = await addJob({
        reference: data.reference,
        pickupAddress: data.pickupAddress,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        deliveryAddress: data.deliveryAddress,
        deliveryLat: data.deliveryLat,
        deliveryLng: data.deliveryLng,
        cargoType: data.cargoType,
        cargoWeight: data.cargoWeight,
        cargoDescription: data.cargoDescription,
        amountNgn: data.amount,
        deadline: data.deadline,
      });
      if (ok) setIsJobFormOpen(false);
    }
  };

  if (vehiclesLoading) {
    return (
      <DashboardLayout title="Dispatch Cockpit" subtitle="Real-time waybill tracking">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (vehicles.length === 0) {
    return (
      <DashboardLayout title="Dispatch Cockpit" subtitle="Real-time waybill tracking">
        <EmptyState
          icon={Truck}
          title="No vehicles to track"
          description="Add vehicles to your fleet to start dispatching"
          actionLabel="View Fleet"
          actionHref="/admin/fleet"
        />
      </DashboardLayout>
    );
  }

  // ---- Dispatcher driver pool ----
  const availableDrivers = drivers.filter((d) => d.status !== "offline");
  const availableVehicles = vehicles.filter((v) => v.status === "active" || v.status === "inactive");

  return (
    <DashboardLayout title="Dispatch Cockpit" subtitle="Real-time waybill control">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-10rem)]">
        {/* ============= LEFT: CONTROL PANEL ============= */}
        <aside className="lg:col-span-3 flex flex-col gap-3 min-h-0">
          {/* KPI strip */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Active", value: counts.total, tone: "text-foreground" },
              { label: "Transit", value: counts.transit, tone: "text-primary" },
              { label: "Wait", value: counts.awaiting, tone: "text-warning" },
              { label: "Delay", value: counts.delayed, tone: "text-destructive" },
            ].map((k) => (
              <Card key={k.label} className="border-border/60">
                <CardContent className="p-2 text-center">
                  <p className={cn("text-lg font-bold leading-none", k.tone)}>{k.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
                    {k.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search + filters */}
          <Card className="border-border/60">
            <CardContent className="p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Waybill, driver, vehicle…"
                  className="pl-8 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setStatusFilter(s.key)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                      statusFilter === s.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs: Waybills | Vehicles */}
          <Card className="border-border/60 flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
              <CardHeader className="p-2 pb-0">
                <TabsList className="grid grid-cols-2 w-full h-8">
                  <TabsTrigger value="waybills" className="text-xs">
                    <Package className="h-3.5 w-3.5 mr-1.5" />
                    Waybills ({filteredJobs.length})
                  </TabsTrigger>
                  <TabsTrigger value="vehicles" className="text-xs">
                    <Truck className="h-3.5 w-3.5 mr-1.5" />
                    Vehicles ({vehicles.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="waybills" className="flex-1 min-h-0 m-0 p-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1.5">
                    {filteredJobs.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        No waybills match
                      </p>
                    )}
                    {filteredJobs.map((j) => {
                      const driver = j.driverId ? driverById[j.driverId] : null;
                      const veh = j.vehicleId ? vehicleById[j.vehicleId] : null;
                      const sel = selectedJobId === j.id;
                      const delayed = isDelayed(j);
                      return (
                        <button
                          key={j.id}
                          onClick={() => setSelectedJobId(j.id)}
                          className={cn(
                            "w-full text-left p-2.5 rounded-lg border transition-all",
                            sel
                              ? "bg-primary/10 border-primary/40 shadow-sm"
                              : "bg-card hover:bg-muted/50 border-border/50",
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold flex items-center gap-1.5">
                              {delayed && <AlertTriangle className="h-3 w-3 text-destructive" />}
                              {j.reference}
                            </span>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", statusTone(j))}>
                              {statusLabel(j)}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground space-y-0.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{driver?.name || "Unassigned"}</span>
                              <span className="opacity-60">·</span>
                              <span className="truncate">{veh?.registrationNumber || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{j.deliveryAddress}</span>
                            </div>
                            {j.deadline && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span className={cn(delayed && "text-destructive font-medium")}>
                                  ETA {new Date(j.deadline).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="vehicles" className="flex-1 min-h-0 m-0 p-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1.5">
                    {vehicles
                      .filter((v) =>
                        !search.trim() ||
                        (v.registrationNumber || "").toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((v) => {
                        const driver = v.currentDriverId ? driverById[v.currentDriverId] : null;
                        const dot =
                          v.status === "active" ? "bg-success" :
                          v.status === "maintenance" ? "bg-destructive" :
                          v.status === "inactive" ? "bg-muted-foreground" :
                          "bg-warning";
                        return (
                          <div key={v.id} className="p-2 rounded-lg border border-border/50 bg-card">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-semibold flex items-center gap-1.5">
                                <span className={cn("h-2 w-2 rounded-full", dot)} />
                                {v.registrationNumber}
                              </span>
                              <Badge variant="outline" className="text-[10px] capitalize">{v.status}</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {driver?.name || "Unassigned"}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </aside>

        {/* ============= MAIN: MAP ============= */}
        <section className="lg:col-span-9 relative min-h-0">
          <Card className="h-full border-border/60 overflow-hidden">
            <CardContent className="p-0 h-full">
              <FleetMap
                selectedVehicle={selectedJobVehicleReg}
                onVehicleSelect={() => {}}
                showGeofences={true}
                showRoutes={false}
                showAlerts={true}
                externalVehicles={mapVehicles}
              />
            </CardContent>
          </Card>

          {/* Top toolbar overlay */}
          <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-1.5 bg-card/95 backdrop-blur-sm border border-border/60 rounded-md px-2.5 py-1.5 shadow-lg pointer-events-auto">
              {autoRefresh ? (
                <Wifi className="h-3.5 w-3.5 text-success" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-[11px] font-medium">
                {autoRefresh ? "LIVE" : "PAUSED"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                · {lastRefresh.toLocaleTimeString()}
              </span>
            </div>

            <div className="ml-auto flex gap-2 pointer-events-auto">
              <Button
                variant="secondary" size="sm" className="shadow-lg"
                onClick={() => setAutoRefresh((v) => !v)}
              >
                <Radio className={cn("h-4 w-4 mr-1.5", autoRefresh && "text-success animate-pulse")} />
                {autoRefresh ? "Pause" : "Resume"}
              </Button>
              <Button variant="secondary" size="sm" className="shadow-lg" onClick={handleManualRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary" size="sm" className="shadow-lg"
                onClick={() => setGeofenceDialogOpen(true)}
              >
                <Shield className="h-4 w-4 mr-1.5" />
                Geofences
              </Button>
            </div>
          </div>

          {/* Bottom stats */}
          <div className="absolute bottom-3 left-3 z-[1000] flex gap-2">
            <Badge variant="secondary" className="shadow-lg">
              {activeJobs.length} active waybills · {vehicles.length} vehicles
            </Badge>
            {alerts.length > 0 && (
              <Badge className="shadow-lg bg-warning text-warning-foreground hover:bg-warning/90">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {alerts.length} alerts
              </Badge>
            )}
          </div>

          {/* ============= RIGHT: WAYBILL DETAILS DRAWER ============= */}
          {selectedJob && (
            <div className="absolute top-16 right-3 bottom-3 z-[1001] w-[380px] max-w-[90vw]">
              <Card className="h-full shadow-2xl border-border/60 flex flex-col">
                <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between space-y-0 border-b border-border/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary flex-shrink-0" />
                      <CardTitle className="text-base truncate">{selectedJob.reference}</CardTitle>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] mt-1.5", statusTone(selectedJob))}>
                      {statusLabel(selectedJob)}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1"
                    onClick={() => setSelectedJobId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>

                <CardContent className="p-0 flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      {/* Driver / Vehicle */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Driver</p>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium truncate">
                              {selectedJob.driverId ? driverById[selectedJob.driverId]?.name || "—" : "Unassigned"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Vehicle</p>
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium truncate">
                              {selectedJob.vehicleId ? vehicleById[selectedJob.vehicleId]?.registrationNumber || "—" : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Route */}
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Route</p>
                        <div className="flex gap-2 text-xs">
                          <div className="flex flex-col items-center pt-0.5">
                            <CircleDot className="h-3 w-3 text-success" />
                            <div className="w-px flex-1 bg-border my-1" />
                            <MapPin className="h-3 w-3 text-destructive" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <p className="text-[10px] text-muted-foreground">PICKUP</p>
                              <p className="leading-tight">{selectedJob.pickupAddress}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">DROP-OFF</p>
                              <p className="leading-tight">{selectedJob.deliveryAddress}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Timeline</p>
                        <div className="space-y-2">
                          {[
                            { key: "created", label: "Created", at: selectedJob.createdAt },
                            { key: "assigned", label: "Assigned", at: selectedJob.driverId ? selectedJob.updatedAt : null },
                            { key: "in_progress", label: "In Transit", at: selectedJob.status === "in_progress" || selectedJob.status === "completed" ? selectedJob.updatedAt : null },
                            { key: "completed", label: "Delivered", at: selectedJob.completedAt },
                          ].map((step) => {
                            const done = !!step.at;
                            return (
                              <div key={step.key} className="flex items-center gap-2 text-xs">
                                <CheckCircle2
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    done ? "text-success" : "text-muted-foreground/40",
                                  )}
                                />
                                <span className={cn(!done && "text-muted-foreground")}>
                                  {step.label}
                                </span>
                                {step.at && (
                                  <span className="ml-auto text-[10px] text-muted-foreground">
                                    {new Date(step.at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes */}
                      {selectedJob.notes && (
                        <>
                          <Separator />
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Notes</p>
                            <pre className="text-[11px] whitespace-pre-wrap font-sans bg-muted/40 rounded p-2 max-h-32 overflow-y-auto">
                              {selectedJob.notes}
                            </pre>
                          </div>
                        </>
                      )}

                      {/* Deadline */}
                      {selectedJob.deadline && (
                        <div className="flex items-center justify-between text-xs bg-muted/40 rounded-md p-2">
                          <span className="text-muted-foreground">Deadline</span>
                          <span className={cn("font-medium", isDelayed(selectedJob) && "text-destructive")}>
                            {new Date(selectedJob.deadline).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Actions */}
                <div className="border-t border-border/50 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={openAssign}>
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      {selectedJob.driverId ? "Reassign" : "Assign"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleReroute}>
                      <Route className="h-3.5 w-3.5 mr-1.5" />
                      Re-route
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={markDelayed}
                      className={cn(isDelayed(selectedJob) && "border-destructive/50 text-destructive")}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      {isDelayed(selectedJob) ? "Clear Delay" : "Mark Delayed"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>
                      <MessageSquarePlus className="h-3.5 w-3.5 mr-1.5" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </section>
      </div>

      {/* Assign / Reassign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedJob?.driverId ? "Reassign Driver" : "Assign Driver"}
            </DialogTitle>
            <DialogDescription>
              Waybill {selectedJob?.reference} — pick a driver and vehicle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Driver</label>
              <Select value={assignDriverId} onValueChange={setAssignDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} <span className="text-muted-foreground">· {d.status}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Vehicle</label>
              <Select value={assignVehicleId} onValueChange={setAssignVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registrationNumber} <span className="text-muted-foreground">· {v.status}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Note will be appended to waybill {selectedJob?.reference} with a timestamp.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="What happened?"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={!noteText.trim()}>Add Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GeofenceManagementDialog
        open={geofenceDialogOpen}
        onOpenChange={setGeofenceDialogOpen}
      />

      <JobFormDialog
        open={isJobFormOpen}
        onOpenChange={(open) => {
          setIsJobFormOpen(open);
          if (!open) setEditingJob(null);
        }}
        job={editingJob as any}
        onSubmit={handleJobSubmit}
      />
    </DashboardLayout>
  );
}



