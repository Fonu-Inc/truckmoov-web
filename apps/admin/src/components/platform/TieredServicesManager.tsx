import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Switch } from '@/components/shadcn/switch';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Separator } from '@/components/shadcn/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import { ScrollArea } from '@/components/shadcn/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { useSubscriptionPlans, SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { formatCurrency } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Layers, 
  Check, 
  X, 
  Edit2, 
  Save,
  Star,
  Truck,
  Users,
  Cpu,
  MapPin,
  Brain,
  Wrench,
  DollarSign,
  Video,
  Route,
  Plug,
  MessageSquare,
  FileText,
  RefreshCw,
  Wifi,
  HardDrive,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  tracking: <MapPin className="h-4 w-4" />,
  operations: <Truck className="h-4 w-4" />,
  communication: <MessageSquare className="h-4 w-4" />,
  reporting: <FileText className="h-4 w-4" />,
  analytics: <Brain className="h-4 w-4" />,
  diagnostics: <Cpu className="h-4 w-4" />,
  maintenance: <Wrench className="h-4 w-4" />,
  safety: <Video className="h-4 w-4" />,
  optimization: <Route className="h-4 w-4" />,
  integration: <Plug className="h-4 w-4" />,
};

const TIER_LABELS: Record<string, string> = {
  basic: 'Tier 1 - Basic',
  standard: 'Tier 2 - Standard',
  advanced: 'Tier 3 - Advanced',
  premium: 'Tier 4 - Premium',
};

