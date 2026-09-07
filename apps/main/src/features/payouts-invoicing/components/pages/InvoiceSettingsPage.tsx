import {
  DollarSign, Download, Send, Settings2,
} from "lucide-react";
import { useEffect } from "react";
import { InvoiceSettingsPanel } from "@/features/payouts-invoicing/components/ui/InvoiceSettingsPanel";
import { TabKpiCards } from "@/features/payouts-invoicing/components/ui/TabKpiCards";
import { useWaybillInvoice } from "@/features/payouts-invoicing/hooks/useWaybillInvoice";
import {
  DEMO_INVOICES, DEMO_PRICING_RULES,
} from "@/features/payouts-invoicing/utils/demoData";

export default function InvoiceSettingsPage() {
  const {
    invoices, pricingRules, invoiceConfig,
    fetchInvoiceConfig, fetchInvoices, fetchPricingRules,
    updateInvoiceConfig,
  } = useWaybillInvoice();

  useEffect(
    () => {
      fetchInvoiceConfig();
      fetchInvoices();
      fetchPricingRules();
    },
    [
      fetchInvoiceConfig,
      fetchInvoices,
      fetchPricingRules,
    ],
  );

  const displayInvoices = invoices.length > 0 ? invoices : DEMO_INVOICES;
  const displayPricingRules = pricingRules.length > 0 ? pricingRules : DEMO_PRICING_RULES;

  const taxEnabled = (invoiceConfig as any)?.tax_enabled ? "On" : "Off";
  const autoSend = (invoiceConfig as any)?.auto_send_enabled ? "On" : "Off";

  return (
    <>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Invoice Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure your company details, tax, banking and invoice defaults shown on every generated invoice.
        </p>
      </div>

      <TabKpiCards stats={[
        {
          label: "Default Tax", value: taxEnabled, icon: Settings2,
        },
        {
          label: "Auto-Send Invoices", value: autoSend, icon: Send,
        },
        {
          label: "Pricing Rules", value: displayPricingRules.length, icon: DollarSign,
        },
        {
          label: "Total Invoices", value: displayInvoices.length, icon: Download,
        },
      ]}
      />

      <div className="mt-4">
        <InvoiceSettingsPanel
          config={invoiceConfig}
          onSave={updateInvoiceConfig}
        />
      </div>
    </>
  );
}
