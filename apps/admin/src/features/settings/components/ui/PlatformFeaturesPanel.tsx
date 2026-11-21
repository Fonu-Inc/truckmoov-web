import { useQuery } from "@tanstack/react-query";
import {
  getSystemSettingsQueryOptions,
  useUpdateSystemSettings,
} from "@truckmoov/api/auth";
import { Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";

type FeatureKey = "allowNewTenantRegistration" | "maintenanceMode" | "enableBetaFeatures";

/** Fleetflow's switch defaults (`defaultChecked` on registration and beta). */
const DEFAULTS: Record<FeatureKey, boolean> = {
  allowNewTenantRegistration: true,
  maintenanceMode: false,
  enableBetaFeatures: true,
};

const FEATURES: Array<{
  key: FeatureKey; label: string; description: string;
}> = [
  {
    key: "allowNewTenantRegistration", label: "Allow New Tenant Registration", description: "Enable self-service tenant onboarding",
  },
  {
    key: "maintenanceMode", label: "Maintenance Mode", description: "Temporarily disable platform access",
  },
  {
    key: "enableBetaFeatures", label: "Enable Beta Features", description: "Allow access to experimental features",
  },
];

/**
 * `/settings/features` — fleetflow's Platform Features card. As in fleetflow
 * there's no Save button: each switch toggles directly, and here each flip is
 * written straight to system settings `features` (merged with the rest).
 *
 * `enableBetaFeatures` is an accepted API field but nothing on the platform
 * reads it yet (see its type comment in packages/api).
 */
export function PlatformFeaturesPanel() {
  const systemSettingsQuery = useQuery(getSystemSettingsQueryOptions());
  const features = systemSettingsQuery.data?.data?.features;
  const updateSettings = useUpdateSystemSettings();
  // Values flipped on this visit — shown straight away, rolled back on error.
  const [
    pending,
    setPending,
  ] = useState<Partial<Record<FeatureKey, boolean>>>({});

  const valueOf = (key: FeatureKey) => pending[key] ?? features?.[key] ?? DEFAULTS[key];

  const toggle = (key: FeatureKey, checked: boolean) => {
    setPending(p => ({
      ...p, [key]: checked,
    }));
    updateSettings.mutate(
      {
        data: {
          features: {
            ...(features ?? {}), ...pending, [key]: checked,
          },
        },
      },
      {
        onError: (error) => {
          toast.error(error.message);
          setPending((p) => {
            const next = { ...p };
            delete next[key];
            return next;
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Platform Features
          </CardTitle>
          <CardDescription>
            Toggle platform-wide capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-4">
              {FEATURES.map(f => (
                <div
                  key={f.key}
                  className="flex items-center justify-between"
                >
                  <div>
                    <Label htmlFor={`feature-${f.key}`}>{f.label}</Label>
                    <p className="text-sm text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                  <Switch
                    id={`feature-${f.key}`}
                    checked={valueOf(f.key)}
                    onCheckedChange={c => toggle(
                      f.key,
                      c,
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
