import type {
  DataBundleAllocationsQuery, DataBundleAnalyticsRangeQuery, DataBundleRatesQuery, DataBundleTransactionsQuery,
} from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getDataBundleAllocationsQueryOptions,
  getDataBundleAutoTopupQueryOptions,
  getDataBundleCarrierDistributionQueryOptions,
  getDataBundleCarriersQueryOptions,
  getDataBundleDashboardSummaryQueryOptions,
  getDataBundleRatesQueryOptions,
  getDataBundleSpendBreakdownQueryOptions,
  getDataBundleSpendingLimitQueryOptions,
  getDataBundleSpendTrendQueryOptions,
  getDataBundleSubscriptionUsageQueryOptions,
  getDataBundleTransactionsQueryOptions,
  getDataBundleWalletBalanceQueryOptions,
  useDisableDataBundleAutoTopup,
  useDisableDataBundleSpendingLimit,
  useSaveDataBundleAutoTopup,
  useSaveDataBundleSpendingLimit,
  useTopUpDataBundleWallet,
} from "@truckmoov/api/auth";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import {
  Activity, AlertTriangle, ArrowUpRight, Clock, CreditCard, Database, Download,
  Eye, Mail, MoreHorizontal, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal, Smartphone,
  TrendingUp, Wallet, Wifi, Zap,
} from "lucide-react";
import {
  useEffect, useMemo, useState,
} from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/shadcn/alert";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuthStore } from "@/stores/authStore";

const formatBundleSize = (mb: number) => mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
function formatDataUsedGb(gb: number) {
  return `${Number(gb || 0).toLocaleString(
    undefined,
    { maximumFractionDigits: 1 },
  )} GB`;
}
function useBundleTopup() {
  return {
    mutateAsync: async (..._args: any[]) => {}, isPending: false,
  };
}

function useDebouncedValue<T>(value: T, delay = 400) {
  const [
    debouncedValue,
    setDebouncedValue,
  ] = useState(value);

  useEffect(
    () => {
      const timer = window.setTimeout(
        setDebouncedValue,
        delay,
        value,
      );
      return () => window.clearTimeout(timer);
    },
    [
      value,
      delay,
    ],
  );

  return debouncedValue;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
];

type AutoTopupSettings = {
  enabled: boolean;
  triggerBalance: number; // NGN — top up when balance drops below
  topupAmount: number; // NGN — amount to top up
  momoPhone: string; // MTN MoMo phone number
};

const TRIGGER_PRESETS = [
  500,
  1000,
  2000,
  5000,
];
const AMOUNT_PRESETS = [
  2000,
  5000,
  10000,
  20000,
];

const RANGE_OPTIONS = [
  {
    value: "today", label: "Today", days: 1,
  },
  {
    value: "yesterday", label: "Yesterday", days: 2,
  },
  {
    value: "7d", label: "Last 7 days", days: 7,
  },
  {
    value: "30d", label: "Last 30 days", days: 30,
  },
  {
    value: "90d", label: "Last 90 days", days: 90,
  },
];

function toAnalyticsRange(rangeKey: string): DataBundleAnalyticsRangeQuery {
  return { params: { range: rangeKey === "7d" || rangeKey === "90d" ? rangeKey : "30d" } };
}

/* ── Format a Nigerian mobile number into a human-readable form ── */
function formatMobile(raw: string) {
  if (!raw)
    return "";
  const digits = raw.replace(
    /\D/g,
    "",
  );
  // Normalize 234XXXXXXXXXX -> 0XXXXXXXXXX
  const local = digits.startsWith("234") ? `0${digits.slice(3)}` : digits.startsWith("0") ? digits : `0${digits}`;
  if (local.length !== 11)
    return raw;
  return `${local.slice(
    0,
    4,
  )} ${local.slice(
    4,
    7,
  )} ${local.slice(7)}`;
}

type SpendingLimitSettings = {
  enabled: boolean;
  monthlyLimit: number; // NGN
  resetDay: number; // 1-28
  alertEmail: string;
};

