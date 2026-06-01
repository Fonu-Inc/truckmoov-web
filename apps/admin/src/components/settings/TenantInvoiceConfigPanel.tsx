import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { Button } from "@/components/shadcn/button";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface InvoiceConfig {
  payment_terms_days: number | null;
  ncc_levy_enabled: boolean | null;
  ncc_levy_percent: number | null;
  ncc_levy_label: string | null;
  tax_enabled: boolean | null;
  tax_rate_percent: number | null;
  tax_label: string | null;
}

export function TenantInvoiceConfigPanel() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId;
  const [cfg, setCfg] = useState<InvoiceConfig>({
    payment_terms_days: 15,
    ncc_levy_enabled: false,
    ncc_levy_percent: 2.5,
    ncc_levy_label: "NCC Levy",
    tax_enabled: true,
    tax_rate_percent: 7.5,
    tax_label: "VAT",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    supabase
      .from("tenant_invoice_config")
      .select("payment_terms_days, ncc_levy_enabled, ncc_levy_percent, ncc_levy_label, tax_enabled, tax_rate_percent, tax_label")
      .eq("tenant_id", tenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCfg((c) => ({ ...c, ...data }));
        setLoading(false);
      });
  }, [tenantId]);

  const save = async () => {
    if (!tenantId) return;
    setSaving(true);
    const { error } = await supabase
      .from("tenant_invoice_config")
      .upsert({ tenant_id: tenantId, ...cfg }, { onConflict: "tenant_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Invoice settings saved");
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle>Invoice Configuration</CardTitle>
        <CardDescription>Payment terms, regulatory levies, and tax settings applied to all generated invoices.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 max-w-xs">
          <Label>Payment Terms (days)</Label>
          <Input
            type="number"
            min={0}
            value={cfg.payment_terms_days ?? 15}
            onChange={(e) => setCfg({ ...cfg, payment_terms_days: Number(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">Default Net 15 — invoices fall due {cfg.payment_terms_days ?? 15} days after issue.</p>
        </div>

        <div className="space-y-3 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>VAT</Label>
              <p className="text-xs text-muted-foreground">Standard tax line on invoices</p>
            </div>
            <Switch
              checked={!!cfg.tax_enabled}
              onCheckedChange={(v) => setCfg({ ...cfg, tax_enabled: v })}
            />
          </div>
          {cfg.tax_enabled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={cfg.tax_label ?? "VAT"} onChange={(e) => setCfg({ ...cfg, tax_label: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rate %</Label>
                <Input type="number" step="0.1" value={cfg.tax_rate_percent ?? 7.5} onChange={(e) => setCfg({ ...cfg, tax_rate_percent: Number(e.target.value) })} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>NCC Regulatory Levy</Label>
              <p className="text-xs text-muted-foreground">Nigerian Communications Commission levy applied to telecom usage</p>
            </div>
            <Switch
              checked={!!cfg.ncc_levy_enabled}
              onCheckedChange={(v) => setCfg({ ...cfg, ncc_levy_enabled: v })}
            />
          </div>
          {cfg.ncc_levy_enabled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={cfg.ncc_levy_label ?? "NCC Levy"} onChange={(e) => setCfg({ ...cfg, ncc_levy_label: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rate %</Label>
                <Input type="number" step="0.1" value={cfg.ncc_levy_percent ?? 2.5} onChange={(e) => setCfg({ ...cfg, ncc_levy_percent: Number(e.target.value) })} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="gradient" onClick={save} disabled={saving || loading}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Invoice Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}



