import type {
  MaintenanceDispatchAction, MaintenanceSettings,
} from "@truckmoov/api/fleet";
import {
  useMaintenanceSettings, useUpdateMaintenanceSettings,
} from "@truckmoov/api/fleet";
import {
  AlertCircle, Save, Settings, Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/shadcn/alert";
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

/** The design app's select trigger is taller and rounder than the shared one. */
const SELECT_TRIGGER_CLASS = "h-10 rounded-xl px-3.5";
const WARN_DAYS_MIN = 1;
const WARN_DAYS_MAX = 30;

function DispatchActionOptions() {
  return (
    <SelectContent>
      <SelectItem value="allow">Allow dispatch</SelectItem>
      <SelectItem value="warn">Warn dispatcher</SelectItem>
      <SelectItem value="block">Block dispatch</SelectItem>
    </SelectContent>
  );
}

/** The Fleet tab (`/settings/fleet`): the tenant's maintenance dispatch rules. */
export function MaintenanceConfigPanel() {
  const settingsQuery = useMaintenanceSettings();
  const updateMutation = useUpdateMaintenanceSettings();
  const [
    draft,
    setDraft,
  ] = useState<Partial<MaintenanceSettings>>({});
  const [
    warnDaysInput,
    setWarnDaysInput,
  ] = useState<string | null>(null);

  const saved = settingsQuery.data?.data;
  const loading = settingsQuery.isPending;
  const form = saved ? {
    ...saved, ...draft,
  } : undefined;
  const warnDays = warnDaysInput ?? (form ? String(form.warnDaysBefore) : "");

  const handleSave = () => {
    if (!form)
      return;
    const days = Number(warnDays);
    if (!Number.isInteger(days) || days < WARN_DAYS_MIN || days > WARN_DAYS_MAX) {
      toast.error(`Warning period must be a whole number from ${WARN_DAYS_MIN} to ${WARN_DAYS_MAX} days`);
      return;
    }
    updateMutation.mutate(
      {
        ...form, warnDaysBefore: days,
      },
      {
        onSuccess: () => {
          setDraft({});
          setWarnDaysInput(null);
          toast.success("Settings saved");
        },
        onError: error => toast.error(error.message || "Failed to save settings"),
      },
    );
  };

  const setAction = (key: "dispatchOverdueAction" | "dispatchDueAction") => (value: string) =>
    setDraft(current => ({
      ...current, [key]: value as MaintenanceDispatchAction,
    }));

  return (
    <div className="rounded-2xl surface-sleek text-card-foreground bg-card/50 border-border/50">
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Maintenance Configuration
        </h3>
        <p className="text-sm text-muted-foreground">Configure vehicle maintenance and dispatch rules for your fleet.</p>
      </div>
      <div className="p-6 pt-0 space-y-6">
        {settingsQuery.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to load fleet settings</AlertTitle>
            <AlertDescription>{settingsQuery.error.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Dispatch Rules
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dispatchOverdueAction">When maintenance is OVERDUE</Label>
              <Select
                disabled={!form}
                value={form?.dispatchOverdueAction}
                onValueChange={setAction("dispatchOverdueAction")}
              >
                <SelectTrigger
                  id="dispatchOverdueAction"
                  className={SELECT_TRIGGER_CLASS}
                >
                  <SelectValue placeholder={loading ? "Loading…" : "-"} />
                </SelectTrigger>
                <DispatchActionOptions />
              </Select>
              <p className="text-xs text-muted-foreground">Action when a vehicle has overdue maintenance items</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatchDueAction">When maintenance is DUE</Label>
              <Select
                disabled={!form}
                value={form?.dispatchDueAction}
                onValueChange={setAction("dispatchDueAction")}
              >
                <SelectTrigger
                  id="dispatchDueAction"
                  className={SELECT_TRIGGER_CLASS}
                >
                  <SelectValue placeholder={loading ? "Loading…" : "-"} />
                </SelectTrigger>
                <DispatchActionOptions />
              </Select>
              <p className="text-xs text-muted-foreground">Action when maintenance is due within the warning period</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="maintenanceWarnDays"
              required
            >
              Warning Period (days)
            </Label>
            <Input
              id="maintenanceWarnDays"
              type="number"
              min={WARN_DAYS_MIN}
              max={WARN_DAYS_MAX}
              value={warnDays}
              onChange={e => setWarnDaysInput(e.target.value)}
              disabled={!form}
              className="max-w-32"
            />
            <p className="text-xs text-muted-foreground">Days before due date to start showing warnings</p>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!form || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
