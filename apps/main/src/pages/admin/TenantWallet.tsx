import type { ColumnDef } from "@tanstack/react-table";
import type { DataBundleLedgerEntry } from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import { useQuery } from "@tanstack/react-query";
import {
  exportDataBundleWalletLedger,
  getCommunicationsWalletRatesQueryOptions,
  getCommunicationsWalletSpendBreakdownQueryOptions,
  getDataBundleAutoTopupQueryOptions,
  getDataBundleWalletBalanceQueryOptions,
  getDataBundleWalletLedgerQueryOptions,
  useTopUpDataBundleWallet,
} from "@truckmoov/api/auth";
import {
  downloadBlob, escapeHtml as esc,
} from "@truckmoov/app-core/utils/general-utils";
import {
  formatDate, formatTime, startOfMonth, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, CreditCard, Download, FileText, SlidersHorizontal as Filter, History, MessageCircle, MessageSquare, Phone, Plus, RefreshCw, Search, Smartphone, TrendingUp, Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SubscriptionInvoicesCard } from "@/components/billing/SubscriptionInvoicesCard";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { AutoTopupSettings } from "@/components/wallet/AutoTopupSettings";
import { PostpaidUsageDashboard } from "@/components/wallet/PostpaidUsageDashboard";
import { SpendingLimitSettings } from "@/components/wallet/SpendingLimitSettings";
import { UsageAnalyticsChart } from "@/components/wallet/UsageAnalyticsChart";
import { useAuthStore } from "@/features/auth/stores/authStore";

type UsageRange = "today" | "yesterday" | "last_7_days" | "last_30_days" | "last_90_days";
const USAGE_RANGE_OPTIONS: {
  value: UsageRange; label: string;
}[] = [
  {
    value: "today", label: "Today",
  },
  {
    value: "yesterday", label: "Yesterday",
  },
  {
    value: "last_7_days", label: "Last 7 days",
  },
  {
    value: "last_30_days", label: "Last 30 days",
  },
  {
    value: "last_90_days", label: "Last 90 days",
  },
];
function getUsageRangeBounds(range: UsageRange): {
  start: Date; end: Date;
} {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setHours(
    0,
    0,
    0,
    0,
  );
  switch (range) {
    case "today":
      return {
        start, end,
      };
    case "yesterday": {
      const yStart = new Date(start);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(start);
      yEnd.setMilliseconds(-1);
      return {
        start: yStart, end: yEnd,
      };
    }
    case "last_7_days": start.setDate(start.getDate() - 6);
      return {
        start, end,
      };
    case "last_30_days": start.setDate(start.getDate() - 29);
      return {
        start, end,
      };
    case "last_90_days": start.setDate(start.getDate() - 89);
      return {
        start, end,
      };
  }
}

type WalletInfo = {
  balance: number;
  credit_enabled: boolean;
  credit_limit: number;
  low_balance_threshold: number;
};

type Transaction = {
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
};

function transactionColumns(getTypeIcon: (commType: string | null) => React.ReactNode): ColumnDef<Transaction>[] {
  return [
    {
      id: "date",
      header: "Date",
      accessorFn: tx => tx.created_at,
      meta: { className: "text-sm" },
      cell: ({ row }) => (
        <>
          <div>{formatDate(row.original.created_at)}</div>
          <div className="text-xs text-muted-foreground">
            {formatTime(row.original.created_at)}
          </div>
        </>
      ),
    },
    {
      accessorKey: "transaction_type",
      header: "Type",
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <Badge
            variant={tx.transaction_type === "debit" ? "destructive" : "default"}
            className={
              tx.transaction_type === "topup" ? "bg-success/10 text-success border-success/20" : ""
            }
          >
            {tx.transaction_type === "debit"
              ? (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )
              : (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                )}
            {tx.transaction_type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "communication_type",
      header: "Channel",
      cell: ({ row }) => row.original.communication_type && (
        <div className="flex items-center gap-1 capitalize">
          {getTypeIcon(row.original.communication_type)}
          {row.original.communication_type}
        </div>
      ),
    },
    {
      id: "details",
      header: "Details",
      enableSorting: false,
      meta: { className: "text-sm text-muted-foreground max-w-[200px] truncate" },
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <>
            {tx.quantity && (
              <span className="mr-2">
                {tx.quantity}
                {" "}
                {tx.communication_type === "call" ? "min" : "msg"}
                {tx.unit_rate_ngn && ` × ₦${tx.unit_rate_ngn}`}
              </span>
            )}
            {tx.description}
          </>
        );
      },
    },
    {
      accessorKey: "amount_ngn",
      header: "Amount",
      meta: { className: "text-right font-medium" },
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <span className={tx.transaction_type === "debit" ? "text-destructive" : "text-success"}>
            {tx.transaction_type === "debit" ? "-" : "+"}
            ₦
            {tx.amount_ngn.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "balance_after_ngn",
      header: "Balance",
      meta: { className: "text-right" },
      cell: ({ row }) => `₦${row.original.balance_after_ngn.toLocaleString()}`,
    },
  ];
}

