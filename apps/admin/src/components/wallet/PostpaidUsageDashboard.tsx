import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePostpaidBilling } from "@/hooks/usePostpaidBilling";
import { formatCurrency } from "@/lib/currency";
import {Download, Shield, TrendingUp, Clock, Zap, MessageSquare, Phone,
  MessageCircle, Bot, Cpu } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useMemo, useState } from "react";
import { TableToolbar, type FilterField, type FilterValues } from "@/components/ui/table-toolbar";
import { ExportButton } from "@/components/ui/export-button";
import { PaymentGateModal } from "@/components/onboarding/PaymentGateModal";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PostpaidUsageDashboardProps {
  tenantId: string;
}

const eventTypeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  sms: { label: "SMS", icon: MessageSquare },
  voice_minute: { label: "Voice Calls", icon: Phone },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  ai_request: { label: "AI Optimization", icon: Bot },
  iot_sim_active: { label: "IoT SIM", icon: Cpu } };

export function PostpaidUsageDashboard({ tenantId }: PostpaidUsageDashboardProps) {
  const {
    usageSummary,
    totalCurrentUsage,
    currentPeriod,
    creditLimit,
    postpaidInvoices,
    isLoading } = usePostpaidBilling(tenantId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading usage data...
        </CardContent>
      </Card>
    );
  }

  // ── Demo fallbacks ──
  const demoUsageSummary: Record<string, { count: number; total: number }> = {
    sms: { count: 1284, total: 5_136 },
    voice_minute: { count: 642, total: 14_124 },
    whatsapp: { count: 980, total: 7_840 },
    ai_request: { count: 312, total: 4_680 },
    iot_sim_active: { count: 48, total: 24_000 } };
  const displayUsageSummary = Object.keys(usageSummary).length > 0 ? usageSummary : demoUsageSummary;
  const displayTotalCurrentUsage = totalCurrentUsage > 0
    ? totalCurrentUsage
    : Object.values(demoUsageSummary).reduce((s, v) => s + v.total, 0);

  const demoInvoices = [
    { id: "demo-inv-1", invoice_number: "INV-2025-0042", billing_period: "Mar 2026", total_usage_ngn: 142_500, wallet_deducted_ngn: 100_000, invoice_balance_ngn: 42_500, due_date: "2026-04-15", status: "paid" },
    { id: "demo-inv-2", invoice_number: "INV-2025-0041", billing_period: "Feb 2026", total_usage_ngn: 128_300, wallet_deducted_ngn: 128_300, invoice_balance_ngn: 0, due_date: "2026-03-15", status: "paid" },
    { id: "demo-inv-3", invoice_number: "INV-2025-0040", billing_period: "Jan 2026", total_usage_ngn: 156_800, wallet_deducted_ngn: 90_000, invoice_balance_ngn: 66_800, due_date: "2026-02-15", status: "overdue" },
    { id: "demo-inv-4", invoice_number: "INV-2025-0039", billing_period: "Dec 2025", total_usage_ngn: 174_200, wallet_deducted_ngn: 150_000, invoice_balance_ngn: 24_200, due_date: "2026-01-15", status: "pending" },
  ];
  const displayInvoices = postpaidInvoices.length > 0 ? postpaidInvoices : (demoInvoices as typeof postpaidInvoices);

  const creditUtilization = creditLimit && Number(creditLimit.credit_limit_ngn) > 0
    ? (Number(creditLimit.current_usage_ngn) / Number(creditLimit.credit_limit_ngn)) * 100
    : 42;

  return (
    <div className="space-y-6">
      {/* Current Period Usage */}
      <CurrentUsageCard
        currentPeriod={currentPeriod}
        displayUsageSummary={displayUsageSummary}
        displayTotalCurrentUsage={displayTotalCurrentUsage}
        creditLimit={creditLimit}
        creditUtilization={creditUtilization}
      />

      <Separator />

      {/* Past Invoices */}
      <PostpaidInvoicesTable invoices={displayInvoices as any} />
    </div>
  );
}

interface CurrentUsageCardProps {
  currentPeriod: string;
  displayUsageSummary: Record<string, { count: number; total: number }>;
  displayTotalCurrentUsage: number;
  creditLimit: any;
  creditUtilization: number;
}

