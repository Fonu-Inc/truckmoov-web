import type { InstallerWorkPreferences } from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateInstallerWorkPreferences } from "@truckmoov/api/auth";
import { Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  formatWorkingHours,
  parseWorkingHours,
} from "@/features/profile/utils/workingHours";

const workSchema = z.object({
  availability: z.enum([
    "available",
    "unavailable",
  ]),
  workingHours: z
    .string()
    .refine(
      v => !!parseWorkingHours(v),
      "Enter hours like 8:00 AM - 6:00 PM.",
    )
    .refine(
      (v) => {
        const hours = parseWorkingHours(v);
        // Zero-padded HH:MM compares correctly as a string.
        return !hours || hours.start < hours.end;
      },
      "The end time must be after the start time.",
    ),
  preferredPeriods: z.enum([
    "weekdays",
    "weekends",
    "all_days",
  ]),
});

type WorkValues = z.infer<typeof workSchema>;

export const WORK_PREFERENCES_FORM_ID = "installer-work-preferences-form";

/**
 * Fleetflow's option lists. "Busy, on a job" and "Flexible" have no API value
 * yet, so they show disabled; "Weekends" is not in fleetflow and only shows
 * for an installer who already has it saved.
 */
const AVAILABILITY = [
  [
    "available",
    "Available for jobs",
  ],
  [
    "busy",
    "Busy, on a job",
  ],
  [
    "unavailable",
    "Off duty",
  ],
] as const;

const PERIODS = [
  [
    "weekdays",
    "Weekdays",
  ],
  [
    "weekends",
    "Weekends",
  ],
  [
    "all_days",
    "Weekdays and weekends",
  ],
  [
    "flexible",
    "Flexible",
  ],
] as const;

const UNSUPPORTED = new Set([
  "busy",
  "flexible",
]);

export function WorkPreferencesForm({ preferences }: { preferences: InstallerWorkPreferences }) {
  const update = useUpdateInstallerWorkPreferences();
  // ponytail: the installer work-preferences API has no capabilities field yet; held on screen only.
  const [
    capabilities,
    setCapabilities,
  ] = useState("");

  const form = useForm<WorkValues>({
    resolver: zodResolver(workSchema),
    defaultValues: {
      availability: preferences.availability,
      workingHours: formatWorkingHours(preferences.workingHours),
      preferredPeriods: preferences.preferredPeriods,
    },
  });

  function onSubmit({
    workingHours, ...rest
  }: WorkValues) {
    const hours = parseWorkingHours(workingHours);
    if (!hours)
      return;
    update.mutate(
      {
        data: {
          ...rest,
          workingHours: hours,
        },
      },
      {
        onSuccess: () => {
          form.reset({
            ...rest,
            workingHours: formatWorkingHours(hours),
          });
          toast.success("Work preferences saved.");
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  return (
    <Form {...form}>
      <form
        id={WORK_PREFERENCES_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="availability"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Current availability</FormLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AVAILABILITY.map(([
                      value,
                      label,
                    ]) => (
                      <SelectItem
                        key={value}
                        value={value}
                        disabled={UNSUPPORTED.has(value)}
                      >
                        {label}
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
            name="workingHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Working hours</FormLabel>
                <FormControl>
                  <Input
                    placeholder="8:00 AM - 6:00 PM"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="installer-service-areas">Service / work areas</Label>
            <Input
              id="installer-service-areas"
              value={preferences.serviceAreas.join(", ")}
              placeholder="None assigned"
              readOnly
              disabled
            />
            <p className="text-xs text-muted-foreground">Assigned by the Platform Admin. Contact Fleet Pro support to change your work areas.</p>
          </div>
          <FormField
            control={form.control}
            name="preferredPeriods"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Preferred working periods</FormLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PERIODS
                      .filter(([value]) => value !== "weekends" || preferences.preferredPeriods === "weekends")
                      .map(([
                        value,
                        label,
                      ]) => (
                        <SelectItem
                          key={value}
                          value={value}
                          disabled={UNSUPPORTED.has(value)}
                        >
                          {label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="installer-capabilities">Installation capabilities</Label>
            <Input
              id="installer-capabilities"
              value={capabilities}
              onChange={e => setCapabilities(e.target.value)}
              placeholder="e.g. Device installation, SIM activation, Device configuration"
            />
          </div>
        </div>
        <Button
          type="submit"
          form={WORK_PREFERENCES_FORM_ID}
          loading={update.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save preferences
        </Button>
      </form>
    </Form>
  );
}
