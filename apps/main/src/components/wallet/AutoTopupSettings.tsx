import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AutoTopupSettingsProps {
  tenantId: string;
  onSettingsUpdated?: () => void;
}

interface AutoTopupConfig {
  enabled: boolean;
  threshold: number;
  amount: number;
  phone: string;
}

export function AutoTopupSettings({ tenantId, onSettingsUpdated }: AutoTopupSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [config, setConfig] = useState<AutoTopupConfig>({
    enabled: false,
    threshold: 500,
    amount: 5000,
    phone: '',
  });

  useEffect(() => {
    fetchSettings();
  }, [tenantId]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tenant_wallets')
      .select('auto_topup_enabled, auto_topup_threshold_ngn, auto_topup_amount_ngn, auto_topup_phone')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!error && data) {
      setConfig({
        enabled: data.auto_topup_enabled || false,
        threshold: data.auto_topup_threshold_ngn || 500,
        amount: data.auto_topup_amount_ngn || 5000,
        phone: data.auto_topup_phone || '',
      });
    }
    setLoading(false);
  };

  const persistConfig = async (nextConfig: AutoTopupConfig) => {
    const { data, error } = await supabase.functions.invoke('wallet-topup', {
      body: {
        action: 'update_auto_topup',
        tenantId,
        autoTopupSettings: nextConfig,
      },
    });
    if (error) throw error;
    // Accept any non-error response — some backends omit `success` flag
    if (data && data.success === false) throw new Error(data?.error || 'Failed to update settings');
    return data || {};
  };

  const handleSaveFromDialog = async () => {
    if (!config.phone) {
      toast.error('Please enter a phone number for auto top-up');
      return;
    }
    if (config.amount <= 0) {
      toast.error('Please enter a valid top-up amount');
      return;
    }

    setSaving(true);
    try {
      const next = { ...config, enabled: true };
      const data = await persistConfig(next);
      setConfig(next);
      toast.success(data.message || 'Auto top-up enabled');
      setDialogOpen(false);
      onSettingsUpdated?.();
      await fetchSettings();
    } catch (error) {
      console.error('Auto top-up settings error:', error);
      toast.error('Failed to update auto top-up settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    setSaving(true);
    try {
      const next = { ...config, enabled: false };
      const data = await persistConfig(next);
      setConfig(next);
      toast.success(data.message || 'Auto top-up disabled');
      setDialogOpen(false);
      setConfirmDisableOpen(false);
      onSettingsUpdated?.();
      await fetchSettings();
    } catch (error) {
      console.error('Auto top-up settings error:', error);
      toast.error('Failed to disable auto top-up');
    } finally {
      setSaving(false);
    }
  };

  const quickAmounts = [2000, 5000, 10000, 20000];
  const quickThresholds = [500, 1000, 2000, 5000];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Auto Top-Up
          </CardTitle>
          <CardDescription>
            Automatically add funds when your balance drops below a threshold
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 flex-1 flex flex-col">
          {config.enabled ? (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <p className="text-sm font-semibold text-foreground">Auto Top-Up is active</p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">Trigger when balance drops below</span>
                  <span className="font-semibold text-foreground">₦{config.threshold.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">Top-up amount</span>
                  <span className="font-semibold text-foreground">₦{config.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">Payment method</span>
                  <span className="font-semibold text-foreground">MTN MoMo</span>
                </div>
                {config.phone && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-muted-foreground">MoMo number</span>
                    <span className="font-semibold text-foreground truncate">{config.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4 rounded-lg border border-dashed border-border bg-muted/20">
              <Zap className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Auto Top-Up is currently disabled. Enable it to keep your wallet funded automatically when the balance is low.
              </p>
            </div>
          )}

          <div className="mt-auto space-y-2">
            {config.enabled ? (
              <>
                <Button onClick={() => setDialogOpen(true)} variant="outline" className="w-full">
                  Edit Settings
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDisableOpen(true)}
                  disabled={saving}
                  className="w-full"
                >
                  Disable Auto Top-Up
                </Button>
              </>
            ) : (
              <Button onClick={() => setDialogOpen(true)} className="w-full">
                Enable Auto Top-Up
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDisableOpen} onOpenChange={setConfirmDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Auto Top-Up?</AlertDialogTitle>
            <AlertDialogDescription>
              Your wallet will no longer be topped up automatically when the balance falls below the threshold. You can re-enable it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisable} disabled={saving}>
              {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {config.enabled ? 'Edit Auto Top-Up' : 'Enable Auto Top-Up'}
            </DialogTitle>
            <DialogDescription>
              Automatically add funds when your balance drops below a threshold
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">How it works</p>
                <p className="text-muted-foreground">
                  When your wallet balance drops below ₦{config.threshold.toLocaleString()},
                  we'll automatically top up ₦{config.amount.toLocaleString()} using MTN MoMo.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Top-up when balance drops below</Label>
                <div className="flex gap-2 flex-wrap">
                  {quickThresholds.map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={config.threshold === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ ...config, threshold: t })}
                    >
                      ₦{t.toLocaleString()}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={config.threshold}
                  onChange={(e) => setConfig({ ...config, threshold: parseFloat(e.target.value) || 0 })}
                  placeholder="Custom threshold"
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <Label>Amount to add each time</Label>
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map((a) => (
                    <Button
                      key={a}
                      type="button"
                      variant={config.amount === a ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ ...config, amount: a })}
                    >
                      ₦{a.toLocaleString()}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={config.amount}
                  onChange={(e) => setConfig({ ...config, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="Custom amount"
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <Label>MTN MoMo Phone Number</Label>
                <Input
                  type="tel"
                  value={config.phone}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  placeholder="e.g., 0803 123 4567"
                />
                <p className="text-xs text-muted-foreground">
                  Payment will be automatically collected from this number
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveFromDialog} disabled={saving}>
              {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {config.enabled ? 'Save Changes' : 'Enable Auto Top-Up'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
