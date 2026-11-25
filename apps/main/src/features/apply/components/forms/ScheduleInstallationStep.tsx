import type {
  OnboardingApplicationVehicle,
  ScheduledOnboardingInstallation,
} from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { InstallationValues } from "@/features/apply/utils/applySchemas";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  CITIES_BY_STATE,
  getOnboardingOrderQueryOptions,
  useScheduleOnboardingInstallation,
} from "@truckmoov/api/auth";
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  CheckCircle2,
  Cpu,
  Loader2,
  Mail,
  WandSparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
import { Label } from "@/components/shadcn/label";
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
  installationDateLimit,
  installationSchema,
  NIGERIAN_STATES,
  normalizePhone,
  normalizeState,
} from "@/features/apply/utils/applySchemas";

import { cn } from "@/lib/utils";

export const INSTALLATION_FORM_ID = "apply-installation-form";

/** Server field -> form field for 400 `{ message, field }` bodies. */
const SERVER_FIELD: Record<string, keyof InstallationValues> = {
  scheduledDate: "date",
  timeSlot: "timeSlot",
  addressLine: "streetAddress",
  city: "city",
  state: "state",
  siteContactName: "contactName",
  siteContactPhone: "contactPhone",
  notes: "notes",
};

type ScheduleInstallationStepProps = {
  applicationId: string;
  vehicles: OnboardingApplicationVehicle[];
  defaults: Partial<InstallationValues>;
  /** Booking done: the account exists and sign-in happens from the emailed link. */
  onDone: () => void;
};

/** "09:30" -> the API slot: morning before noon, afternoon after. Open 08:00–16:00. */
function slotForTime(time: string): InstallationValues["timeSlot"] {
  return time < "12:00" ? "morning" : "afternoon";
}

function withinHours(time: string) {
  return time >= "08:00" && time <= "16:00";
}

function deviceLabel(deviceIndex: number) {
  return `Device ${String(deviceIndex).padStart(
    2,
    "0",
  )}`;
}

/**
 * Last draft-token step (TRU-FE-15). Each paid-for device (from the order) is fitted to
 * one vehicle; devices have no IMEI yet, so they're labelled by position. A successful
 * booking creates the account and emails the setup link.
 */
