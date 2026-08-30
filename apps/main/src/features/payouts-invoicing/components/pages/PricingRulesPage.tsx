import {
  CheckCircle2, DollarSign, FileText, Plus, Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/shadcn/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  PricingRulesPanel,
} from "@/features/payouts-invoicing/components/ui/PricingRulesPanel";
import {
  TabKpiCards,
} from "@/features/payouts-invoicing/components/ui/TabKpiCards";
import {
  useWaybillInvoice,
} from "@/features/payouts-invoicing/hooks/useWaybillInvoice";
import {
  DEMO_PRICING_RULES,
} from "@/features/payouts-invoicing/utils/demoData";

export default function PricingRulesPage() {
  const {
    pricingRules,
    fetchPricingRules,
    addPricingRule,
    updatePricingRule,
    deletePricingRule,
  } = useWaybillInvoice();
  const { format: formatAmount } = useCurrency();

  const displayPricingRules = pricingRules.length > 0 ? pricingRules : DEMO_PRICING_RULES;

  const [
    showPricingDialog,
    setShowPricingDialog,
  ] = useState(false);

  useEffect(
    () => {
      fetchPricingRules();
    },
    [fetchPricingRules],
  );

  const activeRules = displayPricingRules.filter((r: any) => r.is_active !== false).length;
  const flatRules = displayPricingRules.filter((r: any) => r.pricing_type === "flat" || r.type === "flat").length;
  const perWeightRules = displayPricingRules.filter((r: any) => r.pricing_type === "per_weight" || r.type === "per_weight").length;

  return (
    <>
      <div className="flex items-center justify-end">
        <Button onClick={() => setShowPricingDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <TabKpiCards stats={[
        {
          label: "Total Pricing Rules", value: displayPricingRules.length, icon: DollarSign,
        },
        {
          label: "Active Rules", value: activeRules, icon: CheckCircle2,
        },
        {
          label: "Flat-Rate Rules", value: flatRules, icon: FileText,
        },
        {
          label: "Per-Weight Rules", value: perWeightRules, icon: Truck,
        },
      ]}
      />

      <div className="mt-4">
        <PricingRulesPanel
          rules={displayPricingRules}
          onAdd={addPricingRule}
          onUpdate={updatePricingRule}
          onDelete={deletePricingRule}
          formatAmount={formatAmount}
          showDialog={showPricingDialog}
          setShowDialog={setShowPricingDialog}
        />
      </div>
    </>
  );
}
