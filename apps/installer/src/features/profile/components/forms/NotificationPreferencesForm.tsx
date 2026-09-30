import type { InstallerNotificationPreferences } from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateInstallerNotificationPreferences } from "@truckmoov/api/auth";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/shadcn/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/shadcn/form";
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";

const notificationSchema = z.object({
  newInstallationOffers: z.boolean(),
  scheduleReminders: z.boolean(),
  jobAndIssueUpdates: z.boolean(),
  supportTicketUpdates: z.boolean(),
  emailAlerts: z.boolean(),
  inPlatformAlerts: z.boolean(),
});

type NotificationValues = z.infer<typeof notificationSchema>;

export const NOTIFICATION_PREFERENCES_FORM_ID = "installer-notification-preferences-form";

const TYPES = [
  [
    "newInstallationOffers",
    "New installation offers",
    "Alert me when a job is offered to me.",
  ],
  [
    "scheduleReminders",
    "Schedule reminders",
    "Remind me before a scheduled installation.",
  ],
  [
    "jobAndIssueUpdates",
    "Job and issue updates",
    "Changes, cancellations, resolved issues and device verification.",
  ],
  [
    "supportTicketUpdates",
    "Support ticket updates",
    "Replies and status changes on my support tickets.",
  ],
] as const;

// There is no SMS channel — alerts go by email and to the in-platform inbox only.
const CHANNELS = [
  [
    "emailAlerts",
    "Email alerts",
    "Send each alert to my email too.",
  ],
  [
    "inPlatformAlerts",
    "In-platform alerts",
    "Show each alert in the notification bell.",
  ],
] as const;

type ToggleRow = (typeof TYPES)[number] | (typeof CHANNELS)[number];

export function NotificationPreferencesForm({ preferences }: { preferences: InstallerNotificationPreferences }) {
  const update = useUpdateInstallerNotificationPreferences();

  const form = useForm<NotificationValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: preferences,
  });

  function onSubmit(values: NotificationValues) {
    update.mutate(
      { data: values },
      {
        onSuccess: () => toast.success("Notification preferences saved."),
        onError: error => toast.error(error.message),
      },
    );
  }

  const toggle = ([
    name,
    label,
    description,
  ]:
  ToggleRow) => (
    <FormField
      key={name}
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-4 space-y-0 rounded-xl border p-3">
          <div>
            <FormLabel className="text-sm font-medium">{label}</FormLabel>
            <FormDescription className="text-xs">{description}</FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form
        id={NOTIFICATION_PREFERENCES_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {TYPES.map(toggle)}
        <Separator />
        {CHANNELS.map(toggle)}
        <Button
          type="submit"
          form={NOTIFICATION_PREFERENCES_FORM_ID}
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
