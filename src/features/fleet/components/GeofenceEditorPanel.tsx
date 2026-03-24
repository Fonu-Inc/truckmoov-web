import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  Circle,
  Clock,
  MapPin,
  Save,
  Settings2,
  Square,
  X,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { geofenceCategoryColors, weekDays } from "./geofence-modal/constants";
import type {
  GeofenceCategory,
  GeofenceEditorFormState,
  GeofenceModalVehicle,
} from "./geofence-modal/types";

interface GeofenceEditorPanelProps {
  errors: {
    name?: string;
  };
  form: GeofenceEditorFormState;
  isCreating: boolean;
  onCancel: () => void;
  onSave: () => void;
  onUpdateForm: (updates: Partial<GeofenceEditorFormState>) => void;
  title: string;
  vehicles: GeofenceModalVehicle[];
}

interface TabSectionProps {
  form: GeofenceEditorFormState;
  onUpdateForm: (updates: Partial<GeofenceEditorFormState>) => void;
}

interface VehiclesTabProps extends TabSectionProps {
  vehicles: GeofenceModalVehicle[];
}

function GeneralSettingsTab({ form, onUpdateForm }: TabSectionProps) {
  return (
    <TabsContent value="general" className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Zone Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => onUpdateForm({ name: event.target.value })}
            placeholder="Enter zone name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Zone Type</Label>
          <Select
            value={form.category}
            onValueChange={(value: GeofenceCategory) =>
              onUpdateForm({
                category: value,
                color: geofenceCategoryColors[value],
              })}
          >
            <SelectTrigger id="type">
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
            variant={form.geofenceType === "CIRCLE" ? "default" : "outline"}
            size="sm"
            onClick={() => onUpdateForm({ geofenceType: "CIRCLE" })}
          >
            <Circle className="h-4 w-4 mr-2" />
            Circle
          </Button>
          <Button
            type="button"
            variant={form.geofenceType === "POLYGON" ? "default" : "outline"}
            size="sm"
            onClick={() => onUpdateForm({ geofenceType: "POLYGON" })}
          >
            <Square className="h-4 w-4 mr-2" />
            Polygon
          </Button>
        </div>
        {form.geofenceType === "POLYGON" && (
          <p className="text-xs text-muted-foreground">
            Polygon drawing will be connected later. This UI currently preserves the layout and input flow only.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>
          Radius: {form.radiusMeters}m ({(form.radiusMeters / 1000).toFixed(1)}km)
        </Label>
        <Slider
          value={[form.radiusMeters]}
          onValueChange={([value]) => onUpdateForm({ radiusMeters: value })}
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
            value={form.center[0]}
            onChange={(event) =>
              onUpdateForm({
                center: [Number.parseFloat(event.target.value) || 0, form.center[1]],
              })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="0.0001"
            value={form.center[1]}
            onChange={(event) =>
              onUpdateForm({
                center: [form.center[0], Number.parseFloat(event.target.value) || 0],
              })}
          />
        </div>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Tip: a map picker can be plugged into this state later without changing the editor layout.
            </span>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function AlertsSettingsTab({ form, onUpdateForm }: TabSectionProps) {
  return (
    <TabsContent value="alerts" className="mt-4 space-y-4">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alert Triggers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Entry Alert</Label>
              <p className="text-xs text-muted-foreground">
                Trigger when vehicle enters zone
              </p>
            </div>
            <Switch
              checked={form.alertOnEntry}
              onCheckedChange={(checked) => onUpdateForm({ alertOnEntry: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Exit Alert</Label>
              <p className="text-xs text-muted-foreground">
                Trigger when vehicle exits zone
              </p>
            </div>
            <Switch
              checked={form.alertOnExit}
              onCheckedChange={(checked) => onUpdateForm({ alertOnExit: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Dwell Time Alert</Label>
              <p className="text-xs text-muted-foreground">
                Trigger after vehicle stays too long
              </p>
            </div>
            <Switch
              checked={form.alertOnDwell}
              onCheckedChange={(checked) => onUpdateForm({ alertOnDwell: checked })}
            />
          </div>

          {form.alertOnDwell && (
            <div className="pl-6 space-y-2">
              <Label>Dwell Time Threshold: {form.dwellThresholdMinutes} minutes</Label>
              <Slider
                value={[form.dwellThresholdMinutes]}
                onValueChange={([value]) => onUpdateForm({ dwellThresholdMinutes: value })}
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
              checked={form.speedLimitKmh !== null}
              onCheckedChange={(checked) =>
                onUpdateForm({ speedLimitKmh: checked ? 60 : null })}
            />
          </div>

          {form.speedLimitKmh !== null && (
            <div className="space-y-2">
              <Label>Speed Limit: {form.speedLimitKmh} km/h</Label>
              <Slider
                value={[form.speedLimitKmh]}
                onValueChange={([value]) => onUpdateForm({ speedLimitKmh: value })}
                min={10}
                max={120}
                step={5}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function ScheduleSettingsTab({ form, onUpdateForm }: TabSectionProps) {
  const toggleDay = (day: string) => {
    const nextDays = form.scheduleDays.includes(day)
      ? form.scheduleDays.filter((currentDay) => currentDay !== day)
      : [...form.scheduleDays, day];

    onUpdateForm({ scheduleDays: nextDays });
  };

  return (
    <TabsContent value="schedule" className="mt-4 space-y-4">
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
              checked={form.scheduleEnabled}
              onCheckedChange={(checked) => onUpdateForm({ scheduleEnabled: checked })}
            />
          </div>

          {form.scheduleEnabled && (
            <>
              <div className="space-y-2">
                <Label>Active Days</Label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <Button
                      key={day}
                      type="button"
                      size="sm"
                      variant={form.scheduleDays.includes(day) ? "default" : "outline"}
                      className="h-8 w-10"
                      onClick={() => toggleDay(day)}
                    >
                      {day.slice(0, 2)}
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
                    value={form.scheduleStartTime}
                    onChange={(event) => onUpdateForm({ scheduleStartTime: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={form.scheduleEndTime}
                    onChange={(event) => onUpdateForm({ scheduleEndTime: event.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!form.scheduleEnabled && (
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
  );
}

function VehiclesSettingsTab({ form, onUpdateForm, vehicles }: VehiclesTabProps) {
  const toggleVehicle = (vehicleId: string) => {
    const nextVehicleIds = form.assignedVehicleIds.includes(vehicleId)
      ? form.assignedVehicleIds.filter((currentId) => currentId !== vehicleId)
      : [...form.assignedVehicleIds, vehicleId];

    onUpdateForm({ assignedVehicleIds: nextVehicleIds });
  };

  return (
    <TabsContent value="vehicles" className="mt-4 space-y-4">
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Assigned Vehicles</CardTitle>
            <Badge variant="secondary">
              {form.assignedVehicleIds.length} selected
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Select which vehicles should trigger alerts for this zone
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {vehicles.map((vehicle) => {
              const isSelected = form.assignedVehicleIds.includes(vehicle.id);

              return (
                <div
                  key={vehicle.id}
                  className={
                    isSelected
                      ? "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors bg-primary/10 border border-primary/30"
                      : "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors bg-muted/30 hover:bg-muted/50"
                  }
                  onClick={() => toggleVehicle(vehicle.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={
                        isSelected
                          ? "h-5 w-5 rounded border flex items-center justify-center bg-primary border-primary text-primary-foreground"
                          : "h-5 w-5 rounded border flex items-center justify-center border-muted-foreground/30"
                      }
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{vehicle.registrationNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.make} {vehicle.model}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {vehicles.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No vehicles available</p>
                <p className="text-xs mt-1">
                  Vehicle data can be plugged into this UI when the fleet API is ready.
                </p>
              </div>
            )}
          </div>

          {vehicles.length > 0 && (
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onUpdateForm({ assignedVehicleIds: vehicles.map((vehicle) => vehicle.id) })}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onUpdateForm({ assignedVehicleIds: [] })}
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {form.assignedVehicleIds.length === 0 && (
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
  );
}

export function GeofenceEditorPanel({
  errors,
  form,
  isCreating,
  onCancel,
  onSave,
  onUpdateForm,
  title,
  vehicles,
}: GeofenceEditorPanelProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <span className="font-medium">
          {isCreating ? "Create New Zone" : `Edit: ${title}`}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={onSave}>
            <Save className="h-4 w-4 mr-1" />
            Save Zone
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(600px-57px)]">
        <Tabs defaultValue="general" className="p-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          </TabsList>

          {errors.name && (
            <p className="mt-4 text-sm text-destructive">{errors.name}</p>
          )}

          <GeneralSettingsTab form={form} onUpdateForm={onUpdateForm} />
          <AlertsSettingsTab form={form} onUpdateForm={onUpdateForm} />
          <ScheduleSettingsTab form={form} onUpdateForm={onUpdateForm} />
          <VehiclesSettingsTab
            form={form}
            onUpdateForm={onUpdateForm}
            vehicles={vehicles}
          />
        </Tabs>
      </ScrollArea>
    </div>
  );
}
