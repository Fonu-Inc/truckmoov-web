import type { InstallationValues } from "@/features/apply/utils/applySchemas";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  CheckCircle2,
  Cpu,
  Mail,
  Wand2,
  X,
} from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { Progress } from "@/components/shadcn/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import {
  installationSchema,
  NIGERIAN_STATES,
} from "@/features/apply/utils/applySchemas";
import {
  expandDeviceUnits,
  TIME_SLOTS,
} from "@/features/apply/utils/applyTypes";
import { cn } from "@/lib/utils";

export const INSTALLATION_FORM_ID = "apply-installation-form";

type ScheduleInstallationStepProps = {
  defaults: Partial<InstallationValues>;
  onBack: () => void;
  onFinish: () => void;
};

/**
 * ponytail: no installation-scheduling endpoint on the public onboarding API.
 * The preference and the device→vehicle assignment are captured and persisted to
 * applyDraftStore, and the copy says plainly that it is a request awaiting
 * confirmation — never a booked slot.
 */
export function ScheduleInstallationStep({
  defaults,
  onBack,
  onFinish,
}: ScheduleInstallationStepProps) {
  const fleet = useApplyDraftStore(state => state.fleet);
  const installation = useApplyDraftStore(state => state.installation);
  const setInstallation = useApplyDraftStore(state => state.setInstallation);
  const assignments = useApplyDraftStore(state => state.deviceAssignments);
  const setAssignments = useApplyDraftStore(state => state.setDeviceAssignments);
  const scheduled = useApplyDraftStore(state => state.scheduled);
  const setScheduled = useApplyDraftStore(state => state.setScheduled);

  const deviceUnits = useMemo(
    () => expandDeviceUnits(fleet.deviceRequests),
    [fleet.deviceRequests],
  );

  const assignedCount = deviceUnits.filter(unit => assignments[unit.id]).length;
  const progress = deviceUnits.length === 0
    ? 0
    : (assignedCount / deviceUnits.length) * 100;

  const form = useForm<InstallationValues>({
    resolver: zodResolver(installationSchema),
    mode: "onTouched",
    defaultValues: installation ?? {
      streetAddress: defaults.streetAddress ?? "",
      city: defaults.city ?? "",
      state: defaults.state ?? (undefined as unknown as InstallationValues["state"]),
      date: "",
      timeSlot: TIME_SLOTS[0],
      contactName: defaults.contactName ?? "",
      contactPhone: defaults.contactPhone ?? "",
      notes: "",
    },
  });

  /** A vehicle can only be fitted with one device. */
  function assign(unitId: string, vehicleId: string) {
    const next = { ...assignments };
    Object.keys(next).forEach((key) => {
      if (next[key] === vehicleId)
        delete next[key];
    });
    next[unitId] = vehicleId;
    setAssignments(next);
  }

  function autoAssign() {
    const next: Record<string, string> = {};
    deviceUnits.forEach((unit, index) => {
      const vehicle = fleet.vehicles[index];
      if (vehicle)
        next[unit.id] = vehicle.id;
    });
    setAssignments(next);
  }

  function handleSubmit(values: InstallationValues) {
    if (assignedCount < deviceUnits.length) {
      toast.error("Select the vehicle each requested device should be fitted to.");
      return;
    }
    setInstallation(values);
    setScheduled(true);
    toast.success("Installation scheduled");
  }

  if (scheduled) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Installation Scheduled
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Your installation request has been recorded. Our installation team will contact you to
          confirm the date and time, and you will receive an email with your account setup link
          once your application is approved.
        </p>
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground">
          <Mail className="h-4 w-4 text-primary" />
          Check your email for your account setup link.
        </p>
        <Button
          size="lg"
          className="mt-8"
          onClick={onFinish}
        >
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Schedule Installation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose when our team should install your devices. We assign the right installer for you
          automatically.
        </p>
      </div>

      {deviceUnits.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-foreground">Devices you requested</p>
              <p className="text-sm text-muted-foreground">
                Choose the vehicle each device should be installed in — a vehicle can only be
                picked once.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoAssign}
              >
                <Wand2 className="mr-1.5 h-4 w-4" />
                Auto-assign
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={assignedCount === 0}
                onClick={() => setAssignments({})}
              >
                <X className="mr-1.5 h-4 w-4" />
                Clear all
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              {`${assignedCount} of ${deviceUnits.length} devices assigned`}
            </span>
            <Badge
              variant="secondary"
              className="rounded-full"
            >
              {`${Math.max(
                fleet.vehicles.length - assignedCount,
                0,
              )} vehicles left`}
            </Badge>
          </div>
          <Progress
            value={progress}
            className="h-2"
          />

          {deviceUnits.length > fleet.vehicles.length && (
            <p className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
              {`You requested ${deviceUnits.length} devices but submitted only ${fleet.vehicles.length} vehicles. Add more vehicles to fit every device.`}
            </p>
          )}

          <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {deviceUnits.map((unit) => {
              const assignedTo = assignments[unit.id];

              return (
                <div
                  key={unit.id}
                  className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 sm:grid-cols-2 sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        assignedTo ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {assignedTo ? <Check className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {`${unit.label} · ${unit.manufacturer} ${unit.model}`}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {`IMEI ${unit.imei} · SIM carrier ${unit.simCarrier}`}
                      </p>
                    </div>
                  </div>

                  <Select
                    value={assignedTo ?? ""}
                    onValueChange={vehicleId => assign(
                      unit.id,
                      vehicleId,
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {fleet.vehicles.map((vehicle) => {
                        const takenBy = Object.entries(assignments)
                          .find(([
                            key,
                            value,
                          ]) => value === vehicle.id && key !== unit.id);

                        return (
                          <SelectItem
                            key={vehicle.id}
                            value={vehicle.id}
                            disabled={Boolean(takenBy)}
                          >
                            {`${vehicle.registrationNumber || "Unregistered"} — ${vehicle.make} ${vehicle.model}`}
                            {takenBy ? " (already assigned)" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Form {...form}>
        <form
          id={INSTALLATION_FORM_ID}
          className="space-y-5"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FormField
            control={form.control}
            name="streetAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Installation Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Street"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="City"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NIGERIAN_STATES.map(state => (
                        <SelectItem
                          key={state}
                          value={state}
                        >
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Installation Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeSlot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Installation Time</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem
                          key={slot}
                          value={slot}
                        >
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Contact Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+234 801 234 5678"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Installation Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Anything our installation team should know."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
            This is a scheduling request, not a confirmed booking. Our installation team will
            contact you to confirm the date and time.
          </p>

          <div className="flex items-center justify-between border-t border-border/60 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
            >
              <CalendarCheck className="mr-2 h-4 w-4" />
              Schedule Installation
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
