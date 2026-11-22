import type {
  ViolationQuotaPeriod, ViolationRule, ViolationRuleBody, ViolationRuleEntity, ViolationRuleScope, ViolationRuleTrigger, ViolationSeverity, ViolationType, WeekDay,
} from "@truckmoov/api/fleet";
import {
  useCreateViolationRule, useDrivers, useUpdateViolationRule, useVehicles,
} from "@truckmoov/api/fleet";
import {
  ArrowLeft, ArrowRight, CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { Textarea } from "@/components/shadcn/textarea";
import {
  QUOTA_PERIOD_UNIT, VIOLATION_TYPES,
} from "@/features/fleet/components/ui/violations/violationsUi";

const STEPS = [
  "Rule Details",
  "Trigger Conditions",
  "Scope",
  "Schedule",
  "Severity & Quota",
  "Review",
];

const DAYS: WeekDay[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const G_LABEL: Partial<Record<ViolationType, string>> = {
  harsh_braking: "Deceleration",
  harsh_acceleration: "Acceleration",
  harsh_cornering: "Cornering",
};

/**
 * Create / edit a violation rule — the design app's 6-step wizard. Remount it
 * (change its `key`) for each open so the fields start from `rule`.
 */
export function ViolationRuleDialog({
  open,
  onOpenChange,
  entity,
  rule,
  typeLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: ViolationRuleEntity;
  rule: ViolationRule | null;
  typeLabel: (type: ViolationType) => string;
}) {
  const isVehicles = entity === "vehicles";
  const noun = isVehicles ? "vehicle" : "driver";
  const createRule = useCreateViolationRule();
  const updateRule = useUpdateViolationRule();
  const driversQuery = useDrivers();
  const vehiclesQuery = useVehicles();
  const t = rule?.trigger;
  const sched = rule?.schedule;

  const [
    step,
    setStep,
  ] = useState(0);
  const [
    name,
    setName,
  ] = useState(rule?.name ?? "");
  const [
    description,
    setDescription,
  ] = useState(rule?.description ?? "");
  const [
    type,
    setType,
  ] = useState<ViolationType>(rule?.type ?? "overspeeding");
  const [
    speedKph,
    setSpeedKph,
  ] = useState(String(t?.speedKph ?? 100));
  const [
    minDuration,
    setMinDuration,
  ] = useState(String(t?.minDurationSeconds ?? 30));
  const [
    thresholdG,
    setThresholdG,
  ] = useState(String(t?.thresholdG ?? "0.40"));
  const [
    restrictedStart,
    setRestrictedStart,
  ] = useState(t?.restrictedStart ?? "23:00");
  const [
    restrictedEnd,
    setRestrictedEnd,
  ] = useState(t?.restrictedEnd ?? "05:00");
  const [
    restrictedDays,
    setRestrictedDays,
  ] = useState<WeekDay[]>(t?.restrictedDays ?? DAYS);
  const [
    scope,
    setScope,
  ] = useState<ViolationRuleScope>(rule?.scope ?? (isVehicles ? "all_vehicles" : "all_drivers"));
  const [
    scopeIds,
    setScopeIds,
  ] = useState<string[]>(rule?.scopeIds ?? []);
  const [
    scheduleMode,
    setScheduleMode,
  ] = useState<"always" | "scheduled">(sched?.mode ?? "always");
  const [
    schedDays,
    setSchedDays,
  ] = useState<WeekDay[]>(sched?.mode === "scheduled" ? sched.days : DAYS);
  const [
    schedStart,
    setSchedStart,
  ] = useState(sched?.mode === "scheduled" ? sched.start : "06:00");
  const [
    schedEnd,
    setSchedEnd,
  ] = useState(sched?.mode === "scheduled" ? sched.end : "22:00");
  const [
    severity,
    setSeverity,
  ] = useState<ViolationSeverity>(rule?.severity ?? "medium");
  const [
    quota,
    setQuota,
  ] = useState(String(rule?.quota ?? 10));
  const [
    quotaPeriod,
    setQuotaPeriod,
  ] = useState<ViolationQuotaPeriod>(rule?.quotaPeriod ?? "monthly");
  const [
    repeatThreshold,
    setRepeatThreshold,
  ] = useState(String(rule?.repeatThreshold ?? 5));

  const isSelected = scope === "selected_drivers" || scope === "selected_vehicles";
  const scopeOptions = isVehicles
    ? (vehiclesQuery.data?.data ?? []).map(v => ({
        id: v.id,
        label: [
          [
            v.make,
            v.model,
          ].filter(Boolean).join(" "),
          v.plateNumber || v.registrationNumber,
        ].filter(Boolean).join(" · ") || v.id,
      }))
    : (driversQuery.data?.data ?? []).map(d => ({
        id: d.id,
        label: d.name,
      }));
  const scopeQuery = isVehicles ? vehiclesQuery : driversQuery;

  const triggerSummary = {
    overspeeding: `Speed above ${speedKph} km/h for ${minDuration}s+`,
    harsh_braking: `Deceleration beyond ${thresholdG} g`,
    harsh_acceleration: `Acceleration beyond ${thresholdG} g`,
    harsh_cornering: `Cornering force beyond ${thresholdG} g`,
    restricted_hours: `Driving between ${restrictedStart} and ${restrictedEnd}`,
  }[type];
  const scheduleSummary = scheduleMode === "always"
    ? "Always active"
    : `${schedDays.length === 7 ? "Every day" : schedDays.join(", ")}, ${schedStart}–${schedEnd}`;

  const canContinue = [
    name.trim().length > 0,
    type !== "restricted_hours" || restrictedDays.length > 0,
    !isSelected || scopeIds.length > 0,
    scheduleMode === "always" || schedDays.length > 0,
    true,
    true,
  ][step];

  const toggleDay = (day: WeekDay, list: WeekDay[], set: (v: WeekDay[]) => void) =>
    set(list.includes(day) ? list.filter(d => d !== day) : DAYS.filter(d => d === day || list.includes(d)));
  const toggleId = (id: string) =>
    setScopeIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [
      ...prev,
      id,
    ]));

  const handleSave = () => {
    const trigger: ViolationRuleTrigger = type === "overspeeding"
      ? {
          speedKph: Number(speedKph),
          minDurationSeconds: Number(minDuration),
        }
      : type === "restricted_hours"
        ? {
            restrictedStart,
            restrictedEnd,
            restrictedDays,
          }
        : { thresholdG: Number(thresholdG) };
    const body: ViolationRuleBody = {
      entity,
      name: name.trim(),
      description: description.trim() || null,
      type,
      trigger,
      scope,
      scopeIds: isSelected ? scopeIds : [],
      schedule: scheduleMode === "always"
        ? { mode: "always" }
        : {
            mode: "scheduled",
            days: schedDays,
            start: schedStart,
            end: schedEnd,
          },
      severity,
      quota: Number(quota),
      quotaPeriod,
      repeatThreshold: Number(repeatThreshold),
      notify: rule?.notify ?? true,
    };
    const callbacks = {
      onSuccess: () => {
        toast.success(
          rule ? "Violation rule updated" : "Violation rule activated",
          {
            description: rule
              ? `"${body.name}" has been saved.`
              : `"${body.name}" will now generate violations from matching events.`,
          },
        );
        onOpenChange(false);
      },
      onError: (error: { message: string }) => toast.error(error.message),
    };
    if (rule) {
      updateRule.mutate(
        {
          id: rule.id,
          data: body,
        },
        callbacks,
      );
    }
    else {
      createRule.mutate(
        { data: body },
        callbacks,
      );
    }
  };

  const dayButtons = (list: WeekDay[], set: (v: WeekDay[]) => void) => (
    <div className="flex flex-wrap gap-2">
      {DAYS.map(d => (
        <Button
          key={d}
          type="button"
          size="sm"
          variant={list.includes(d) ? "default" : "outline"}
          onClick={() => toggleDay(
            d,
            list,
            set,
          )}
        >
          {d}
        </Button>
      ))}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Violation Rule" : "Create Violation Rule"}</DialogTitle>
          <DialogDescription>
            Step
            {" "}
            {step + 1}
            {" "}
            of
            {" "}
            {STEPS.length}
            {" "}
            —
            {" "}
            {STEPS[step]}
            . A violation is generated when a recorded event satisfies this rule's conditions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="space-y-4 py-2">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Highway Speed Limit"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What this rule is for..."
                />
              </div>
              <div className="space-y-2">
                <Label>Violation Type</Label>
                <Select
                  value={type}
                  onValueChange={v => setType(v as ViolationType)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIOLATION_TYPES.map(v => (
                      <SelectItem
                        key={v}
                        value={v}
                      >
                        {typeLabel(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">What the rule detects — overspeeding, harsh driving events, or restricted-hours trips.</p>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              {type === "overspeeding" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Speed Threshold (km/h)</Label>
                    <Input
                      type="number"
                      value={speedKph}
                      onChange={e => setSpeedKph(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min. Duration Above (seconds)</Label>
                    <Input
                      type="number"
                      value={minDuration}
                      onChange={e => setMinDuration(e.target.value)}
                    />
                  </div>
                </div>
              )}
              {G_LABEL[type] && (
                <div className="space-y-2">
                  <Label>
                    {G_LABEL[type]}
                    {" "}
                    Threshold (g)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={thresholdG}
                    onChange={e => setThresholdG(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">This rule fires only when the tracker reports the event; the g-force value is not enforced.</p>
                </div>
              )}
              {type === "restricted_hours" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={restrictedStart}
                        onChange={e => setRestrictedStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={restrictedEnd}
                        onChange={e => setRestrictedEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Applicable Days</Label>
                    {dayButtons(
                      restrictedDays,
                      setRestrictedDays,
                    )}
                  </div>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                Trigger:
                {" "}
                <span className="font-medium text-foreground">{triggerSummary}</span>
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Where does this rule apply?</Label>
                <Select
                  value={scope}
                  onValueChange={(v) => {
                    setScope(v as ViolationRuleScope);
                    setScopeIds([]);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {isVehicles
                      ? (
                          <>
                            <SelectItem value="all_vehicles">All Vehicles</SelectItem>
                            <SelectItem value="selected_vehicles">Selected vehicles</SelectItem>
                          </>
                        )
                      : (
                          <>
                            <SelectItem value="all_drivers">All drivers</SelectItem>
                            <SelectItem value="selected_drivers">Selected drivers</SelectItem>
                          </>
                        )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose whether the rule monitors every
                  {" "}
                  {noun}
                  {" "}
                  or only the
                  {" "}
                  {noun}
                  s you pick.
                </p>
              </div>
              {isSelected && (
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border p-3">
                  {scopeQuery.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
                  {scopeQuery.isError && <p className="text-sm text-muted-foreground">{`Unable to load ${noun}s.`}</p>}
                  {!scopeQuery.isLoading && !scopeQuery.isError && scopeOptions.length === 0 && (
                    <p className="text-sm text-muted-foreground">{`No ${noun}s on this account yet.`}</p>
                  )}
                  {scopeOptions.map(o => (
                    <label
                      key={o.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={scopeIds.includes(o.id)}
                        onCheckedChange={() => toggleId(o.id)}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>When is this rule active?</Label>
                <Select
                  value={scheduleMode}
                  onValueChange={v => setScheduleMode(v as "always" | "scheduled")}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Always active</SelectItem>
                    <SelectItem value="scheduled">Specific days and times</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scheduleMode === "scheduled" && (
                <>
                  <div className="space-y-2">
                    <Label>Days</Label>
                    {dayButtons(
                      schedDays,
                      setSchedDays,
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={schedStart}
                        onChange={e => setSchedStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={schedEnd}
                        onChange={e => setSchedEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                This schedule defines when the rule applies — it is different from the date filter used when reviewing past violations.
              </p>
            </>
          )}

          {step === 4 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={severity}
                  onValueChange={v => setSeverity(v as ViolationSeverity)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How serious the violation is — critical deducts the most
                  {" "}
                  {noun}
                  {" "}
                  score points.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Violation Quota</Label>
                <Input
                  type="number"
                  value={quota}
                  onChange={e => setQuota(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum violations a
                  {" "}
                  {noun}
                  {" "}
                  can record in one period before the quota is exceeded.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Quota Period</Label>
                <Select
                  value={quotaPeriod}
                  onValueChange={v => setQuotaPeriod(v as ViolationQuotaPeriod)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How often the quota resets and counting starts over.</p>
              </div>
              <div className="space-y-2">
                <Label>Repeat-Offender Threshold</Label>
                <Input
                  type="number"
                  value={repeatThreshold}
                  onChange={e => setRepeatThreshold(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Violations within the period that flag a
                  {" "}
                  {noun}
                  {" "}
                  as a repeat offender.
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Rule Name</span>
                <div className="text-right">
                  <span className="font-medium">{name}</span>
                  {description.trim() && (
                    <p className="text-xs text-muted-foreground mt-0.5">{description.trim()}</p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline">{typeLabel(type)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trigger</span>
                <span className="font-medium text-right">{triggerSummary}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Scope</span>
                <span className="font-medium">
                  {scope.replace(
                    /_/g,
                    " ",
                  ).replace(
                    /\b\w/g,
                    c => c.toUpperCase(),
                  )}
                  {isSelected && ` (${scopeIds.length} selected)`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Schedule</span>
                <span className="font-medium">{scheduleSummary}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Severity</span>
                <span className="font-medium capitalize">{severity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quota</span>
                <span className="font-medium">{`${quota} per ${QUOTA_PERIOD_UNIT[quotaPeriod]}`}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {step < STEPS.length - 1
              ? (
                  <Button
                    variant="gradient"
                    onClick={() => setStep(step + 1)}
                    disabled={!canContinue}
                  >
                    Next
                    {" "}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )
              : (
                  <Button
                    variant="gradient"
                    onClick={handleSave}
                    loading={createRule.isPending || updateRule.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {rule ? "Save Changes" : "Activate Rule"}
                  </Button>
                )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
