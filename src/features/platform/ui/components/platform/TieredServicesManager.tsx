import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    updatePlanFeature,
    togglePlanActive,
    getPlanFeatures,
    getFeatureCategories,
    getUniqueFeatures,
    refetch,
  } = useSubscriptionPlans();

  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    price_ngn: 0,
    max_vehicles: 0,
    max_drivers: 0,
    max_devices: 0,
    trial_days: 0,
    yearly_discount_percent: 0,
    applicable_org_types: ['FLEET_PROVIDER', 'ENTERPRISE', 'AGGREGATOR', 'OWNER_OPERATOR'] as string[],
  });

  const categories = getFeatureCategories();
  const features = getUniqueFeatures();

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setEditForm({
      price_ngn: plan.price_ngn,
      max_vehicles: plan.max_vehicles || 0,
      max_drivers: plan.max_drivers || 0,
      max_devices: plan.max_devices || 0,
      trial_days: plan.trial_days || 0,
      yearly_discount_percent: plan.yearly_discount_percent || 0,
      applicable_org_types: plan.applicable_org_types || ['FLEET_PROVIDER', 'ENTERPRISE', 'AGGREGATOR', 'OWNER_OPERATOR'],
    });
    setEditDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    
    await updatePlan.mutateAsync({
      id: editingPlan.id,
      updates: {
        price_ngn: editForm.price_ngn,
        max_vehicles: editForm.max_vehicles || null,
        max_drivers: editForm.max_drivers || null,
        max_devices: editForm.max_devices || null,
        trial_days: editForm.trial_days,
        yearly_discount_percent: editForm.yearly_discount_percent,
        applicable_org_types: editForm.applicable_org_types,
      },
    });
    setEditDialogOpen(false);
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
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {plans?.map((plan) => {
                  const planFeatures = getPlanFeatures(plan.id);
                  const includedCount = planFeatures.filter(f => f.is_included).length;
                  
                  return (
                    <Card 
                      key={plan.id} 
                      className={`relative ${plan.is_popular ? 'ring-2 ring-primary' : ''}`}
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
                        <CardDescription className="text-xs">
                          {plan.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-2xl font-bold">
                          {formatCurrency(plan.price_ngn, 'NGN')}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{plan.billing_cycle}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
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
                        </div>

                        <Separator />

                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Available for</span>
                          <div className="flex flex-wrap gap-1">
                            {(plan.applicable_org_types || []).map(ot => (
                              <Badge key={ot} variant="outline" className="text-[10px] px-1.5 py-0">
                                {ot === 'FLEET_PROVIDER' ? 'Fleet' : ot === 'ENTERPRISE' ? 'Enterprise' : ot === 'AGGREGATOR' ? 'Aggregator' : 'Owner-Op'}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Features included</span>
                          <Badge variant="secondary">{includedCount} / {planFeatures.length}</Badge>
                        </div>

                        {plan.trial_days > 0 && (
                          <div className="text-xs text-muted-foreground">
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
                        <div className="text-lg font-semibold">
                          {formatCurrency(plan.price_ngn, 'NGN')}/{plan.billing_cycle}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editingPlan?.name} Plan</DialogTitle>
            <DialogDescription>
              Update pricing and resource limits for this tier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Monthly Price (NGN)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  className="pl-9"
                  value={editForm.price_ngn}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price_ngn: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Max Vehicles</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={editForm.max_vehicles || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, max_vehicles: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Drivers</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={editForm.max_drivers || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, max_drivers: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Devices</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={editForm.max_devices || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, max_devices: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Trial Days</Label>
                <Input
                  type="number"
                  value={editForm.trial_days}
                  onChange={(e) => setEditForm(prev => ({ ...prev, trial_days: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Yearly Discount %</Label>
                <Input
                  type="number"
                  value={editForm.yearly_discount_percent}
                  onChange={(e) => setEditForm(prev => ({ ...prev, yearly_discount_percent: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Available for Organization Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'FLEET_PROVIDER', label: 'Fleet Provider' },
                  { key: 'ENTERPRISE', label: 'Enterprise' },
                  { key: 'AGGREGATOR', label: 'Aggregator' },
                  { key: 'OWNER_OPERATOR', label: 'Owner-Operator' },
                ].map(ot => (
                  <label key={ot.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Switch
                      checked={editForm.applicable_org_types.includes(ot.key)}
                      onCheckedChange={(checked) => {
                        setEditForm(prev => ({
                          ...prev,
                          applicable_org_types: checked
                            ? [...prev.applicable_org_types, ot.key]
                            : prev.applicable_org_types.filter(t => t !== ot.key),
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
            <Button onClick={handleSavePlan} disabled={updatePlan.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
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
