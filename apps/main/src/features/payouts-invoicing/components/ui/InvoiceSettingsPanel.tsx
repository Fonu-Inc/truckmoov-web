import type { InvoiceConfig } from "@/features/payouts-invoicing/hooks/useWaybillInvoice";
import { Save } from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { Textarea } from "@/components/shadcn/textarea";

export function InvoiceSettingsPanel({
  config, onSave,
}: {
  config: InvoiceConfig | null;
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [
    form,
    setForm,
  ] = useState({
    tax_enabled: config?.tax_enabled || false,
    tax_rate_percent: config?.tax_rate_percent || 7.5,
    tax_label: config?.tax_label || "VAT",
    invoice_prefix: config?.invoice_prefix || "INV",
    company_name: config?.company_name || "",
    company_address: config?.company_address || "",
    company_phone: config?.company_phone || "",
    company_email: config?.company_email || "",
    bank_name: config?.bank_name || "",
    bank_account_name: config?.bank_account_name || "",
    bank_account_number: config?.bank_account_number || "",
    payment_terms_days: config?.payment_terms_days || 30,
    notes_template: config?.notes_template || "",
  });

  useEffect(
    () => {
      if (config) {
        setForm({
          tax_enabled: config.tax_enabled,
          tax_rate_percent: config.tax_rate_percent,
          tax_label: config.tax_label,
          invoice_prefix: config.invoice_prefix,
          company_name: config.company_name || "",
          company_address: config.company_address || "",
          company_phone: config.company_phone || "",
          company_email: config.company_email || "",
          bank_name: config.bank_name || "",
          bank_account_name: config.bank_account_name || "",
          bank_account_number: config.bank_account_number || "",
          payment_terms_days: config.payment_terms_days,
          notes_template: config.notes_template || "",
        });
      }
    },
    [config],
  );

  return (
    <div className="space-y-6 w-full px-2 md:px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>These appear on generated invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Company Name</Label>
            <Input
              placeholder="e.g. Acme Logistics Ltd"
              value={form.company_name}
              onChange={e => setForm(f => ({
                ...f, company_name: e.target.value,
              }))}
            />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea
              placeholder="e.g. 12 Marina Road, Lagos Island, Lagos"
              value={form.company_address}
              onChange={e => setForm(f => ({
                ...f, company_address: e.target.value,
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input
                placeholder="e.g. +234 801 234 5678"
                value={form.company_phone}
                onChange={e => setForm(f => ({
                  ...f, company_phone: e.target.value,
                }))}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                placeholder="e.g. billing@company.com"
                value={form.company_email}
                onChange={e => setForm(f => ({
                  ...f, company_email: e.target.value,
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Tax</Label>
            <Switch
              checked={form.tax_enabled}
              onCheckedChange={v => setForm(f => ({
                ...f, tax_enabled: v,
              }))}
            />
          </div>
          {form.tax_enabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tax Label</Label>
                <Input
                  placeholder="e.g. VAT"
                  value={form.tax_label}
                  onChange={e => setForm(f => ({
                    ...f, tax_label: e.target.value,
                  }))}
                />
              </div>
              <div>
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 7.5"
                  value={form.tax_rate_percent}
                  onChange={e => setForm(f => ({
                    ...f, tax_rate_percent: Number(e.target.value),
                  }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Bank details shown on invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bank Name</Label>
            <Input
              placeholder="e.g. Access Bank"
              value={form.bank_name}
              onChange={e => setForm(f => ({
                ...f, bank_name: e.target.value,
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Account Name</Label>
              <Input
                placeholder="e.g. Acme Logistics Ltd"
                value={form.bank_account_name}
                onChange={e => setForm(f => ({
                  ...f, bank_account_name: e.target.value,
                }))}
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                placeholder="e.g. 0123456789"
                value={form.bank_account_number}
                onChange={e => setForm(f => ({
                  ...f, bank_account_number: e.target.value,
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invoice Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Invoice Prefix</Label>
              <Input
                placeholder="e.g. INV"
                value={form.invoice_prefix}
                onChange={e => setForm(f => ({
                  ...f, invoice_prefix: e.target.value,
                }))}
              />
            </div>
            <div>
              <Label>Payment Terms (days)</Label>
              <Input
                type="number"
                placeholder="e.g. 30"
                value={form.payment_terms_days}
                onChange={e => setForm(f => ({
                  ...f, payment_terms_days: Number(e.target.value),
                }))}
              />
            </div>
          </div>
          <div>
            <Label>Default Notes</Label>
            <Textarea
              value={form.notes_template}
              onChange={e => setForm(f => ({
                ...f, notes_template: e.target.value,
              }))}
              placeholder="e.g. Payment is due within 30 days..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          onClick={() => onSave(form)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 text-base shadow-mtn"
        >
          <Save className="h-5 w-5 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
