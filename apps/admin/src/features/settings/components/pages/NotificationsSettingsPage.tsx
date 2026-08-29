import {
  getPlatformAlertSettingsQueryOptions,
  useUpdatePlatformAlertSetting,
  type PlatformAlertChannel,
  type PlatformAlertSetting,
  type PlatformAlertSeverity,
  type PlatformAlertType,
} from "@truckmoov/api/auth";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import { cn } from "@/lib/utils";

/**
 * `/settings/notifications` — platform alert routing.
 *
 * One row per alertType. Each change fires a PATCH; server invalidation
 * refreshes the row.
 */

const ALERT_TYPES: { type: PlatformAlertType; label: string; description: string }[] = [
  { type: "new_tenant_signup", label: "New tenant signup", description: "A new tenant registers on the platform." },
  { type: "system_errors",     label: "System errors",     description: "Critical failures in platform services." },
  { type: "billing_alerts",    label: "Billing alerts",    description: "Failed payments and billing issues." },
  { type: "security_alerts",   label: "Security alerts",   description: "Suspicious activity and access anomalies." },
];

const CHANNELS: { value: PlatformAlertChannel; label: string }[] = [
  { value: "email",   label: "Email" },
  { value: "sms",     label: "SMS" },
  { value: "slack",   label: "Slack" },
  { value: "webhook", label: "Webhook" },
];

const SEVERITIES: { value: PlatformAlertSeverity; label: string }[] = [
  { value: "low",      label: "Low" },
  { value: "medium",   label: "Medium" },
  { value: "high",     label: "High" },
  { value: "critical", label: "Critical" },
];

export default function NotificationsSettingsPage() {
  const { data, isLoading, isError, error } = useQuery(getPlatformAlertSettingsQueryOptions());
  const mutation = useUpdatePlatformAlertSetting();

  const byType = new Map<PlatformAlertType, PlatformAlertSetting>(
    (data?.data ?? []).map((row) => [row.alertType, row]),
  );
  const pendingType = mutation.isPending ? mutation.variables?.alertType : undefined;

  function patch(alertType: PlatformAlertType, patch: Partial<PlatformAlertSetting>) {
    mutation.mutate(
      { alertType, data: patch },
      {
        onSuccess: () => toast.success("Routing updated"),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Notification routing</h2>
        <p className="text-sm text-muted-foreground">
          Configure which channels receive each platform alert, and the minimum severity that triggers them.
        </p>
      </header>

      {isError ? (
        <Card><CardContent className="py-6 text-sm text-destructive">{error.message}</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {ALERT_TYPES.map(({ type, label, description }) => {
              const row = byType.get(type);
              const loading = isLoading || !row;
              const pending = pendingType === type;
              const dimmed = row && !row.enabled;

              return (
                <div
                  key={type}
                  className={cn(
                    "grid grid-cols-1 gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-start",
                    pending && "opacity-70",
                  )}
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold">{label}</h3>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>

                    <div className={cn("space-y-3", dimmed && "opacity-50")}>
                      <Field label="Channels">
                        {loading ? (
                          <MatrixSkeleton count={CHANNELS.length} />
                        ) : (
                          <ToggleGroup
                            type="multiple"
                            variant="outline"
                            size="sm"
                            value={row.channels}
                            disabled={pending || !row.enabled}
                            onValueChange={(next: string[]) => {
                              if (next.length === 0) return;
                              patch(type, { channels: next as PlatformAlertChannel[] });
                            }}
                            className="flex-wrap justify-start"
                          >
                            {CHANNELS.map((c) => (
                              <ToggleGroupItem key={c.value} value={c.value} aria-label={c.label}>
                                {c.label}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        )}
                      </Field>

                      <Field label="Min severity">
                        {loading ? (
                          <MatrixSkeleton count={SEVERITIES.length} />
                        ) : (
                          <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={row.minSeverity}
                            disabled={pending || !row.enabled}
                            onValueChange={(next: string) => {
                              if (!next) return;
                              patch(type, { minSeverity: next as PlatformAlertSeverity });
                            }}
                            className="flex-wrap justify-start"
                          >
                            {SEVERITIES.map((s) => (
                              <ToggleGroupItem key={s.value} value={s.value} aria-label={s.label}>
                                {s.label}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        )}
                      </Field>
                    </div>

                    {row && (
                      <p className="font-mono text-xs text-muted-foreground">
                        Updated {formatDateTime(row.updatedAt)}
                        {row.updatedBy ? ` · ${row.updatedBy}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start justify-end">
                    {loading ? (
                      <Skeleton className="h-6 w-11 rounded-full" />
                    ) : (
                      <Switch
                        checked={row.enabled}
                        disabled={pending}
                        onCheckedChange={(checked) => patch(type, { enabled: checked })}
                        aria-label={`${label} enabled`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-center">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function MatrixSkeleton({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-16 rounded-md" />
      ))}
    </div>
  );
}