type Rate = {
  communication_type: string;
  rate_ngn: number;
  rate_unit: string;
};

type ServerRate = {
  channel: string; unit: string; rateKobo: number; enabled: boolean;
};

const CHANNEL_BY_CATEGORY: Record<string, string> = {
  sms: "sms", whatsapp: "whatsapp", voice: "call",
};

function toTransaction(entry: DataBundleLedgerEntry): Transaction {
  const debit = entry.direction === "debit";
  return {
    id: entry.id,
    transaction_type: debit ? "debit" : entry.category === "top_up" ? "topup" : "credit",
    communication_type: CHANNEL_BY_CATEGORY[entry.category] ?? null,
    quantity: entry.quantity || null,
    unit_rate_ngn: entry.unitRate || null,
    amount_ngn: entry.amount,
    balance_before_ngn: debit ? entry.balanceAfter + entry.amount : entry.balanceAfter - entry.amount,
    balance_after_ngn: entry.balanceAfter,
    description: entry.reason,
    created_at: entry.createdAt,
  };
}

function toRate(rate: ServerRate): Rate {
  return {
    communication_type: CHANNEL_BY_CATEGORY[rate.channel] ?? rate.channel,
    rate_ngn: rate.rateKobo / 100,
    rate_unit: rate.unit,
  };
}

// The table, chart and PDF show the latest 100 ledger lines (the endpoint's page cap); totals and CSV come from the server.
const LEDGER_QUERY = { params: { limit: 100 } };

const BREAKDOWN_CHANNEL: Record<string, string> = {
  voice: "call", data_bundle: "data bundles",
};

