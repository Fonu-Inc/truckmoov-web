import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Badge } from "@/components/shadcn/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from "@/components/shadcn/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from "@/components/shadcn/dialog";
import {Wallet, CreditCard, Phone, MessageSquare, MessageCircle, ArrowUpRight, ArrowDownRight, RefreshCw, Plus, TrendingUp, AlertTriangle, History, Smartphone, BarChart3, FileText, Search, SlidersHorizontal as Filter, Download} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Separator } from "@/components/shadcn/separator";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { UsageAnalyticsChart } from "@/components/wallet/UsageAnalyticsChart";
import { AutoTopupSettings } from "@/components/wallet/AutoTopupSettings";
import { SpendingLimitSettings } from "@/components/wallet/SpendingLimitSettings";
import { PostpaidUsageDashboard } from "@/components/wallet/PostpaidUsageDashboard";
import { SubscriptionInvoicesCard } from "@/components/billing/SubscriptionInvoicesCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from "@/components/shadcn/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/shadcn/select";

type UsageRange = "today" | "yesterday" | "last_7_days" | "last_30_days" | "last_90_days";
const USAGE_RANGE_OPTIONS: { value: UsageRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
];
function getUsageRangeBounds(range: UsageRange): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  switch (range) {
    case "today":
      return { start, end };
    case "yesterday": {
      const yStart = new Date(start); yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(start); yEnd.setMilliseconds(-1);
      return { start: yStart, end: yEnd };
    }
    case "last_7_days": start.setDate(start.getDate() - 6); return { start, end };
    case "last_30_days": start.setDate(start.getDate() - 29); return { start, end };
    case "last_90_days": start.setDate(start.getDate() - 89); return { start, end };
  }
}

interface WalletInfo {
  balance: number;
  credit_enabled: boolean;
  credit_limit: number;
  low_balance_threshold: number;
}

interface Transaction {
  id: string;
  transaction_type: string;
  communication_type: string | null;
  quantity: number | null;
  unit_rate_ngn: number | null;
  amount_ngn: number;
  balance_before_ngn: number;
  balance_after_ngn: number;
  description: string | null;
  created_at: string;
}

interface Rate {
  communication_type: string;
  rate_ngn: number;
  rate_unit: string;
}

