"use client";

import type {
  OnboardingApplicationVehicle,
  ScheduledOnboardingInstallation,
} from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { InstallationValues } from "@/features/get-started/schemas/applySchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Cpu,
  EnvelopeSimple,
  Warning,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingOrderQueryOptions,
  useScheduleOnboardingInstallation,
} from "@truckmoov/api/auth";
import {
  CalendarCheck,
  WandSparkles,
} from "lucide-react";
import { useState } from "react";
import {
  useForm,
  useWatch,
} from "react-hook-form";
import {
  LoadingBlock,
  Notice,
  Pill,
  ProgressBar,
  SectionHeading,
  StepHeading,
  StepLayout,
  SuccessMark,
} from "@/features/get-started/components/StepParts";
import {
  installationDateLimit,
  installationSchema,
  normalizePhone,
} from "@/features/get-started/schemas/applySchemas";
import { useApplyDraftStore } from "@/features/get-started/stores/applyDraftStore";
import {
  CARD_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXTAREA_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils";

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
 * Last draft-token step (main app: ScheduleInstallationStep). Each paid-for device is fitted
 * to one vehicle; devices have no IMEI yet, so they're labelled by position. A successful
 * booking creates the account and emails the setup link. As in the design, the submit
 * button sits in the card and there is no footer or Back button.
 */
export function ScheduleInstallationStep({
  applicationId,
  vehicles,
  defaults,
  onDone,
}: {
  applicationId: string;
  vehicles: OnboardingApplicationVehicle[];
  defaults: Partial<InstallationValues>;
  /** Booking done: the account exists and sign-in happens from the emailed link. */
  onDone: () => void;
}) {
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
    message: string;
    conflict: boolean;
  } | null>(null);

  const deviceCount = orderQuery.data?.data.order.deviceCount ?? 0;
  const deviceIndexes = Array.from(
    { length: deviceCount },
    (_, index) => index + 1,
  );
  const assignedCount = deviceIndexes.filter(index => assignments[index]).length;

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
  // The summary line under the form reads what is typed.
  const watched = useWatch({ control: form.control });
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
    if (vehicleId)
      next[deviceIndex] = vehicleId;
    else
      delete next[deviceIndex];
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
      <StepLayout>
        <div
          className="flex flex-col items-center pt-[50px] text-center"
          role="status"
        >
          <SuccessMark />
          <h2 className="mt-[21px] text-[20px] leading-[25px] font-semibold text-heading">Installation Scheduled</h2>
          <p className="mt-3 max-w-[460px] text-sm leading-5 text-heading">
            Your installation order has been created successfully. You now have access to the Fleet
            Pro platform, and we also have sent an email containing your setup link so you can create
            your password and sign in right away.
          </p>
          {booked.setupLinkSent
            ? (
                <Notice
                  tone="success"
                  className="mt-4"
                >
                  <span className="flex items-center gap-2">
                    <EnvelopeSimple className="size-4 shrink-0" />
                    Check your email for your account setup link.
                  </span>
                </Notice>
              )
            : (
                <Notice className="mt-4">
                  <span className="flex items-center gap-2">
                    <Warning className="size-4 shrink-0" />
                    We couldn't send your account setup email. Please contact support.
                  </span>
                </Notice>
              )}
          <button
            type="button"
            className={cn(
              PRIMARY_BUTTON_CLASS,
              "mt-8",
            )}
            onClick={onDone}
          >
            Return to Home
          </button>
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout>
      <StepHeading
        title="Schedule Installation"
        description="Choose when our team should install your devices. We assign the right installer for you automatically."
      />

      <section className={cn(
        CARD_CLASS,
        "mt-[30px]",
      )}
      >
        <h3 className="text-base leading-5 font-semibold text-heading">Installation Scheduling</h3>

        <div className="mt-5 rounded-[15px] border-[0.5px] border-border p-4">
          <SectionHeading
            title="Devices you requested"
            description="Choose the vehicle each device should be installed in — a vehicle can only be picked once."
            action={(
              <div className="flex gap-2">
                <button
                  type="button"
                  className={SECONDARY_BUTTON_CLASS}
                  disabled={deviceCount === 0}
                  onClick={autoAssign}
                >
                  <WandSparkles className="size-4" />
                  Auto-assign
                </button>
                <button
                  type="button"
                  className={SECONDARY_BUTTON_CLASS}
                  disabled={assignedCount === 0}
                  onClick={() => setAssignments({})}
                >
                  <X className="size-4" />
                  Clear all
                </button>
              </div>
            )}
          />

          {orderQuery.isLoading && <LoadingBlock />}
          {orderQuery.isError && (
            <Notice>{(orderQuery.error as ServerErrorResponse | null)?.message || "We couldn't load your order."}</Notice>
          )}

          {deviceCount > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{`${assignedCount} of ${deviceCount} devices assigned`}</span>
                <Pill>
                  {`${Math.max(
                    vehicles.length - assignedCount,
                    0,
                  )} vehicles left`}
                </Pill>
              </div>
              <ProgressBar value={(assignedCount / deviceCount) * 100} />
              {deviceCount > vehicles.length && (
                <Notice tone="info">
                  {`You requested ${deviceCount} devices but submitted only ${vehicles.length} vehicles. Add more vehicles to fit every device.`}
                </Notice>
              )}
              <ul className="max-h-[380px] space-y-2 overflow-y-auto">
                {deviceIndexes.map((deviceIndex) => {
                  const assignedTo = assignments[deviceIndex];
                  return (
                    <li
                      key={deviceIndex}
                      className="grid gap-3 rounded-[15px] bg-surface p-3 sm:grid-cols-2 sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-[12px]",
                          assignedTo ? "bg-brand-tint text-brand-deep" : "bg-background text-muted-foreground",
                        )}
                        >
                          {assignedTo ? <Check className="size-4" /> : <Cpu className="size-4" />}
                        </span>
                        <span className="text-sm font-medium text-heading">{deviceLabel(deviceIndex)}</span>
                      </div>
                      <select
                        aria-label={`Vehicle for ${deviceLabel(deviceIndex)}`}
                        value={assignedTo ?? ""}
                        onChange={event => assign(
                          deviceIndex,
                          event.target.value,
                        )}
                        className={cn(
                          FIELD_CLASS,
                          !assignedTo && "text-faint-foreground",
                        )}
                      >
                        <option value="">Select vehicle to assign</option>
                        {vehicles.map((vehicle) => {
                          const takenBy = Object.entries(assignments)
                            .find(([
                              key,
                              value,
                            ]) => value === vehicle.id && Number(key) !== deviceIndex);
                          return (
                            <option
                              key={vehicle.id}
                              value={vehicle.id}
                              disabled={Boolean(takenBy)}
                              className="text-heading"
                            >
                              {`${vehicle.registrationNumber || "Unregistered"} — ${vehicle.make} ${vehicle.model}${takenBy ? " (already assigned)" : ""}`}
                            </option>
                          );
                        })}
                      </select>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <Form {...form}>
          <form
            className="mt-[25px] grid grid-cols-2 gap-x-[15px] gap-y-[19px]"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="col-span-2 space-y-1.5">
              <span className={LABEL_CLASS}>Installation Address</span>
              <div className="grid gap-[15px] sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="streetAddress"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormControl>
                        <Input
                          aria-label="Street"
                          placeholder="Street"
                          maxLength={200}
                          className={FIELD_CLASS}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormControl>
                        <Input
                          aria-label="City"
                          placeholder="City"
                          className={FIELD_CLASS}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormControl>
                        <Input
                          aria-label="State"
                          placeholder="State"
                          className={FIELD_CLASS}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="col-span-2 gap-1.5 sm:col-span-1">
                  <FormLabel className={LABEL_CLASS}>Installation Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={installationDateLimit(1)}
                      max={installationDateLimit(90)}
                      className={FIELD_CLASS}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeSlot"
              render={({ field }) => (
                <FormItem className="col-span-2 gap-1.5 sm:col-span-1">
                  <FormLabel className={LABEL_CLASS}>Installation Time</FormLabel>
                  <FormControl>
                    {/* The design takes a clock time; the API books a slot, so the time
                        picks it — before noon is the morning slot. */}
                    <Input
                      type="time"
                      min="08:00"
                      max="16:00"
                      value={time}
                      className={FIELD_CLASS}
                      onChange={(event) => {
                        setTime(event.target.value);
                        field.onChange(slotForTime(event.target.value));
                      }}
                    />
                  </FormControl>
                  {timeOutOfHours && (
                    <p className="text-xs font-medium text-destructive">
                      Pick a time between 08:00 and 16:00.
                    </p>
                  )}
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem className="col-span-2 gap-1.5 sm:col-span-1">
                  <FormLabel className={LABEL_CLASS}>Site Contact Name</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={80}
                      className={FIELD_CLASS}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem className="col-span-2 gap-1.5 sm:col-span-1">
                  <FormLabel className={LABEL_CLASS}>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      className={FIELD_CLASS}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-2 gap-1.5">
                  <FormLabel className={LABEL_CLASS}>Installation Notes (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      placeholder="Anything the installer should know."
                      className={TEXTAREA_CLASS}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {bookingError && (
              <Notice className="col-span-2">
                <span className="flex flex-wrap items-center justify-between gap-3">
                  <span>{bookingError.message}</span>
                  {bookingError.conflict && (
                    <button
                      type="button"
                      className={SECONDARY_BUTTON_CLASS}
                      onClick={() => {
                        setBookingError(null);
                        void orderQuery.refetch();
                      }}
                    >
                      Refresh
                    </button>
                  )}
                </span>
              </Notice>
            )}

            <p className="col-span-2 rounded-[15px] bg-surface p-4 text-xs leading-[17px] text-muted-foreground">
              {`${deviceCount} device${deviceCount === 1 ? "" : "s"} will be installed at ${[
                watched.streetAddress,
                watched.city,
                watched.state,
              ].filter(Boolean).join(", ") || "your confirmed address"}${watched.date ? ` on ${watched.date}` : ""} — ${time}.`}
            </p>

            <button
              type="submit"
              className={cn(
                PRIMARY_BUTTON_CLASS,
                "col-span-2 w-full sm:w-auto sm:justify-self-start",
              )}
              disabled={schedule.isPending || deviceCount === 0}
            >
              <CalendarCheck className="size-4" />
              {schedule.isPending ? "Please wait…" : "Schedule Installation"}
            </button>
          </form>
        </Form>
      </section>
    </StepLayout>
  );
}
