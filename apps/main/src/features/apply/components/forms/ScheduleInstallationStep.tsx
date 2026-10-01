import type {
  OnboardingApplicationVehicle,
  ScheduledOnboardingInstallation,
} from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { InstallationValues } from "@/features/apply/utils/applySchemas";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingOrderQueryOptions,
  useScheduleOnboardingInstallation,
} from "@truckmoov/api/auth";
import { CityCombobox } from "@truckmoov/reusables/components/location/CityCombobox";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  Check,
  CheckCircle2,
  Cpu,
  Loader2,
  Mail,
  Wand2,
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
} from "@/features/apply/utils/applySchemas";
import { TIME_SLOTS } from "@/features/apply/utils/applyTypes";
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
  onBack: () => void;
  /** Booking done: the account exists and sign-in happens from the emailed link. */
  onDone: () => void;
};

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
  onBack,
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
      state: defaults.state ?? (undefined as unknown as InstallationValues["state"]),
      date: "",
      timeSlot: "morning",
      contactName: defaults.contactName ?? "",
      contactPhone: defaults.contactPhone ?? "",
      notes: "",
    },
  });

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
      // Date rules come back without a field key.
      if (err.statusCode === 400 && /date|booked/i.test(message)) {
        form.setError(
          "date",
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
          Installation Booked
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">{`Order ${booked.orderNumber}`}</p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {`Your installation is booked for ${new Date(`${booked.scheduledDate}T00:00:00`).toLocaleDateString(
            "en-NG",
            { dateStyle: "long" },
          )}, ${booked.timeSlotLabel}.`}
        </p>

        <div className="mt-6 w-full max-w-md rounded-2xl border border-border/60 bg-muted/20 p-5 text-left text-sm">
          {booked.installer
            ? (
                <>
                  <p className="font-medium text-foreground">Your installer</p>
                  <p className="mt-2 text-foreground">{booked.installer.fullName}</p>
                  <p className="text-muted-foreground">{booked.installer.team}</p>
                  <p className="text-muted-foreground">{booked.installer.phoneNumber}</p>
                </>
              )
            : (
                <p className="text-muted-foreground">
                  We're assigning an installer for this slot and will let you know who is coming.
                </p>
              )}
        </div>

        {booked.setupLinkSent
          ? (
              <p className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                Your account is ready. Check your email for the setup link.
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
          Go to sign in
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

      <div className="space-y-3 rounded-xl border border-border/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-foreground">Devices you paid for</p>
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
              disabled={deviceCount === 0}
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
                {`You paid for ${deviceCount} devices but have only ${vehicles.length} vehicles. Each device needs its own vehicle.`}
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
          </>
        )}
      </div>

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
                    maxLength={200}
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
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue(
                        "city",
                        "",
                      );
                    }}
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

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <CityCombobox
                      state={form.watch("state")}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
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
                          key={slot.value}
                          value={slot.value}
                        >
                          {slot.label}
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
                    maxLength={1000}
                    placeholder="Anything our installation team should know."
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
              loading={schedule.isPending}
              disabled={deviceCount === 0}
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
