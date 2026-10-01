import type { InstallerWorkPreferences } from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateInstallerWorkPreferences } from "@truckmoov/api/auth";
import { Save } from "lucide-react";
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

const HH_MM = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const workSchema = z
  .object({
    availability: z.enum([
      "available",
      "unavailable",
    ]),
    start: z.string().regex(
      HH_MM,
      "Enter a time.",
    ),
    end: z.string().regex(
      HH_MM,
      "Enter a time.",
    ),
    preferredPeriods: z.enum([
      "weekdays",
      "weekends",
      "all_days",
    ]),
  })
  // Zero-padded HH:MM compares correctly as a string.
  .refine(
    v => v.start < v.end,
    {
      message: "End must be after start.",
      path: ["end"],
    },
  );

type WorkValues = z.infer<typeof workSchema>;

export const WORK_PREFERENCES_FORM_ID = "installer-work-preferences-form";

export function WorkPreferencesForm({ preferences }: { preferences: InstallerWorkPreferences }) {
  const update = useUpdateInstallerWorkPreferences();

  const form = useForm<WorkValues>({
    resolver: zodResolver(workSchema),
    defaultValues: {
      availability: preferences.availability,
      start: preferences.workingHours.start,
      end: preferences.workingHours.end,
      preferredPeriods: preferences.preferredPeriods,
    },
  });

  function onSubmit({
    start, end, ...rest
  }: WorkValues) {
    update.mutate(
      {
        data: {
          ...rest,
          workingHours: {
            start, end,
          },
        },
      },
      {
        onSuccess: () => toast.success("Work preferences saved."),
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
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="availability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current availability</FormLabel>
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
                    <SelectItem value="available">Available for jobs</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label>Working hours</Label>
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="time"
                        aria-label="Working hours start"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="time"
                        aria-label="Working hours end"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
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
                <FormLabel>Preferred working periods</FormLabel>
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
                    <SelectItem value="all_days">All days</SelectItem>
                    <SelectItem value="weekdays">Weekdays</SelectItem>
                    <SelectItem value="weekends">Weekends</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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
