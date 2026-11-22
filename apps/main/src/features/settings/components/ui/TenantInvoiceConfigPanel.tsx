import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";

/**
 * The Invoicing tab (`/settings/invoicing`). No endpoint stores the tenant's
 * invoice configuration (payment terms, VAT, NCC levy) yet, so every control
 * shows "-" and is locked, and saving says so instead of pretending.
 */
export function TenantInvoiceConfigPanel() {
  const save = () => {
    toast.info("Invoice settings are not available yet.");
  };

  return (
    <div className="rounded-2xl surface-sleek text-card-foreground bg-card/50 border-border/50">
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display">Invoice Configuration</h3>
        <p className="text-sm text-muted-foreground">Payment terms, regulatory levies, and tax settings applied to all generated invoices.</p>
      </div>
      <div className="p-6 pt-0 space-y-6">
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="invoicePaymentTerms">Payment Terms (days)</Label>
          <Input
            id="invoicePaymentTerms"
            value="-"
            readOnly
            disabled
          />
          <p className="text-xs text-muted-foreground">Default Net 15 — invoices fall due - days after issue.</p>
        </div>

        <div className="space-y-3 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>VAT</Label>
              <p className="text-xs text-muted-foreground">Standard tax line on invoices</p>
            </div>
            <Switch
              aria-label="VAT"
              checked={false}
              disabled
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="invoiceTaxLabel">Label</Label>
              <Input
                id="invoiceTaxLabel"
                value="-"
                readOnly
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceTaxRate">Rate %</Label>
              <Input
                id="invoiceTaxRate"
                value="-"
                readOnly
                disabled
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>NCC Regulatory Levy</Label>
              <p className="text-xs text-muted-foreground">Nigerian Communications Commission levy applied to telecom usage</p>
            </div>
            <Switch
              aria-label="NCC Regulatory Levy"
              checked={false}
              disabled
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="gradient"
            onClick={save}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Invoice Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