function CurrentUsageCard({
  currentPeriod,
  displayUsageSummary,
  displayTotalCurrentUsage,
  creditLimit,
  creditUtilization }: CurrentUsageCardProps) {
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  const availableServices = Object.keys(displayUsageSummary);
  const filteredEntries = serviceFilter === "all"
    ? Object.entries(displayUsageSummary)
    : Object.entries(displayUsageSummary).filter(([type]) => type === serviceFilter);

  const filteredTotal = serviceFilter === "all"
    ? displayTotalCurrentUsage
    : filteredEntries.reduce((s, [, v]) => s + v.total, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Usage — {currentPeriod}
            </CardTitle>
            <CardDescription>
              Real-time usage tracking for the current billing period
            </CardDescription>
          </div>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {availableServices.map((type) => {
                const cfg = eventTypeConfig[type] || { label: type };
                return (
                  <SelectItem key={type} value={type}>
                    {cfg.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground">
              {serviceFilter === "all" ? "Current Period Spend" : `${eventTypeConfig[serviceFilter]?.label ?? serviceFilter} Spend`}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(filteredTotal, 'NGN')}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Credit Limit</p>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(Number(creditLimit?.credit_limit_ngn ?? 250_000), 'NGN')}
            </p>
            <Progress value={creditUtilization} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {creditUtilization.toFixed(1)}% utilized
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                  No usage for this service
                </TableCell>
              </TableRow>
            ) : filteredEntries.map(([type, data]) => {
              const config = eventTypeConfig[type] || { label: type, icon: Zap };
              const Icon = config.icon;
              return (
                <TableRow key={type}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {config.label}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{data.count.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(data.total, 'NGN')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface PostpaidInvoiceRow {
  id: string;
  invoice_number: string;
  billing_period: string;
  total_usage_ngn: number | string;
  wallet_deducted_ngn: number | string;
  invoice_balance_ngn: number | string;
  due_date: string;
  status: string;
}

function PostpaidInvoicesTable({ invoices }: { invoices: PostpaidInvoiceRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [filters, setFilters] = useState<FilterValues>({});
  const [payingInvoice, setPayingInvoice] = useState<PostpaidInvoiceRow | null>(null);
  const queryClient = useQueryClient();

  const filterFields: FilterField[] = [
    {
      type: "daterange",
      key: "due_date",
      label: "Due date",
      placeholderFrom: "From",
      placeholderTo: "To" },
  ];

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dueFilter = filters.due_date;
    return invoices.filter((inv) => {
      if (q) {
        const hay = `${inv.invoice_number} ${inv.billing_period} ${inv.status}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status !== "all" && inv.status !== status) return false;
      if (dueFilter?.enabled) {
        const d = new Date(inv.due_date).getTime();
        if (dueFilter.dateFrom) {
          const f = new Date(dueFilter.dateFrom).getTime();
          if (d < f) return false;
        }
        if (dueFilter.dateTo) {
          const t = new Date(dueFilter.dateTo).getTime();
          if (d > t) return false;
        }
      }
      return true;
    });
  }, [invoices, search, status, filters]);

  const handlePaid = async (method: string) => {
    if (!payingInvoice) return;
    // Demo invoices have ids that start with "demo-" — just close.
    if (String(payingInvoice.id).startsWith("demo-")) {
      toast.success(`Invoice ${payingInvoice.invoice_number} paid`);
      setPayingInvoice(null);
      return;
    }
    const { data, error } = await supabase.rpc("pay_postpaid_invoice", {
      p_invoice_id: payingInvoice.id,
      p_payment_method: method,
      p_payment_reference: null,
    });
    if (error || (data as { success?: boolean } | null)?.success === false) {
      toast.error("Payment could not be recorded", {
        description: error?.message || (data as { error?: string } | null)?.error,
      });
      return;
    }
    toast.success(`Invoice ${payingInvoice.invoice_number} marked paid`);
    queryClient.invalidateQueries({ queryKey: ["postpaid-invoices"] });
    queryClient.invalidateQueries({ queryKey: ["credit-limit"] });
    setPayingInvoice(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Postpaid Invoices
            </CardTitle>
            <CardDescription>Past billing cycle invoices · Net 14 payment terms</CardDescription>
          </div>
          <ExportButton
            rows={filteredInvoices}
            columns={[
              { header: "Invoice #", accessor: "invoice_number" },
              { header: "Period", accessor: "billing_period" },
              { header: "Total (NGN)", accessor: (r) => Number(r.total_usage_ngn) },
              { header: "Wallet Paid (NGN)", accessor: (r) => Number(r.wallet_deducted_ngn) },
              { header: "Balance (NGN)", accessor: (r) => Number(r.invoice_balance_ngn) },
              { header: "Due Date", accessor: "due_date" },
              { header: "Status", accessor: "status" },
            ]}
            filename="postpaid_invoices"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by invoice #, period, status..."
          status={status}
          onStatusChange={setStatus}
          statusOptions={[
            { value: "paid", label: "Paid" },
            { value: "generated", label: "Pending" },
            { value: "overdue", label: "Overdue" },
          ]}
          filterEntity="invoices"
          filterFields={filterFields}
          filterValues={filters}
          onFiltersApply={setFilters}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Wallet Paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No invoices match your filters
                </TableCell>
              </TableRow>
            ) : filteredInvoices.map(inv => {
              const balance = Number(inv.invoice_balance_ngn);
              const isUnpaid = inv.status !== "paid" && balance > 0;
              return (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.billing_period}</TableCell>
                  <TableCell>{formatCurrency(Number(inv.total_usage_ngn), 'NGN')}</TableCell>
                  <TableCell>{formatCurrency(Number(inv.wallet_deducted_ngn), 'NGN')}</TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(balance, 'NGN')}
                  </TableCell>
                  <TableCell>{inv.due_date}</TableCell>
                  <TableCell>
                    <Badge className={
                      inv.status === 'paid' ? 'bg-success/10 text-success border-success/30' :
                      inv.status === 'overdue' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {isUnpaid ? (
                      <Button size="sm" onClick={() => setPayingInvoice(inv)}>
                        Pay
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <PaymentGateModal
        open={!!payingInvoice}
        onOpenChange={(v) => !v && setPayingInvoice(null)}
        planName={payingInvoice ? `Invoice ${payingInvoice.invoice_number}` : ""}
        amountLabel={
          payingInvoice
            ? formatCurrency(Number(payingInvoice.invoice_balance_ngn), 'NGN')
            : ""
        }
        onConfirmed={() => handlePaid("card_or_momo")}
      />
    </Card>
  );
}



