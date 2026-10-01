import { useBillingSummary } from "@truckmoov/api/billing";
import { CreditCard, FileText, Package, ReceiptText, Wallet } from "lucide-react";
import { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { InvoicesTab } from "@/components/platform/billing/InvoicesTab";
import { formatNgn } from "@/components/platform/billing/billingUi";
import { LicensePlansTab } from "@/components/platform/billing/LicensePlansTab";
import { PaymentsTab } from "@/components/platform/billing/PaymentsTab";
import { QuotationsTab } from "@/components/platform/billing/QuotationsTab";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";

const TABS = [
  { value: "items", label: "License Plans", icon: Package },
  { value: "quotations", label: "Quotation History", icon: FileText },
  { value: "invoices", label: "Invoices", icon: ReceiptText },
  { value: "payments", label: "Payments History", icon: CreditCard },
];

export default function PlatformCommercialBilling() {
  const [tab, setTab] = useState("items");
  const { data, isLoading } = useBillingSummary();
  const summary = data?.data;
  const outstanding = summary?.outstandingNgn ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure what you charge for, price it, and review the quotations and payments the
          system has recorded.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active License Plans"
          value={summary?.activePlans ?? 0}
          icon={Package}
          loading={isLoading}
        />
        <StatCard
          title="Quotations Issued"
          value={summary?.quotationsCount ?? 0}
          icon={FileText}
          loading={isLoading}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatNgn(outstanding)}
          icon={Wallet}
          variant={outstanding > 0 ? "warning" : "default"}
          loading={isLoading}
        />
        <StatCard
          title="Payments Collected"
          value={formatNgn(summary?.collectedNgn ?? 0)}
          icon={CreditCard}
          variant="success"
          loading={isLoading}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto rounded-xl">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="rounded-lg gap-1.5">
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="items">
          <LicensePlansTab />
        </TabsContent>
        <TabsContent value="quotations">
          <QuotationsTab />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