export default function DataBundles() {
  const { user } = useAuthStore();
  const { format: fmtCurrency } = useCurrency();
  const tenantId = user?.tenantId;
  const catalogQuery = useQuery(getDataBundleRatesQueryOptions({
    params: {
      page: 1, limit: 100,
    },
  }));
  const catalog = useMemo(
    () => (catalogQuery.data?.data.items ?? []).map(rate => ({
      id: rate.id,
      code: rate.code,
      name: rate.name,
      carrier: rate.carrier,
      data_mb: rate.dataAmountGb * 1024,
      validity_days: rate.validityDays,
      price_ngn: rate.price,
      billing_cycle: rate.billingCycle,
      is_active: rate.active,
    })),
    [catalogQuery.data],
  );
  const dataBundleSummaryQuery = useQuery(getDataBundleDashboardSummaryQueryOptions());
  const dataBundleSummary = dataBundleSummaryQuery.data?.data;
  const walletBalanceQuery = useQuery(getDataBundleWalletBalanceQueryOptions());
  const walletBalance = walletBalanceQuery.data?.data;
  const spendingLimitQuery = useQuery(getDataBundleSpendingLimitQueryOptions());
  const spendingLimit = spendingLimitQuery.data?.data;
  const autoTopupQuery = useQuery(getDataBundleAutoTopupQueryOptions());
  const autoTopup = autoTopupQuery.data?.data;
  const carriersQuery = useQuery(getDataBundleCarriersQueryOptions());

  const topup = useBundleTopup();
  const walletTopup = useTopUpDataBundleWallet();
  const saveAutoTopup = useSaveDataBundleAutoTopup();
  const disableAutoTopup = useDisableDataBundleAutoTopup();
  const saveSpendingLimit = useSaveDataBundleSpendingLimit();
  const disableSpendingLimit = useDisableDataBundleSpendingLimit();

  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    autoOpen,
    setAutoOpen,
  ] = useState(false);
  const [
    limitOpen,
    setLimitOpen,
  ] = useState(false);
  const [
    allocOpen,
    setAllocOpen,
  ] = useState(false);
  const [
    viewOpen,
    setViewOpen,
  ] = useState(false);
  const [
    viewAlloc,
    setViewAlloc,
  ] = useState<any | null>(null);
  const [_msisdn] = useState("");
  const [_bundleCode] = useState("");
  const [
    topupAmount,
    setTopupAmount,
  ] = useState<number | "">("");
  const [
    topupMomo,
    setTopupMomo,
  ] = useState("");
  // Allocate-bundle state (cascading: Carrier → Plan type → Bundle size)
  const [
    allocCarrier,
    setAllocCarrier,
  ] = useState<string>("");
  const [
    allocCycle,
    setAllocCycle,
  ] = useState<string>("");
  const [
    allocBundle,
    setAllocBundle,
  ] = useState<string>("");
  const [
    allocNumbers,
    setAllocNumbers,
  ] = useState<string>("");

  // Filters
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    draftStatusFilter,
    setDraftStatusFilter,
  ] = useState<string>("all");
  const [
    filterCycles,
    setFilterCycles,
  ] = useState<string[]>([]);
  const [
    draftCycles,
    setDraftCycles,
  ] = useState<string[]>([]);

  const debouncedAllocationSearch = useDebouncedValue(search.trim());
  const allocationQueryPayload = useMemo<DataBundleAllocationsQuery>(
    () => ({
      params: {
        search: debouncedAllocationSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        billingCycles: filterCycles.length > 0 ? filterCycles : undefined,
        page: 1,
        limit: 100,
      },
    }),
    [
      debouncedAllocationSearch,
      statusFilter,
      filterCycles,
    ],
  );

  const allocationsQuery = useQuery(getDataBundleAllocationsQueryOptions(allocationQueryPayload));
  const isLoading = allocationsQuery.isLoading;
  const allocationsLive = useMemo(
    () => {
      return (allocationsQuery.data?.data.items ?? []).map(item => ({
        id: item.id,
        msisdn: item.mobileNumber,
        bundle_code: item.bundle.code,
        bundle: item.bundle,
        data_mb_total: item.dataTotalMb,
        data_mb_used: item.dataUsedMb,
        usage_percentage: item.usagePercentage,
        status: item.status,
        expires_at: item.expiresAt,
        created_at: item.activatedAt,
        days_left: item.daysLeft,
      }));
    },
    [allocationsQuery.data],
  );

  const allocations = allocationsLive;

  // Analytics range filters
  const [
    spendRange,
    setSpendRange,
  ] = useState("30d");
  const [
    channelRange,
    setChannelRange,
  ] = useState("30d");
  const [
    usageRange,
    setUsageRange,
  ] = useState("30d");

  const spendTrendQuery = useQuery(getDataBundleSpendTrendQueryOptions(toAnalyticsRange(spendRange)));
  const spendBreakdownQuery = useQuery(getDataBundleSpendBreakdownQueryOptions(toAnalyticsRange(spendRange)));
  const carrierDistributionQuery = useQuery(getDataBundleCarrierDistributionQueryOptions(toAnalyticsRange(channelRange)));
  const subscriptionUsageQuery = useQuery(getDataBundleSubscriptionUsageQueryOptions());

  // Transaction history filters
  const [
    txSearch,
    setTxSearch,
  ] = useState("");
  const [
    txStatus,
    setTxStatus,
  ] = useState("all");
  const [
    txCarriers,
    setTxCarriers,
  ] = useState<string[]>([]);
  const [
    txDraftCarriers,
    setTxDraftCarriers,
  ] = useState<string[]>([]);

  const debouncedTransactionSearch = useDebouncedValue(txSearch.trim());
  const transactionQueryPayload = useMemo<DataBundleTransactionsQuery>(
    () => ({
      params: {
        search: debouncedTransactionSearch || undefined,
        status: txStatus === "all" ? undefined : txStatus,
        carriers: txCarriers.length > 0 ? txCarriers : undefined,
        page: 1,
        limit: 100,
      },
    }),
    [
      debouncedTransactionSearch,
      txStatus,
      txCarriers,
    ],
  );

  const transactionsQuery = useQuery(getDataBundleTransactionsQueryOptions(transactionQueryPayload));
  const topupsLive = useMemo(
    () => {
      return (transactionsQuery.data?.data.items ?? []).map(item => ({
        id: item.id,
        created_at: item.date,
        msisdn: item.mobileNumber,
        bundle_code: item.bundle.code,
        bundle: item.bundle,
        status: String(item.status).toUpperCase(),
        amount_ngn: item.amount,
        payment_reference: item.paymentReference,
        failure_reason: item.failureReason,
      }));
    },
    [transactionsQuery.data],
  );
  const topups = topupsLive;

  // Rates filters
  const [
    ratesSearch,
    setRatesSearch,
  ] = useState("");
  const [
    ratesCarriers,
    setRatesCarriers,
  ] = useState<string[]>([]);
  const [
    ratesDraftCarriers,
    setRatesDraftCarriers,
  ] = useState<string[]>([]);
  const [
    ratesPlanType,
    setRatesPlanType,
  ] = useState("all");
  const [
    ratesDraftPlanType,
    setRatesDraftPlanType,
  ] = useState("all");

  const debouncedRatesSearch = useDebouncedValue(ratesSearch.trim());
  const ratesQueryPayload = useMemo<DataBundleRatesQuery>(
    () => ({
      params: {
        search: debouncedRatesSearch || undefined,
        carriers: ratesCarriers.length > 0 ? ratesCarriers : undefined,
        planType: ratesPlanType === "all" ? undefined : ratesPlanType,
        page: 1,
        limit: 100,
      },
    }),
    [
      debouncedRatesSearch,
      ratesCarriers,
      ratesPlanType,
    ],
  );

  const ratesQuery = useQuery(getDataBundleRatesQueryOptions(ratesQueryPayload));
  const ratesLive = useMemo(
    () => {
      return (ratesQuery.data?.data.items ?? []).map(rate => ({
        id: rate.id,
        code: rate.code,
        name: rate.name,
        carrier: rate.carrier,
        data_mb: rate.dataAmountGb * 1024,
        validity_days: rate.validityDays,
        price_ngn: rate.price,
        billing_cycle: rate.billingCycle,
        is_active: rate.active,
      }));
    },
    [ratesQuery.data],
  );
  const dataBundleCarriers = useMemo(
    () => {
      const liveCarriers = carriersQuery.data?.data.carriers ?? [];
      if (liveCarriers.length > 0) {
        return liveCarriers.filter(carrier => carrier.active).map(carrier => ({
          value: carrier.name,
          label: carrier.displayName || carrier.name,
        }));
      }
      return Array.from(new Set(catalog.map(b => b.carrier))).map(carrier => ({
        value: carrier,
        label: carrier,
      }));
    },
    [
      carriersQuery.data,
      catalog,
    ],
  );

  // Auto-topup settings
  const [
    auto,
    setAuto,
  ] = useState<AutoTopupSettings>({
    enabled: false,
    triggerBalance: 500,
    topupAmount: 5000,
    momoPhone: "",
  });
  // Spending limit settings
  const [
    limit,
    setLimit,
  ] = useState<SpendingLimitSettings>({
    enabled: false,
    monthlyLimit: 50000,
    resetDay: 1,
    alertEmail: "",
  });

  useEffect(
    () => {
      if (!autoTopup)
        return;
      setAuto({
        enabled: autoTopup.enabled,
        triggerBalance: autoTopup.thresholdAmount,
        topupAmount: autoTopup.topUpAmount,
        momoPhone: autoTopup.mobileNumber,
      });
    },
    [autoTopup],
  );

  useEffect(
    () => {
      if (!spendingLimit)
        return;
      setLimit({
        enabled: spendingLimit.enabled,
        monthlyLimit: spendingLimit.monthlyLimit,
        resetDay: spendingLimit.resetDayOfMonth,
        alertEmail: spendingLimit.alertEmail,
      });
    },
    [spendingLimit],
  );

  const expiringSoon = useMemo(
    () => allocations.filter((a) => {
      const days = (new Date(a.expires_at).getTime() - Date.now()) / 86400000;
      return days <= 7 && days > 0;
    }),
    [allocations],
  );
  const expired = useMemo(
    () => allocations.filter(a => new Date(a.expires_at).getTime() < Date.now()),
    [allocations],
  );

  // KPIs
  const usedDataMb = allocations.reduce(
    (s, a) => s + (a.data_mb_used || 0),
    0,
  );

  const successTopups = useMemo(
    () => topups.filter((t: { status: string }) => t.status === "SUCCESS"),
    [topups],
  );

  const totalToppedUp = useMemo(
    () =>
      successTopups.reduce(
        (sum, t: { bundle_code: string }) => {
          const b = catalog.find(c => c.code === t.bundle_code);
          return sum + (b ? Number(b.price_ngn) : 0);
        },
        0,
      ),
    [
      successTopups,
      catalog,
    ],
  );

  const monthSpend = useMemo(
    () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(
        0,
        0,
        0,
        0,
      );
      return successTopups
        .filter((t: { created_at: string }) => new Date(t.created_at) >= start)
        .reduce(
          (sum, t: { bundle_code: string }) => {
            const b = catalog.find(c => c.code === t.bundle_code);
            return sum + (b ? Number(b.price_ngn) : 0);
          },
          0,
        );
    },
    [
      successTopups,
      catalog,
    ],
  );

  const monthTopupCount = useMemo(
    () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(
        0,
        0,
        0,
        0,
      );
      return successTopups.filter((t: { created_at: string }) => new Date(t.created_at) >= start).length;
    },
    [successTopups],
  );

  // Current balance — total NGN value of remaining (unused) data across bundles
  const currentBalance = useMemo(
    () => {
      return allocations.reduce(
        (sum, a) => {
          const b = catalog.find(c => c.code === a.bundle_code);
          if (!b || !b.data_mb)
            return sum;
          const remainingPct = Math.max(
            0,
            (a.data_mb_total - a.data_mb_used) / a.data_mb_total,
          );
          return sum + Number(b.price_ngn) * remainingPct;
        },
        0,
      );
    },
    [
      allocations,
      catalog,
    ],
  );

  const statValues = {
    totalDataUsed: dataBundleSummary ? formatDataUsedGb(dataBundleSummary.totalDataUsedGb) : formatBundleSize(usedDataMb),
    currentBalance: fmtCurrency(walletBalance?.balance ?? dataBundleSummary?.walletBalance ?? currentBalance),
    monthlySpend: fmtCurrency(dataBundleSummary?.monthlySpend ?? monthSpend),
    topUpsThisMonth: dataBundleSummary?.topUpsThisMonth ?? monthTopupCount,
    activeBundles: dataBundleSummary?.activeAllocations ?? allocations.length,
  };

  const topupSummaryValues = {
    totalAmount: dataBundleSummary?.totalAmountToppedUp ?? totalToppedUp,
    successfulTransactions: dataBundleSummary?.successfulTopUpTransactions ?? successTopups.length,
  };

  const bundleAlertCounts = {
    expired: dataBundleSummary?.expiredAllocations ?? expired.length,
    expiringSoon: dataBundleSummary?.expiringWithinSevenDays ?? expiringSoon.length,
  };

  const filtered = allocations;

  const rangeStart = (rangeKey: string) => {
    const opt = RANGE_OPTIONS.find(r => r.value === rangeKey) ?? RANGE_OPTIONS[3];
    const d = new Date();
    if (rangeKey === "yesterday") {
      d.setDate(d.getDate() - 1);
      d.setHours(
        0,
        0,
        0,
        0,
      );
      return d;
    }
    d.setDate(d.getDate() - opt.days);
    return d;
  };

  // Analytics: daily spending trend (range-aware)
  const dailySpend = useMemo(
    () => {
      if (spendTrendQuery.data) {
        return spendTrendQuery.data.data.trend.map(point => ({
          day: point.date.slice(5),
          spend: point.amount,
        }));
      }
      const opt = RANGE_OPTIONS.find(r => r.value === spendRange) ?? RANGE_OPTIONS[3];
      const days = opt.days;
      const buckets = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        buckets.set(
          d.toISOString().slice(
            0,
            10,
          ),
          0,
        );
      }
      successTopups.forEach((t: {
        created_at: string; bundle_code: string;
      }) => {
        const key = new Date(t.created_at).toISOString().slice(
          0,
          10,
        );
        if (!buckets.has(key))
          return;
        const b = catalog.find(c => c.code === t.bundle_code);
        buckets.set(
          key,
          (buckets.get(key) ?? 0) + (b ? Number(b.price_ngn) : 0),
        );
      });
      return Array.from(buckets.entries()).map(([
        day,
        spend,
      ]) => ({
        day: day.slice(5),
        spend,
      }));
    },
    [
      successTopups,
      catalog,
      spendRange,
      spendTrendQuery.data,
    ],
  );

  // Spend breakdown by bundle (range-aware)
  const spendBreakdown = useMemo(
    () => {
      if (spendBreakdownQuery.data) {
        return spendBreakdownQuery.data.data.breakdown.map(item => ({
          name: item.bundleName || item.bundleCode,
          value: item.amount,
        }));
      }
      const start = rangeStart(spendRange);
      const map = new Map<string, number>();
      successTopups
        .filter((t: { created_at: string }) => new Date(t.created_at) >= start)
        .forEach((t: { bundle_code: string }) => {
          const b = catalog.find(c => c.code === t.bundle_code);
          if (!b)
            return;
          map.set(
            b.name,
            (map.get(b.name) ?? 0) + Number(b.price_ngn),
          );
        });
      return Array.from(map.entries()).map(([
        name,
        value,
      ]) => ({
        name, value,
      }));
    },
    [
      successTopups,
      catalog,
      spendRange,
      spendBreakdownQuery.data,
    ],
  );

  // Channel distribution by carrier (range-aware via topups)
  const channelDistribution = useMemo(
    () => {
      if (carrierDistributionQuery.data) {
        return carrierDistributionQuery.data.data.distribution.map(item => ({
          name: item.carrierId,
          value: item.amount,
        }));
      }
      const start = rangeStart(channelRange);
      const map = new Map<string, number>();
      successTopups
        .filter((t: { created_at: string }) => new Date(t.created_at) >= start)
        .forEach((t: { bundle_code: string }) => {
          const b = catalog.find(c => c.code === t.bundle_code);
          const carrier = b?.carrier ?? "Unknown";
          map.set(
            carrier,
            (map.get(carrier) ?? 0) + 1,
          );
        });
      return Array.from(map.entries()).map(([
        name,
        value,
      ]) => ({
        name, value,
      }));
    },
    [
      successTopups,
      catalog,
      channelRange,
      carrierDistributionQuery.data,
    ],
  );

  // Subscription usage (per bundle) — range-aware via topups counts
  const usageByBundle = useMemo(
    () => {
      if (subscriptionUsageQuery.data) {
        return subscriptionUsageQuery.data.data.usage.map(item => ({
          name: item.bundleCode,
          used: item.usedMb,
          total: item.totalMb,
        }));
      }
      const start = rangeStart(usageRange);
      const map = new Map<string, {
        name: string; used: number; total: number;
      }>();
      allocations.forEach((a) => {
        if (new Date(a.created_at ?? Date.now()) < start)
          return;
        const cur = map.get(a.bundle_code) ?? {
          name: a.bundle_code, used: 0, total: 0,
        };
        cur.used += a.data_mb_used || 0;
        cur.total += a.data_mb_total || 0;
        map.set(
          a.bundle_code,
          cur,
        );
      });
      if (map.size === 0) {
      // fallback to full allocations if range yields nothing
        allocations.forEach((a) => {
          const cur = map.get(a.bundle_code) ?? {
            name: a.bundle_code, used: 0, total: 0,
          };
          cur.used += a.data_mb_used || 0;
          cur.total += a.data_mb_total || 0;
          map.set(
            a.bundle_code,
            cur,
          );
        });
      }
      return Array.from(map.values()).slice(
        0,
        8,
      );
    },
    [
      allocations,
      usageRange,
      subscriptionUsageQuery.data,
    ],
  );

  const filteredTopups = topups;

  const filteredRates = ratesQuery.data ? ratesLive : catalog.filter(b => b.is_active);

  const handleTopup = async () => {
    if (!topupAmount || !topupMomo)
      return;
    await walletTopup.mutateAsync({
      data: {
        amount: Number(topupAmount),
        mobileMoneyProvider: "MTN",
        mobileNumber: topupMomo,
      },
    });
    setOpen(false);
    setTopupAmount("");
    setTopupMomo("");
  };

  // Parse pasted/typed numbers (newline, comma, space separated) into clean list
  const parsedAllocNumbers = useMemo(
    () => allocNumbers.split(/[\s,;]+/).map(n => n.trim()).filter(Boolean),
    [allocNumbers],
  );
  const allocBundleObj = useMemo(
    () => catalog.find(b => b.code === allocBundle),
    [
      catalog,
      allocBundle,
    ],
  );
  const allocTotalCost = allocBundleObj ? Number(allocBundleObj.price_ngn) : 0;

  const handleAllocate = async () => {
    if (!tenantId || !allocBundle || parsedAllocNumbers.length === 0)
      return;
    for (const num of parsedAllocNumbers) {
      try {
        await topup.mutateAsync({
          tenant_id: tenantId, msisdn: num, bundle_code: allocBundle,
        });
      }
      catch { /* continue allocating remaining numbers */ }
    }
    setAllocOpen(false);
    setAllocCarrier("");
    setAllocCycle("");
    setAllocBundle("");
    setAllocNumbers("");
  };

  const exportCsv = () => {
    const header = [
      "MSISDN",
      "Bundle",
      "Used (MB)",
      "Total (MB)",
      "Expires",
      "Status",
    ];
    const rows = filtered.map(a => [
      a.msisdn,
      a.bundle_code,
      a.data_mb_used,
      a.data_mb_total,
      new Date(a.expires_at).toISOString(),
      a.status,
    ]);
    const csv = [
      header,
      ...rows,
    ].map(r => r.join(",")).join("\n");
    const blob = new Blob(
      [csv],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data-bundles-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyFilter = () => {
    setFilterCycles(draftCycles);
    setStatusFilter(draftStatusFilter);
  };
  const clearFilter = () => {
    setDraftCycles([]);
    setFilterCycles([]);
    setDraftStatusFilter("all");
    setStatusFilter("all");
  };

  const applyTxFilter = () => {
    setTxCarriers(txDraftCarriers);
  };
  const clearTxFilter = () => {
    setTxDraftCarriers([]);
    setTxCarriers([]);
  };

  const applyRatesFilter = () => {
    setRatesCarriers(ratesDraftCarriers);
    setRatesPlanType(ratesDraftPlanType);
  };
  const clearRatesFilter = () => {
    setRatesDraftCarriers([]);
    setRatesCarriers([]);
    setRatesDraftPlanType("all");
    setRatesPlanType("all");
  };

  const downloadCsv = (filename: string, header: string[], rows: (string | number)[][]) => {
    const csv = [
      header,
      ...rows,
    ].map(r => r.join(",")).join("\n");
    const blob = new Blob(
      [csv],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportTopupsCsv = () => downloadCsv(
    `transactions-${Date.now()}.csv`,
    [
      "Date",
      "MSISDN",
      "Bundle",
      "Amount",
      "Status",
    ],
    filteredTopups.map((t: {
      created_at: string; msisdn: string; bundle_code: string; status: string;
    }) => {
      const b = catalog.find(c => c.code === t.bundle_code);
      return [
        new Date(t.created_at).toISOString(),
        t.msisdn,
        t.bundle_code,
        b ? Number(b.price_ngn) : 0,
        t.status,
      ];
    }),
  );

  const exportRatesCsv = () => downloadCsv(
    `rates-${Date.now()}.csv`,
    [
      "Bundle",
      "Carrier",
      "Data (MB)",
      "Validity (days)",
      "Cycle",
      "Price (NGN)",
    ],
    filteredRates.map(b => [
      b.name,
      b.carrier,
      b.data_mb,
      b.validity_days,
      b.billing_cycle,
      Number(b.price_ngn),
    ]),
  );

  const saveAuto = async () => {
    await saveAutoTopup.mutateAsync({
      data: {
        thresholdAmount: auto.triggerBalance,
        topUpAmount: auto.topupAmount,
        paymentProvider: "MTN",
        mobileNumber: auto.momoPhone,
      },
    });
    setAuto(current => ({
      ...current, enabled: true,
    }));
    setAutoOpen(false);
  };

  const disableAuto = async () => {
    await disableAutoTopup.mutateAsync();
    setAuto(current => ({
      ...current, enabled: false,
    }));
    setAutoOpen(false);
  };

  const saveLimit = async () => {
    await saveSpendingLimit.mutateAsync({
      data: {
        monthlyLimit: limit.monthlyLimit,
        resetDayOfMonth: limit.resetDay,
        alertEmail: limit.alertEmail,
        notifyAtPercentages: [
          80,
          100,
        ],
      },
    });
    setLimit(current => ({
      ...current, enabled: true,
    }));
    setLimitOpen(false);
  };

  const disableLimit = async () => {
    await disableSpendingLimit.mutateAsync();
    setLimit(current => ({
      ...current, enabled: false,
    }));
    setLimitOpen(false);
  };

  const isPageLoading
    = dataBundleSummaryQuery.isLoading
      || walletBalanceQuery.isLoading
      || allocationsQuery.isLoading
      || transactionsQuery.isLoading
      || catalogQuery.isLoading;

  if (isPageLoading) {
    return (
      <div
        className="space-y-6"
        aria-busy="true"
        aria-label="Loading data bundles"
      >
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from(
            { length: 5 },
            (_, index) => (
              <Skeleton
                key={index}
                className="h-48 w-full"
              />
            ),
          )}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Data Bundles</h1>
          <p className="text-sm text-muted-foreground">
            Manage bundle allocations, top-ups, auto-renewal and spending limits
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setLimitOpen(true)}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            {" "}
            Spending Limits
          </Button>
          <Button
            variant="outline"
            onClick={() => setAutoOpen(true)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {" "}
            Auto Top-up
          </Button>
          <Dialog
            open={open}
            onOpenChange={setOpen}
          >
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                {" "}
                Top-up Bundle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  {" "}
                  Top Up Wallet
                </DialogTitle>
                <DialogDescription>
                  Add funds to your wallet using MTN Mobile Money
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quick Amounts</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      5000,
                      10000,
                      25000,
                      50000,
                      100000,
                    ].map(v => (
                      <Button
                        key={v}
                        type="button"
                        variant={topupAmount === v ? "gradient" : "outline"}
                        size="sm"
                        onClick={() => setTopupAmount(v)}
                      >
                        ₦
                        {v.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amount (₦)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={topupAmount}
                    onChange={e => setTopupAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">MTN Mobile Number</Label>
                  <Input
                    placeholder="e.g., 08031234567"
                    value={topupMomo}
                    onChange={e => setTopupMomo(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll receive a prompt on this number to approve the payment
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleTopup}
                  disabled={!topupAmount || !topupMomo || walletTopup.isPending}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {walletTopup.isPending ? "Processing..." : "Pay with MoMo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Total Topped Up — own container */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Total Amount Topped Up</p>
            <p className="text-xl font-bold truncate">{fmtCurrency(topupSummaryValues.totalAmount)}</p>
            <p className="text-xs text-muted-foreground">
              Across
              {topupSummaryValues.successfulTransactions}
              {" "}
              successful transactions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Data Used"
          value={statValues.totalDataUsed}
          icon={Activity}
        />
        <StatCard
          title="Current Balance"
          value={statValues.currentBalance}
          icon={Wallet}
        />
        <StatCard
          title="Total Spend This Month"
          value={statValues.monthlySpend}
          icon={TrendingUp}
        />
        <StatCard
          title="Top-ups This Month"
          value={statValues.topUpsThisMonth}
          icon={ArrowUpRight}
        />
        <StatCard
          title="Active Bundles"
          value={statValues.activeBundles}
          icon={Database}
        />
      </div>

      {/* Alerts */}
      {bundleAlertCounts.expired > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {bundleAlertCounts.expired}
            {" "}
            bundle(s) expired
          </AlertTitle>
          <AlertDescription>These SIMs are no longer carrying data. Top up to restore service.</AlertDescription>
        </Alert>
      )}
      {bundleAlertCounts.expiringSoon > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>
            {bundleAlertCounts.expiringSoon}
            {" "}
            bundle(s) expiring within 7 days
          </AlertTitle>
          <AlertDescription>Renew now or enable auto top-up to avoid interruption.</AlertDescription>
        </Alert>
      )}

      <Tabs
        defaultValue="bundles"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="bundles">My Bundles</TabsTrigger>
          <TabsTrigger value="topups">Transaction History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="rates">Current Rates</TabsTrigger>
        </TabsList>

        {/* MY BUNDLES */}
        <TabsContent
          value="bundles"
          className="space-y-4"
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    {" "}
                    Active Allocations
                  </CardTitle>
                  <CardDescription>Active data bundles assigned to your SIMs, with consumption and expiry status to help you plan top-ups.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCsv}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {" "}
                  Export Data
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search mobile number or bundle..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {" "}
                      Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-3 rounded-xl space-y-3"
                    align="end"
                    sideOffset={8}
                  >
                    <h4 className="text-xs font-medium text-foreground px-0.5">Only show allocations by...</h4>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium">Status</p>
                      <Select
                        value={draftStatusFilter}
                        onValueChange={setDraftStatusFilter}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="expiring">Expiring soon</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium">Billing cycle</p>
                      <div className="space-y-1.5 pl-0.5">
                        {[
                          {
                            v: "monthly", l: "Monthly",
                          },
                          {
                            v: "yearly", l: "Yearly",
                          },
                        ].map(opt => (
                          <label
                            key={opt.v}
                            className="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <Checkbox
                              checked={draftCycles.includes(opt.v)}
                              onCheckedChange={c => setDraftCycles(prev => c
                                ? [
                                    ...prev,
                                    opt.v,
                                  ]
                                : prev.filter(x => x !== opt.v))}
                              className="h-3.5 w-3.5"
                            />
                            <span className="text-xs">{opt.l}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={applyFilter}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={clearFilter}
                      >
                        Show All
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead>Bundle</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Loading...
                          </TableCell>
                        </TableRow>
                      )
                    : filtered.length === 0
                      ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No bundles match your filters.
                            </TableCell>
                          </TableRow>
                        )
                      : filtered.map((a) => {
                          const pct = a.data_mb_total > 0 ? (a.data_mb_used / a.data_mb_total) * 100 : 0;
                          const days = a.days_left ?? Math.ceil((new Date(a.expires_at).getTime() - Date.now()) / 86400000);
                          const status = String(a.status).toUpperCase();
                          const isExpired = status === "EXPIRED" || days <= 0;
                          return (
                            <TableRow key={a.id}>
                              <TableCell className="text-sm">{formatMobile(a.msisdn)}</TableCell>
                              <TableCell>{a.bundle_code}</TableCell>
                              <TableCell className="w-[200px]">
                                <div className="space-y-1">
                                  <Progress
                                    value={pct}
                                    className="h-2"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    {formatBundleSize(a.data_mb_used)}
                                    {" "}
                                    /
                                    {formatBundleSize(a.data_mb_total)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {isExpired
                                  ? <Badge variant="destructive">Expired</Badge>
                                  : (
                                      <span className="text-sm">
                                        {days}
                                        d left
                                      </span>
                                    )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>{status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setViewAlloc(a);
                                      setViewOpen(true);
                                    }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      {" "}
                                      View allocation
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => {
                                      const b = a.bundle ?? catalog.find(c => c.code === a.bundle_code);
                                      setAllocCarrier(b?.carrier ?? "");
                                      setAllocCycle((b && ("billingCycle" in b ? b.billingCycle : b.billing_cycle)) ?? "");
                                      setAllocBundle(a.bundle_code);
                                      setAllocNumbers(formatMobile(a.msisdn));
                                      setAllocOpen(true);
                                    }}
                                    >
                                      <Smartphone className="h-4 w-4 mr-2" />
                                      {" "}
                                      Allocate bundle
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRANSACTION HISTORY */}
        <TabsContent value="topups">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Chronological log of every bundle top-up — useful for reconciling spend and tracking failed attempts.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTopupsCsv}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {" "}
                  Export Data
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search mobile number or bundle..."
                    value={txSearch}
                    onChange={e => setTxSearch(e.target.value)}
                  />
                </div>
                <Select
                  value={txStatus}
                  onValueChange={setTxStatus}
                >
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {" "}
                      Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-3 rounded-xl space-y-3"
                    align="end"
                    sideOffset={8}
                  >
                    <h4 className="text-xs font-medium text-foreground px-0.5">Only show transactions by...</h4>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium">Carrier</p>
                      <div className="space-y-1.5 pl-0.5">
                        {dataBundleCarriers.map(carrier => (
                          <label
                            key={carrier.value}
                            className="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <Checkbox
                              checked={txDraftCarriers.includes(carrier.value)}
                              onCheckedChange={chk => setTxDraftCarriers(prev => chk
                                ? [
                                    ...prev,
                                    carrier.value,
                                  ]
                                : prev.filter(x => x !== carrier.value))}
                              className="h-3.5 w-3.5"
                            />
                            <span className="text-xs">{carrier.label}</span>
                          </label>
                        ))}
                        {dataBundleCarriers.length === 0 && <p className="text-xs text-muted-foreground">No carriers</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={applyTxFilter}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={clearTxFilter}
                      >
                        Show All
                      </Button>
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
                    <TableHead>Mobile Number</TableHead>
                    <TableHead>Bundle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsQuery.isLoading
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-6 text-muted-foreground"
                          >
                            Loading...
                          </TableCell>
                        </TableRow>
                      )
                    : filteredTopups.length === 0
                      ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-6 text-muted-foreground"
                            >
                              No transactions match your filters
                            </TableCell>
                          </TableRow>
                        )
                      : filteredTopups.slice(
                          0,
                          100,
                        ).map((t: {
                          id: string; created_at: string; msisdn: string; bundle_code: string; status: string; amount_ngn?: number; bundle?: { carrier?: string };
                        }) => {
                          const b = catalog.find(c => c.code === t.bundle_code);
                          const amt = Number(t.amount_ngn ?? b?.price_ngn ?? 0);
                          return (
                            <TableRow key={t.id}>
                              <TableCell className="text-sm">{new Date(t.created_at).toLocaleString()}</TableCell>
                              <TableCell className="text-sm">{formatMobile(t.msisdn)}</TableCell>
                              <TableCell>{t.bundle_code}</TableCell>
                              <TableCell>{fmtCurrency(amt)}</TableCell>
                              <TableCell>
                                <Badge variant={t.status === "SUCCESS" ? "default" : t.status === "FAILED" ? "destructive" : "secondary"}>
                                  {t.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent
          value="analytics"
          className="space-y-4"
        >
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {" "}
                    Daily Spending Trend
                  </CardTitle>
                  <CardDescription>Spending over time</CardDescription>
                </div>
                <Select
                  value={spendRange}
                  onValueChange={setSpendRange}
                >
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RANGE_OPTIONS.map(r => (
                      <SelectItem
                        key={r.value}
                        value={r.value}
                      >
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart data={dailySpend}>
                  <defs>
                    <linearGradient
                      id="spend"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.6}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <Tooltip contentStyle={{
                    background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                  }}
                  />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="hsl(var(--primary))"
                    fill="url(#spend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      {" "}
                      Spend Breakdown
                    </CardTitle>
                    <CardDescription>By bundle type</CardDescription>
                  </div>
                  <Select
                    value={spendRange}
                    onValueChange={setSpendRange}
                  >
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RANGE_OPTIONS.map(r => (
                        <SelectItem
                          key={r.value}
                          value={r.value}
                        >
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-[280px]">
                {spendBreakdown.length === 0
                  ? (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No spend data yet</div>
                    )
                  : (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={spendBreakdown}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={2}
                          >
                            {spendBreakdown.map((_, i) => (
                              <Cell
                                key={i}
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{
                            background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                          }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {" "}
                      Channel Distribution
                    </CardTitle>
                    <CardDescription>Bundles by carrier</CardDescription>
                  </div>
                  <Select
                    value={channelRange}
                    onValueChange={setChannelRange}
                  >
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RANGE_OPTIONS.map(r => (
                        <SelectItem
                          key={r.value}
                          value={r.value}
                        >
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-[280px]">
                {channelDistribution.length === 0
                  ? (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No allocations yet</div>
                    )
                  : (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={channelDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                          >
                            {channelDistribution.map((_, i) => (
                              <Cell
                                key={i}
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{
                            background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                          }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>Subscription Usage Breakdown</CardTitle>
                  <CardDescription>MB used vs total per bundle</CardDescription>
                </div>
                <Select
                  value={usageRange}
                  onValueChange={setUsageRange}
                >
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RANGE_OPTIONS.map(r => (
                      <SelectItem
                        key={r.value}
                        value={r.value}
                      >
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={usageByBundle}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip contentStyle={{
                    background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
                  }}
                  />
                  <Legend />
                  <Bar
                    dataKey="used"
                    name="Used (MB)"
                    fill="hsl(var(--primary))"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                  />
                  <Bar
                    dataKey="total"
                    name="Total (MB)"
                    fill="hsl(var(--muted))"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CURRENT RATES */}
        <TabsContent value="rates">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Rates</CardTitle>
                  <CardDescription>Current bundle catalog by carrier and plan type — the source of truth for all SIM allocations.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportRatesCsv}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {" "}
                  Export Data
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search bundles..."
                    value={ratesSearch}
                    onChange={e => setRatesSearch(e.target.value)}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {" "}
                      Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-3 rounded-xl space-y-3"
                    align="end"
                    sideOffset={8}
                  >
                    <h4 className="text-xs font-medium text-foreground px-0.5">Only show rates by...</h4>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium">Plan type</p>
                      <Select
                        value={ratesDraftPlanType}
                        onValueChange={setRatesDraftPlanType}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All plan types</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium">Carrier</p>
                      <div className="space-y-1.5 pl-0.5">
                        {dataBundleCarriers.map(carrier => (
                          <label
                            key={carrier.value}
                            className="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <Checkbox
                              checked={ratesDraftCarriers.includes(carrier.value)}
                              onCheckedChange={chk => setRatesDraftCarriers(prev => chk
                                ? [
                                    ...prev,
                                    carrier.value,
                                  ]
                                : prev.filter(x => x !== carrier.value))}
                              className="h-3.5 w-3.5"
                            />
                            <span className="text-xs">{carrier.label}</span>
                          </label>
                        ))}
                        {dataBundleCarriers.length === 0 && <p className="text-xs text-muted-foreground">No carriers</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={applyRatesFilter}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={clearRatesFilter}
                      >
                        Show All
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bundle</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratesQuery.isLoading
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-6 text-muted-foreground"
                          >
                            Loading...
                          </TableCell>
                        </TableRow>
                      )
                    : filteredRates.length === 0
                      ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-6 text-muted-foreground"
                            >
                              No bundles match your filters
                            </TableCell>
                          </TableRow>
                        )
                      : filteredRates.map(b => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.name}</TableCell>
                            <TableCell>{b.carrier}</TableCell>
                            <TableCell>{formatBundleSize(b.data_mb)}</TableCell>
                            <TableCell>
                              {b.validity_days}
                              d
                            </TableCell>
                            <TableCell><Badge variant="secondary">{b.billing_cycle}</Badge></TableCell>
                            <TableCell className="font-semibold">{fmtCurrency(Number(b.price_ngn))}</TableCell>
                          </TableRow>
                        ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Allocate Bundle Dialog */}
      <Dialog
        open={allocOpen}
        onOpenChange={setAllocOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              {" "}
              Allocate Bundle
            </DialogTitle>
            <DialogDescription>
              Push a data bundle to one or more SIMs in your fleet. Each number gets the selected bundle credited to it instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {(() => {
              const carrierOptions = Array.from(new Set(catalog.filter(b => b.is_active).map(b => b.carrier)));
              const cycleOptions = Array.from(new Set(
                catalog.filter(b => b.is_active && (!allocCarrier || b.carrier === allocCarrier)).map(b => b.billing_cycle),
              ));
              const sizeOptions = catalog.filter(b =>
                b.is_active
                && (!allocCarrier || b.carrier === allocCarrier)
                && (!allocCycle || b.billing_cycle === allocCycle));
              return (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Carrier</Label>
                    <Select
                      value={allocCarrier}
                      onValueChange={(v) => {
                        setAllocCarrier(v);
                        setAllocCycle("");
                        setAllocBundle("");
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                      <SelectContent>
                        {carrierOptions.map(c => (
                          <SelectItem
                            key={c}
                            value={c}
                          >
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Plan Type</Label>
                    <Select
                      value={allocCycle}
                      onValueChange={(v) => {
                        setAllocCycle(v);
                        setAllocBundle("");
                      }}
                      disabled={!allocCarrier}
                    >
                      <SelectTrigger><SelectValue placeholder={allocCarrier ? "Select plan type" : "Pick carrier first"} /></SelectTrigger>
                      <SelectContent>
                        {cycleOptions.map(c => (
                          <SelectItem
                            key={c}
                            value={c}
                            className="capitalize"
                          >
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Bundle Size</Label>
                    <Select
                      value={allocBundle}
                      onValueChange={setAllocBundle}
                      disabled={!allocCycle}
                    >
                      <SelectTrigger><SelectValue placeholder={allocCycle ? "Select size" : "Pick plan type"} /></SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map(b => (
                          <SelectItem
                            key={b.code}
                            value={b.code}
                          >
                            {formatBundleSize(b.data_mb)}
                            {" "}
                            —
                            {fmtCurrency(Number(b.price_ngn))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })()}

            {allocBundleObj && parsedAllocNumbers.length > 0 && (
              <div className="rounded-md border bg-muted/40 p-3 flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium">{allocBundleObj.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtCurrency(Number(allocBundleObj.price_ngn))}
                  </p>
                </div>
                <p className="text-base font-semibold">{fmtCurrency(allocTotalCost)}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAllocOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleAllocate}
              disabled={!allocBundle || parsedAllocNumbers.length === 0 || topup.isPending}
            >
              <Zap className="h-4 w-4 mr-2" />
              {topup.isPending ? "Allocating..." : "Allocate Bundle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Allocation Dialog */}
      <Dialog
        open={viewOpen}
        onOpenChange={setViewOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              {" "}
              Allocation Details
            </DialogTitle>
            <DialogDescription>Full details for this bundle allocation.</DialogDescription>
          </DialogHeader>
          {viewAlloc && (() => {
            const b = viewAlloc.bundle ?? catalog.find(c => c.code === viewAlloc.bundle_code);
            const pct = viewAlloc.data_mb_total > 0 ? (viewAlloc.data_mb_used / viewAlloc.data_mb_total) * 100 : 0;
            const days = viewAlloc.days_left ?? Math.ceil((new Date(viewAlloc.expires_at).getTime() - Date.now()) / 86400000);
            const status = String(viewAlloc.status).toUpperCase();
            const isExpired = status === "EXPIRED" || days <= 0;
            const remainingMb = Math.max(
              0,
              viewAlloc.data_mb_total - viewAlloc.data_mb_used,
            );
            return (
              <div className="space-y-4 py-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile Number</p>
                    <p className="font-medium">{formatMobile(viewAlloc.msisdn)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    {isExpired
                      ? <Badge variant="destructive">Expired</Badge>
                      : <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>{status}</Badge>}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bundle</p>
                    <p className="font-medium">{b?.name ?? viewAlloc.bundle_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Carrier</p>
                    <p className="font-medium">{b?.carrier ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan Type</p>
                    <p className="font-medium capitalize">{b?.billingCycle ?? b?.billing_cycle ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-medium">{b ? fmtCurrency(Number(b.price ?? b.price_ngn)) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Activated</p>
                    <p className="font-medium">{formatDate(viewAlloc.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p className="font-medium">
                      {formatDate(viewAlloc.expires_at)}
                      {!isExpired && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (
                          {days}
                          d left)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Data Usage</p>
                    <p className="text-xs font-medium">
                      {pct.toFixed(1)}
                      %
                    </p>
                  </div>
                  <Progress
                    value={pct}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatBundleSize(viewAlloc.data_mb_used)}
                    {" "}
                    used ·
                    {formatBundleSize(remainingMb)}
                    {" "}
                    remaining of
                    {formatBundleSize(viewAlloc.data_mb_total)}
                  </p>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                if (!viewAlloc)
                  return;
                const b = viewAlloc.bundle ?? catalog.find(c => c.code === viewAlloc.bundle_code);
                setAllocCarrier(b?.carrier ?? "");
                setAllocCycle(b?.billingCycle ?? b?.billing_cycle ?? "");
                setAllocBundle(viewAlloc.bundle_code);
                setAllocNumbers(formatMobile(viewAlloc.msisdn));
                setViewOpen(false);
                setAllocOpen(true);
              }}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              {" "}
              Allocate Bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto Top-up Dialog */}
      <Dialog
        open={autoOpen}
        onOpenChange={setAutoOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {" "}
              {auto.enabled ? "Auto Top-Up" : "Enable Auto Top-Up"}
            </DialogTitle>
            <DialogDescription>
              Automatically add funds when your balance drops below a threshold
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                {" "}
                How it works
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                When your wallet balance drops below
                {" "}
                {fmtCurrency(auto.triggerBalance)}
                , we'll automatically top up
                {" "}
                {fmtCurrency(auto.topupAmount)}
                {" "}
                using MTN MoMo.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Top-up when balance drops below</Label>
              <div className="grid grid-cols-4 gap-2">
                {TRIGGER_PRESETS.map(v => (
                  <Button
                    key={v}
                    type="button"
                    variant={auto.triggerBalance === v ? "gradient" : "outline"}
                    size="sm"
                    onClick={() => setAuto({
                      ...auto, triggerBalance: v,
                    })}
                  >
                    ₦
                    {v.toLocaleString()}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min={0}
                value={auto.triggerBalance}
                onChange={e => setAuto({
                  ...auto, triggerBalance: Number(e.target.value),
                })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount to add each time</Label>
              <div className="grid grid-cols-4 gap-2">
                {AMOUNT_PRESETS.map(v => (
                  <Button
                    key={v}
                    type="button"
                    variant={auto.topupAmount === v ? "gradient" : "outline"}
                    size="sm"
                    onClick={() => setAuto({
                      ...auto, topupAmount: v,
                    })}
                  >
                    ₦
                    {v.toLocaleString()}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min={0}
                value={auto.topupAmount}
                onChange={e => setAuto({
                  ...auto, topupAmount: Number(e.target.value),
                })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">MTN MoMo Phone Number</Label>
              <Input
                placeholder="e.g., 0803 123 4567"
                value={auto.momoPhone}
                onChange={e => setAuto({
                  ...auto, momoPhone: e.target.value,
                })}
              />
              <p className="text-xs text-muted-foreground">
                Payment will be automatically collected from this number
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAutoOpen(false)}
            >
              Cancel
            </Button>
            {auto.enabled && (
              <Button
                variant="outline"
                onClick={disableAuto}
                disabled={disableAutoTopup.isPending || saveAutoTopup.isPending}
              >
                Disable
              </Button>
            )}
            <Button
              variant="gradient"
              onClick={saveAuto}
              disabled={!auto.momoPhone || saveAutoTopup.isPending || disableAutoTopup.isPending}
            >
              <Zap className="h-4 w-4 mr-2" />
              {saveAutoTopup.isPending ? "Saving..." : auto.enabled ? "Save Auto Top-Up" : "Enable Auto Top-Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spending Limits Dialog */}
      <Dialog
        open={limitOpen}
        onOpenChange={setLimitOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {" "}
              {limit.enabled ? "Spending Limit" : "Enable Spending Limit"}
            </DialogTitle>
            <DialogDescription>
              Cap your monthly communication costs and get notified before you hit the limit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                {" "}
                How it works
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Communications will be blocked once your monthly spending reaches the limit you set. You'll be notified at 80% and 100% usage.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Monthly Limit (₦)</Label>
              <Input
                type="number"
                min={0}
                value={limit.monthlyLimit}
                onChange={e => setLimit({
                  ...limit, monthlyLimit: Number(e.target.value),
                })}
              />
              <p className="text-xs text-muted-foreground">
                Spent this month:
                {fmtCurrency(spendingLimit?.spentThisMonth ?? monthSpend)}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reset Day of Month</Label>
              <Select
                value={String(limit.resetDay)}
                onValueChange={v => setLimit({
                  ...limit, resetDay: Number(v),
                })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 28 },
                    (_, i) => i + 1,
                  ).map(d => (
                    <SelectItem
                      key={d}
                      value={String(d)}
                    >
                      Day
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Usage counter resets on this day each month</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {" "}
                Alert Email
              </Label>
              <Input
                type="email"
                placeholder="alerts@company.com"
                value={limit.alertEmail}
                onChange={e => setLimit({
                  ...limit, alertEmail: e.target.value,
                })}
              />
              <p className="text-xs text-muted-foreground">Receive email notifications at 80% and 100% of your limit</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLimitOpen(false)}
            >
              Cancel
            </Button>
            {limit.enabled && (
              <Button
                variant="outline"
                onClick={disableLimit}
                disabled={disableSpendingLimit.isPending || saveSpendingLimit.isPending}
              >
                Disable
              </Button>
            )}
            <Button
              variant="gradient"
              onClick={saveLimit}
              disabled={!limit.alertEmail || saveSpendingLimit.isPending || disableSpendingLimit.isPending}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {saveSpendingLimit.isPending ? "Saving..." : limit.enabled ? "Save Spending Limit" : "Enable Spending Limit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
