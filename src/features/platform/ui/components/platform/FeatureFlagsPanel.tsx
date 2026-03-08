import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useAIConfigPermissions } from '@/hooks/useAIConfigPermissions';
import { 
  Settings2, 
  Beaker, 
  Wrench, 
  Fuel, 
  Brain,
  AlertCircle,
  Building2
} from 'lucide-react';

export function FeatureFlagsPanel() {
  const { featureFlags, isLoading, toggleFeatureFlag, getPhase3Features, getFeaturesByCategory } = useFeatureFlags();
  const { isPlatformAdmin } = useAIConfigPermissions();

  const phase3Features = getPhase3Features();
  const maintenanceFeatures = getFeaturesByCategory('maintenance');
  const fuelFeatures = getFeaturesByCategory('fuel');
  const optimizationFeatures = getFeaturesByCategory('optimization');
  const architectureFeatures = getFeaturesByCategory('architecture');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'fuel': return <Fuel className="h-4 w-4" />;
      case 'optimization': return <Brain className="h-4 w-4" />;
      case 'architecture': return <Building2 className="h-4 w-4" />;
      default: return <Settings2 className="h-4 w-4" />;
    }
  };

  if (isLoading) {
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

  if (!isPlatformAdmin) {
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
            <p>Feature flag management is restricted to Platform Administrators</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderFeatureGroup = (features: typeof featureFlags, title: string, icon: React.ReactNode) => {
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
                <span className="font-medium">{flag.feature_name}</span>
                {flag.phase && (
                  <Badge variant="outline" className="text-xs">
                    {flag.phase.replace('_', ' ').toUpperCase()}
                  </Badge>
                )}
              </div>
              {flag.feature_description && (
                <p className="text-xs text-muted-foreground">
                  {flag.feature_description}
                </p>
              )}
            </div>
            <Switch
              checked={flag.is_enabled}
              onCheckedChange={(checked) => 
                toggleFeatureFlag.mutate({ id: flag.id, isEnabled: checked })
              }
              disabled={toggleFeatureFlag.isPending}
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
              {phase3Features.filter(f => f.is_enabled).length} / {phase3Features.length} enabled
            </Badge>
          </div>
        </div>

        <Separator />

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
