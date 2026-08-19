import {
  Fuel, Save, Settings, Wrench,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
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
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";

type TenantMaintenanceConfig = any;

export function MaintenanceConfigPanel() {
  const getConfig = async (): Promise<TenantMaintenanceConfig | null> => null;
  const updateConfig = async (_cfg: any): Promise<boolean> => false;
  const tenantId: string | null = null;
  const [
    _config,
    setConfig,
  ] = useState<TenantMaintenanceConfig | null>(null);
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);
  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  // Local form state
  const [
    dispatchOverdueAction,
    setDispatchOverdueAction,
  ] = useState<string>("warn");
  const [
    dispatchDueAction,
    setDispatchDueAction,
  ] = useState<string>("allow");
  const [
    warnDaysBefore,
    setWarnDaysBefore,
  ] = useState<string>("7");
  const [
    fuelVarianceThreshold,
    setFuelVarianceThreshold,
  ] = useState<string>("15");
  const [
    fuelAlertEnabled,
    setFuelAlertEnabled,
  ] = useState(true);

  useEffect(
    () => {
      const loadConfig = async () => {
        setIsLoading(true);
        try {
          const data = await getConfig();
          if (data) {
            setConfig(data);
            setDispatchOverdueAction(data.dispatch_overdue_action);
            setDispatchDueAction(data.dispatch_due_action);
            setWarnDaysBefore(data.warn_days_before.toString());
            setFuelVarianceThreshold(data.fuel_variance_threshold_percent.toString());
            setFuelAlertEnabled(data.fuel_alert_enabled);
          }
        }
        catch (err) {
          console.error(
            "Failed to load config:",
            err,
          );
        }
        finally {
          setIsLoading(false);
        }
      };

      if (tenantId) {
        loadConfig();
      }
    },
    [
      getConfig,
      tenantId,
    ],
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateConfig({
        dispatch_overdue_action: dispatchOverdueAction as "allow" | "warn" | "block",
        dispatch_due_action: dispatchDueAction as "allow" | "warn" | "block",
        warn_days_before: parseInt(warnDaysBefore) || 7,
        fuel_variance_threshold_percent: Number.parseFloat(fuelVarianceThreshold) || 15,
        fuel_alert_enabled: fuelAlertEnabled,
      });

      if (success) {
        toast.success("Settings saved");
      }
      else {
        toast.error("Failed to save settings");
      }
    }
    catch {
      toast.error("Failed to save settings");
    }
    finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Maintenance & Fuel Configuration
        </CardTitle>
        <CardDescription>
          Configure dispatch rules and fuel monitoring thresholds for your fleet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dispatch Rules */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Dispatch Rules
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>When maintenance is OVERDUE</Label>
              <Select
                value={dispatchOverdueAction}
                onValueChange={setDispatchOverdueAction}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">Allow dispatch</SelectItem>
                  <SelectItem value="warn">Warn dispatcher</SelectItem>
                  <SelectItem value="block">Block dispatch</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Action when a vehicle has overdue maintenance items
              </p>
            </div>

            <div className="space-y-2">
              <Label>When maintenance is DUE</Label>
              <Select
                value={dispatchDueAction}
                onValueChange={setDispatchDueAction}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">Allow dispatch</SelectItem>
                  <SelectItem value="warn">Warn dispatcher</SelectItem>
                  <SelectItem value="block">Block dispatch</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Action when maintenance is due within the warning period
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Warning Period (days)</Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={warnDaysBefore}
              onChange={e => setWarnDaysBefore(e.target.value)}
              className="max-w-32"
            />
            <p className="text-xs text-muted-foreground">
              Days before due date to start showing warnings
            </p>
          </div>
        </div>

        <Separator />

        {/* Fuel Alerts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            Fuel Monitoring
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Fuel Anomaly Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Detect sudden fuel drops and abnormal consumption
              </p>
            </div>
            <Switch
              checked={fuelAlertEnabled}
              onCheckedChange={setFuelAlertEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Fuel Drop Threshold (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="5"
                max="50"
                value={fuelVarianceThreshold}
                onChange={e => setFuelVarianceThreshold(e.target.value)}
                className="max-w-32"
                disabled={!fuelAlertEnabled}
              />
              <span className="text-sm text-muted-foreground">
                % drop to trigger alert
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              A fuel drop greater than this percentage triggers a SUDDEN_FUEL_DROP alert
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