export function ScheduleInstallationStep({
  applicationId,
  vehicles,
  defaults,
  onDone,
}: ScheduleInstallationStepProps) {
  const installation = useApplyDraftStore(state => state.installation);
  const setInstallation = useApplyDraftStore(state => state.setInstallation);
  const assignments = useApplyDraftStore(state => state.deviceAssignments);
  const setAssignments = useApplyDraftStore(state => state.setDeviceAssignments);
  const orderQuery = useQuery(getOnboardingOrderQueryOptions(applicationId));
  const schedule = useScheduleOnboardingInstallation();
  const [
    booked,
    setBooked,
  ] = useState<ScheduledOnboardingInstallation | null>(null);
  const [
    bookingError,
    setBookingError,
  ] = useState<{
    message: string; conflict: boolean;
  } | null>(null);

  const deviceCount = orderQuery.data?.data.order.deviceCount ?? 0;
  const deviceIndexes = Array.from(
    { length: deviceCount },
    (_, index) => index + 1,
  );
  const assignedCount = deviceIndexes.filter(index => assignments[index]).length;
  const progress = deviceCount === 0 ? 0 : (assignedCount / deviceCount) * 100;

  const form = useForm<InstallationValues>({
    resolver: zodResolver(installationSchema),
    mode: "onTouched",
    defaultValues: installation ?? {
      streetAddress: defaults.streetAddress ?? "",
      city: defaults.city ?? "",
      state: defaults.state ?? "",
      date: "",
      timeSlot: "morning",
      contactName: defaults.contactName ?? "",
      contactPhone: defaults.contactPhone ?? "",
      notes: "",
    },
  });
  // The summary line under the form reads what is typed.
  const watched = form.watch();
  const installState = normalizeState(watched.state ?? "");
  const lgaOptions = (installState && CITIES_BY_STATE[installState]) || [];
  // A saved city outside the list (typed before the dropdown existed) stays selectable.
  const cityOptions = watched.city && !lgaOptions.includes(watched.city)
    ? [
        watched.city,
        ...lgaOptions,
      ]
    : lgaOptions;
  // ponytail: the installation API has no LGA field yet, so this is held on screen only and not sent.
  const [
    lga,
    setLga,
  ] = useState("");
  // The design defaults the clock to 09:00 (the morning slot, the form default).
  const [
    time,
    setTime,
  ] = useState(watched.timeSlot === "afternoon" ? "13:00" : "09:00");
  const timeOutOfHours = !withinHours(time);

  /** A vehicle can only be fitted with one device. */
  function assign(deviceIndex: number, vehicleId: string) {
    const next = { ...assignments };
    Object.keys(next).forEach((key) => {
      if (next[Number(key)] === vehicleId)
        delete next[Number(key)];
    });
    next[deviceIndex] = vehicleId;
    setAssignments(next);
  }

  function autoAssign() {
    const next: Record<number, string> = {};
    deviceIndexes.forEach((deviceIndex) => {
      const vehicle = vehicles[deviceIndex - 1];
      if (vehicle)
        next[deviceIndex] = vehicle.id;
    });
    setAssignments(next);
  }

  async function handleSubmit(values: InstallationValues) {
    if (timeOutOfHours)
      return;
    setInstallation(values);
    setBookingError(null);
    if (assignedCount < deviceCount) {
      setBookingError({
        message: "Select the vehicle each device should be fitted to.",
        conflict: false,
      });
      return;
    }
    try {
      const res = await schedule.mutateAsync({
        id: applicationId,
        data: {
          scheduledDate: values.date,
          timeSlot: values.timeSlot,
          addressLine: values.streetAddress,
          city: values.city,
          state: values.state,
          siteContactName: values.contactName,
          siteContactPhone: normalizePhone(values.contactPhone),
          notes: values.notes || undefined,
          assignments: deviceIndexes.map(deviceIndex => ({
            deviceIndex,
            vehicleId: assignments[deviceIndex],
          })),
        },
      });
      setBooked(res.data);
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      const message = Array.isArray(err.message)
        ? err.message.join(", ")
        : err.message || "The installation couldn't be booked. Try again.";
      const field = err.field ? SERVER_FIELD[err.field] : undefined;
      if (field) {
        form.setError(
          field,
          { message },
        );
        return;
      }
      setBookingError({
        message,
        conflict: err.statusCode === 409,
      });
    }
  }

  if (booked) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Installation Scheduled
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Your installation order has been created successfully. You now have access to the Fleet
          Pro platform, and we also have sent an email containing your setup link so you can create
          your password and sign in right away.
        </p>

        {booked.setupLinkSent
          ? (
              <p className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                Check your email for your account setup link.
              </p>
            )
          : (
              <p className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-foreground">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                We couldn't send your account setup email. Please contact support.
              </p>
            )}

        <Button
          size="lg"
          className="mt-8"
          onClick={onDone}
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

      <div className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
        <h3 className="text-base font-semibold text-foreground">Installation Scheduling</h3>
        <Form {...form}>
          <form
            id={INSTALLATION_FORM_ID}
            className="mt-5 space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">Devices you requested</p>
                  <p className="text-sm text-muted-foreground">
                    Choose the vehicle each device should be installed in. A vehicle can only be
                    picked once.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deviceCount === 0}
                    onClick={autoAssign}
                  >
                    <WandSparkles className="mr-1.5 h-4 w-4" />
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

              {orderQuery.isLoading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {orderQuery.isError && (
                <p className="text-sm text-destructive">
                  {(orderQuery.error as ServerErrorResponse | null)?.message || "We couldn't load your order."}
                </p>
              )}

              {deviceCount > 0 && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      {`${assignedCount} of ${deviceCount} devices assigned`}
                    </span>
                    <Badge
                      variant="secondary"
                      className="rounded-full"
                    >
                      {`${Math.max(
                        vehicles.length - assignedCount,
                        0,
                      )} vehicles left`}
                    </Badge>
                  </div>
                  <Progress
                    value={progress}
                    className="h-2"
                  />

                  {deviceCount > vehicles.length && (
                    <p className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                      {`You requested ${deviceCount} devices but submitted only ${vehicles.length} vehicles. Add more vehicles to fit every device.`}
                    </p>
                  )}

                  <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                    {deviceIndexes.map((deviceIndex) => {
                      const assignedTo = assignments[deviceIndex];

                      return (
                        <div
                          key={deviceIndex}
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
                            <p className="text-sm font-medium text-foreground">{deviceLabel(deviceIndex)}</p>
                          </div>

                          <Select
                            value={assignedTo ?? ""}
                            onValueChange={vehicleId => assign(
                              deviceIndex,
                              vehicleId,
                            )}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle to assign" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicles.map((vehicle) => {
                                const takenBy = Object.entries(assignments)
                                  .find(([
                                    key,
                                    value,
                                  ]) => value === vehicle.id && Number(key) !== deviceIndex);

                                return (
                                  <SelectItem
                                    key={vehicle.id}
                                    value={vehicle.id}
                                    disabled={Boolean(takenBy)}
                                  >
                                    {`${vehicle.registrationNumber || "Unregistered"} - ${vehicle.make} ${vehicle.model}`}
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
                </>
              )}
            </div>

            <div className="space-y-3">
              <Label required>Installation Address</Label>
              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel htmlFor="install-address">Address</FormLabel>
                    <FormControl>
                      <Input
                        id="install-address"
                        placeholder="e.g. 15 Marina Road, Victoria Island"
                        maxLength={200}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>State</FormLabel>
                      <Select
                        value={normalizeState(field.value ?? "") ?? ""}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // A city belongs to one state: changing the state clears it.
                          form.setValue(
                            "city",
                            "",
                          );
                          setLga("");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger aria-label="State">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-72">
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
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel>City</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        disabled={!installState}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger aria-label="City">
                            <SelectValue placeholder={installState ? "Select city" : "Select a state first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-72">
                          {cityOptions.map(city => (
                            <SelectItem
                              key={city}
                              value={city}
                            >
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="install-lga">LGA</Label>
                  <Select
                    value={lga}
                    disabled={!installState}
                    onValueChange={setLga}
                  >
                    <SelectTrigger
                      id="install-lga"
                      aria-label="Local Government Area"
                    >
                      <SelectValue placeholder="Select local government area" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {lgaOptions.map(option => (
                        <SelectItem
                          key={option}
                          value={option}
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Installation Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={installationDateLimit(1)}
                        max={installationDateLimit(90)}
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
                    <FormLabel required>Installation Time</FormLabel>
                    <FormControl>
                      {/* The design takes a clock time; the API books a slot, so the time
                          picks it — before noon is the morning slot. */}
                      <Input
                        type="time"
                        min="08:00"
                        max="16:00"
                        value={time}
                        onChange={(event) => {
                          setTime(event.target.value);
                          field.onChange(slotForTime(event.target.value));
                        }}
                      />
                    </FormControl>
                    {timeOutOfHours && (
                      <p className="text-sm font-medium text-destructive">
                        Pick a time between 08:00 and 16:00.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Site Contact Name</FormLabel>
                    <FormControl>
                      <Input
                        maxLength={80}
                        {...field}
                      />
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
                    <FormLabel required>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
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
                      maxLength={1000}
                      placeholder="Anything the installer should know."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {bookingError && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground">
                <span>{bookingError.message}</span>
                {bookingError.conflict && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Refresh
                  </Button>
                )}
              </div>
            )}

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
              {`${deviceCount} device${deviceCount === 1 ? "" : "s"} will be installed at ${[
                watched.streetAddress,
                watched.city,
                watched.state,
              ].filter(Boolean).join(", ") || "your confirmed address"}${watched.date ? ` on ${watched.date}` : ""} at ${time}.`}
            </div>

            <Button
              type="submit"
              size="lg"
              loading={schedule.isPending}
              disabled={deviceCount === 0}
            >
              <CalendarCheck className="mr-2 h-4 w-4" />
              Schedule Installation
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