export function TieredServicesManager() {
  const {
    plans,
    isLoading,
    updatePlan,
    createPlan,
    updatePlanFeature,
    togglePlanActive,
    getPlanFeatures,
    getFeatureCategories,
    getUniqueFeatures,
    refetch,
  } = useSubscriptionPlans();

  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [overviewMode, setOverviewMode] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    billing_mode: 'prepaid' as 'prepaid' | 'postpaid',
    price_ngn: 0,
    yearly_price_ngn: 0,
    max_vehicles: 0,
    max_drivers: 0,
    max_devices: 0,
    max_sims: 0,
    storage_gb: 0,
    trial_days: 0,
    yearly_discount_percent: 0,
    features: [] as string[],
    applicable_org_types: ['FLEET_PROVIDER', 'ENTERPRISE', 'AGGREGATOR', 'OWNER_OPERATOR'] as string[],
    tier: 'basic' as string,
    pricing_display_mode: 'fixed' as 'fixed' | 'custom',
    custom_price_text: '' as string,
  });
  const [newFeature, setNewFeature] = useState('');

  const resetForm = (mode: 'prepaid' | 'postpaid' = overviewMode) => {
    setEditForm({
      name: '',
      description: '',
      billing_mode: mode,
      price_ngn: 0,
      yearly_price_ngn: 0,
      max_vehicles: 0,
      max_drivers: 0,
      max_devices: 0,
      max_sims: 0,
      storage_gb: 0,
      trial_days: 0,
      yearly_discount_percent: 0,
      features: [],
      applicable_org_types: ['FLEET_PROVIDER', 'ENTERPRISE', 'AGGREGATOR', 'OWNER_OPERATOR'],
      tier: 'basic',
      pricing_display_mode: 'fixed',
      custom_price_text: '',
    });
    setNewFeature('');
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    resetForm();
    setEditDialogOpen(true);
  };

  const categories = getFeatureCategories();
  const features = getUniqueFeatures();

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    const p = plan as unknown as {
      storage_gb?: number | null;
      tier?: string | null;
      pricing_display_mode?: 'fixed' | 'custom' | null;
      custom_price_text?: string | null;
    };
    setEditForm({
      name: plan.name || '',
      description: plan.description || '',
      billing_mode: (plan.billing_mode as 'prepaid' | 'postpaid') || 'prepaid',
      price_ngn: plan.price_ngn,
      yearly_price_ngn: plan.yearly_price_ngn || 0,
      max_vehicles: plan.max_vehicles || 0,
      max_drivers: plan.max_drivers || 0,
      max_devices: plan.max_devices || 0,
      max_sims: plan.max_sims || 0,
      storage_gb: p.storage_gb || 0,
      trial_days: plan.trial_days || 0,
      yearly_discount_percent: plan.yearly_discount_percent || 0,
      features: Array.isArray(plan.features) ? [...plan.features] : [],
      applicable_org_types: plan.applicable_org_types || ['FLEET_PROVIDER', 'ENTERPRISE', 'AGGREGATOR', 'OWNER_OPERATOR'],
      tier: p.tier || 'basic',
      pricing_display_mode: p.pricing_display_mode || 'fixed',
      custom_price_text: p.custom_price_text || '',
    });
    setNewFeature('');
    setEditDialogOpen(true);
  };

  const handleSavePlan = async () => {
    const payload = {
      name: editForm.name,
      description: editForm.description,
      billing_mode: editForm.billing_mode,
      price_ngn: editForm.price_ngn,
      yearly_price_ngn: editForm.yearly_price_ngn,
      max_vehicles: editForm.max_vehicles || null,
      max_drivers: editForm.max_drivers || null,
      max_devices: editForm.max_devices || null,
      max_sims: editForm.max_sims || null,
      storage_gb: editForm.storage_gb || null,
      trial_days: editForm.trial_days,
      yearly_discount_percent: editForm.yearly_discount_percent,
      features: editForm.features,
      applicable_org_types: editForm.applicable_org_types,
      tier: editForm.tier,
      pricing_display_mode: editForm.pricing_display_mode,
      custom_price_text: editForm.pricing_display_mode === 'custom'
        ? (editForm.custom_price_text || 'Custom pricing')
        : null,
    };

    if (editingPlan) {
      await updatePlan.mutateAsync({ id: editingPlan.id, updates: payload });
    } else {
      if (!editForm.name.trim()) {
        toast.error('Plan name is required');
        return;
      }
      await createPlan.mutateAsync(payload);
    }
    setEditDialogOpen(false);
  };

  const addFeature = () => {
    const v = newFeature.trim();
    if (!v) return;
    setEditForm((prev) => ({ ...prev, features: [...prev.features, v] }));
    setNewFeature('');
  };

  const removeFeature = (idx: number) => {
    setEditForm((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };

  const handleToggleFeature = async (planId: string, featureKey: string, currentValue: boolean) => {
    await updatePlanFeature.mutateAsync({
      planId,
      featureKey,
      isIncluded: !currentValue,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Tiered Service Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Tiered Service Plans
              </CardTitle>
              <CardDescription>
                Configure subscription tiers based on sensor complexity and features tracked
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="overview">Plan Overview</TabsTrigger>
              <TabsTrigger value="features">Feature Matrix</TabsTrigger>
              <TabsTrigger value="limits">Resource Limits</TabsTrigger>
              <TabsTrigger value="usage-items">Usage Items</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Billing mode switcher */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
                  {(['prepaid', 'postpaid'] as const).map((m) => {
                    const count = (plans || []).filter((p) => (p.billing_mode || 'prepaid') === m).length;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setOverviewMode(m)}
                        className={`rounded-md px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                          overviewMode === m
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {m}
                        <span className="ml-1.5 text-[10px] text-muted-foreground">({count})</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground hidden md:block">
                    Click any plan card to edit price, quotas, and features.
                  </p>
                  <Button size="sm" onClick={handleNewPlan}>
                    <Plus className="h-4 w-4 mr-1" /> New Plan
                  </Button>
                </div>
              </div>

              {(() => {
                const visiblePlans = (plans || []).filter(
                  (p) => (p.billing_mode || 'prepaid') === overviewMode
                );
                if (visiblePlans.length === 0) {
                  return (
                    <div className="rounded-lg border border-dashed border-border p-10 text-center">
                      <p className="text-sm text-muted-foreground">
                        No {overviewMode} plans yet. Edit any plan and switch its billing mode to {overviewMode} to move it here.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visiblePlans.map((plan) => {
                      const planFeatures = getPlanFeatures(plan.id);
                      const includedCount = planFeatures.filter((f) => f.is_included).length;
                      const planFeatureList = Array.isArray(plan.features) ? plan.features : [];
                      return (
                        <Card
                          key={plan.id}
                          className={`relative flex flex-col ${plan.is_popular ? 'ring-2 ring-primary' : ''}`}
                        >
                          {plan.is_popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <Badge className="bg-primary text-primary-foreground">
                                <Star className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            </div>
                          )}
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                style={{ borderColor: plan.tier_badge_color, color: plan.tier_badge_color }}
                              >
                                {TIER_LABELS[plan.tier || 'basic'] || plan.tier}
                              </Badge>
                              <Switch
                                checked={plan.is_active}
                                onCheckedChange={(checked) =>
                                  togglePlanActive.mutate({ id: plan.id, isActive: checked })
                                }
                              />
                            </div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <CardDescription className="text-xs line-clamp-2">
                              {plan.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3 flex-1 flex flex-col">
                            <div>
                              {(plan as unknown as { pricing_display_mode?: string }).pricing_display_mode === 'custom' ? (
                                <div className="text-2xl font-bold">
                                  {(plan as unknown as { custom_price_text?: string }).custom_price_text || 'Custom'}
                                </div>
                              ) : (
                                <>
                                  <div className="text-2xl font-bold">
                                    {formatCurrency(plan.price_ngn, 'NGN')}
                                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                                  </div>
                                  {plan.yearly_price_ngn > 0 && (
                                    <div className="text-[11px] text-muted-foreground">
                                      {formatCurrency(plan.yearly_price_ngn, 'NGN')}/yr
                                      {plan.yearly_discount_percent > 0 && (
                                        <span className="ml-1 text-success">−{plan.yearly_discount_percent}%</span>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <Truck className="h-4 w-4 mx-auto mb-1" />
                                <div className="font-medium">{plan.max_vehicles || '∞'}</div>
                                <div className="text-muted-foreground">Vehicles</div>
                              </div>
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <Users className="h-4 w-4 mx-auto mb-1" />
                                <div className="font-medium">{plan.max_drivers || '∞'}</div>
                                <div className="text-muted-foreground">Drivers</div>
                              </div>
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <Cpu className="h-4 w-4 mx-auto mb-1" />
                                <div className="font-medium">{plan.max_devices || '∞'}</div>
                                <div className="text-muted-foreground">Devices</div>
                              </div>
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <Wifi className="h-4 w-4 mx-auto mb-1" />
                                <div className="font-medium">{plan.max_sims || '∞'}</div>
                                <div className="text-muted-foreground">SIMs</div>
                              </div>
                              <div className="text-center p-2 bg-muted/50 rounded col-span-2">
                                <HardDrive className="h-4 w-4 mx-auto mb-1" />
                                <div className="font-medium">{plan.storage_gb ? `${plan.storage_gb} GB` : '∞'}</div>
                                <div className="text-muted-foreground">Storage</div>
                              </div>
                            </div>

                            <Separator />

                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-foreground">Features</span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {planFeatureList.length || includedCount} included
                                </Badge>
                              </div>
                              {planFeatureList.length > 0 ? (
                                <ul className="space-y-1">
                                  {planFeatureList.slice(0, 6).map((f, i) => (
                                    <li key={`${plan.id}-f-${i}`} className="flex items-start gap-1.5 text-xs">
                                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                                      <span className="text-foreground line-clamp-1">{f}</span>
                                    </li>
                                  ))}
                                  {planFeatureList.length > 6 && (
                                    <li className="text-[11px] text-muted-foreground pl-4">
                                      +{planFeatureList.length - 6} more…
                                    </li>
                                  )}
                                </ul>
                              ) : (
                                <p className="text-[11px] italic text-muted-foreground">
                                  No features listed. Click Edit to add.
                                </p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <span className="text-[11px] text-muted-foreground">Available for</span>
                              <div className="flex flex-wrap gap-1">
                                {(plan.applicable_org_types || []).map((ot) => (
                                  <Badge key={ot} variant="outline" className="text-[10px] px-1.5 py-0">
                                    {ot === 'FLEET_PROVIDER' ? 'Fleet' : ot === 'ENTERPRISE' ? 'Enterprise' : ot === 'AGGREGATOR' ? 'Aggregator' : 'Owner-Op'}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {plan.trial_days > 0 && (
                              <div className="text-[11px] text-muted-foreground">
                                {plan.trial_days}-day free trial
                              </div>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleEditPlan(plan)}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Plan
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}
            </TabsContent>


            {/* Feature Matrix Tab */}
            <TabsContent value="features">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background w-[250px]">Feature</TableHead>
                      {plans?.map(plan => (
                        <TableHead key={plan.id} className="text-center min-w-[120px]">
                          <div className="flex flex-col items-center gap-1">
                            <Badge 
                              variant="outline" 
                              style={{ borderColor: plan.tier_badge_color, color: plan.tier_badge_color }}
                              className="text-xs"
                            >
                              {plan.name}
                            </Badge>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(category => (
                      <React.Fragment key={category}>
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={(plans?.length || 0) + 1} className="font-medium">
                            <div className="flex items-center gap-2 capitalize">
                              {CATEGORY_ICONS[category] || <Layers className="h-4 w-4" />}
                              {category}
                            </div>
                          </TableCell>
                        </TableRow>
                        {features
                          .filter(f => f.category === category)
                          .map(feature => (
                            <TableRow key={feature.key}>
                              <TableCell className="sticky left-0 bg-background">
                                <div>
                                  <div className="font-medium text-sm">{feature.name}</div>
                                  {feature.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {feature.description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              {plans?.map(plan => {
                                const planFeature = getPlanFeatures(plan.id).find(
                                  f => f.feature_key === feature.key
                                );
                                const isIncluded = planFeature?.is_included || false;
                                const usageLimit = planFeature?.usage_limit;

                                return (
                                  <TableCell key={plan.id} className="text-center">
                                    <button
                                      onClick={() => handleToggleFeature(plan.id, feature.key, isIncluded)}
                                      className="p-2 rounded hover:bg-muted transition-colors"
                                    >
                                      {isIncluded ? (
                                        <div className="flex flex-col items-center">
                                          <Check className="h-5 w-5 text-success" />
                                          {usageLimit && (
                                            <span className="text-xs text-muted-foreground">
                                              {usageLimit}/mo
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <X className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </button>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            {/* Resource Limits Tab */}
            <TabsContent value="limits">
              <div className="space-y-4">
                {plans?.map(plan => (
                  <Card key={plan.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            style={{ borderColor: plan.tier_badge_color, color: plan.tier_badge_color }}
                          >
                            {plan.name}
                          </Badge>
                          {TIER_LABELS[plan.tier || 'basic']}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-semibold">
                            {(plan as unknown as { pricing_display_mode?: string }).pricing_display_mode === 'custom'
                              ? ((plan as unknown as { custom_price_text?: string }).custom_price_text || 'Custom')
                              : `${formatCurrency(plan.price_ngn, 'NGN')}/${plan.billing_cycle}`}
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleEditPlan(plan)}>
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Vehicles</div>
                          <div className="text-lg font-semibold">
                            {plan.max_vehicles || 'Unlimited'}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Drivers</div>
                          <div className="text-lg font-semibold">
                            {plan.max_drivers || 'Unlimited'}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Devices</div>
                          <div className="text-lg font-semibold">
                            {plan.max_devices || 'Unlimited'}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">SIMs</div>
                          <div className="text-lg font-semibold">
                            {plan.max_sims || 'Unlimited'}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Trial Period</div>
                          <div className="text-lg font-semibold">
                            {plan.trial_days} days
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Yearly Discount</div>
                          <div className="text-lg font-semibold">
                            {plan.yearly_discount_percent}%
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Status</div>
                          <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Usage Items Tab */}
            <TabsContent value="usage-items">
              <UsageSummaryItemsManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? `Edit ${editingPlan.name} Plan` : 'Create New Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? 'Update pricing, quotas, and the feature list shown to tenants.'
                : 'Define pricing, quotas, and features for a new subscription plan.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Billing Mode</Label>
                <div className="inline-flex rounded-md border border-border bg-muted p-0.5 w-full">
                  {(['prepaid', 'postpaid'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, billing_mode: m }))}
                      className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                        editForm.billing_mode === m
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tier</Label>
                <select
                  value={editForm.tier}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, tier: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {Object.entries(TIER_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Pricing Display</Label>
                <div className="inline-flex rounded-md border border-border bg-muted p-0.5 w-full">
                  {(['fixed', 'custom'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, pricing_display_mode: m }))}
                      className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                        editForm.pricing_display_mode === m
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m === 'fixed' ? 'Fixed Price' : 'Custom (Contact Sales)'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Short tagline shown on the plan card"
                />
              </div>
              {editForm.pricing_display_mode === 'custom' && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Custom Price Label</Label>
                  <Input
                    value={editForm.custom_price_text}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, custom_price_text: e.target.value }))}
                    placeholder="e.g. Custom pricing, Contact us"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Pricing */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Pricing</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Monthly Price (NGN)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      className="pl-9"
                      value={editForm.price_ngn}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, price_ngn: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Yearly Price (NGN)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      className="pl-9"
                      value={editForm.yearly_price_ngn}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, yearly_price_ngn: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Yearly Discount %</Label>
                  <Input
                    type="number"
                    value={editForm.yearly_discount_percent}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, yearly_discount_percent: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Quotas */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Resource Quotas</h4>
              <p className="text-xs text-muted-foreground mb-3">Leave blank for unlimited.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Vehicles</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={editForm.max_vehicles || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, max_vehicles: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Drivers</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={editForm.max_drivers || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, max_drivers: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" /> Devices</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={editForm.max_devices || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, max_devices: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" /> SIMs</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={editForm.max_sims || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, max_sims: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><HardDrive className="h-3.5 w-3.5" /> Storage (GB)</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={editForm.storage_gb || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, storage_gb: Number(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="mt-3 space-y-2 max-w-xs">
                <Label>Trial Days</Label>
                <Input
                  type="number"
                  value={editForm.trial_days}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, trial_days: Number(e.target.value) }))}
                />
              </div>
            </div>

            <Separator />

            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Features</h4>
              <p className="text-xs text-muted-foreground mb-3">
                These appear as bullet points on the plan card (e.g. "Geofencing", "AI load matching", "50 GB storage").
              </p>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Add a feature and press Enter"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addFeature} disabled={!newFeature.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {editForm.features.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">No features yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {editForm.features.map((f, idx) => (
                    <li
                      key={`${idx}-${f}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Check className="h-3.5 w-3.5 text-success shrink-0" />
                        <Input
                          value={f}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditForm((prev) => ({
                              ...prev,
                              features: prev.features.map((x, i) => (i === idx ? v : x)),
                            }));
                          }}
                          className="h-7 text-xs border-0 bg-transparent focus-visible:ring-0 px-0"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive shrink-0"
                        onClick={() => removeFeature(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Separator />

            {/* Availability */}
            <div className="space-y-2">
              <Label>Available for Organization Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'FLEET_PROVIDER', label: 'Fleet Provider' },
                  { key: 'ENTERPRISE', label: 'Enterprise' },
                  { key: 'AGGREGATOR', label: 'Aggregator' },
                  { key: 'OWNER_OPERATOR', label: 'Owner-Operator' },
                ].map((ot) => (
                  <label key={ot.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Switch
                      checked={editForm.applicable_org_types.includes(ot.key)}
                      onCheckedChange={(checked) => {
                        setEditForm((prev) => ({
                          ...prev,
                          applicable_org_types: checked
                            ? [...prev.applicable_org_types, ot.key]
                            : prev.applicable_org_types.filter((t) => t !== ot.key),
                        }));
                      }}
                    />
                    {ot.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={updatePlan.isPending || createPlan.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


const USAGE_ICON_OPTIONS = [
  { key: 'wifi', label: 'Wifi', Icon: Wifi },
  { key: 'message', label: 'Message', Icon: MessageSquare },
  { key: 'phone', label: 'Phone', Icon: Phone },
  { key: 'brain', label: 'Brain / AI', Icon: Brain },
  { key: 'truck', label: 'Truck', Icon: Truck },
  { key: 'cpu', label: 'Device', Icon: Cpu },
  { key: 'route', label: 'Route', Icon: Route },
  { key: 'plug', label: 'Integration', Icon: Plug },
];

type UsageSummaryItem = {
  id: string;
  icon_key: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  linked_rate_type?: string | null;
};


function UsageSummaryItemsManager() {
  const [items, setItems] = useState<UsageSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('wifi');

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('usage_summary_items')
      .select('*')
      .order('sort_order');
    setItems((data as UsageSummaryItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
    const { error } = await supabase.from('usage_summary_items').insert({
      icon_key: newIcon,
      label: newLabel.trim(),
      sort_order: nextOrder,
    });
    if (error) { toast.error('Failed to add item'); return; }
    toast.success('Item added');
    setNewLabel('');
    fetchItems();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from('usage_summary_items').update({ is_active: !current }).eq('id', id);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('usage_summary_items').delete().eq('id', id);
    toast.success('Item deleted');
    fetchItems();
  };

  const handleUpdateLabel = async (id: string, label: string) => {
    await supabase.from('usage_summary_items').update({ label }).eq('id', id);
  };

  const handleUpdateIcon = async (id: string, icon_key: string) => {
    await supabase.from('usage_summary_items').update({ icon_key }).eq('id', id);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      {/* Usage Summary Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usage Summary Items</CardTitle>
          <CardDescription>
            Configure the connectivity & usage items shown during onboarding plan selection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new item */}
          <div className="flex items-end gap-2">
            <div className="space-y-1 flex-shrink-0">
              <Label className="text-xs">Icon</Label>
              <select
                value={newIcon}
                onChange={e => setNewIcon(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {USAGE_ICON_OPTIONS.map(o => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Label</Label>
              <Input
                placeholder="e.g. AI trip optimization"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!newLabel.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          <Separator />

          {/* Items list */}
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No items configured.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Icon</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="w-[80px]">Active</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => {
                  const IconMatch = USAGE_ICON_OPTIONS.find(o => o.key === item.icon_key);
                  const IconComponent = IconMatch?.Icon || Wifi;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <select
                          value={item.icon_key}
                          onChange={e => handleUpdateIcon(item.id, e.target.value)}
                          className="h-8 rounded-md border border-input bg-background px-1.5 text-xs"
                        >
                          {USAGE_ICON_OPTIONS.map(o => (
                            <option key={o.key} value={o.key}>{o.label}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input
                          defaultValue={item.label}
                          className="h-8 text-sm"
                          onBlur={e => {
                            if (e.target.value !== item.label) handleUpdateLabel(item.id, e.target.value);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch checked={item.is_active} onCheckedChange={() => handleToggle(item.id, item.is_active)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



