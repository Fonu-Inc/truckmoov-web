import type { EnforcementSettings, EnforcementSettingsUpdate } from "@truckmoov/api/billing";
import { useEnforcementPreview, useEnforcementSettings, useUpdateEnforcementSettings } from "@truckmoov/api/billing";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { useState } from "react";
import { toast } from "sonner";
import { ListErrorBanner } from "@/components/platform/billing/billingUi";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import { EnforcementChangeDialog } from "./EnforcementChangeDialog";
import { plural } from "./enforcementModel";
import { errorMessage } from "./paymentsAccessModel";

type Pending = "enable" | "disable" | "pause" | "resume" | "numbers" | null;

type Props = { isSuperAdmin: boolean; canEdit: boolean };

function isWholeInRange(value: string, min: number, max: number) {
  const n = Number(value);
  return value.trim() !== "" && Number.isInteger(n) && n >= min && n <= max;
}

function EnableImpact() {
  const preview = useEnforcementPreview();
  if (preview.isPending)
    return <Skeleton className="h-16 w-full" />;
  if (preview.isError)
    return <p className="text-sm text-destructive">Could not check who would be suspended. Try again before turning this on.</p>;
  const { wouldSuspend, cappedCount, notes } = preview.data.data;
  return (
    <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
      <p className="font-medium">{`This would suspend ${plural(wouldSuspend.length, "customer")} today.`}</p>
      {cappedCount > 0
        ? <p className="text-muted-foreground">{`${plural(cappedCount, "more customer")} wait for the next run because of the per-run limit.`}</p>
        : null}
      <p className="text-muted-foreground">{notes.sims}</p>
      <p className="text-muted-foreground">{notes.scope}</p>
    </div>
  );
}

