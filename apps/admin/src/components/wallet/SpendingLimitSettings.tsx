import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Gauge, AlertTriangle, RotateCcw, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuthStore } from '@/stores/authStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SpendingLimitSettingsProps {
  tenantId: string;
  onUpdate?: () => void;
}

export function SpendingLimitSettings({ tenantId, onUpdate }: SpendingLimitSettingsProps) {
  const { format } = useCurrency();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isPlatformAdmin = user?.role === 'platform_admin';

  const { data: settings, isLoading } = useQuery({
    queryKey: ['spending-limit-settings', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_wallets')
        .select('spending_limit_enabled, monthly_spending_limit_ngn, current_month_spending_ngn, spending_limit_reset_day, spending_alert_email')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState('50000');
  const [resetDay, setResetDay] = useState('1');
  const [alertEmail, setAlertEmail] = useState('');

  useEffect(() => {
    if (settings) {
      setMonthlyLimit(settings.monthly_spending_limit_ngn?.toString() ?? '50000');
      setResetDay(settings.spending_limit_reset_day?.toString() ?? '1');
      setAlertEmail(settings.spending_alert_email ?? '');
    }
  }, [settings]);

  const persistMutation = useMutation({
    mutationFn: async (nextEnabled: boolean) => {
      const { error } = await supabase
        .from('tenant_wallets')
        .upsert({
          tenant_id: tenantId,
          spending_limit_enabled: nextEnabled,
          monthly_spending_limit_ngn: nextEnabled ? parseFloat(monthlyLimit) : null,
          spending_limit_reset_day: parseInt(resetDay),
          spending_alert_email: nextEnabled && alertEmail ? alertEmail : null
        }, { onConflict: 'tenant_id' });

      if (error) throw error;
      return nextEnabled;
    },
    onSuccess: (nextEnabled) => {
      queryClient.invalidateQueries({ queryKey: ['spending-limit-settings', tenantId] });
      toast.success(nextEnabled ? 'Spending limit enabled' : 'Spending limit disabled');
      setDialogOpen(false);
      setConfirmDisableOpen(false);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error('Failed to update settings: ' + (error as Error).message);
    }
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tenant_wallets')
        .update({ current_month_spending_ngn: 0 })
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending-limit-settings', tenantId] });
      toast.success('Monthly spending counter reset to zero');
      onUpdate?.();
    },
    onError: (error) => {
      toast.error('Failed to reset spending: ' + (error as Error).message);
    }
  });

  const handleSave = () => {
    if (!monthlyLimit || parseFloat(monthlyLimit) <= 0) {
      toast.error('Please enter a valid monthly limit');
      return;
    }
    persistMutation.mutate(true);
  };

  const handleDisable = () => {
    persistMutation.mutate(false);
  };

  const enabled = settings?.spending_limit_enabled ?? false;
  const currentSpending = settings?.current_month_spending_ngn ?? 0;
  const limit = settings?.monthly_spending_limit_ngn ?? 0;
  const spendingPercentage = limit > 0 ? Math.min((currentSpending / limit) * 100, 100) : 0;
  const isNearLimit = spendingPercentage >= 80;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Spending Limits
              </CardTitle>
              <CardDescription>
                Control your monthly communication spending
              </CardDescription>
            </div>
            {isPlatformAdmin && currentSpending > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Counter
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Monthly Spending Counter?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset the current month spending counter from {format(currentSpending)} to ₦0.
                      This action cannot be undone. Use this for billing adjustments or corrections.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => resetMutation.mutate()}
                      disabled={resetMutation.isPending}
                    >
                      {resetMutation.isPending ? 'Resetting...' : 'Reset Counter'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 flex-1 flex flex-col">
          {enabled && limit > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Month Usage</span>
                <span className={isNearLimit ? 'text-destructive font-medium' : ''}>
                  {format(currentSpending)} / {format(limit)}
                </span>
              </div>
              <Progress
                value={spendingPercentage}
                className={isNearLimit ? '[&>div]:bg-destructive' : ''}
              />
              {isNearLimit && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>You're approaching your spending limit</span>
                </div>
              )}
            </div>
          )}

          {enabled && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <p className="font-medium text-foreground">Spending limit is active</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Monthly Limit</p>
                  <p className="font-medium text-foreground">{format(limit)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reset Day</p>
                  <p className="font-medium text-foreground">Day {settings?.spending_limit_reset_day ?? 1}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Spending Cap</p>
                  <p className="font-medium text-foreground">{format(limit)} / month</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trigger</p>
                  <p className="font-medium text-foreground">Block at 100%</p>
                </div>
                {settings?.spending_alert_email && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Alert Email</p>
                    <p className="font-medium text-foreground truncate">{settings.spending_alert_email}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!enabled && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4 rounded-lg border border-dashed border-border bg-muted/20">
              <Gauge className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Spending Limits are currently disabled. Enable them to cap your monthly communication costs and get alerts before you hit the cap.
              </p>
            </div>
          )}

          {isPlatformAdmin && !enabled && currentSpending > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Month Spending</span>
                <span className="font-medium">{format(currentSpending)}</span>
              </div>
            </div>
          )}

          <div className="mt-auto space-y-2">
            {enabled ? (
              <>
                <Button onClick={() => setDialogOpen(true)} variant="outline" className="w-full">
                  Edit Settings
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDisableOpen(true)}
                  disabled={persistMutation.isPending}
                  className="w-full"
                >
                  Disable Spending Limit
                </Button>
              </>
            ) : (
              <Button onClick={() => setDialogOpen(true)} className="w-full">
                Enable Spending Limit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDisableOpen} onOpenChange={setConfirmDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Spending Limit?</AlertDialogTitle>
            <AlertDialogDescription>
              Communications will no longer be capped or blocked when monthly spending reaches the limit. You can re-enable this at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={persistMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={persistMutation.isPending}
            >
              {persistMutation.isPending ? 'Disabling...' : 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              {enabled ? 'Edit Spending Limit' : 'Enable Spending Limit'}
            </DialogTitle>
            <DialogDescription>
              Cap your monthly communication costs and get notified before you hit the limit
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">How it works</p>
                <p className="text-muted-foreground">
                  Communications will be blocked once your monthly spending reaches the limit you set.
                  You'll be notified at 80% and 100% usage.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyLimit">Monthly Limit (₦)</Label>
              <Input
                id="monthlyLimit"
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="50000"
                min="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resetDay">Reset Day of Month</Label>
              <Select value={resetDay} onValueChange={setResetDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      Day {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Usage counter resets on this day each month
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alertEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Alert Email
              </Label>
              <Input
                id="alertEmail"
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="alerts@company.com"
              />
              <p className="text-xs text-muted-foreground">
                Receive email notifications at 80% and 100% of your limit
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={persistMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={persistMutation.isPending}>
              {persistMutation.isPending ? 'Saving...' : enabled ? 'Save Changes' : 'Enable Spending Limit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



