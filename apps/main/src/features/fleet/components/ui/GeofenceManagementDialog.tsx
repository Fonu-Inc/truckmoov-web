import type {
  Geofence, GeofencePayload,
} from "@truckmoov/api/fleet";
import {

  useArchiveGeofence,
  useCreateGeofence,
  useGeofences,
  useUpdateGeofence,
  useVehicles,
} from "@truckmoov/api/fleet";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Bell,
  Check,
  Circle,
  Clock,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Save,
  Settings2,
  Shield,
  Square,
  X,
  Zap,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
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
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Slider } from "@/components/shadcn/slider";
import { Switch } from "@/components/shadcn/switch";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";

type GeofenceManagementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedVehicleId?: string | null;
};

const zoneTypeColors: Record<string, string> = {
  depot: "#3b82f6",
  delivery: "#22c55e",
  restricted: "#ef4444",
  customer: "#8b5cf6",
  custom: "#f59e0b",
};

const zoneTypeLabels: Record<string, string> = {
  depot: "Depot",
  delivery: "Delivery Zone",
  restricted: "Restricted Area",
  customer: "Customer Site",
  custom: "Custom Zone",
};

const weekDays = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

type EditFormState = {
  id?: string;
  name: string;
  description: string;
  category: string;
  geofence_type: "CIRCLE" | "POLYGON";
  center: [number, number];
  radius_meters: number;
  color: string;
  alert_on_entry: boolean;
  alert_on_exit: boolean;
  alert_on_dwell: boolean;
  dwell_threshold_minutes: number;
  speed_limit_kmh: number | null;
  schedule_enabled: boolean;
  schedule_days: string[];
  schedule_start_time: string;
  schedule_end_time: string;
  assignedVehicleIds: string[];
};

type GeofenceView = Geofence & {
  color: string;
  geofence_type: Geofence["shape"];
  radius_meters: number;
  alert_on_entry: boolean;
  alert_on_exit: boolean;
  alert_on_dwell: boolean;
  dwell_threshold_minutes: number;
  speed_limit_kmh: number | null;
  schedule_enabled: boolean;
  schedule_days: string[];
  schedule_start_time: string;
  schedule_end_time: string;
};

const defaultEditForm: EditFormState = {
  name: "",
  description: "",
  category: "custom",
  geofence_type: "CIRCLE",
  center: [
    6.5244,
    3.3792,
  ], // Lagos default
  radius_meters: 500,
  color: zoneTypeColors.custom,
  alert_on_entry: true,
  alert_on_exit: true,
  alert_on_dwell: false,
  dwell_threshold_minutes: 30,
  speed_limit_kmh: null,
  schedule_enabled: false,
  schedule_days: [],
  schedule_start_time: "08:00",
  schedule_end_time: "17:00",
  assignedVehicleIds: [],
};

