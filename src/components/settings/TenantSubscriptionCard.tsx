import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  CreditCard, 
  Truck, 
  Users, 
  Cpu, 
  Sparkles,
  AlertTriangle,
  Check,
  TrendingUp,
  TrendingDown,
  Lock,
  Loader2,
} from "lucide-react";
import { useTenantSubscription, TenantPlan } from "@/hooks/useTenantSubscription";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export function TenantSubscriptionCard() {
  const { 
    tenant,
    currentPlan, 
    planFeatures, 
    usageStats, 
    upgradeOptions,
    downgradeOptions,
    isLoading,
    isApproachingLimit,
    isAtLimit,
  } = useTenantSubscription();
  const { user } = useAuthStore();
  const { currency } = useCurrency();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Demo user IDs that are not valid UUIDs
  const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1", "inst1"];

  const handleContactSales = async (plan: TenantPlan, action: 'upgrade' | 'downgrade') => {
    if (!user?.tenantId || !user?.id) {
      toast.error("Unable to create request. Please try again.");
      return;
    }

    // Check if this is a demo user (mock ID is not a valid UUID)
    const isDemoUser = DEMO_USER_IDS.includes(user.id);

    setIsSubmitting(plan.id);
    try {
      // Create the support ticket
      const { data: ticketData, error } = await supabase
        .from('support_tickets')
        .insert([{
          tenant_id: user.tenantId,
          created_by: isDemoUser ? null : user.id,
          category: 'billing_subscription' as const,
          subject: `Plan ${action === 'upgrade' ? 'Upgrade' : 'Downgrade'} Request: ${currentPlan?.name} → ${plan.name}`,
          description: `Request to ${action} from ${currentPlan?.name} plan to ${plan.name} plan.\n\nCurrent Plan: ${currentPlan?.name} (₦${currentPlan?.price_ngn?.toLocaleString()}/${currentPlan?.billing_cycle})\nRequested Plan: ${plan.name} (₦${plan.price_ngn.toLocaleString()}/${plan.billing_cycle})\n\nCurrent Usage:\n- Vehicles: ${usageStats.vehicles.current}/${usageStats.vehicles.limit || '∞'}\n- Drivers: ${usageStats.drivers.current}/${usageStats.drivers.limit || '∞'}\n- Devices: ${usageStats.devices.current}/${usageStats.devices.limit || '∞'}`,
          status: 'open' as const,
          priority: 'medium' as const,
          context_type: 'billing' as const,
          context_snapshot: JSON.parse(JSON.stringify({
            current_plan_name: currentPlan?.name,
            current_plan_price: currentPlan?.price_ngn,
            requested_plan_name: plan.name,
            requested_plan_price: plan.price_ngn,
            action,
            usage: {
              vehicles: `${usageStats.vehicles.current}/${usageStats.vehicles.limit || '∞'}`,
              drivers: `${usageStats.drivers.current}/${usageStats.drivers.limit || '∞'}`,
              devices: `${usageStats.devices.current}/${usageStats.devices.limit || '∞'}`,
            },
          })),
        }])
        .select('id')
        .single();

      if (error) throw error;

      // Send notification to Platform Admins (fire and forget)
      supabase.functions.invoke('billing-ticket-notification', {
        body: {
          ticketId: ticketData.id,
          tenantId: user.tenantId,
          tenantName: tenant?.name || 'Unknown Tenant',
          requestedBy: user.name || user.email || 'Unknown User',
          requestedByEmail: user.email,
          action,
          currentPlan: currentPlan?.name || 'Unknown',
          currentPlanPrice: currentPlan?.price_ngn || 0,
          requestedPlan: plan.name,
          requestedPlanPrice: plan.price_ngn,
          currentUsage: {
            vehicles: `${usageStats.vehicles.current}/${usageStats.vehicles.limit || '∞'}`,
            drivers: `${usageStats.drivers.current}/${usageStats.drivers.limit || '∞'}`,
            devices: `${usageStats.devices.current}/${usageStats.devices.limit || '∞'}`,
          },
        },
      }).catch(err => {
        console.warn('Failed to send billing notification:', err);
      });

      toast.success("Plan change request submitted!", {
        description: "Our sales team will contact you within 24 hours.",
      });
      
      if (action === 'upgrade') {
        setUpgradeDialogOpen(false);
      } else {
        setDowngradeDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentPlan) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>No subscription plan found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Contact your platform administrator to configure your subscription.
          </p>
        </CardContent>
      </Card>
    );
  }

  const includedFeatures = planFeatures?.filter(f => f.is_included) || [];
  const lockedFeatures = planFeatures?.filter(f => !f.is_included) || [];
  const hasWarnings = isApproachingLimit('vehicles') || isApproachingLimit('drivers') || isApproachingLimit('devices');

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>Your current plan and resource usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Overview */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-linear-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center gap-4">
            <div 
              className="h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ 
                backgroundColor: currentPlan.tier_badge_color || 'hsl(var(--primary))',
                color: 'white'
              }}
            >
              {currentPlan.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-lg">{currentPlan.name} Plan</h4>
                <Badge className="bg-success/20 text-success border-success/30">Active</Badge>
                {currentPlan.is_popular && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" /> Popular
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPlan.max_vehicles ? `Up to ${currentPlan.max_vehicles} vehicles` : 'Unlimited vehicles'}
                {currentPlan.max_drivers ? `, ${currentPlan.max_drivers} drivers` : ', unlimited drivers'}
              </p>
              {currentPlan.trial_days > 0 && (
                <p className="text-xs text-primary mt-1">{currentPlan.trial_days}-day trial included</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {currency === 'NGN' 
                ? `₦${currentPlan.price_ngn.toLocaleString()}`
                : `$${Math.round(currentPlan.price_ngn / 1550).toLocaleString()}`
              }
              <span className="text-sm font-normal text-muted-foreground">/{currentPlan.billing_cycle}</span>
            </p>
            {currentPlan.yearly_discount_percent > 0 && (
              <p className="text-xs text-primary">{currentPlan.yearly_discount_percent}% off yearly</p>
            )}
            <div className="flex gap-2 mt-2">
              {upgradeOptions.length > 0 && (
                <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Upgrade
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upgrade Your Plan</DialogTitle>
                      <DialogDescription>
                        Choose a plan with more resources and features
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {upgradeOptions.map(plan => (
                        <Card 
                          key={plan.id} 
                          className={cn(
                            "cursor-pointer transition-all hover:border-primary/50",
                            plan.is_popular && "border-primary"
                          )}
                        >
                          {plan.is_popular && (
                            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                              Recommended
                            </Badge>
                          )}
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                              {plan.name}
                              {plan.tier && (
                                <Badge style={{ backgroundColor: plan.tier_badge_color }}>
                                  {plan.tier}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              <span className="text-xl font-bold text-foreground">
                                {currency === 'NGN' 
                                  ? `₦${plan.price_ngn.toLocaleString()}`
                                  : `$${Math.round(plan.price_ngn / 1550).toLocaleString()}`
                                }
                              </span>
                              <span className="text-muted-foreground">/{plan.billing_cycle}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-sm space-y-1">
                              <p>• {plan.max_vehicles || 'Unlimited'} vehicles</p>
                              <p>• {plan.max_drivers || 'Unlimited'} drivers</p>
                              <p>• {plan.max_devices || 'Unlimited'} devices</p>
                            </div>
                            <Button 
                              className="w-full mt-4"
                              onClick={() => handleContactSales(plan, 'upgrade')}
                              disabled={isSubmitting === plan.id}
                            >
                              {isSubmitting === plan.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                'Contact Sales'
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {downgradeOptions.length > 0 && (
                <Dialog open={downgradeDialogOpen} onOpenChange={setDowngradeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                      <TrendingDown className="h-3 w-3" />
                      Downgrade
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Downgrade Your Plan</DialogTitle>
                      <DialogDescription>
                        Switch to a lower-tier plan. Note: Resource limits will be reduced.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {downgradeOptions.map(plan => (
                        <Card 
                          key={plan.id} 
                          className="cursor-pointer transition-all hover:border-muted-foreground/50"
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                              {plan.name}
                              {plan.tier && (
                                <Badge variant="outline" style={{ borderColor: plan.tier_badge_color, color: plan.tier_badge_color }}>
                                  {plan.tier}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              <span className="text-xl font-bold text-foreground">
                                {currency === 'NGN' 
                                  ? `₦${plan.price_ngn.toLocaleString()}`
                                  : `$${Math.round(plan.price_ngn / 1550).toLocaleString()}`
                                }
                              </span>
                              <span className="text-muted-foreground">/{plan.billing_cycle}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-sm space-y-1 text-muted-foreground">
                              <p>• {plan.max_vehicles || 'Unlimited'} vehicles</p>
                              <p>• {plan.max_drivers || 'Unlimited'} drivers</p>
                              <p>• {plan.max_devices || 'Unlimited'} devices</p>
                            </div>
                            {/* Warning if current usage exceeds plan limits */}
                            {((plan.max_vehicles && usageStats.vehicles.current > plan.max_vehicles) ||
                              (plan.max_drivers && usageStats.drivers.current > plan.max_drivers) ||
                              (plan.max_devices && usageStats.devices.current > plan.max_devices)) && (
                              <div className="flex items-center gap-2 p-2 rounded bg-warning/10 border border-warning/20 text-warning text-xs">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span>Current usage exceeds this plan's limits</span>
                              </div>
                            )}
                            <Button 
                              variant="outline" 
                              className="w-full mt-4"
                              onClick={() => handleContactSales(plan, 'downgrade')}
                              disabled={isSubmitting === plan.id}
                            >
                              {isSubmitting === plan.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                'Contact Sales'
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="space-y-4">
          <h5 className="font-medium flex items-center gap-2">
            Resource Usage
            {hasWarnings && (
              <Badge variant="outline" className="text-warning border-warning gap-1">
                <AlertTriangle className="h-3 w-3" />
                Approaching limits
              </Badge>
            )}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vehicles */}
            <div className="p-4 rounded-lg border bg-card/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Vehicles</span>
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  isAtLimit('vehicles') && "text-destructive",
                  isApproachingLimit('vehicles') && !isAtLimit('vehicles') && "text-warning"
                )}>
                  {usageStats.vehicles.current}/{usageStats.vehicles.limit || '∞'}
                </span>
              </div>
              {usageStats.vehicles.limit && (
                <Progress 
                  value={usageStats.vehicles.percentage} 
                  className={cn(
                    "h-2",
                    isAtLimit('vehicles') && "[&>div]:bg-destructive",
                    isApproachingLimit('vehicles') && !isAtLimit('vehicles') && "[&>div]:bg-warning"
                  )}
                />
              )}
              {isAtLimit('vehicles') && (
                <p className="text-xs text-destructive mt-1">Limit reached</p>
              )}
            </div>

            {/* Drivers */}
            <div className="p-4 rounded-lg border bg-card/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Drivers</span>
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  isAtLimit('drivers') && "text-destructive",
                  isApproachingLimit('drivers') && !isAtLimit('drivers') && "text-warning"
                )}>
                  {usageStats.drivers.current}/{usageStats.drivers.limit || '∞'}
                </span>
              </div>
              {usageStats.drivers.limit && (
                <Progress 
                  value={usageStats.drivers.percentage} 
                  className={cn(
                    "h-2",
                    isAtLimit('drivers') && "[&>div]:bg-destructive",
                    isApproachingLimit('drivers') && !isAtLimit('drivers') && "[&>div]:bg-warning"
                  )}
                />
              )}
              {isAtLimit('drivers') && (
                <p className="text-xs text-destructive mt-1">Limit reached</p>
              )}
            </div>

            {/* Devices */}
            <div className="p-4 rounded-lg border bg-card/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Devices</span>
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  isAtLimit('devices') && "text-destructive",
                  isApproachingLimit('devices') && !isAtLimit('devices') && "text-warning"
                )}>
                  {usageStats.devices.current}/{usageStats.devices.limit || '∞'}
                </span>
              </div>
              {usageStats.devices.limit && (
                <Progress 
                  value={usageStats.devices.percentage} 
                  className={cn(
                    "h-2",
                    isAtLimit('devices') && "[&>div]:bg-destructive",
                    isApproachingLimit('devices') && !isAtLimit('devices') && "[&>div]:bg-warning"
                  )}
                />
              )}
              {isAtLimit('devices') && (
                <p className="text-xs text-destructive mt-1">Limit reached</p>
              )}
            </div>
          </div>
        </div>

        {/* Feature Access */}
        {(includedFeatures.length > 0 || lockedFeatures.length > 0) && (
          <div className="space-y-3">
            <h5 className="font-medium">Plan Features</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {includedFeatures.slice(0, 6).map(feature => (
                <div 
                  key={feature.feature_key}
                  className="flex items-center gap-2 text-sm p-2 rounded-lg bg-success/5 border border-success/20"
                >
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>{feature.feature_name}</span>
                  {feature.usage_limit && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {feature.usage_limit}/mo
                    </Badge>
                  )}
                </div>
              ))}
              {lockedFeatures.slice(0, 4).map(feature => (
                <div 
                  key={feature.feature_key}
                  className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30 border border-muted text-muted-foreground"
                >
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>{feature.feature_name}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    Upgrade
                  </Badge>
                </div>
              ))}
            </div>
            {(includedFeatures.length > 6 || lockedFeatures.length > 4) && (
              <p className="text-xs text-muted-foreground">
                +{Math.max(0, includedFeatures.length - 6) + Math.max(0, lockedFeatures.length - 4)} more features
              </p>
            )}
          </div>
        )}

        {/* Upgrade Prompt */}
        {(hasWarnings || lockedFeatures.length > 0) && upgradeOptions.length > 0 && (
          <div className="p-4 rounded-lg bg-linear-to-r from-warning/10 to-primary/10 border border-warning/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">
                  {hasWarnings 
                    ? "You're approaching your plan limits"
                    : "Unlock more features"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasWarnings 
                    ? "Consider upgrading to avoid service interruptions when adding new resources."
                    : `Upgrade to access ${lockedFeatures.length} more features including ${lockedFeatures[0]?.feature_name}.`}
                </p>
              </div>
              <Button size="sm" onClick={() => setUpgradeDialogOpen(true)}>
                View Plans
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
