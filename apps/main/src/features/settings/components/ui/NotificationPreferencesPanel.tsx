import type { NotificationPreferences } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getNotificationPreferencesQueryOptions,

  useUpdateNotificationPreferences,
} from "@truckmoov/api/auth";
import {
  AlertCircle, Bell, Mail, Phone,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";

import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/shadcn/alert";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";

type PreferenceRow = {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon?: typeof Bell;
};

const ALERT_PREFERENCES: PreferenceRow[] = [
  {
    key: "jobAssignment", label: "Job Assignments", description: "When new jobs are assigned to drivers",
  },
  {
    key: "jobCompletion", label: "Job Completions", description: "When jobs are marked as completed",
  },
  {
    key: "incidentAlerts", label: "Driver Alerts", description: "SOS signals and emergency notifications",
  },
  {
    key: "maintenanceReminders", label: "Maintenance Reminders", description: "Upcoming vehicle maintenance schedules",
  },
  {
    key: "fuelAlerts", label: "Fuel Alerts", description: "Low fuel warnings and refueling events",
  },
  {
    key: "geofenceAlerts", label: "Geofence Alerts", description: "When vehicles enter or exit zones",
  },
];

const DELIVERY_CHANNELS: PreferenceRow[] = [
  {
    key: "emailDigest", label: "Email Digest", description: "Daily summary of all activities", icon: Mail,
  },
  {
    key: "smsAlerts", label: "SMS Alerts", description: "Critical alerts via SMS", icon: Phone,
  },
  {
    key: "pushAlerts", label: "Push Notifications", description: "Real-time browser notifications", icon: Bell,
  },
];

// The design app's card, verbatim. The shared shadcn `Card` adds a border,
// shadow and different padding the reference doesn't have.
const CARD = "rounded-2xl surface-sleek text-card-foreground bg-card/50 border-border/50";
const CARD_HEADER = "flex flex-col space-y-1.5 p-6 pb-4";
const CARD_TITLE = "text-base font-semibold leading-none tracking-tight text-foreground font-display";
const CARD_CONTENT = "p-6 pt-0 space-y-4";

function LoadingPanel() {
  return (
    <div
      className="space-y-6"
      aria-label="Loading notification preferences"
    >
      {[
        6,
        3,
      ].map(rowCount => (
        <div
          key={rowCount}
          className={CARD}
        >
          <div className={CARD_HEADER}>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className={CARD_CONTENT}>
            {Array.from({ length: rowCount }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-16 w-full"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationPreferencesPanel() {
  const preferencesQuery = useQuery(getNotificationPreferencesQueryOptions());
  const updateMutation = useUpdateNotificationPreferences();
  const serverPreferences = preferencesQuery.data?.data.notificationPreferences;
  const [
    preferences,
    setPreferences,
  ] = useState<NotificationPreferences | null>(null);

  useEffect(
    () => {
      if (serverPreferences)
        setPreferences(serverPreferences);
    },
    [serverPreferences],
  );

  if (preferencesQuery.isPending)
    return <LoadingPanel />;

  if (preferencesQuery.isError || !preferences) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to load notification preferences</AlertTitle>
        <AlertDescription>{preferencesQuery.error?.message ?? "The server returned an invalid response."}</AlertDescription>
      </Alert>
    );
  }

  const updatePreference = (key: keyof NotificationPreferences, checked: boolean) => {
    const previousValue = preferences[key];
    setPreferences(current => current
      ? {
          ...current, [key]: checked,
        }
      : current);

    updateMutation.mutate(
      { data: { [key]: checked } },
      {
        onSuccess: () => toast.success("Notification preference updated"),
        onError: (error) => {
          setPreferences(current => current
            ? {
                ...current, [key]: previousValue,
              }
            : current);
          toast.error(error.message);
        },
      },
    );
  };

  const renderRows = (rows: PreferenceRow[], showIcons = false) => rows.map((item) => {
    const Icon = item.icon;
    return (
      <div
        key={item.key}
        className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
      >
        <div className={showIcons ? "flex items-center gap-3" : undefined}>
          {showIcons && Icon && (
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium">{item.label}</p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>
        <Switch
          aria-label={item.label}
          checked={preferences[item.key]}
          disabled={updateMutation.isPending}
          onCheckedChange={checked => updatePreference(
            item.key,
            checked,
          )}
        />
      </div>
    );
  });

  return (
    <>
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <h3 className={CARD_TITLE}>Alert Preferences</h3>
          <p className="text-sm text-muted-foreground">Choose which events trigger notifications</p>
        </div>
        <div className={CARD_CONTENT}>{renderRows(ALERT_PREFERENCES)}</div>
      </div>

      <div className={CARD}>
        <div className={CARD_HEADER}>
          <h3 className={CARD_TITLE}>Delivery Channels</h3>
          <p className="text-sm text-muted-foreground">How you want to receive notifications</p>
        </div>
        <div className={CARD_CONTENT}>
          {renderRows(
            DELIVERY_CHANNELS,
            true,
          )}
        </div>
      </div>
    </>
  );
}
