import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Plus, AlertTriangle, Wifi, Clock, Search, SlidersHorizontal, Download,
  Database, Zap, TrendingUp, Wallet, Settings2, Activity, ShieldCheck, ArrowUpRight, Mail,
  Smartphone, CreditCard, MoreHorizontal, Eye,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { useAuthStore } from "@/stores/authStore";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  useBundleAllocations,
  useBundleCatalog,
  useBundleTopup,
  useBundleTopups,
  formatBundleSize,
} from "@/hooks/useDataBundles";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--accent))"];

interface AutoTopupSettings {
  enabled: boolean;
  triggerBalance: number; // NGN — top up when balance drops below
  topupAmount: number; // NGN — amount to top up
  momoPhone: string; // MTN MoMo phone number
}

const TRIGGER_PRESETS = [500, 1000, 2000, 5000];
const AMOUNT_PRESETS = [2000, 5000, 10000, 20000];

const RANGE_OPTIONS = [
  { value: "today", label: "Today", days: 1 },
  { value: "yesterday", label: "Yesterday", days: 2 },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
];

/* ── Format a Nigerian mobile number into a human-readable form ── */
const formatMobile = (raw: string) => {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  // Normalize 234XXXXXXXXXX -> 0XXXXXXXXXX
  let local = digits.startsWith("234") ? "0" + digits.slice(3) : digits.startsWith("0") ? digits : "0" + digits;
  if (local.length !== 11) return raw;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
};

/* ── Dummy data (used when no live data is available, for demo) ── */
const DUMMY_CATALOG = [
  { id: "d1", code: "MTN_1GB_M", name: "MTN 1GB Monthly", carrier: "MTN", data_mb: 1024, validity_days: 30, price_ngn: 1500, billing_cycle: "monthly" as const, is_active: true },
  { id: "d2", code: "MTN_5GB_M", name: "MTN 5GB Monthly", carrier: "MTN", data_mb: 5120, validity_days: 30, price_ngn: 5500, billing_cycle: "monthly" as const, is_active: true },
  { id: "d3", code: "MTN_10GB_M", name: "MTN 10GB Monthly", carrier: "MTN", data_mb: 10240, validity_days: 30, price_ngn: 9500, billing_cycle: "monthly" as const, is_active: true },
  { id: "d4", code: "MTN_25GB_M", name: "MTN 25GB Monthly", carrier: "MTN", data_mb: 25600, validity_days: 30, price_ngn: 18000, billing_cycle: "monthly" as const, is_active: true },
  { id: "d5", code: "MTN_60GB_Y", name: "MTN 60GB Yearly", carrier: "MTN", data_mb: 61440, validity_days: 365, price_ngn: 75000, billing_cycle: "yearly" as const, is_active: true },
  { id: "d6", code: "AIRTEL_3GB_M", name: "Airtel 3GB Monthly", carrier: "Airtel", data_mb: 3072, validity_days: 30, price_ngn: 3500, billing_cycle: "monthly" as const, is_active: true },
  { id: "d7", code: "GLO_2GB_M", name: "Glo 2GB Monthly", carrier: "Glo", data_mb: 2048, validity_days: 30, price_ngn: 2200, billing_cycle: "monthly" as const, is_active: true },
  { id: "d8", code: "FONU_2GB_M", name: "Fonu 2GB Monthly", carrier: "Fonu", data_mb: 2048, validity_days: 30, price_ngn: 2000, billing_cycle: "monthly" as const, is_active: true },
  { id: "d9", code: "FONU_10GB_M", name: "Fonu 10GB Monthly", carrier: "Fonu", data_mb: 10240, validity_days: 30, price_ngn: 9000, billing_cycle: "monthly" as const, is_active: true },
  { id: "d10", code: "FONU_50GB_Y", name: "Fonu 50GB Yearly", carrier: "Fonu", data_mb: 51200, validity_days: 365, price_ngn: 65000, billing_cycle: "yearly" as const, is_active: true },
];

const DUMMY_ALLOCATIONS = Array.from({ length: 14 }, (_, i) => {
  const carriers = ["234803", "234806", "234810", "234813", "234817"];
  const bundles = DUMMY_CATALOG;
  const b = bundles[i % bundles.length];
  const used = Math.floor(b.data_mb * (0.1 + Math.random() * 0.85));
  const dayOffset = -2 + (i % 12);
  return {
    id: `alloc-${i}`,
    tenant_id: "demo",
    msisdn: `+${carriers[i % carriers.length]}${String(1000000 + i * 7311).slice(0, 7)}`,
    bundle_code: b.code,
    data_mb_total: b.data_mb,
    data_mb_used: used,
    status: dayOffset <= 0 ? "EXPIRED" : "ACTIVE",
    expires_at: new Date(Date.now() + dayOffset * 86400000).toISOString(),
    expiry_alert_7d_sent_at: null,
    expiry_alert_1d_sent_at: null,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  };
});

