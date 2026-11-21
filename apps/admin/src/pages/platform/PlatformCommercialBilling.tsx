import { useBillingSummary } from "@truckmoov/api/billing";
import {
  CreditCard, FileText, Package, ReceiptText, Wallet,
} from "lucide-react";
import { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatNgn } from "@/components/platform/billing/billingUi";
import { InvoicesTab } from "@/components/platform/billing/InvoicesTab";
import { LicensePlansTab } from "@/components/platform/billing/LicensePlansTab";
import { PaymentsTab } from "@/components/platform/billing/PaymentsTab";
import { QuotationsTab } from "@/components/platform/billing/QuotationsTab";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { PageTitle } from "@/shared/components/layout/PageTitle";

const TABS = [
  {
    value: "items", label: "Chargeable Items", icon: Package,
  },
  {
    value: "quotations", label: "Quotation History", icon: FileText,
  },
  {
    value: "invoices", label: "Invoices", icon: ReceiptText,
  },
  {
    value: "payments", label: "Payments History", icon: CreditCard,
  },
];

// Tab labels, headings and descriptions are copied verbatim from the design app.
const TAB_HEADINGS: Record<string, {
  title: string; description: string;
}> = {
  items: {
    title: "Chargeable Items", description: "View and manage the products, services, and other items that contribute to customer charges.",
  },
  quotations: {
    title: "Quotation History", description: "View and track quotations generated for customers, including their amounts, statuses, and associated details.",
  },
  invoices: {
    title: "Invoices", description: "Manage customer invoices, monitor payment statuses, and track outstanding balances.",
  },
  payments: {
    title: "Payment History", description: "View and track customer payment transactions, including payment dates, amounts, methods, and statuses.",
  },
};

/** `/subscription` — `manualTitle` in sidebarNav: the heading follows the active tab, under the bar. */
export default function PlatformCommercialBilling() {
  const [
    tab,
    setTab,
  ] = useState("items");
  const {
    data, isLoading,
  } = useBillingSummary();
  const summary = data?.data;
  const outstanding = summary?.outstandingNgn ?? 0;

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="space-y-4"
      >
        <div className="overflow-x-auto">
          <TabsList className="h-10 flex w-max mx-auto rounded-xl">
            {TABS.map(t => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="px-3.5 rounded-lg gap-1.5"
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <PageTitle {...TAB_HEADINGS[tab]} />

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