export default function TenantWallet() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || "default";

  const balanceQuery = useQuery(getDataBundleWalletBalanceQueryOptions());
  const ledgerQuery = useQuery(getDataBundleWalletLedgerQueryOptions(LEDGER_QUERY));
  const [
    {
      monthStart, today,
    },
  ] = useState(() => {
    const now = new Date();
    return {
      monthStart: startOfMonth(now)!.toISOString(), today: toDateParam(now),
    };
  });
  const monthSpendQuery = useQuery(getCommunicationsWalletSpendBreakdownQueryOptions({
    params: {
      range: "custom", startDate: toDateParam(monthStart), endDate: today,
    },
  }));
  const monthDebitsQuery = useQuery(getDataBundleWalletLedgerQueryOptions({
    params: {
      direction: "debit", from: monthStart, limit: 1,
    },
  }));
  // shortcut: sums at most 100 top-ups in a month; add a server sum if a tenant tops up more often.
  const monthTopupsQuery = useQuery(getDataBundleWalletLedgerQueryOptions({
    params: {
      category: "top_up", from: monthStart, limit: 100,
    },
  }));
  const ratesQuery = useQuery(getCommunicationsWalletRatesQueryOptions());
  const autoTopupQuery = useQuery(getDataBundleAutoTopupQueryOptions());
  const topUp = useTopUpDataBundleWallet();
  const loading = balanceQuery.isPending;
  const walletInfo: WalletInfo | null = balanceQuery.data
    ? {
        balance: balanceQuery.data.data.balance,
        credit_enabled: false,
        credit_limit: 0,
        low_balance_threshold: autoTopupQuery.data?.data.thresholdAmount ?? 0,
      }
    : null;
  const transactions = (ledgerQuery.data?.data.items ?? []).map(toTransaction);
  const rates = ((ratesQuery.data?.data ?? []) as ServerRate[])
    .filter(r => r.enabled && r.channel !== "iot_sim")
    .map(toRate);
  const [
    topupDialogOpen,
    setTopupDialogOpen,
  ] = useState(false);
  const [
    topupAmount,
    setTopupAmount,
  ] = useState("");
  const [
    phoneNumber,
    setPhoneNumber,
  ] = useState("");
  const topupLoading = topUp.isPending;
  const [
    usageRange,
    setUsageRange,
  ] = useState<UsageRange>("last_30_days");
  const [
    rateFilter,
    setRateFilter,
  ] = useState<string>("all");
  const [
    txSearch,
    setTxSearch,
  ] = useState("");
  // Applied filter values
  const [
    txTypeEnabled,
    setTxTypeEnabled,
  ] = useState(false);
  const [
    txTypeValue,
    setTxTypeValue,
  ] = useState<string>("all");
  const [
    txChannelEnabled,
    setTxChannelEnabled,
  ] = useState(false);
  const [
    txChannelValue,
    setTxChannelValue,
  ] = useState<string>("all");
  const [
    txAmountEnabled,
    setTxAmountEnabled,
  ] = useState(false);
  const [
    txAmountFrom,
    setTxAmountFrom,
  ] = useState<string>("");
  const [
    txAmountTo,
    setTxAmountTo,
  ] = useState<string>("");
  const [
    txDateEnabled,
    setTxDateEnabled,
  ] = useState(false);
  const [
    txDateFrom,
    setTxDateFrom,
  ] = useState<string>("");
  const [
    txDateTo,
    setTxDateTo,
  ] = useState<string>("");
  // Draft state (used inside the popover before Apply)
  const [
    filterPopoverOpen,
    setFilterPopoverOpen,
  ] = useState(false);
  const [
    draftTypeEnabled,
    setDraftTypeEnabled,
  ] = useState(false);
  const [
    draftType,
    setDraftType,
  ] = useState<string>("all");
  const [
    draftChannelEnabled,
    setDraftChannelEnabled,
  ] = useState(false);
  const [
    draftChannel,
    setDraftChannel,
  ] = useState<string>("all");
  const [
    draftAmountEnabled,
    setDraftAmountEnabled,
  ] = useState(false);
  const [
    draftAmountFrom,
    setDraftAmountFrom,
  ] = useState("");
  const [
    draftAmountTo,
    setDraftAmountTo,
  ] = useState("");
  const [
    draftDateEnabled,
    setDraftDateEnabled,
  ] = useState(false);
  const [
    draftDateFrom,
    setDraftDateFrom,
  ] = useState("");
  const [
    draftDateTo,
    setDraftDateTo,
  ] = useState("");

  const activeFilterCount
    = (txTypeEnabled ? 1 : 0)
      + (txChannelEnabled ? 1 : 0)
      + (txAmountEnabled ? 1 : 0)
      + (txDateEnabled ? 1 : 0);

  const syncDraftsFromApplied = () => {
    setDraftTypeEnabled(txTypeEnabled);
    setDraftType(txTypeValue);
    setDraftChannelEnabled(txChannelEnabled);
    setDraftChannel(txChannelValue);
    setDraftAmountEnabled(txAmountEnabled);
    setDraftAmountFrom(txAmountFrom);
    setDraftAmountTo(txAmountTo);
    setDraftDateEnabled(txDateEnabled);
    setDraftDateFrom(txDateFrom);
    setDraftDateTo(txDateTo);
  };

  const handleApplyFilters = () => {
    setTxTypeEnabled(draftTypeEnabled);
    setTxTypeValue(draftType);
    setTxChannelEnabled(draftChannelEnabled);
    setTxChannelValue(draftChannel);
    setTxAmountEnabled(draftAmountEnabled);
    setTxAmountFrom(draftAmountFrom);
    setTxAmountTo(draftAmountTo);
    setTxDateEnabled(draftDateEnabled);
    setTxDateFrom(draftDateFrom);
    setTxDateTo(draftDateTo);
    setFilterPopoverOpen(false);
  };

  const handleShowAllFilters = () => {
    setTxTypeEnabled(false);
    setTxTypeValue("all");
    setTxChannelEnabled(false);
    setTxChannelValue("all");
    setTxAmountEnabled(false);
    setTxAmountFrom("");
    setTxAmountTo("");
    setTxDateEnabled(false);
    setTxDateFrom("");
    setTxDateTo("");
    setDraftTypeEnabled(false);
    setDraftType("all");
    setDraftChannelEnabled(false);
    setDraftChannel("all");
    setDraftAmountEnabled(false);
    setDraftAmountFrom("");
    setDraftAmountTo("");
    setDraftDateEnabled(false);
    setDraftDateFrom("");
    setDraftDateTo("");
    setFilterPopoverOpen(false);
  };

  const fetchData = () => {
    void balanceQuery.refetch();
    void ledgerQuery.refetch();
    void autoTopupQuery.refetch();
    void monthSpendQuery.refetch();
    void monthDebitsQuery.refetch();
    void monthTopupsQuery.refetch();
  };

  const handleTopup = () => {
    const amount = Number.parseFloat(topupAmount);
    if (!(amount > 0)) {
      toast.error("Enter an amount to top up");
      return;
    }
    topUp.mutate(
      {
        data: {
          amount, mobileMoneyProvider: "mtn_momo", mobileNumber: phoneNumber.trim(),
        },
      },
      {
        onSuccess: (res) => {
          if (res.data.authorizationUrl) {
            window.location.assign(res.data.authorizationUrl);
            return;
          }
          void ledgerQuery.refetch();
          toast.success(`₦${amount.toLocaleString()} added to your wallet`);
          setTopupDialogOpen(false);
          setTopupAmount("");
        },
        onError: err => toast.error((err as Partial<ServerErrorResponse> | undefined)?.message ?? "Top-up could not be started. Try again."),
      },
    );
  };

  const getTypeIcon = (commType: string | null) => {
    switch (commType) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "whatsapp":
        return <MessageCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const q = txSearch.trim().toLowerCase();
  const amtFrom = txAmountEnabled && txAmountFrom !== "" ? Number.parseFloat(txAmountFrom) : null;
  const amtTo = txAmountEnabled && txAmountTo !== "" ? Number.parseFloat(txAmountTo) : null;
  const dateFrom = txDateEnabled && txDateFrom ? new Date(txDateFrom) : null;
  const dateTo = txDateEnabled && txDateTo ? new Date(`${txDateTo}T23:59:59`) : null;
  const filteredTransactions = transactions.filter((tx) => {
    const type = (tx.transaction_type || "").toLowerCase();
    if (txTypeEnabled && txTypeValue !== "all" && type !== txTypeValue)
      return false;
    const ch = (tx.communication_type || "").toLowerCase();
    if (txChannelEnabled && txChannelValue !== "all") {
      const matchKey = ch && [
        "call",
        "sms",
        "whatsapp",
        "email",
      ].includes(ch)
        ? ch
        : "other";
      if (matchKey !== txChannelValue)
        return false;
    }
    if (amtFrom !== null && tx.amount_ngn < amtFrom)
      return false;
    if (amtTo !== null && tx.amount_ngn > amtTo)
      return false;
    if (dateFrom || dateTo) {
      const d = new Date(tx.created_at);
      if (dateFrom && d < dateFrom)
        return false;
      if (dateTo && d > dateTo)
        return false;
    }
    if (q) {
      const hay = `${tx.description || ""} ${tx.communication_type || ""} ${tx.transaction_type || ""}`.toLowerCase();
      if (!hay.includes(q))
        return false;
    }
    return true;
  });

  const quickTopupAmounts = [
    5000,
    10000,
    25000,
    50000,
    100000,
  ];

  const totalSpentThisMonth = monthSpendQuery.data?.data.total ?? 0;
  const monthTopups = monthTopupsQuery.data?.data.items ?? [];

  const usageRangeBounds = getUsageRangeBounds(usageRange);
  const usageQuery = useQuery(getCommunicationsWalletSpendBreakdownQueryOptions({
    params: {
      range: "custom", startDate: toDateParam(usageRangeBounds.start), endDate: toDateParam(usageRangeBounds.end),
    },
  }));
  const usageByType = (usageQuery.data?.data.breakdown ?? []).filter(b => b.amount > 0);
  const usageRangeLabel = USAGE_RANGE_OPTIONS.find(o => o.value === usageRange)?.label.toLowerCase();

  const exportToCSV = async () => {
    const channel = txChannelEnabled && txChannelValue !== "all" ? txChannelValue : null;
    const category = txTypeEnabled && txTypeValue === "topup"
      ? "top_up"
      : channel === "call" ? "voice" : channel === "sms" || channel === "whatsapp" ? channel : undefined;
    try {
      downloadBlob(
        await exportDataBundleWalletLedger({
          category,
          direction: txTypeEnabled && txTypeValue !== "all" ? (txTypeValue === "debit" ? "debit" : "credit") : undefined,
          from: dateFrom?.toISOString(),
          to: dateTo?.toISOString(),
        }),
        `wallet-transactions-${toDateParam(new Date())}.csv`,
      );
      toast.success("CSV exported successfully");
    }
    catch {
      toast.error("CSV export failed. Try again.");
    }
  };

  const exportToPDF = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    // Create a printable HTML document
    const totalDebits = transactions.filter(tx => tx.transaction_type === "debit").reduce(
      (sum, tx) => sum + tx.amount_ngn,
      0,
    );
    const totalCredits = transactions.filter(tx => tx.transaction_type !== "debit").reduce(
      (sum, tx) => sum + tx.amount_ngn,
      0,
    );

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
          <p style="color: #64748b;">Generated on ${esc(new Date().toLocaleString())}</p>
          
          <div class="summary">
            <div class="summary-card">
              <h3>Current Balance</h3>
              <p>₦${esc((walletInfo?.balance || 0).toLocaleString())}</p>
            </div>
            <div class="summary-card">
              <h3>Total Spent</h3>
              <p class="debit">₦${esc(totalDebits.toLocaleString())}</p>
            </div>
            <div class="summary-card">
              <h3>Total Top-ups</h3>
              <p class="credit">₦${esc(totalCredits.toLocaleString())}</p>
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
                  <td>${esc(new Date(tx.created_at).toLocaleString())}</td>
                  <td>${esc(tx.transaction_type)}</td>
                  <td>${esc(tx.communication_type || "-")}</td>
                  <td>${tx.quantity ? `${esc(tx.quantity)} ${tx.communication_type === "call" ? "min" : "msg"}` : ""} ${esc(tx.description)}</td>
                  <td class="text-right ${tx.transaction_type === "debit" ? "debit" : "credit"}">
                    ${tx.transaction_type === "debit" ? "-" : "+"}₦${esc(tx.amount_ngn.toLocaleString())}
                  </td>
                  <td class="text-right">₦${esc(tx.balance_after_ngn.toLocaleString())}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          
          <div class="footer">
            <p>FleetPro Fleet Management System - Wallet Statement</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open(
      "",
      "_blank",
    );
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(
        () => {
          printWindow.print();
        },
        250,
      );
      toast.success("PDF export opened - use Print to save as PDF");
    }
    else {
      toast.error("Please allow popups to export PDF");
    }
  };

  return (
    <>
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
                    <p className={`text-4xl font-bold ${(walletInfo?.balance || 0) < 0 ? "text-destructive" : ""}`}>
                      ₦
                      {(walletInfo?.balance || 0).toLocaleString()}
                    </p>
                    {walletInfo?.credit_enabled && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Credit limit: ₦
                        {walletInfo.credit_limit.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button onClick={() => setTopupDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Top Up
                  </Button>
                </div>
                {walletInfo && walletInfo.balance < walletInfo.low_balance_threshold && (
                  <div className="mt-4 flex items-center gap-2 text-warning bg-warning/10 rounded-lg px-3 py-2">
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
                <p className="text-2xl font-bold">
                  ₦
                  {totalSpentThisMonth.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {monthDebitsQuery.data?.data.total ?? 0}
                  {" "}
                  transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Ups This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">
                  ₦
                  {monthTopups
                    .reduce(
                      (sum, tx) => sum + tx.amount,
                      0,
                    )
                    .toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {monthTopupsQuery.data?.data.total ?? 0}
                  {" "}
                  top-ups
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Analytics Charts */}
          <UsageAnalyticsChart transactions={transactions} />

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
                    <CardDescription className="text-xs truncate">
                      Channel usage for the
                      {usageRangeLabel}
                    </CardDescription>
                  </div>
                  <Select
                    value={usageRange}
                    onValueChange={v => setUsageRange(v as UsageRange)}
                  >
                    <SelectTrigger className="h-7 w-[120px] shrink-0 text-[11px] px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USAGE_RANGE_OPTIONS.map(opt => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-xs"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageByType.length === 0
                    ? (
                        <p className="text-muted-foreground text-center py-4">No usage for the selected range</p>
                      )
                    : (
                        usageByType.map(({
                          channel, amount, percentage,
                        }) => {
                          const type = BREAKDOWN_CHANNEL[channel] ?? channel;
                          return (
                            <div
                              key={channel}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${type === "call" ? "bg-info/10 text-info" : "bg-success/10 text-success"}`}>
                                  {channel === "data_bundle" ? <Smartphone className="h-4 w-4" /> : getTypeIcon(type)}
                                </div>
                                <div>
                                  <p className="font-medium capitalize">{type}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {percentage}
                                    % of spend
                                  </p>
                                </div>
                              </div>
                              <p className="font-semibold">
                                ₦
                                {amount.toLocaleString()}
                              </p>
                            </div>
                          );
                        })
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
                  <Select
                    value={rateFilter}
                    onValueChange={setRateFilter}
                  >
                    <SelectTrigger className="h-7 w-[130px] text-[11px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All channels</SelectItem>
                      {rates.map(r => (
                        <SelectItem
                          key={r.communication_type}
                          value={r.communication_type}
                          className="capitalize"
                        >
                          {r.communication_type.replace(
                            /_/g,
                            " ",
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rates.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No rates configured</p>
                  )}
                  {rates
                    .filter(r => rateFilter === "all" || r.communication_type === rateFilter)
                    .map(rate => (
                      <div
                        key={rate.communication_type}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            rate.communication_type === "call"
                              ? "bg-info/10 text-info"
                              : rate.communication_type === "sms"
                                ? "bg-success/10 text-success"
                                : "bg-success/10 text-success"
                          }`}
                          >
                            {getTypeIcon(rate.communication_type)}
                          </div>
                          <span className="font-medium capitalize">{rate.communication_type}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            ₦
                            {rate.rate_ngn}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rate.rate_unit === "per_minute" ? "per minute" : "per message"}
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
            <AutoTopupSettings
              tenantId={tenantId}
              onSettingsUpdated={fetchData}
            />
            <SpendingLimitSettings
              tenantId={tenantId}
              onUpdate={fetchData}
            />
          </div>

          {/* Postpaid Usage Section */}
          <Separator className="my-6" />
          <h3 className="text-lg font-semibold text-foreground mb-4">Postpaid Usage</h3>
          <PostpaidUsageDashboard tenantId={tenantId} />

          {/* Subscription Invoices & Receipts */}
          <SubscriptionInvoicesCard />

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>Latest 100 entries. Export as CSV for the full history.</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                    >
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
                    onChange={e => setTxSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Popover
                  open={filterPopoverOpen}
                  onOpenChange={(o) => {
                    if (o)
                      syncDraftsFromApplied();
                    setFilterPopoverOpen(o);
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                      {activeFilterCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 px-1.5"
                        >
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-80 space-y-4 max-h-[70vh] overflow-y-auto"
                  >
                    <h4 className="text-xs font-medium text-foreground px-0.5">Only show transactions by...</h4>

                    {/* Type */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="flt-tx-type"
                          checked={draftTypeEnabled}
                          onCheckedChange={c => setDraftTypeEnabled(c === true)}
                        />
                        <Label
                          htmlFor="flt-tx-type"
                          className="text-sm cursor-pointer"
                        >
                          Type
                        </Label>
                      </div>
                      <Select
                        value={draftType}
                        onValueChange={setDraftType}
                        disabled={!draftTypeEnabled}
                      >
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
                        <Checkbox
                          id="flt-tx-ch"
                          checked={draftChannelEnabled}
                          onCheckedChange={c => setDraftChannelEnabled(c === true)}
                        />
                        <Label
                          htmlFor="flt-tx-ch"
                          className="text-sm cursor-pointer"
                        >
                          Channel
                        </Label>
                      </div>
                      <Select
                        value={draftChannel}
                        onValueChange={setDraftChannel}
                        disabled={!draftChannelEnabled}
                      >
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
                        <Checkbox
                          id="flt-tx-amt"
                          checked={draftAmountEnabled}
                          onCheckedChange={c => setDraftAmountEnabled(c === true)}
                        />
                        <Label
                          htmlFor="flt-tx-amt"
                          className="text-sm cursor-pointer"
                        >
                          Amount (₦)
                        </Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="From"
                          disabled={!draftAmountEnabled}
                          value={draftAmountFrom}
                          onChange={e => setDraftAmountFrom(e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="To"
                          disabled={!draftAmountEnabled}
                          value={draftAmountTo}
                          onChange={e => setDraftAmountTo(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="flt-tx-date"
                          checked={draftDateEnabled}
                          onCheckedChange={c => setDraftDateEnabled(c === true)}
                        />
                        <Label
                          htmlFor="flt-tx-date"
                          className="text-sm cursor-pointer"
                        >
                          Date
                        </Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          disabled={!draftDateEnabled}
                          value={draftDateFrom}
                          onChange={e => setDraftDateFrom(e.target.value)}
                        />
                        <Input
                          type="date"
                          disabled={!draftDateEnabled}
                          value={draftDateTo}
                          onChange={e => setDraftDateTo(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        onClick={handleApplyFilters}
                        className="flex-1"
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShowAllFilters}
                        className="flex-1"
                      >
                        Show All
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={transactionColumns(getTypeIcon)}
                data={filteredTransactions}
                hasActiveFilters={transactions.length > 0}
                emptyState="No transactions yet"
                filteredEmptyState="No transactions match your filters"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top-up Dialog */}
      <Dialog
        open={topupDialogOpen}
        onOpenChange={setTopupDialogOpen}
      >
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
                {quickTopupAmounts.map(amount => (
                  <Button
                    key={amount}
                    variant={topupAmount === amount.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTopupAmount(amount.toString())}
                  >
                    ₦
                    {amount.toLocaleString()}
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
                onChange={e => setTopupAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">MTN Mobile Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 08031234567"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You'll receive a prompt on this number to approve the payment
              </p>
            </div>

            {topupAmount && (
              <div className="bg-muted rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount to pay:</span>
                  <span className="text-xl font-bold">
                    ₦
                    {Number.parseFloat(topupAmount || "0").toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-muted-foreground">New balance:</span>
                  <span className="font-medium text-success">
                    ₦
                    {((walletInfo?.balance || 0) + Number.parseFloat(topupAmount || "0")).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTopupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTopup}
              disabled={topupLoading || !topupAmount || !phoneNumber}
            >
              {topupLoading
                ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )
                : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
              Pay with MoMo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