const DUMMY_TOPUPS = Array.from({ length: 40 }, (_, i) => {
  const b = DUMMY_CATALOG[i % DUMMY_CATALOG.length];
  const statuses = ["SUCCESS", "SUCCESS", "SUCCESS", "SUCCESS", "PENDING", "FAILED"];
  const daysBack = Math.floor(Math.random() * 89);
  return {
    id: `tx-${i}`,
    created_at: new Date(Date.now() - daysBack * 86400000 - Math.random() * 86400000).toISOString(),
    msisdn: `+234803${String(1000000 + i * 4231).slice(0, 7)}`,
    bundle_code: b.code,
    status: statuses[i % statuses.length],
    amount_ngn: b.price_ngn,
  };
});

interface SpendingLimitSettings {
  enabled: boolean;
  monthlyLimit: number; // NGN
  resetDay: number; // 1-28
  alertEmail: string;
}

export default function DataBundles() {
  const { user } = useAuthStore();
  const { format: fmtCurrency } = useCurrency();
  const tenantId = user?.tenantId;
  const { data: allocationsLive = [], isLoading } = useBundleAllocations(tenantId);
  const { data: catalogLive = [] } = useBundleCatalog();
  const { data: topupsLive = [] } = useBundleTopups(tenantId);

  // Fall back to dummy data when nothing live is loaded (demo)
  const allocations = (allocationsLive.length > 0 ? allocationsLive : DUMMY_ALLOCATIONS) as typeof allocationsLive;
  const catalog = (catalogLive.length > 0 ? catalogLive : DUMMY_CATALOG) as typeof catalogLive;
  const topups = (topupsLive.length > 0 ? topupsLive : DUMMY_TOPUPS) as typeof topupsLive;
  const topup = useBundleTopup();

  const [open, setOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewAlloc, setViewAlloc] = useState<typeof allocations[number] | null>(null);
  const [msisdn, setMsisdn] = useState("");
  const [bundleCode, setBundleCode] = useState("");
  const [topupAmount, setTopupAmount] = useState<number | "">("");
  const [topupMomo, setTopupMomo] = useState("");
  // Allocate-bundle state (cascading: Carrier → Plan type → Bundle size)
  const [allocCarrier, setAllocCarrier] = useState<string>("");
  const [allocCycle, setAllocCycle] = useState<string>("");
  const [allocBundle, setAllocBundle] = useState<string>("");
  const [allocNumbers, setAllocNumbers] = useState<string>("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterCycles, setFilterCycles] = useState<string[]>([]);
  const [draftCycles, setDraftCycles] = useState<string[]>([]);

  // Analytics range filters
  const [spendRange, setSpendRange] = useState("30d");
  const [channelRange, setChannelRange] = useState("30d");
  const [usageRange, setUsageRange] = useState("30d");

  // Transaction history filters
  const [txSearch, setTxSearch] = useState("");
  const [txStatus, setTxStatus] = useState("all");
  const [txCarriers, setTxCarriers] = useState<string[]>([]);
  const [txDraftCarriers, setTxDraftCarriers] = useState<string[]>([]);

  // Rates filters
  const [ratesSearch, setRatesSearch] = useState("");
  const [ratesCarriers, setRatesCarriers] = useState<string[]>([]);
  const [ratesDraftCarriers, setRatesDraftCarriers] = useState<string[]>([]);

  // Auto-topup settings
  const autoKey = `bundle-autotopup:${tenantId ?? "anon"}`;
  const [auto, setAuto] = useState<AutoTopupSettings>({
    enabled: false,
    triggerBalance: 500,
    topupAmount: 5000,
    momoPhone: "",
  });
  // Spending limit settings
  const limitKey = `bundle-spendlimit:${tenantId ?? "anon"}`;
  const [limit, setLimit] = useState<SpendingLimitSettings>({
    enabled: false,
    monthlyLimit: 50000,
    resetDay: 1,
    alertEmail: "",
  });

  useEffect(() => {
    const a = localStorage.getItem(autoKey);
    if (a) try { setAuto(JSON.parse(a)); } catch { /* noop */ }
    const l = localStorage.getItem(limitKey);
    if (l) try { setLimit(JSON.parse(l)); } catch { /* noop */ }
  }, [autoKey, limitKey]);

  const expiringSoon = useMemo(
    () => allocations.filter((a) => {
      const days = (new Date(a.expires_at).getTime() - Date.now()) / 86400000;
      return days <= 7 && days > 0;
    }),
    [allocations]
  );
  const expired = useMemo(
    () => allocations.filter((a) => new Date(a.expires_at).getTime() < Date.now()),
    [allocations]
  );

  // KPIs
  const totalDataMb = allocations.reduce((s, a) => s + (a.data_mb_total || 0), 0);
  const usedDataMb = allocations.reduce((s, a) => s + (a.data_mb_used || 0), 0);
  const usagePct = totalDataMb > 0 ? (usedDataMb / totalDataMb) * 100 : 0;

  const successTopups = useMemo(
    () => topups.filter((t: { status: string }) => t.status === "SUCCESS"),
    [topups]
  );

  const totalToppedUp = useMemo(() =>
    successTopups.reduce((sum, t: { bundle_code: string }) => {
      const b = catalog.find((c) => c.code === t.bundle_code);
      return sum + (b ? Number(b.price_ngn) : 0);
    }, 0),
  [successTopups, catalog]);

  const monthSpend = useMemo(() => {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    return successTopups
      .filter((t: { created_at: string }) => new Date(t.created_at) >= start)
      .reduce((sum, t: { bundle_code: string }) => {
        const b = catalog.find((c) => c.code === t.bundle_code);
        return sum + (b ? Number(b.price_ngn) : 0);
      }, 0);
  }, [successTopups, catalog]);

  const monthTopupCount = useMemo(() => {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    return successTopups.filter((t: { created_at: string }) => new Date(t.created_at) >= start).length;
  }, [successTopups]);

  // Current balance — total NGN value of remaining (unused) data across bundles
  const currentBalance = useMemo(() => {
    return allocations.reduce((sum, a) => {
      const b = catalog.find((c) => c.code === a.bundle_code);
      if (!b || !b.data_mb) return sum;
      const remainingPct = Math.max(0, (a.data_mb_total - a.data_mb_used) / a.data_mb_total);
      return sum + Number(b.price_ngn) * remainingPct;
    }, 0);
  }, [allocations, catalog]);

  // Filtered allocations
  const filtered = useMemo(() => {
    return allocations.filter((a) => {
      if (search && !`${a.msisdn} ${a.bundle_code}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all") {
        const days = (new Date(a.expires_at).getTime() - Date.now()) / 86400000;
        if (statusFilter === "active" && (a.status !== "ACTIVE" || days <= 0)) return false;
        if (statusFilter === "expiring" && !(days > 0 && days <= 7)) return false;
        if (statusFilter === "expired" && days > 0) return false;
      }
      if (filterCycles.length > 0) {
        const b = catalog.find((c) => c.code === a.bundle_code);
        if (!b || !filterCycles.includes(b.billing_cycle)) return false;
      }
      return true;
    });
  }, [allocations, search, statusFilter, filterCycles, catalog]);

  const rangeStart = (rangeKey: string) => {
    const opt = RANGE_OPTIONS.find((r) => r.value === rangeKey) ?? RANGE_OPTIONS[3];
    const d = new Date();
    if (rangeKey === "yesterday") {
      d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return d;
    }
    d.setDate(d.getDate() - opt.days); return d;
  };

  // Analytics: daily spending trend (range-aware)
  const dailySpend = useMemo(() => {
    const opt = RANGE_OPTIONS.find((r) => r.value === spendRange) ?? RANGE_OPTIONS[3];
    const days = opt.days;
    const buckets = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    successTopups.forEach((t: { created_at: string; bundle_code: string }) => {
      const key = new Date(t.created_at).toISOString().slice(0, 10);
      if (!buckets.has(key)) return;
      const b = catalog.find((c) => c.code === t.bundle_code);
      buckets.set(key, (buckets.get(key) ?? 0) + (b ? Number(b.price_ngn) : 0));
    });
    return Array.from(buckets.entries()).map(([day, spend]) => ({
      day: day.slice(5),
      spend,
    }));
  }, [successTopups, catalog, spendRange]);

  // Spend breakdown by bundle (range-aware)
  const spendBreakdown = useMemo(() => {
    const start = rangeStart(spendRange);
    const map = new Map<string, number>();
    successTopups
      .filter((t: { created_at: string }) => new Date(t.created_at) >= start)
      .forEach((t: { bundle_code: string }) => {
        const b = catalog.find((c) => c.code === t.bundle_code);
        if (!b) return;
        map.set(b.name, (map.get(b.name) ?? 0) + Number(b.price_ngn));
      });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [successTopups, catalog, spendRange]);

  // Channel distribution by carrier (range-aware via topups)
  const channelDistribution = useMemo(() => {
    const start = rangeStart(channelRange);
    const map = new Map<string, number>();
    successTopups
      .filter((t: { created_at: string }) => new Date(t.created_at) >= start)
      .forEach((t: { bundle_code: string }) => {
        const b = catalog.find((c) => c.code === t.bundle_code);
        const carrier = b?.carrier ?? "Unknown";
        map.set(carrier, (map.get(carrier) ?? 0) + 1);
      });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [successTopups, catalog, channelRange]);

  // Subscription usage (per bundle) — range-aware via topups counts
  const usageByBundle = useMemo(() => {
    const start = rangeStart(usageRange);
    const map = new Map<string, { name: string; used: number; total: number }>();
    allocations.forEach((a) => {
      if (new Date(a.created_at ?? Date.now()) < start) return;
      const cur = map.get(a.bundle_code) ?? { name: a.bundle_code, used: 0, total: 0 };
      cur.used += a.data_mb_used || 0;
      cur.total += a.data_mb_total || 0;
      map.set(a.bundle_code, cur);
    });
    if (map.size === 0) {
      // fallback to full allocations if range yields nothing
      allocations.forEach((a) => {
        const cur = map.get(a.bundle_code) ?? { name: a.bundle_code, used: 0, total: 0 };
        cur.used += a.data_mb_used || 0;
        cur.total += a.data_mb_total || 0;
        map.set(a.bundle_code, cur);
      });
    }
    return Array.from(map.values()).slice(0, 8);
  }, [allocations, usageRange]);

  // Filtered transactions
  const filteredTopups = useMemo(() => {
    return topups.filter((t: { msisdn: string; bundle_code: string; status: string }) => {
      if (txSearch && !`${t.msisdn} ${t.bundle_code}`.toLowerCase().includes(txSearch.toLowerCase())) return false;
      if (txStatus !== "all" && t.status !== txStatus) return false;
      if (txCarriers.length > 0) {
        const b = catalog.find((c) => c.code === t.bundle_code);
        if (!b || !txCarriers.includes(b.carrier)) return false;
      }
      return true;
    });
  }, [topups, txSearch, txStatus, txCarriers, catalog]);

  // Filtered rates
  const filteredRates = useMemo(() => {
    return catalog.filter((b) => b.is_active).filter((b) => {
      if (ratesSearch && !`${b.name} ${b.code} ${b.carrier}`.toLowerCase().includes(ratesSearch.toLowerCase())) return false;
      if (ratesCarriers.length > 0 && !ratesCarriers.includes(b.carrier)) return false;
      return true;
    });
  }, [catalog, ratesSearch, ratesCarriers]);

  const carriers = useMemo(() => Array.from(new Set(catalog.map((b) => b.carrier))), [catalog]);

  const handleTopup = async () => {
    if (!tenantId || !topupAmount || !topupMomo) return;
    const defaultBundle = catalog.find((b) => b.is_active)?.code ?? "WALLET_TOPUP";
    await topup.mutateAsync({ tenant_id: tenantId, msisdn: topupMomo, bundle_code: defaultBundle });
    setOpen(false);
    setTopupAmount("");
    setTopupMomo("");
  };

  // Parse pasted/typed numbers (newline, comma, space separated) into clean list
  const parsedAllocNumbers = useMemo(
    () => allocNumbers.split(/[\s,;]+/).map((n) => n.trim()).filter(Boolean),
    [allocNumbers],
  );
  const allocBundleObj = useMemo(
    () => catalog.find((b) => b.code === allocBundle),
    [catalog, allocBundle],
  );
  const allocTotalCost = allocBundleObj ? Number(allocBundleObj.price_ngn) : 0;

  const handleAllocate = async () => {
    if (!tenantId || !allocBundle || parsedAllocNumbers.length === 0) return;
    for (const num of parsedAllocNumbers) {
      try {
        await topup.mutateAsync({ tenant_id: tenantId, msisdn: num, bundle_code: allocBundle });
      } catch { /* continue allocating remaining numbers */ }
    }
    setAllocOpen(false);
    setAllocCarrier("");
    setAllocCycle("");
    setAllocBundle("");
    setAllocNumbers("");
  };

  const exportCsv = () => {
    const header = ["MSISDN", "Bundle", "Used (MB)", "Total (MB)", "Expires", "Status"];
    const rows = filtered.map((a) => [
      a.msisdn, a.bundle_code, a.data_mb_used, a.data_mb_total,
      new Date(a.expires_at).toISOString(), a.status,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data-bundles-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyFilter = () => {
    setFilterCycles(draftCycles);
  };
  const clearFilter = () => {
    setDraftCycles([]);
    setFilterCycles([]);
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
  };
  const clearRatesFilter = () => {
    setRatesDraftCarriers([]);
    setRatesCarriers([]);
  };

  const downloadCsv = (filename: string, header: string[], rows: (string | number)[][]) => {
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; link.click();
    URL.revokeObjectURL(url);
  };

  const exportTopupsCsv = () => downloadCsv(
    `transactions-${Date.now()}.csv`,
    ["Date", "MSISDN", "Bundle", "Amount", "Status"],
    filteredTopups.map((t: { created_at: string; msisdn: string; bundle_code: string; status: string }) => {
      const b = catalog.find((c) => c.code === t.bundle_code);
      return [new Date(t.created_at).toISOString(), t.msisdn, t.bundle_code, b ? Number(b.price_ngn) : 0, t.status];
    })
  );

  const exportRatesCsv = () => downloadCsv(
    `rates-${Date.now()}.csv`,
    ["Bundle", "Carrier", "Data (MB)", "Validity (days)", "Cycle", "Price (NGN)"],
    filteredRates.map((b) => [b.name, b.carrier, b.data_mb, b.validity_days, b.billing_cycle, Number(b.price_ngn)])
  );

  const saveAuto = () => {
    localStorage.setItem(autoKey, JSON.stringify(auto));
    setAutoOpen(false);
  };
  const saveLimit = () => {
    localStorage.setItem(limitKey, JSON.stringify(limit));
    setLimitOpen(false);
  };

  return (
    <DashboardLayout title="Data Bundles">
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
            <Button variant="outline" onClick={() => setLimitOpen(true)}>
              <ShieldCheck className="h-4 w-4 mr-2" /> Spending Limits
            </Button>
            <Button variant="outline" onClick={() => setAutoOpen(true)}>
              <Settings2 className="h-4 w-4 mr-2" /> Auto Top-up
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="h-4 w-4 mr-2" /> Top-up Bundle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" /> Top Up Wallet
                  </DialogTitle>
                  <DialogDescription>
                    Add funds to your wallet using MTN Mobile Money
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quick Amounts</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[5000, 10000, 25000, 50000, 100000].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          variant={topupAmount === v ? "gradient" : "outline"}
                          size="sm"
                          onClick={() => setTopupAmount(v)}
                        >
                          ₦{v.toLocaleString()}
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
                      onChange={(e) => setTopupAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">MTN Mobile Number</Label>
                    <Input
                      placeholder="e.g., 08031234567"
                      value={topupMomo}
                      onChange={(e) => setTopupMomo(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      You'll receive a prompt on this number to approve the payment
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button
                    variant="gradient"
                    onClick={handleTopup}
                    disabled={!topupAmount || !topupMomo || topup.isPending}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {topup.isPending ? "Processing..." : "Pay with MoMo"}
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
              <p className="text-xl font-bold truncate">{fmtCurrency(totalToppedUp)}</p>
              <p className="text-xs text-muted-foreground">Across {successTopups.length} successful transactions</p>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Data Used" value={formatBundleSize(usedDataMb)} icon={Activity} />
          <StatCard title="Current Balance" value={fmtCurrency(currentBalance)} icon={Wallet} />
          <StatCard title="Total Spend This Month" value={fmtCurrency(monthSpend)} icon={TrendingUp} />
          <StatCard title="Top-ups This Month" value={monthTopupCount} icon={ArrowUpRight} />
          <StatCard title="Active Bundles" value={allocations.length} icon={Database} />
        </div>

        {/* Alerts */}
        {expired.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{expired.length} bundle(s) expired</AlertTitle>
            <AlertDescription>These SIMs are no longer carrying data. Top up to restore service.</AlertDescription>
          </Alert>
        )}
        {expiringSoon.length > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>{expiringSoon.length} bundle(s) expiring within 7 days</AlertTitle>
            <AlertDescription>Renew now or enable auto top-up to avoid interruption.</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="bundles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bundles">My Bundles</TabsTrigger>
            <TabsTrigger value="topups">Transaction History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="rates">Current Rates</TabsTrigger>
          </TabsList>

          {/* MY BUNDLES */}
          <TabsContent value="bundles" className="space-y-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Wifi className="h-5 w-5" /> Active Allocations</CardTitle>
                    <CardDescription>Active data bundles assigned to your SIMs, with consumption and expiry status to help you plan top-ups.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportCsv}>
                    <Download className="h-4 w-4 mr-2" /> Export Data
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search mobile number or bundle..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expiring">Expiring soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline"><SlidersHorizontal className="h-4 w-4 mr-2" /> Filter</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 rounded-xl space-y-3" align="end" sideOffset={8}>
                      <h4 className="text-xs font-medium text-foreground px-0.5">Only show allocations by...</h4>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium">Billing cycle</p>
                        <div className="space-y-1.5 pl-0.5">
                          {[{ v: "MONTHLY", l: "Monthly" }, { v: "YEARLY", l: "Yearly" }].map((opt) => (
                            <label key={opt.v} className="flex items-center gap-2 cursor-pointer select-none">
                              <Checkbox
                                checked={draftCycles.includes(opt.v)}
                                onCheckedChange={(c) => setDraftCycles((prev) => c ? [...prev, opt.v] : prev.filter((x) => x !== opt.v))}
                                className="h-3.5 w-3.5"
                              />
                              <span className="text-xs">{opt.l}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button size="sm" className="flex-1" onClick={applyFilter}>Apply</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={clearFilter}>Show All</Button>
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
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bundles match your filters.</TableCell></TableRow>
                    ) : filtered.map((a) => {
                      const pct = a.data_mb_total > 0 ? (a.data_mb_used / a.data_mb_total) * 100 : 0;
                      const days = Math.ceil((new Date(a.expires_at).getTime() - Date.now()) / 86400000);
                      const isExpired = days <= 0;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm">{formatMobile(a.msisdn)}</TableCell>
                          <TableCell>{a.bundle_code}</TableCell>
                          <TableCell className="w-[200px]">
                            <div className="space-y-1">
                              <Progress value={pct} className="h-2" />
                              <p className="text-xs text-muted-foreground">
                                {formatBundleSize(a.data_mb_used)} / {formatBundleSize(a.data_mb_total)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isExpired ? <Badge variant="destructive">Expired</Badge> : <span className="text-sm">{days}d left</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={a.status === "ACTIVE" ? "default" : "secondary"}>{a.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setViewAlloc(a); setViewOpen(true); }}>
                                  <Eye className="h-4 w-4 mr-2" /> View allocation
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  const b = catalog.find((c) => c.code === a.bundle_code);
                                  setAllocCarrier(b?.carrier ?? "");
                                  setAllocCycle(b?.billing_cycle ?? "");
                                  setAllocBundle(a.bundle_code);
                                  setAllocNumbers(formatMobile(a.msisdn));
                                  setAllocOpen(true);
                                }}>
                                  <Smartphone className="h-4 w-4 mr-2" /> Allocate bundle
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
                  <Button variant="outline" size="sm" onClick={exportTopupsCsv}>
                    <Download className="h-4 w-4 mr-2" /> Export Data
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search mobile number or bundle..." value={txSearch} onChange={(e) => setTxSearch(e.target.value)} />
                  </div>
                  <Select value={txStatus} onValueChange={setTxStatus}>
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
                      <Button variant="outline"><SlidersHorizontal className="h-4 w-4 mr-2" /> Filter</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 rounded-xl space-y-3" align="end" sideOffset={8}>
                      <h4 className="text-xs font-medium text-foreground px-0.5">Only show transactions by...</h4>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium">Carrier</p>
                        <div className="space-y-1.5 pl-0.5">
                          {carriers.map((c) => (
                            <label key={c} className="flex items-center gap-2 cursor-pointer select-none">
                              <Checkbox
                                checked={txDraftCarriers.includes(c)}
                                onCheckedChange={(chk) => setTxDraftCarriers((prev) => chk ? [...prev, c] : prev.filter((x) => x !== c))}
                                className="h-3.5 w-3.5"
                              />
                              <span className="text-xs">{c}</span>
                            </label>
                          ))}
                          {carriers.length === 0 && <p className="text-xs text-muted-foreground">No carriers</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button size="sm" className="flex-1" onClick={applyTxFilter}>Apply</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={clearTxFilter}>Show All</Button>
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
                    {filteredTopups.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No transactions match your filters</TableCell></TableRow>
                    ) : filteredTopups.slice(0, 100).map((t: { id: string; created_at: string; msisdn: string; bundle_code: string; status: string; amount_ngn?: number }) => {
                      const b = catalog.find((c) => c.code === t.bundle_code);
                      const amt = b ? Number(b.price_ngn) : Number(t.amount_ngn ?? 0);
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
          <TabsContent value="analytics" className="space-y-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Daily Spending Trend</CardTitle>
                    <CardDescription>Spending over time</CardDescription>
                  </div>
                  <Select value={spendRange} onValueChange={setSpendRange}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RANGE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySpend}>
                    <defs>
                      <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Area type="monotone" dataKey="spend" stroke="hsl(var(--primary))" fill="url(#spend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Spend Breakdown</CardTitle>
                      <CardDescription>By bundle type</CardDescription>
                    </div>
                    <Select value={spendRange} onValueChange={setSpendRange}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RANGE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="h-[280px]">
                  {spendBreakdown.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No spend data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={spendBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                          {spendBreakdown.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
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
                      <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Channel Distribution</CardTitle>
                      <CardDescription>Bundles by carrier</CardDescription>
                    </div>
                    <Select value={channelRange} onValueChange={setChannelRange}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RANGE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="h-[280px]">
                  {channelDistribution.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No allocations yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={channelDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                          {channelDistribution.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
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
                  <Select value={usageRange} onValueChange={setUsageRange}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RANGE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageByBundle}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Bar dataKey="used" name="Used (MB)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" name="Total (MB)" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
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
                  <Button variant="outline" size="sm" onClick={exportRatesCsv}>
                    <Download className="h-4 w-4 mr-2" /> Export Data
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search bundles..." value={ratesSearch} onChange={(e) => setRatesSearch(e.target.value)} />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline"><SlidersHorizontal className="h-4 w-4 mr-2" /> Filter</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 rounded-xl space-y-3" align="end" sideOffset={8}>
                      <h4 className="text-xs font-medium text-foreground px-0.5">Only show rates by...</h4>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium">Carrier</p>
                        <div className="space-y-1.5 pl-0.5">
                          {carriers.map((c) => (
                            <label key={c} className="flex items-center gap-2 cursor-pointer select-none">
                              <Checkbox
                                checked={ratesDraftCarriers.includes(c)}
                                onCheckedChange={(chk) => setRatesDraftCarriers((prev) => chk ? [...prev, c] : prev.filter((x) => x !== c))}
                                className="h-3.5 w-3.5"
                              />
                              <span className="text-xs">{c}</span>
                            </label>
                          ))}
                          {carriers.length === 0 && <p className="text-xs text-muted-foreground">No carriers</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button size="sm" className="flex-1" onClick={applyRatesFilter}>Apply</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={clearRatesFilter}>Show All</Button>
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
                    {filteredRates.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No bundles match your filters</TableCell></TableRow>
                    ) : filteredRates.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>{b.carrier}</TableCell>
                        <TableCell>{formatBundleSize(b.data_mb)}</TableCell>
                        <TableCell>{b.validity_days}d</TableCell>
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
        <Dialog open={allocOpen} onOpenChange={setAllocOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" /> Allocate Bundle
              </DialogTitle>
              <DialogDescription>
                Push a data bundle to one or more SIMs in your fleet. Each number gets the selected bundle credited to it instantly.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {(() => {
                const carrierOptions = Array.from(new Set(catalog.filter((b) => b.is_active).map((b) => b.carrier)));
                const cycleOptions = Array.from(new Set(
                  catalog.filter((b) => b.is_active && (!allocCarrier || b.carrier === allocCarrier)).map((b) => b.billing_cycle),
                ));
                const sizeOptions = catalog.filter((b) =>
                  b.is_active &&
                  (!allocCarrier || b.carrier === allocCarrier) &&
                  (!allocCycle || b.billing_cycle === allocCycle),
                );
                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Carrier</Label>
                      <Select
                        value={allocCarrier}
                        onValueChange={(v) => { setAllocCarrier(v); setAllocCycle(""); setAllocBundle(""); }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                        <SelectContent>
                          {carrierOptions.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Plan Type</Label>
                      <Select
                        value={allocCycle}
                        onValueChange={(v) => { setAllocCycle(v); setAllocBundle(""); }}
                        disabled={!allocCarrier}
                      >
                        <SelectTrigger><SelectValue placeholder={allocCarrier ? "Select plan type" : "Pick carrier first"} /></SelectTrigger>
                        <SelectContent>
                          {cycleOptions.map((c) => (
                            <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Bundle Size</Label>
                      <Select value={allocBundle} onValueChange={setAllocBundle} disabled={!allocCycle}>
                        <SelectTrigger><SelectValue placeholder={allocCycle ? "Select size" : "Pick plan type"} /></SelectTrigger>
                        <SelectContent>
                          {sizeOptions.map((b) => (
                            <SelectItem key={b.code} value={b.code}>
                              {formatBundleSize(b.data_mb)} — {fmtCurrency(Number(b.price_ngn))}
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
              <Button variant="outline" onClick={() => setAllocOpen(false)}>Cancel</Button>
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
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" /> Allocation Details
              </DialogTitle>
              <DialogDescription>Full details for this bundle allocation.</DialogDescription>
            </DialogHeader>
            {viewAlloc && (() => {
              const b = catalog.find((c) => c.code === viewAlloc.bundle_code);
              const pct = viewAlloc.data_mb_total > 0 ? (viewAlloc.data_mb_used / viewAlloc.data_mb_total) * 100 : 0;
              const days = Math.ceil((new Date(viewAlloc.expires_at).getTime() - Date.now()) / 86400000);
              const isExpired = days <= 0;
              const remainingMb = Math.max(0, viewAlloc.data_mb_total - viewAlloc.data_mb_used);
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
                        : <Badge variant={viewAlloc.status === "ACTIVE" ? "default" : "secondary"}>{viewAlloc.status}</Badge>}
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
                      <p className="font-medium capitalize">{b?.billing_cycle ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-medium">{b ? fmtCurrency(Number(b.price_ngn)) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Activated</p>
                      <p className="font-medium">{new Date(viewAlloc.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expires</p>
                      <p className="font-medium">
                        {new Date(viewAlloc.expires_at).toLocaleDateString()}
                        {!isExpired && <span className="text-xs text-muted-foreground ml-1">({days}d left)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Data Usage</p>
                      <p className="text-xs font-medium">{pct.toFixed(1)}%</p>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {formatBundleSize(viewAlloc.data_mb_used)} used · {formatBundleSize(remainingMb)} remaining of {formatBundleSize(viewAlloc.data_mb_total)}
                    </p>
                  </div>
                </div>
              );
            })()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
              <Button
                variant="gradient"
                onClick={() => {
                  if (!viewAlloc) return;
                  const b = catalog.find((c) => c.code === viewAlloc.bundle_code);
                  setAllocCarrier(b?.carrier ?? "");
                  setAllocCycle(b?.billing_cycle ?? "");
                  setAllocBundle(viewAlloc.bundle_code);
                  setAllocNumbers(formatMobile(viewAlloc.msisdn));
                  setViewOpen(false);
                  setAllocOpen(true);
                }}
              >
                <Smartphone className="h-4 w-4 mr-2" /> Allocate Bundle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Auto Top-up Dialog */}
        <Dialog open={autoOpen} onOpenChange={setAutoOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" /> Enable Auto Top-Up
              </DialogTitle>
              <DialogDescription>
                Automatically add funds when your balance drops below a threshold
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary" /> How it works
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  When your wallet balance drops below {fmtCurrency(auto.triggerBalance)}, we'll automatically top up {fmtCurrency(auto.topupAmount)} using MTN MoMo.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Top-up when balance drops below</Label>
                <div className="grid grid-cols-4 gap-2">
                  {TRIGGER_PRESETS.map((v) => (
                    <Button
                      key={v}
                      type="button"
                      variant={auto.triggerBalance === v ? "gradient" : "outline"}
                      size="sm"
                      onClick={() => setAuto({ ...auto, triggerBalance: v })}
                    >
                      ₦{v.toLocaleString()}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={0}
                  value={auto.triggerBalance}
                  onChange={(e) => setAuto({ ...auto, triggerBalance: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Amount to add each time</Label>
                <div className="grid grid-cols-4 gap-2">
                  {AMOUNT_PRESETS.map((v) => (
                    <Button
                      key={v}
                      type="button"
                      variant={auto.topupAmount === v ? "gradient" : "outline"}
                      size="sm"
                      onClick={() => setAuto({ ...auto, topupAmount: v })}
                    >
                      ₦{v.toLocaleString()}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={0}
                  value={auto.topupAmount}
                  onChange={(e) => setAuto({ ...auto, topupAmount: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">MTN MoMo Phone Number</Label>
                <Input
                  placeholder="e.g., 0803 123 4567"
                  value={auto.momoPhone}
                  onChange={(e) => setAuto({ ...auto, momoPhone: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Payment will be automatically collected from this number
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAutoOpen(false)}>Cancel</Button>
              <Button
                variant="gradient"
                onClick={() => { setAuto({ ...auto, enabled: true }); saveAuto(); }}
                disabled={!auto.momoPhone}
              >
                <Zap className="h-4 w-4 mr-2" /> Enable Auto Top-Up
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Spending Limits Dialog */}
        <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Enable Spending Limit
              </DialogTitle>
              <DialogDescription>
                Cap your monthly communication costs and get notified before you hit the limit
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary" /> How it works
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
                  onChange={(e) => setLimit({ ...limit, monthlyLimit: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Spent this month: {fmtCurrency(monthSpend)}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reset Day of Month</Label>
                <Select
                  value={String(limit.resetDay)}
                  onValueChange={(v) => setLimit({ ...limit, resetDay: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>Day {d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Usage counter resets on this day each month</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Alert Email
                </Label>
                <Input
                  type="email"
                  placeholder="alerts@company.com"
                  value={limit.alertEmail}
                  onChange={(e) => setLimit({ ...limit, alertEmail: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Receive email notifications at 80% and 100% of your limit</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLimitOpen(false)}>Cancel</Button>
              <Button
                variant="gradient"
                onClick={() => { setLimit({ ...limit, enabled: true }); saveLimit(); }}
                disabled={!limit.alertEmail}
              >
                <ShieldCheck className="h-4 w-4 mr-2" /> Enable Spending Limit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
