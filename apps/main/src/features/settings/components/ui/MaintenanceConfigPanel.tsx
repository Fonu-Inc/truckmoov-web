import {
  Fuel, Save, Settings, Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";

/** The design app's select trigger is taller and rounder than the shared one. */
const SELECT_TRIGGER_CLASS = "h-10 rounded-xl px-3.5";

function DispatchActionOptions() {
  return (
    <SelectContent>
      <SelectItem value="allow">Allow dispatch</SelectItem>
      <SelectItem value="warn">Warn dispatcher</SelectItem>
      <SelectItem value="block">Block dispatch</SelectItem>
    </SelectContent>
  );
}

/**
 * The Fleet tab (`/settings/fleet`). No endpoint stores the tenant's
 * maintenance dispatch rules or fuel-drop alert settings yet (the fleet API's
 * fuel thresholds are km/L per vehicle type, a different setting), so every
 * control shows "-" and is locked, and saving says so instead of pretending.
 */
export function MaintenanceConfigPanel() {
  const handleSave = () => {
    toast.info("Fleet settings are not available yet.");
  };

  return (
    <div className="rounded-2xl surface-sleek text-card-foreground bg-card/50 border-border/50">
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Maintenance & Fuel Configuration
        </h3>
        <p className="text-sm text-muted-foreground">Configure dispatch rules and fuel monitoring thresholds for your fleet.</p>
      </div>
      <div className="p-6 pt-0 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Dispatch Rules
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dispatchOverdueAction">When maintenance is OVERDUE</Label>
              <Select disabled>
                <SelectTrigger
                  id="dispatchOverdueAction"
                  className={SELECT_TRIGGER_CLASS}
                >
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <DispatchActionOptions />
              </Select>
              <p className="text-xs text-muted-foreground">Action when a vehicle has overdue maintenance items</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatchDueAction">When maintenance is DUE</Label>
              <Select disabled>
                <SelectTrigger
                  id="dispatchDueAction"
                  className={SELECT_TRIGGER_CLASS}
                >
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <DispatchActionOptions />
              </Select>
              <p className="text-xs text-muted-foreground">Action when maintenance is due within the warning period</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceWarnDays">Warning Period (days)</Label>
            <Input
              id="maintenanceWarnDays"
              value="-"
              readOnly
              disabled
              className="max-w-32"
            />
            <p className="text-xs text-muted-foreground">Days before due date to start showing warnings</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            Fuel Monitoring
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Fuel Anomaly Alerts</Label>
              <p className="text-xs text-muted-foreground">Detect sudden fuel drops and abnormal consumption</p>
            </div>
            <Switch
              aria-label="Fuel Anomaly Alerts"
              checked={false}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuelDropThreshold">Fuel Drop Threshold (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="fuelDropThreshold"
                value="-"
                readOnly
                disabled
                className="max-w-32"
              />
              <span className="text-sm text-muted-foreground">% drop to trigger alert</span>
            </div>
            <p className="text-xs text-muted-foreground">A fuel drop greater than this percentage triggers an alert</p>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