export function GeofenceManagementDialog({
  open, onOpenChange, preselectedVehicleId,
}: GeofenceManagementDialogProps) {
  const {
    data: geofenceResponse, isLoading,
  } = useGeofences({ params: { status: "ACTIVE" } });
  const {
    data: vehicleResponse, isLoading: vehiclesLoading,
  } = useVehicles();
  const createGeofence = useCreateGeofence();
  const updateGeofence = useUpdateGeofence();
  const archiveGeofence = useArchiveGeofence();
  const canManageGeofences = true;
  const vehicles = vehicleResponse?.data ?? [];

  const geofences = useMemo(
    () => (geofenceResponse?.data ?? []).map(zone => ({
      ...zone,
      color: zoneTypeColors[zone.category] ?? zoneTypeColors.custom,
      geofence_type: zone.shape,
      radius_meters: zone.radiusMeters,
      alert_on_entry: zone.alerts.entry,
      alert_on_exit: zone.alerts.exit,
      alert_on_dwell: zone.alerts.dwell,
      dwell_threshold_minutes: zone.alerts.dwellMinutes,
      speed_limit_kmh: zone.alerts.speedLimit.enabled ? zone.alerts.speedLimit.limitKph : null,
      schedule_enabled: zone.schedule.enabled,
      schedule_days: zone.schedule.days,
      schedule_start_time: zone.schedule.startTime,
      schedule_end_time: zone.schedule.endTime,
    })),
    [geofenceResponse],
  );

  const [
    selectedZone,
    setSelectedZone,
  ] = useState<GeofenceView | null>(null);
  const [
    isEditing,
    setIsEditing,
  ] = useState(false);
  const [
    isCreating,
    setIsCreating,
  ] = useState(false);
  const [
    deleteConfirmId,
    setDeleteConfirmId,
  ] = useState<string | null>(null);
  const [
    editForm,
    setEditForm,
  ] = useState<EditFormState>(defaultEditForm);

  // Filter to show only ACTIVE geofences
  const activeGeofences = geofences?.filter(g => g.status === "ACTIVE") || [];

  // When opened with a preselected vehicle, auto-start a new zone scoped to that vehicle
  useEffect(
    () => {
      if (open && preselectedVehicleId) {
        setEditForm({
          ...defaultEditForm,
          assignedVehicleIds: [preselectedVehicleId],
        });
        setIsCreating(true);
        setIsEditing(true);
      }
    },
    [
      open,
      preselectedVehicleId,
    ],
  );

  const handleCreateNew = () => {
    setEditForm(defaultEditForm);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEditZone = (zone: GeofenceView) => {
    setEditForm({
      id: zone.id,
      name: zone.name,
      description: zone.description ?? "",
      category: zone.category,
      geofence_type: zone.geofence_type,
      center: [
        zone.center.latitude,
        zone.center.longitude,
      ],
      radius_meters: zone.radius_meters || 500,
      color: zone.color,
      alert_on_entry: zone.alert_on_entry,
      alert_on_exit: zone.alert_on_exit,
      alert_on_dwell: zone.alert_on_dwell,
      dwell_threshold_minutes: zone.dwell_threshold_minutes || 30,
      speed_limit_kmh: zone.speed_limit_kmh,
      schedule_enabled: zone.schedule_enabled,
      schedule_days: zone.schedule_days || [],
      schedule_start_time: zone.schedule_start_time || "08:00",
      schedule_end_time: zone.schedule_end_time || "17:00",
      assignedVehicleIds: zone.assignedVehicleIds || [],
    });
    setSelectedZone(zone);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSaveZone = async () => {
    if (!editForm.name?.trim()) {
      toast.error("Zone name is required");
      return;
    }

    const input: GeofencePayload = {
      name: editForm.name,
      description: editForm.description,
      zoneType: editForm.category,
      category: editForm.category,
      shape: editForm.geofence_type,
      center: {
        latitude: editForm.center[0], longitude: editForm.center[1],
      },
      coordinates: editForm.geofence_type === "POLYGON"
        ? []
        : [
            [
              editForm.center[1],
              editForm.center[0],
            ],
          ],
      radiusMeters: editForm.geofence_type === "CIRCLE" ? editForm.radius_meters : 0,
      entryAlertsEnabled: editForm.alert_on_entry,
      exitAlertsEnabled: editForm.alert_on_exit,
      dwellAlertsEnabled: editForm.alert_on_dwell,
      dwellMinutes: editForm.alert_on_dwell ? editForm.dwell_threshold_minutes : 0,
      speedLimit: {
        enabled: editForm.speed_limit_kmh !== null,
        limitKph: editForm.speed_limit_kmh ?? 0,
      },
      schedule: {
        enabled: editForm.schedule_enabled,
        timezone: "Africa/Lagos",
        days: editForm.schedule_days,
        startTime: editForm.schedule_start_time,
        endTime: editForm.schedule_end_time,
      },
      assignedVehicleIds: editForm.assignedVehicleIds,
    };

    try {
      if (isCreating) {
        await createGeofence.mutateAsync({ data: input });
        toast.success("Geofence created");
      }
      else if (editForm.id) {
        await updateGeofence.mutateAsync({
          id: editForm.id, data: input,
        });
        toast.success("Geofence updated");
      }

      setIsEditing(false);
      setIsCreating(false);
      setSelectedZone(null);
      setEditForm(defaultEditForm);
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save geofence");
    }
  };

  const handleArchiveZone = async (zoneId: string) => {
    try {
      await archiveGeofence.mutateAsync({ id: zoneId });
      toast.success("Geofence archived");
      setDeleteConfirmId(null);
      if (selectedZone?.id === zoneId)
        setSelectedZone(null);
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to archive geofence");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedZone(null);
    setEditForm(defaultEditForm);
  };

  const updateEditForm = (updates: Partial<EditFormState>) => {
    setEditForm(prev => ({
      ...prev, ...updates,
    }));
  };

  const toggleDay = (day: string) => {
    const currentDays = editForm.schedule_days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [
          ...currentDays,
          day,
        ];
    updateEditForm({ schedule_days: newDays });
  };

  const toggleVehicle = (vehicleId: string) => {
    const currentVehicles = editForm.assignedVehicleIds || [];
    const newVehicles = currentVehicles.includes(vehicleId)
      ? currentVehicles.filter(v => v !== vehicleId)
      : [
          ...currentVehicles,
          vehicleId,
        ];
    updateEditForm({ assignedVehicleIds: newVehicles });
  };

  const isSaving = createGeofence.isPending || updateGeofence.isPending;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Geofence Management
            </DialogTitle>
            <DialogDescription>
              Create, edit, and configure geofence zones with custom alerts
            </DialogDescription>
          </DialogHeader>

          <div className="flex h-[600px]">
            {/* Zone List Sidebar */}
            <div className="w-80 border-r border-border bg-muted/20 flex flex-col">
              <div className="p-4 border-b border-border">
                <Button
                  onClick={handleCreateNew}
                  className="w-full"
                  disabled={isEditing || !canManageGeofences}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Zone
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {isLoading
                    ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      )
                    : activeGeofences.length === 0
                      ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No geofences configured</p>
                            <p className="text-xs mt-1">Create your first zone above</p>
                          </div>
                        )
                      : (
                          activeGeofences.map(zone => (
                            <Card
                              key={zone.id}
                              className={`cursor-pointer transition-all hover:border-primary/50 ${
                                selectedZone?.id === zone.id && !isEditing
                                  ? "border-primary bg-primary/5"
                                  : ""
                              }`}
                              onClick={() => !isEditing && setSelectedZone(zone)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-3 w-3 rounded-full"
                                      style={{ backgroundColor: zone.color }}
                                    />
                                    <div>
                                      <p className="font-medium text-sm">{zone.name}</p>
                                      <p className="text-xs text-muted-foreground capitalize">
                                        {zoneTypeLabels[zone.category]}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {zone.assignedVehicleIds.length}
                                    {" "}
                                    vehicles
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  {zone.alert_on_entry && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      <LogIn className="h-2.5 w-2.5 mr-1" />
                                      Entry
                                    </Badge>
                                  )}
                                  {zone.alert_on_exit && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      <LogOut className="h-2.5 w-2.5 mr-1" />
                                      Exit
                                    </Badge>
                                  )}
                                  {zone.alert_on_dwell && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      <Clock className="h-2.5 w-2.5 mr-1" />
                                      Dwell
                                    </Badge>
                                  )}
                                </div>
                                {canManageGeofences && (
                                  <div className="flex gap-1 mt-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs flex-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditZone(zone);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmId(zone.id);
                                      }}
                                    >
                                      <Archive className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        )}
                </div>
              </ScrollArea>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {isEditing ? (
                /* Edit/Create Form */
                <div className="flex-1 overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                      <span className="font-medium">
                        {isCreating ? "Create New Zone" : `Edit: ${editForm.name}`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveZone}
                        disabled={isSaving}
                      >
                        {isSaving
                          ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            )
                          : (
                              <Save className="h-4 w-4 mr-1" />
                            )}
                        Save Zone
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[calc(600px-57px)]">
                    <Tabs
                      defaultValue="general"
                      className="p-4"
                    >
                      <TabsList className="w-full grid grid-cols-4">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="alerts">Alerts</TabsTrigger>
                        <TabsTrigger value="schedule">Schedule</TabsTrigger>
                        <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                      </TabsList>

                      <TabsContent
                        value="general"
                        className="mt-4 space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Zone Name *</Label>
                            <Input
                              id="name"
                              value={editForm.name}
                              onChange={e => updateEditForm({ name: e.target.value })}
                              placeholder="Enter zone name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="type">Zone Type</Label>
                            <Select
                              value={editForm.category}
                              onValueChange={(value: string) => {
                                updateEditForm({
                                  category: value,
                                  color: zoneTypeColors[value],
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="depot">Depot</SelectItem>
                                <SelectItem value="delivery">Delivery Zone</SelectItem>
                                <SelectItem value="restricted">Restricted Area</SelectItem>
                                <SelectItem value="customer">Customer Site</SelectItem>
                                <SelectItem value="custom">Custom Zone</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Shape</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={editForm.geofence_type === "CIRCLE" ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateEditForm({ geofence_type: "CIRCLE" })}
                            >
                              <Circle className="h-4 w-4 mr-2" />
                              Circle
                            </Button>
                            <Button
                              type="button"
                              variant={editForm.geofence_type === "POLYGON" ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateEditForm({ geofence_type: "POLYGON" })}
                            >
                              <Square className="h-4 w-4 mr-2" />
                              Polygon
                            </Button>
                          </div>
                          {editForm.geofence_type === "POLYGON" && (
                            <p className="text-xs text-muted-foreground">
                              Polygon drawing requires map interaction. Enter coordinates manually below or use the map editor.
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Radius:
                            {" "}
                            {editForm.radius_meters}
                            m (
                            {(editForm.radius_meters / 1000).toFixed(1)}
                            km)
                          </Label>
                          <Slider
                            value={[editForm.radius_meters]}
                            onValueChange={([value]) => updateEditForm({ radius_meters: value })}
                            min={100}
                            max={5000}
                            step={100}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>100m</span>
                            <span>5km</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="lat">Latitude</Label>
                            <Input
                              id="lat"
                              type="number"
                              step="0.0001"
                              value={editForm.center[0]}
                              onChange={e =>
                                updateEditForm({
                                  center: [
                                    Number.parseFloat(e.target.value) || 0,
                                    editForm.center[1],
                                  ],
                                })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lng">Longitude</Label>
                            <Input
                              id="lng"
                              type="number"
                              step="0.0001"
                              value={editForm.center[1]}
                              onChange={e =>
                                updateEditForm({
                                  center: [
                                    editForm.center[0],
                                    Number.parseFloat(e.target.value) || 0,
                                  ],
                                })}
                            />
                          </div>
                        </div>

                        <Card className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Tip: Click on the map to set the zone center point
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent
                        value="alerts"
                        className="mt-4 space-y-4"
                      >
                        <Card>
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Bell className="h-4 w-4" />
                              Alert Triggers
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <LogIn className="h-4 w-4 text-success" />
                                <div>
                                  <Label className="text-sm">Entry Alert</Label>
                                  <p className="text-xs text-muted-foreground">
                                    Trigger when vehicle enters zone
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={editForm.alert_on_entry}
                                onCheckedChange={checked => updateEditForm({ alert_on_entry: checked })}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <LogOut className="h-4 w-4 text-destructive" />
                                <div>
                                  <Label className="text-sm">Exit Alert</Label>
                                  <p className="text-xs text-muted-foreground">
                                    Trigger when vehicle exits zone
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={editForm.alert_on_exit}
                                onCheckedChange={checked => updateEditForm({ alert_on_exit: checked })}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-warning" />
                                <div>
                                  <Label className="text-sm">Dwell Time Alert</Label>
                                  <p className="text-xs text-muted-foreground">
                                    Trigger after vehicle stays too long
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={editForm.alert_on_dwell}
                                onCheckedChange={checked => updateEditForm({ alert_on_dwell: checked })}
                              />
                            </div>

                            {editForm.alert_on_dwell && (
                              <div className="pl-6 space-y-2">
                                <Label>
                                  Dwell Time Threshold:
                                  {editForm.dwell_threshold_minutes}
                                  {" "}
                                  minutes
                                </Label>
                                <Slider
                                  value={[editForm.dwell_threshold_minutes]}
                                  onValueChange={([value]) => updateEditForm({ dwell_threshold_minutes: value })}
                                  min={5}
                                  max={120}
                                  step={5}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Speed Limit
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm">Enable Speed Limit</Label>
                                <p className="text-xs text-muted-foreground">
                                  Alert when vehicle exceeds speed
                                </p>
                              </div>
                              <Switch
                                checked={editForm.speed_limit_kmh !== null}
                                onCheckedChange={checked =>
                                  updateEditForm({ speed_limit_kmh: checked ? 60 : null })}
                              />
                            </div>

                            {editForm.speed_limit_kmh !== null && (
                              <div className="space-y-2">
                                <Label>
                                  Speed Limit:
                                  {editForm.speed_limit_kmh}
                                  {" "}
                                  km/h
                                </Label>
                                <Slider
                                  value={[editForm.speed_limit_kmh]}
                                  onValueChange={([value]) => updateEditForm({ speed_limit_kmh: value })}
                                  min={10}
                                  max={120}
                                  step={5}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent
                        value="schedule"
                        className="mt-4 space-y-4"
                      >
                        <Card>
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Settings2 className="h-4 w-4" />
                              Active Schedule
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm">Enable Schedule</Label>
                                <p className="text-xs text-muted-foreground">
                                  Zone only active during specific times
                                </p>
                              </div>
                              <Switch
                                checked={editForm.schedule_enabled}
                                onCheckedChange={checked => updateEditForm({ schedule_enabled: checked })}
                              />
                            </div>

                            {editForm.schedule_enabled && (
                              <>
                                <div className="space-y-2">
                                  <Label>Active Days</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {weekDays.map(day => (
                                      <Button
                                        key={day}
                                        type="button"
                                        size="sm"
                                        variant={
                                          editForm.schedule_days.includes(day)
                                            ? "default"
                                            : "outline"
                                        }
                                        className="h-8 w-10"
                                        onClick={() => toggleDay(day)}
                                      >
                                        {day.slice(
                                          0,
                                          2,
                                        )}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input
                                      id="startTime"
                                      type="time"
                                      value={editForm.schedule_start_time}
                                      onChange={e => updateEditForm({ schedule_start_time: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input
                                      id="endTime"
                                      type="time"
                                      value={editForm.schedule_end_time}
                                      onChange={e => updateEditForm({ schedule_end_time: e.target.value })}
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>

                        {!editForm.schedule_enabled && (
                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Zone is active 24/7 when schedule is disabled</span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>

                      <TabsContent
                        value="vehicles"
                        className="mt-4 space-y-4"
                      >
                        <Card>
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">Assigned Vehicles</CardTitle>
                              <Badge variant="secondary">
                                {editForm.assignedVehicleIds.length}
                                {" "}
                                selected
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Select which vehicles should trigger alerts for this zone
                            </p>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {vehicles?.map(vehicle => (
                                <div
                                  key={vehicle.id}
                                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                                    editForm.assignedVehicleIds.includes(vehicle.id)
                                      ? "bg-primary/10 border border-primary/30"
                                      : "bg-muted/30 hover:bg-muted/50"
                                  }`}
                                  onClick={() => toggleVehicle(vehicle.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-5 w-5 rounded border flex items-center justify-center ${
                                        editForm.assignedVehicleIds.includes(vehicle.id)
                                          ? "bg-primary border-primary text-primary-foreground"
                                          : "border-muted-foreground/30"
                                      }`}
                                    >
                                      {editForm.assignedVehicleIds.includes(vehicle.id) && (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{vehicle.registrationNumber}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {vehicle.make}
                                        {" "}
                                        {vehicle.model}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {vehiclesLoading && (
                                <div className="flex justify-center py-4">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              )}
                              {!vehiclesLoading && vehicles.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground">
                                  <p className="text-sm">No vehicles available</p>
                                </div>
                              )}
                            </div>

                            {vehicles && vehicles.length > 0 && (
                              <div className="flex gap-2 mt-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateEditForm({ assignedVehicleIds: vehicles.map(v => v.id) })}
                                >
                                  Select All
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateEditForm({ assignedVehicleIds: [] })}
                                >
                                  Clear All
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {editForm.assignedVehicleIds.length === 0 && (
                          <Card className="bg-warning/10 border-warning/30">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 text-sm text-warning">
                                <AlertTriangle className="h-4 w-4" />
                                <span>No vehicles selected. Alerts will trigger for all vehicles.</span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>
                    </Tabs>
                  </ScrollArea>
                </div>
              ) : selectedZone ? (
                /* Zone Details View */
                <div className="flex-1 p-4 overflow-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${selectedZone.color}20` }}
                        >
                          <Shield
                            className="h-5 w-5"
                            style={{ color: selectedZone.color }}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium">{selectedZone.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {zoneTypeLabels[selectedZone.category]}
                          </p>
                        </div>
                      </div>
                      {canManageGeofences && (
                        <Button
                          size="sm"
                          onClick={() => handleEditZone(selectedZone)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Shape</p>
                          <p className="font-medium">{selectedZone.geofence_type}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Radius</p>
                          <p className="font-medium">
                            {selectedZone.radius_meters ? `${selectedZone.radius_meters}m` : "N/A"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm">Alert Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Entry Alerts</span>
                          <Badge variant={selectedZone.alert_on_entry ? "default" : "secondary"}>
                            {selectedZone.alert_on_entry ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Exit Alerts</span>
                          <Badge variant={selectedZone.alert_on_exit ? "default" : "secondary"}>
                            {selectedZone.alert_on_exit ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Dwell Alerts</span>
                          <Badge variant={selectedZone.alert_on_dwell ? "default" : "secondary"}>
                            {selectedZone.alert_on_dwell
                              ? `After ${selectedZone.dwell_threshold_minutes}min`
                              : "Disabled"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm">Assigned Vehicles</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        {selectedZone.assignedVehicleIds.length > 0
                          ? (
                              <div className="flex flex-wrap gap-2">
                                {vehicles
                                  ?.filter(v => selectedZone.assignedVehicleIds.includes(v.id))
                                  .map(v => (
                                    <Badge
                                      key={v.id}
                                      variant="outline"
                                    >
                                      {v.registrationNumber}
                                    </Badge>
                                  ))}
                              </div>
                            )
                          : (
                              <p className="text-sm text-muted-foreground">
                                All vehicles (no specific assignment)
                              </p>
                            )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                /* Empty State */
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="font-medium mb-1">Select a Geofence</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a zone from the list to view details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Geofence?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the geofence and stop all alerts. You can restore it later from the archived zones view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleArchiveZone(deleteConfirmId)}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
