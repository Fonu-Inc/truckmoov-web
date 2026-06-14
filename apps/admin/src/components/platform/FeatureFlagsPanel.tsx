import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getSystemFeatureFlagsQueryOptions,
  useUpdateFeatureFlag,
} from '@truckmoov/api/auth';
import type { SystemFeatureFlag } from '@truckmoov/api/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Switch } from '@/components/shadcn/switch';
import { Separator } from '@/components/shadcn/separator';
import { toast } from 'sonner';
import {
  Beaker,
  Wrench,
  Fuel,
  Brain,
  AlertCircle,
  Building2
} from 'lucide-react';

export function FeatureFlagsPanel() {
  const featureFlagsQuery = useQuery(getSystemFeatureFlagsQueryOptions());
  const updateFeatureFlag = useUpdateFeatureFlag();

  const featureFlags = featureFlagsQuery.data?.data.flags ?? [];

  const phase3Features = useMemo(
    () => featureFlags.filter((flag) => flag.phase === 'phase_3'),
    [featureFlags],
  );
  const maintenanceFeatures = useMemo(
    () => featureFlags.filter((flag) => flag.category === 'maintenance'),
    [featureFlags],
  );
  const fuelFeatures = useMemo(
    () => featureFlags.filter((flag) => flag.category === 'fuel'),
    [featureFlags],
  );
  const optimizationFeatures = useMemo(
    () => featureFlags.filter((flag) => flag.category === 'optimization'),
    [featureFlags],
  );
  const architectureFeatures = useMemo(
    () => featureFlags.filter((flag) => flag.category === 'architecture'),
    [featureFlags],
  );

if (featureFlagsQuery.isError) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Beaker className="h-5 w-5" />
          Feature Flags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>{featureFlagsQuery.error.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

if (featureFlagsQuery.isLoading) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const renderFeatureGroup = (features: SystemFeatureFlag[], title: string, icon: ReactNode) => {
  if (!features || features.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>
      {features.map(flag => (
        <div
          key={flag.id}
          className="flex items-center justify-between p-3 rounded-lg border"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{flag.featureName}</span>
              {flag.phase && (
                <Badge variant="outline" className="text-xs">
                  {flag.phase.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </div>
            {flag.featureDescription && (
              <p className="text-xs text-muted-foreground">
                {flag.featureDescription}
              </p>
            )}
          </div>
          <Switch
            checked={flag.isEnabled}
            onCheckedChange={(checked) =>
              updateFeatureFlag.mutate(
                { key: flag.featureKey, data: { isEnabled: checked } },
                {
                  onSuccess: () => toast.success('Feature flag updated'),
                  onError: (error) => toast.error(error.message),
                },
              )
            }
            disabled={updateFeatureFlag.isPending}
          />
        </div>
      ))}
    </div>
  );
};

return (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Beaker className="h-5 w-5" />
        Feature Flags
      </CardTitle>
      <CardDescription>
        Enable or disable enterprise features for phased rollout
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Phase 3 Summary */}
      <div className="p-4 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Phase 3: Intelligence & Optimization</div>
            <div className="text-sm text-muted-foreground">
              Enterprise features for predictive analytics
            </div>
          </div>
          <Badge variant="outline">
            {phase3Features.filter(f => f.isEnabled).length} / {phase3Features.length} enabled
          </Badge>
        </div>
      </div>

      <Separator />

      {featureFlags.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-8">
          No feature flags found
        </div>
      )}

      {renderFeatureGroup(
        architectureFeatures,
        'Architecture',
        <Building2 className="h-4 w-4" />
      )}

      {architectureFeatures && architectureFeatures.length > 0 && maintenanceFeatures && maintenanceFeatures.length > 0 && (
        <Separator />
      )}

      {renderFeatureGroup(
        maintenanceFeatures,
        'Maintenance Features',
        <Wrench className="h-4 w-4" />
      )}

      {maintenanceFeatures && maintenanceFeatures.length > 0 && fuelFeatures && fuelFeatures.length > 0 && (
        <Separator />
      )}

      {renderFeatureGroup(
        fuelFeatures,
        'Fuel Intelligence',
        <Fuel className="h-4 w-4" />
      )}

      {fuelFeatures && fuelFeatures.length > 0 && optimizationFeatures && optimizationFeatures.length > 0 && (
        <Separator />
      )}

      {renderFeatureGroup(
        optimizationFeatures,
        'Fleet Optimization',
        <Brain className="h-4 w-4" />
      )}

      {/* Warning Note */}
      <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded">
        <AlertCircle className="h-3 w-3 inline mr-1" />
        Feature changes take effect immediately for all tenants
      </div>
    </CardContent>
  </Card>
);
}
