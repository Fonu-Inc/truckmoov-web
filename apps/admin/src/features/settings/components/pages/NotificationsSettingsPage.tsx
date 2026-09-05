import type {
  PlatformAlertSetting, PlatformAlertType,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getPlatformAlertSettingsQueryOptions,

  useUpdatePlatformAlertSetting,
} from "@truckmoov/api/auth";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";

/**
 * `/settings/notifications` — matches fleetflow's shape: grouped Admin Alerts
 * on top, Notification Channels below.
 *
 * ponytail: channels are UI-only (unwired). Backend still stores per-alert
 * channels array; we always update `enabled` here and leave `channels`
 * untouched. Wire real channel routing when the API supports simpler
 * per-channel global toggles.
 */

const ADMIN_ALERTS: {
  type: PlatformAlertType; label: string; description: string;
}[] = [
  {
    type: "new_tenant_signup", label: "New Tenant Signup", description: "Notify when a new tenant registers",
  },
  {
    type: "system_errors", label: "System Errors", description: "Notify on critical system failures",
  },
  {
    type: "billing_alerts", label: "Billing Alerts", description: "Notify on failed payments and billing issues",
  },
  {
    type: "security_alerts", label: "Security Alerts", description: "Notify on suspicious activity",
  },
];

export default function NotificationsSettingsPage() {
  const {
    data, isLoading, isError, error,
  } = useQuery(getPlatformAlertSettingsQueryOptions());
  const mutation = useUpdatePlatformAlertSetting();

  const byType = new Map<PlatformAlertType, PlatformAlertSetting>(
    (data?.data ?? []).map(row => [
      row.alertType,
      row,
    ]),
  );
  const pendingType = mutation.isPending ? mutation.variables?.alertType : undefined;

  function toggle(alertType: PlatformAlertType, enabled: boolean) {
    mutation.mutate(
      {
        alertType, data: { enabled },
      },
      {
        onSuccess: () => toast.success("Routing updated"),
        onError: err => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure platform-wide notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Admin Alerts</h4>

            {isError && (
              <p className="text-sm text-destructive">{error.message}</p>
            )}

            {ADMIN_ALERTS.map(({
              type, label, description,
            }) => {
              const row = byType.get(type);
              const loading = isLoading || !row;
              const pending = pendingType === type;
              return (
                <div
                  key={type}
                  className="flex items-center justify-between"
                >
                  <div>
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  {loading
                    ? <Skeleton className="h-6 w-11 rounded-full" />
                    : (
                        <Switch
                          checked={row.enabled}
                          disabled={pending}
                          onCheckedChange={checked => toggle(
                            type,
                            checked,
                          )}
                          aria-label={`${label} enabled`}
                        />
                      )}
                </div>
              );
            })}
          </div>

          <Separator />

          {/* ponytail: unwired channel toggles — visible to match fleetflow shape,
              wire when the API exposes global per-channel routing. */}
          <div className="space-y-4">
            <h4 className="font-medium">Notification Channels</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <Label>Email</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>SMS</Label>
                <Switch />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