function SettingsForm({ settings, isSuperAdmin, canEdit }: Props & { settings: EnforcementSettings }) {
  const [graceDays, setGraceDays] = useState(String(settings.graceDays));
  const [leadDays, setLeadDays] = useState(String(settings.renewalLeadDays));
  const [cap, setCap] = useState(String(settings.autoSuspendCapPerRun));
  const [pending, setPending] = useState<Pending>(null);
  const mutation = useUpdateEnforcementSettings();
  const { limits } = settings;

  const graceOk = isWholeInRange(graceDays, limits.graceDays.min, limits.graceDays.max);
  const leadOk = isWholeInRange(leadDays, limits.renewalLeadDays.min, limits.renewalLeadDays.max);
  const capOk = isWholeInRange(cap, limits.autoSuspendCapPerRun.min, limits.autoSuspendCapPerRun.max);
  const dirty = Number(graceDays) !== settings.graceDays || Number(leadDays) !== settings.renewalLeadDays || Number(cap) !== settings.autoSuspendCapPerRun;

  const save = (patch: Omit<EnforcementSettingsUpdate, "reason">, done: string) => (reason: string) =>
    mutation.mutate({ ...patch, reason }, {
      onSuccess: () => {
        toast.success(done);
        setPending(null);
      },
      onError: err => toast.error(errorMessage(err)),
    });

  const numbersPatch = {
    ...(Number(graceDays) !== settings.graceDays ? { graceDays: Number(graceDays) } : {}),
    ...(Number(leadDays) !== settings.renewalLeadDays ? { renewalLeadDays: Number(leadDays) } : {}),
    ...(Number(cap) !== settings.autoSuspendCapPerRun ? { autoSuspendCapPerRun: Number(cap) } : {}),
  };
  const dialogs: Record<Exclude<Pending, null>, { title: string; description: string; label: string; onConfirm: (r: string) => void; destructive?: boolean; body?: boolean }> = {
    enable: {
      title: "Turn on automatic suspension?",
      description: "Overdue customers will be suspended automatically once their grace period ends. They are emailed first.",
      label: "Turn on",
      destructive: true,
      body: true,
      onConfirm: save({ autoSuspendEnabled: true }, "Automatic suspension is on"),
    },
    disable: {
      title: "Turn off automatic suspension?",
      description: "No customer will be suspended automatically. Customers who pay are still restored.",
      label: "Turn off",
      onConfirm: save({ autoSuspendEnabled: false }, "Automatic suspension is off"),
    },
    pause: {
      title: "Pause all automatic actions?",
      description: "Automatic emails and suspensions stop right away. Customers who pay are still restored.",
      label: "Pause everything",
      destructive: true,
      onConfirm: save({ paused: true }, "All automatic actions are paused"),
    },
    resume: {
      title: "Resume automatic actions?",
      description: "Automatic emails and suspensions continue if automatic suspension is on.",
      label: "Resume",
      onConfirm: save({ paused: false }, "Automatic actions resumed"),
    },
    numbers: {
      title: "Save payment grace settings?",
      description: "Changing the grace period does not change customers who are already suspended.",
      label: "Save",
      onConfirm: save(numbersPatch, "Settings saved"),
    },
  };
  const active = pending ? dialogs[pending] : null;
  const enableBlocked = !isSuperAdmin && !settings.autoSuspendEnabled;
  const resumeBlocked = !isSuperAdmin && settings.paused;

  return (
    <CardContent className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="grace-days">Grace days after the billing date</Label>
          <Input
            id="grace-days"
            type="number"
            inputMode="numeric"
            min={limits.graceDays.min}
            max={limits.graceDays.max}
            value={graceDays}
            disabled={!canEdit}
            onChange={e => setGraceDays(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {`From ${limits.graceDays.min} to ${limits.graceDays.max}. Customers get emails during this time.`}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="renewal-lead-days">Renewal invoice lead time (days)</Label>
          <Input
            id="renewal-lead-days"
            type="number"
            inputMode="numeric"
            min={limits.renewalLeadDays.min}
            max={limits.renewalLeadDays.max}
            value={leadDays}
            disabled={!canEdit}
            onChange={e => setLeadDays(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Renewal invoices are issued this many days before the licence expires and are due on the expiry date.
            {` From ${limits.renewalLeadDays.min} to ${limits.renewalLeadDays.max}.`}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="run-cap">Most customers suspended per day</Label>
          <Input
            id="run-cap"
            type="number"
            inputMode="numeric"
            min={limits.autoSuspendCapPerRun.min}
            max={limits.autoSuspendCapPerRun.max}
            value={cap}
            disabled={!canEdit}
            onChange={e => setCap(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {`From ${limits.autoSuspendCapPerRun.min} to ${limits.autoSuspendCapPerRun.max}. The rest wait for the next day.`}
          </p>
        </div>
      </div>
      {canEdit && dirty && (
        <Button disabled={!graceOk || !leadOk || !capOk} onClick={() => setPending("numbers")}>Save changes</Button>
      )}

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-1">
          <Label htmlFor="auto-switch" className="text-sm font-medium">Automatic suspension</Label>
          <p className="text-sm text-muted-foreground">
            When on, a customer who is still unpaid after the grace period is suspended automatically
            and emailed first. Users, devices, SIMs, share links and API access are all affected.
            SIMs are marked suspended in our system; the mobile network is not told.
            Paying restores everything automatically.
          </p>
          <p className="text-xs text-muted-foreground">
            The automatic check covers unpaid invoices (including licence renewals) and unpaid SIM monthly charges.
          </p>
          {enableBlocked && canEdit
            ? <p className="text-xs text-warning">Only a super admin can turn this on.</p>
            : null}
        </div>
        <Switch
          id="auto-switch"
          checked={settings.autoSuspendEnabled}
          disabled={!canEdit || enableBlocked}
          onCheckedChange={on => setPending(on ? "enable" : "disable")}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <p className="max-w-xl text-sm text-muted-foreground">
          {settings.paused
            ? "All automatic actions are paused. Nothing is emailed or suspended automatically. Paying customers are still restored."
            : "In an emergency, pause all automatic emails and suspensions right away."}
        </p>
        {canEdit && (settings.paused
          ? (
              <Button variant="outline" disabled={resumeBlocked} onClick={() => setPending("resume")}>
                {resumeBlocked ? "Only a super admin can resume" : "Resume automatic actions"}
              </Button>
            )
          : <Button variant="destructive" onClick={() => setPending("pause")}>Pause all automatic actions</Button>)}
      </div>

      <p className="text-xs text-muted-foreground">
        {settings.updatedAt
          ? `Last changed ${formatDateTime(settings.updatedAt)}${settings.updatedBy ? ` by ${settings.updatedBy}` : ""}.`
          : "Not changed yet. Automatic suspension is off until a super admin turns it on."}
      </p>

      <EnforcementChangeDialog
        open={!!active}
        title={active?.title ?? ""}
        description={active?.description ?? ""}
        confirmLabel={active?.label ?? ""}
        destructive={active?.destructive}
        pending={mutation.isPending}
        onConfirm={reason => active?.onConfirm(reason)}
        onClose={() => setPending(null)}
      >
        {active?.body ? <EnableImpact /> : null}
      </EnforcementChangeDialog>
    </CardContent>
  );
}

export function PaymentGraceCard({ isSuperAdmin, canEdit }: Props) {
  const query = useEnforcementSettings();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment grace</CardTitle>
        <CardDescription>
          {canEdit ? "Set how long customers have after the billing date before they are suspended." : "Only super admins and system admins can change these settings."}
        </CardDescription>
      </CardHeader>
      {query.isPending && <CardContent><Skeleton className="h-40 w-full" /></CardContent>}
      {query.isError && (
        <CardContent>
          <ListErrorBanner
            title="Could not load payment grace settings"
            message="Check your connection and try again."
            onRetry={() => void query.refetch()}
          />
        </CardContent>
      )}
      {query.data && <SettingsForm settings={query.data.data} isSuperAdmin={isSuperAdmin} canEdit={canEdit} />}
    </Card>
  );
}
