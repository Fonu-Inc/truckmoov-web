import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Zap, AlertCircle } from "lucide-react";
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

  const handleSave = async () => {
    if (config.enabled && !config.phone) {
      toast.error('Please enter a phone number for auto top-up');
      return;
    }

    if (config.enabled && config.amount <= 0) {
      toast.error('Please enter a valid top-up amount');
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke('wallet-topup', {
        body: {
          action: 'update_auto_topup',
          tenantId,
          autoTopupSettings: config,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message);
        onSettingsUpdated?.();
      } else {
        toast.error(data?.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Auto top-up settings error:', error);
      toast.error('Failed to update auto top-up settings');
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Auto Top-Up
            </CardTitle>
            <CardDescription>
              Automatically add funds when your balance drops below a threshold
            </CardDescription>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {config.enabled && (
          <>
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
          </>
        )}

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
          {config.enabled ? 'Save Auto Top-Up Settings' : 'Disable Auto Top-Up'}
        </Button>
      </CardContent>
    </Card>
  );
}