export default function TenantWallet() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || 'default';
  
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [usageRange, setUsageRange] = useState<UsageRange>("last_30_days");
  const [rateFilter, setRateFilter] = useState<string>("all");
  const [txSearch, setTxSearch] = useState("");
  // Applied filter values
  const [txTypeEnabled, setTxTypeEnabled] = useState(false);
  const [txTypeValue, setTxTypeValue] = useState<string>("all");
  const [txChannelEnabled, setTxChannelEnabled] = useState(false);
  const [txChannelValue, setTxChannelValue] = useState<string>("all");
  const [txAmountEnabled, setTxAmountEnabled] = useState(false);
  const [txAmountFrom, setTxAmountFrom] = useState<string>("");
  const [txAmountTo, setTxAmountTo] = useState<string>("");
  const [txDateEnabled, setTxDateEnabled] = useState(false);
  const [txDateFrom, setTxDateFrom] = useState<string>("");
  const [txDateTo, setTxDateTo] = useState<string>("");
  // Draft state (used inside the popover before Apply)
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [draftTypeEnabled, setDraftTypeEnabled] = useState(false);
  const [draftType, setDraftType] = useState<string>("all");
  const [draftChannelEnabled, setDraftChannelEnabled] = useState(false);
  const [draftChannel, setDraftChannel] = useState<string>("all");
  const [draftAmountEnabled, setDraftAmountEnabled] = useState(false);
  const [draftAmountFrom, setDraftAmountFrom] = useState("");
  const [draftAmountTo, setDraftAmountTo] = useState("");
  const [draftDateEnabled, setDraftDateEnabled] = useState(false);
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");

  const activeFilterCount =
    (txTypeEnabled ? 1 : 0) +
    (txChannelEnabled ? 1 : 0) +
    (txAmountEnabled ? 1 : 0) +
    (txDateEnabled ? 1 : 0);

  const syncDraftsFromApplied = () => {
    setDraftTypeEnabled(txTypeEnabled); setDraftType(txTypeValue);
    setDraftChannelEnabled(txChannelEnabled); setDraftChannel(txChannelValue);
    setDraftAmountEnabled(txAmountEnabled); setDraftAmountFrom(txAmountFrom); setDraftAmountTo(txAmountTo);
    setDraftDateEnabled(txDateEnabled); setDraftDateFrom(txDateFrom); setDraftDateTo(txDateTo);
  };

  const handleApplyFilters = () => {
    setTxTypeEnabled(draftTypeEnabled); setTxTypeValue(draftType);
    setTxChannelEnabled(draftChannelEnabled); setTxChannelValue(draftChannel);
    setTxAmountEnabled(draftAmountEnabled); setTxAmountFrom(draftAmountFrom); setTxAmountTo(draftAmountTo);
    setTxDateEnabled(draftDateEnabled); setTxDateFrom(draftDateFrom); setTxDateTo(draftDateTo);
    setFilterPopoverOpen(false);
  };

  const handleShowAllFilters = () => {
    setTxTypeEnabled(false); setTxTypeValue("all");
    setTxChannelEnabled(false); setTxChannelValue("all");
    setTxAmountEnabled(false); setTxAmountFrom(""); setTxAmountTo("");
    setTxDateEnabled(false); setTxDateFrom(""); setTxDateTo("");
    setDraftTypeEnabled(false); setDraftType("all");
    setDraftChannelEnabled(false); setDraftChannel("all");
    setDraftAmountEnabled(false); setDraftAmountFrom(""); setDraftAmountTo("");
    setDraftDateEnabled(false); setDraftDateFrom(""); setDraftDateTo("");
    setFilterPopoverOpen(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchWallet(), fetchTransactions(), fetchRates()]);
    setLoading(false);
  };

  const fetchWallet = async () => {
    // Coming soon
  };

  const fetchTransactions = async () => {
    // Coming soon
  };

  const fetchRates = async () => {
    // Coming soon
  };

  const handleTopup = async () => {
    toast.info('Coming soon');
    return;
  };

  const getTypeIcon = (commType: string | null) => {
    switch (commType) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const quickTopupAmounts = [5000, 10000, 25000, 50000, 100000];

  // ── Demo transactions fallback so wallet UI is always populated ──
  const demoTransactions: Transaction[] = (() => {
    const channels = ["call", "sms", "whatsapp"] as const;
    const descriptions: Record<string, string[]> = {
      call: ["Driver dispatch call", "Customer follow-up call", "IVR job offer", "Support callback"],
      sms: ["Job assignment SMS", "ETA update SMS", "OTP verification", "Delivery confirmation"],
      whatsapp: ["Waybill confirmation", "Job offer broadcast", "Delivery photo request", "Driver check-in"] };
    let balance = 250_000;
    const out: Transaction[] = [];
    for (let i = 0; i < 60; i++) {
      const ch = channels[i % channels.length];
      const isTopup = i % 11 === 0;
      const minutesAgo = i * 73 + Math.floor(Math.random() * 40);
      const created = new Date(Date.now() - minutesAgo * 60_000).toISOString();
      if (isTopup) {
        const amt = [5000, 10000, 25000, 50000][i % 4];
        balance += amt;
        out.push({
          id: `demo-tx-${i}`,
          transaction_type: "topup",
          communication_type: null,
          quantity: null,
          unit_rate_ngn: null,
          amount_ngn: amt,
          balance_before_ngn: balance - amt,
          balance_after_ngn: balance,
          description: "MTN Mobile Money top-up",
          created_at: created });
      } else {
        const rate = ch === "call" ? 22 : ch === "sms" ? 4 : 8;
        const qty = ch === "call" ? 1 + (i % 6) : 1 + (i % 4);
        const amt = rate * qty;
        balance -= amt;
        const desc = descriptions[ch][i % 4];
        out.push({
          id: `demo-tx-${i}`,
          transaction_type: "debit",
          communication_type: ch,
          quantity: qty,
          unit_rate_ngn: rate,
          amount_ngn: amt,
          balance_before_ngn: balance + amt,
          balance_after_ngn: balance,
          description: desc,
          created_at: created });
      }
    }
    return out;
  })();

  const displayTransactions = transactions.length > 0 ? transactions : demoTransactions;

  // Calculate usage stats (this-month for KPIs at the top)
  const thisMonthTransactions = displayTransactions.filter(tx => {
    const txDate = new Date(tx.created_at);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });

  const totalSpentThisMonth = thisMonthTransactions
    .filter(tx => tx.transaction_type === 'debit')
    .reduce((sum, tx) => sum + tx.amount_ngn, 0);

  // Range-filtered usage breakdown (driven by date dropdown on the Usage card)
  const usageRangeBounds = getUsageRangeBounds(usageRange);
  const usageByType = displayTransactions
    .filter(tx => {
      if (tx.transaction_type !== 'debit' || !tx.communication_type) return false;
      const d = new Date(tx.created_at);
      return d >= usageRangeBounds.start && d <= usageRangeBounds.end;
    })
    .reduce((acc, tx) => {
      const type = tx.communication_type!;
      if (!acc[type]) acc[type] = { count: 0, amount: 0 };
      acc[type].count += tx.quantity || 1;
      acc[type].amount += tx.amount_ngn;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);
  const usageRangeLabel = USAGE_RANGE_OPTIONS.find(o => o.value === usageRange)?.label.toLowerCase();

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'Time', 'Type', 'Channel', 'Quantity', 'Rate (₦)', 'Amount (₦)', 'Balance After (₦)', 'Description'];
    const rows = transactions.map(tx => [
      new Date(tx.created_at).toLocaleDateString(),
      new Date(tx.created_at).toLocaleTimeString(),
      tx.transaction_type,
      tx.communication_type || '',
      tx.quantity || '',
      tx.unit_rate_ngn || '',
      tx.amount_ngn,
      tx.balance_after_ngn,
      tx.description || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('CSV exported successfully');
  };

  const exportToPDF = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    // Create a printable HTML document
    const totalDebits = transactions.filter(tx => tx.transaction_type === 'debit').reduce((sum, tx) => sum + tx.amount_ngn, 0);
    const totalCredits = transactions.filter(tx => tx.transaction_type !== 'debit').reduce((sum, tx) => sum + tx.amount_ngn, 0);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Wallet Transaction History</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            .summary { display: flex; gap: 20px; margin: 20px 0; }
            .summary-card { background: #f8fafc; padding: 15px; border-radius: 8px; flex: 1; }
            .summary-card h3 { margin: 0 0 5px 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
            .summary-card p { margin: 0; font-size: 24px; font-weight: bold; }
            .debit { color: #ef4444; }
            .credit { color: #22c55e; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #f1f5f9; padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
            .text-right { text-align: right; }
            .footer { margin-top: 30px; text-align: center; color: #64748b; font-size: 11px; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>Wallet Transaction History</h1>
          <p style="color: #64748b;">Generated on ${new Date().toLocaleString()}</p>
          
          <div class="summary">
            <div class="summary-card">
              <h3>Current Balance</h3>
              <p>₦${(walletInfo?.balance || 0).toLocaleString()}</p>
            </div>
            <div class="summary-card">
              <h3>Total Spent</h3>
              <p class="debit">₦${totalDebits.toLocaleString()}</p>
            </div>
            <div class="summary-card">
              <h3>Total Top-ups</h3>
              <p class="credit">₦${totalCredits.toLocaleString()}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Channel</th>
                <th>Details</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(tx => `
                <tr>
                  <td>${new Date(tx.created_at).toLocaleString()}</td>
                  <td>${tx.transaction_type}</td>
                  <td>${tx.communication_type || '-'}</td>
                  <td>${tx.quantity ? `${tx.quantity} ${tx.communication_type === 'call' ? 'min' : 'msg'}` : ''} ${tx.description || ''}</td>
                  <td class="text-right ${tx.transaction_type === 'debit' ? 'debit' : 'credit'}">
                    ${tx.transaction_type === 'debit' ? '-' : '+'}₦${tx.amount_ngn.toLocaleString()}
                  </td>
                  <td class="text-right">₦${tx.balance_after_ngn.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>FleetPro Fleet Management System - Wallet Statement</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
      toast.success('PDF export opened - use Print to save as PDF');
    } else {
      toast.error('Please allow popups to export PDF');
    }
  };

  return (
    <DashboardLayout
      title="Wallet & Billing"
      subtitle="Manage your communication credits and view usage"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Balance & Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-4xl font-bold ${(walletInfo?.balance || 0) < 0 ? 'text-destructive' : ''}`}>
                      ₦{(walletInfo?.balance || 0).toLocaleString()}
                    </p>
                    {walletInfo?.credit_enabled && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Credit limit: ₦{walletInfo.credit_limit.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button onClick={() => setTopupDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Top Up
                  </Button>
                </div>
                {(walletInfo?.balance || 0) < (walletInfo?.low_balance_threshold || 1000) && (
                  <div className="mt-4 flex items-center gap-2 text-yellow-600 bg-yellow-500/10 rounded-lg px-3 py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Low balance - top up to continue sending messages</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">This Month Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₦{totalSpentThisMonth.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {thisMonthTransactions.filter(tx => tx.transaction_type === 'debit').length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Ups This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  ₦{thisMonthTransactions
                    .filter(tx => tx.transaction_type === 'topup')
                    .reduce((sum, tx) => sum + tx.amount_ngn, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {thisMonthTransactions.filter(tx => tx.transaction_type === 'topup').length} top-ups
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Analytics Charts */}
          <UsageAnalyticsChart transactions={displayTransactions} />

          {/* Usage Breakdown & Rates */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex flex-nowrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base truncate">
                      <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">Usage Breakdown</span>
                    </CardTitle>
                    <CardDescription className="text-xs truncate">Channel usage for the {usageRangeLabel}</CardDescription>
                  </div>
                  <Select value={usageRange} onValueChange={(v) => setUsageRange(v as UsageRange)}>
                    <SelectTrigger className="h-7 w-[120px] shrink-0 text-[11px] px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USAGE_RANGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(usageByType).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No usage for the selected range</p>
                  ) : (
                    Object.entries(usageByType).map(([type, data]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            type === 'call' ? 'bg-blue-500/10 text-blue-500' :
                            type === 'sms' ? 'bg-green-500/10 text-green-500' :
                            'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {getTypeIcon(type)}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{type}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.count} {type === 'call' ? 'minutes' : 'messages'}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold">₦{data.amount.toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-nowrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-sm truncate">
                      <CreditCard className="h-5 w-5 text-primary shrink-0" />
                      Current Rates
                    </CardTitle>
                    <CardDescription className="text-xs truncate">Charges per unit for each channel</CardDescription>
                  </div>
                  <Select value={rateFilter} onValueChange={setRateFilter}>
                    <SelectTrigger className="h-7 w-[130px] text-[11px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All channels</SelectItem>
                      {rates.map(r => (
                        <SelectItem key={r.communication_type} value={r.communication_type} className="capitalize">
                          {r.communication_type.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rates
                    .filter(r => rateFilter === 'all' || r.communication_type === rateFilter)
                    .map((rate) => (
                    <div key={rate.communication_type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          rate.communication_type === 'call' ? 'bg-blue-500/10 text-blue-500' :
                          rate.communication_type === 'sms' ? 'bg-green-500/10 text-green-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {getTypeIcon(rate.communication_type)}
                        </div>
                        <span className="font-medium capitalize">{rate.communication_type}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₦{rate.rate_ngn}</p>
                        <p className="text-xs text-muted-foreground">
                          {rate.rate_unit === 'per_minute' ? 'per minute' : 'per message'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Auto Top-Up & Spending Limit Settings */}
          <div className="grid gap-4 md:grid-cols-2">
            <AutoTopupSettings tenantId={tenantId} onSettingsUpdated={fetchData} />
            <SpendingLimitSettings tenantId={tenantId} onUpdate={fetchData} />
          </div>

          {/* Postpaid Usage Section */}
          <Separator className="my-6" />
          <h3 className="text-lg font-semibold text-foreground mb-4">Postpaid Usage</h3>
          <PostpaidUsageDashboard tenantId={tenantId} />

          {/* Subscription Invoices & Receipts */}
          <SubscriptionInvoicesCard tenantName={user?.name || "Your Organization"} />

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>Your wallet activity and usage logs</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportToCSV}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Popover open={filterPopoverOpen} onOpenChange={(o) => { if (o) syncDraftsFromApplied(); setFilterPopoverOpen(o); }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5">{activeFilterCount}</Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 space-y-4 max-h-[70vh] overflow-y-auto">
                    <h4 className="text-xs font-medium text-foreground px-0.5">Only show transactions by...</h4>

                    {/* Type */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="flt-tx-type" checked={draftTypeEnabled} onCheckedChange={(c) => setDraftTypeEnabled(c === true)} />
                        <Label htmlFor="flt-tx-type" className="text-sm cursor-pointer">Type</Label>
                      </div>
                      <Select value={draftType} onValueChange={setDraftType} disabled={!draftTypeEnabled}>
                        <SelectTrigger><SelectValue placeholder="Any type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any type</SelectItem>
                          <SelectItem value="topup">Top-up</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                          <SelectItem value="debit">Debit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Channel */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="flt-tx-ch" checked={draftChannelEnabled} onCheckedChange={(c) => setDraftChannelEnabled(c === true)} />
                        <Label htmlFor="flt-tx-ch" className="text-sm cursor-pointer">Channel</Label>
                      </div>
                      <Select value={draftChannel} onValueChange={setDraftChannel} disabled={!draftChannelEnabled}>
                        <SelectTrigger><SelectValue placeholder="Any channel" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any channel</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="flt-tx-amt" checked={draftAmountEnabled} onCheckedChange={(c) => setDraftAmountEnabled(c === true)} />
                        <Label htmlFor="flt-tx-amt" className="text-sm cursor-pointer">Amount (₦)</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" placeholder="From" disabled={!draftAmountEnabled} value={draftAmountFrom} onChange={(e) => setDraftAmountFrom(e.target.value)} />
                        <Input type="number" placeholder="To" disabled={!draftAmountEnabled} value={draftAmountTo} onChange={(e) => setDraftAmountTo(e.target.value)} />
                      </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="flt-tx-date" checked={draftDateEnabled} onCheckedChange={(c) => setDraftDateEnabled(c === true)} />
                        <Label htmlFor="flt-tx-date" className="text-sm cursor-pointer">Date</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="date" disabled={!draftDateEnabled} value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} />
                        <Input type="date" disabled={!draftDateEnabled} value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button onClick={handleApplyFilters} className="flex-1">Apply</Button>
                      <Button variant="outline" onClick={handleShowAllFilters} className="flex-1">Show All</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const q = txSearch.trim().toLowerCase();
                    const amtFrom = txAmountEnabled && txAmountFrom !== "" ? parseFloat(txAmountFrom) : null;
                    const amtTo = txAmountEnabled && txAmountTo !== "" ? parseFloat(txAmountTo) : null;
                    const dateFrom = txDateEnabled && txDateFrom ? new Date(txDateFrom) : null;
                    const dateTo = txDateEnabled && txDateTo ? new Date(txDateTo + "T23:59:59") : null;
                    const filtered = displayTransactions.filter((tx) => {
                      const type = (tx.transaction_type || '').toLowerCase();
                      if (txTypeEnabled && txTypeValue !== "all" && type !== txTypeValue) return false;
                      const ch = (tx.communication_type || '').toLowerCase();
                      if (txChannelEnabled && txChannelValue !== "all") {
                        const effective = ch || 'other';
                        const matchKey = ch && ['call','sms','whatsapp','email'].includes(ch) ? ch : 'other';
                        if (matchKey !== txChannelValue) return false;
                      }
                      if (amtFrom !== null && tx.amount_ngn < amtFrom) return false;
                      if (amtTo !== null && tx.amount_ngn > amtTo) return false;
                      if (dateFrom || dateTo) {
                        const d = new Date(tx.created_at);
                        if (dateFrom && d < dateFrom) return false;
                        if (dateTo && d > dateTo) return false;
                      }
                      if (q) {
                        const hay = `${tx.description || ''} ${tx.communication_type || ''} ${tx.transaction_type || ''}`.toLowerCase();
                        if (!hay.includes(q)) return false;
                      }
                      return true;
                    });
                    if (filtered.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return filtered.slice(0, 50).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">
                          <div>{new Date(tx.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.transaction_type === 'debit' ? 'destructive' : 'default'} className={
                            tx.transaction_type === 'topup' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''
                          }>
                            {tx.transaction_type === 'debit' ? (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            )}
                            {tx.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tx.communication_type && (
                            <div className="flex items-center gap-1 capitalize">
                              {getTypeIcon(tx.communication_type)}
                              {tx.communication_type}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {tx.quantity && (
                            <span className="mr-2">
                              {tx.quantity} {tx.communication_type === 'call' ? 'min' : 'msg'}
                              {tx.unit_rate_ngn && ` × ₦${tx.unit_rate_ngn}`}
                            </span>
                          )}
                          {tx.description}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          tx.transaction_type === 'debit' ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {tx.transaction_type === 'debit' ? '-' : '+'}₦{tx.amount_ngn.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₦{tx.balance_after_ngn.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top-up Dialog */}
      <Dialog open={topupDialogOpen} onOpenChange={setTopupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Top Up Wallet
            </DialogTitle>
            <DialogDescription>
              Add funds to your wallet using MTN Mobile Money
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quick Amounts</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickTopupAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={topupAmount === amount.toString() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTopupAmount(amount.toString())}
                  >
                    ₦{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">MTN Mobile Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 08031234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You'll receive a prompt on this number to approve the payment
              </p>
            </div>

            {topupAmount && (
              <div className="bg-muted rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount to pay:</span>
                  <span className="text-xl font-bold">₦{parseFloat(topupAmount || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-muted-foreground">New balance:</span>
                  <span className="font-medium text-green-600">
                    ₦{((walletInfo?.balance || 0) + parseFloat(topupAmount || '0')).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTopupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTopup} disabled={topupLoading || !topupAmount || !phoneNumber}>
              {topupLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Pay with MoMo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
