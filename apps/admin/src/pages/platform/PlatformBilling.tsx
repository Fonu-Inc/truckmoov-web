import type { ChartDateRange } from "@/components/shadcn/chart-date-filter";
import type {
  FilterDraft,
  FilterField,
} from "@/components/shadcn/platform-filter-popover";
import {
  formatDateOnlyInTimezone,
  getTimezoneLabel,

  TIMEZONES,
} from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Phone,
  PieChart,
  Plus,
  Receipt,
  Search,
  Send,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/StatCard";
import { PostpaidBillingTab } from "@/components/platform/PostpaidBillingTab";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { ChartDateFilter } from "@/components/shadcn/chart-date-filter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog as Sheet,
  DialogContent as SheetContent,
  DialogDescription as SheetDescription,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle,
} from "@/components/shadcn/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,

} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  buildEmptyDraft,

  PlatformFilterPopover,
} from "@/components/shadcn/platform-filter-popover";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,

} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,

} from "@/components/shadcn/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import {
  convertCurrency,
  CURRENCIES,
  formatCurrency,
} from "@/lib/currency";
import { downloadReceiptPDF } from "@/lib/receiptPdf";

type Invoice = {
  id: string;
  invoiceNumber: string;
  tenant: string;
  tenantId: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  dueDate: string;
  paidDate: string | null;
  paymentMethod: "mtn_momo" | "bank_transfer" | "card" | null;
  plan: string;
  period: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
};

type Subscription = {
  id: string;
  tenant: string;
  tenantId: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "trialing" | "past_due" | "cancelled";
  startDate: string;
  nextBillingDate: string;
  amount: number;
  paymentMethod: "mtn_momo" | "bank_transfer" | "card";
  autoRenew: boolean;
};

const revenueData = [
  {
    month: "Jan",
    revenue: 12500000,
    subscriptions: 45,
    invoices: 48,
  },
  {
    month: "Feb",
    revenue: 14200000,
    subscriptions: 52,
    invoices: 55,
  },
  {
    month: "Mar",
    revenue: 15800000,
    subscriptions: 61,
    invoices: 64,
  },
  {
    month: "Apr",
    revenue: 17500000,
    subscriptions: 68,
    invoices: 71,
  },
  {
    month: "May",
    revenue: 18900000,
    subscriptions: 74,
    invoices: 78,
  },
  {
    month: "Jun",
    revenue: 21500000,
    subscriptions: 82,
    invoices: 86,
  },
  {
    month: "Jul",
    revenue: 22800000,
    subscriptions: 89,
    invoices: 93,
  },
  {
    month: "Aug",
    revenue: 24500000,
    subscriptions: 95,
    invoices: 99,
  },
  {
    month: "Sep",
    revenue: 26800000,
    subscriptions: 103,
    invoices: 107,
  },
  {
    month: "Oct",
    revenue: 28500000,
    subscriptions: 112,
    invoices: 116,
  },
  {
    month: "Nov",
    revenue: 30200000,
    subscriptions: 118,
    invoices: 122,
  },
  {
    month: "Dec",
    revenue: 32500000,
    subscriptions: 125,
    invoices: 130,
  },
];

const planDistribution = [
  {
    name: "Starter",
    value: 45,
    color: "#94a3b8",
  },
  {
    name: "Professional",
    value: 62,
    color: "#3b82f6",
  },
  {
    name: "Enterprise",
    value: 18,
    color: "#22c55e",
  },
];

const paymentMethodData = [
  {
    method: "MTN MoMo",
    count: 78,
    revenue: 18500000,
  },
  {
    method: "Bank Transfer",
    count: 32,
    revenue: 9500000,
  },
  {
    method: "Card",
    count: 15,
    revenue: 4500000,
  },
];

const mockInvoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2024-001",
    tenant: "ABC Logistics",
    tenantId: "tenant-1",
    amount: 149900,
    status: "paid",
    dueDate: "2024-12-15",
    paidDate: "2024-12-10",
    paymentMethod: "mtn_momo",
    plan: "Professional",
    period: "December 2024",
    items: [
      {
        description: "Professional Plan - Monthly",
        quantity: 1,
        unitPrice: 129900,
        total: 129900,
      },
      {
        description: "Additional Vehicles (5)",
        quantity: 5,
        unitPrice: 4000,
        total: 20000,
      },
    ],

  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2024-002",
    tenant: "XYZ Transport",
    tenantId: "tenant-2",
    amount: 499900,
    status: "paid",
    dueDate: "2024-12-15",
    paidDate: "2024-12-12",
    paymentMethod: "bank_transfer",
    plan: "Enterprise",
    period: "December 2024",
    items: [
      {
        description: "Enterprise Plan - Monthly",
        quantity: 1,
        unitPrice: 499900,
        total: 499900,
      },
    ],

  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2024-003",
    tenant: "Quick Movers",
    tenantId: "tenant-3",
    amount: 49900,
    status: "pending",
    dueDate: "2024-12-20",
    paidDate: null,
    paymentMethod: null,
    plan: "Starter",
    period: "December 2024",
    items: [
      {
        description: "Starter Plan - Monthly",
        quantity: 1,
        unitPrice: 49900,
        total: 49900,
      },
    ],

  },
  {
    id: "inv-004",
    invoiceNumber: "INV-2024-004",
    tenant: "Metro Couriers",
    tenantId: "tenant-4",
    amount: 149900,
    status: "overdue",
    dueDate: "2024-11-30",
    paidDate: null,
    paymentMethod: null,
    plan: "Professional",
    period: "November 2024",
    items: [
      {
        description: "Professional Plan - Monthly",
        quantity: 1,
        unitPrice: 149900,
        total: 149900,
      },
    ],

  },
  {
    id: "inv-005",
    invoiceNumber: "INV-2024-005",
    tenant: "Swift Delivery",
    tenantId: "tenant-5",
    amount: 169900,
    status: "paid",
    dueDate: "2024-12-10",
    paidDate: "2024-12-08",
    paymentMethod: "mtn_momo",
    plan: "Professional",
    period: "December 2024",
    items: [
      {
        description: "Professional Plan - Monthly",
        quantity: 1,
        unitPrice: 149900,
        total: 149900,
      },
      {
        description: "SMS Bundle (500)",
        quantity: 1,
        unitPrice: 20000,
        total: 20000,
      },
    ],

  },
];

const mockSubscriptions: Subscription[] = [
  {
    id: "sub-001",
    tenant: "ABC Logistics",
    tenantId: "tenant-1",
    plan: "professional",
    status: "active",
    startDate: "2024-01-15",
    nextBillingDate: "2025-01-15",
    amount: 149900,
    paymentMethod: "mtn_momo",
    autoRenew: true,

  },
  {
    id: "sub-002",
    tenant: "XYZ Transport",
    tenantId: "tenant-2",
    plan: "enterprise",
    status: "active",
    startDate: "2023-08-20",
    nextBillingDate: "2024-12-20",
    amount: 499900,
    paymentMethod: "bank_transfer",
    autoRenew: true,

  },
  {
    id: "sub-003",
    tenant: "Quick Movers",
    tenantId: "tenant-3",
    plan: "starter",
    status: "trialing",
    startDate: "2024-11-01",
    nextBillingDate: "2024-12-15",
    amount: 49900,
    paymentMethod: "mtn_momo",
    autoRenew: true,

  },
  {
    id: "sub-004",
    tenant: "Metro Couriers",
    tenantId: "tenant-4",
    plan: "professional",
    status: "past_due",
    startDate: "2023-12-10",
    nextBillingDate: "2024-11-30",
    amount: 149900,
    paymentMethod: "card",
    autoRenew: false,

  },
];

const planColors = {
  starter: "bg-muted text-muted-foreground",
  professional: "bg-primary/10 text-primary",
  enterprise: "bg-success/10 text-success",

};

const INVOICE_FILTER_FIELDS: FilterField[] = [
  {
    key: "payment_method",
    label: "Payment Method",
    type: "select",
    options: [
      {
        value: "mtn_momo",
        label: "MTN MoMo",
      },
      {
        value: "bank_transfer",
        label: "Bank Transfer",
      },
      {
        value: "card",
        label: "Card",
      },
    ],

  },
  {
    key: "amount",
    label: "Amount (NGN)",
    type: "range",
    fromPlaceholder: "Min",
    toPlaceholder: "Max",
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      {
        value: "paid",
        label: "Paid",
      },
      {
        value: "pending",
        label: "Pending",
      },
      {
        value: "overdue",
        label: "Overdue",
      },
      {
        value: "cancelled",
        label: "Cancelled",
      },
    ],

  },
  {
    key: "date",
    label: "Due Date",
    type: "date",
  },
  {
    key: "payment_type",
    label: "Payment Type",
    type: "select",
    options: [
      {
        value: "subscription",
        label: "Subscription",
      },
      {
        value: "one_time",
        label: "One-Time",
      },
    ],

  },
];

const SUBSCRIPTION_FILTER_FIELDS: FilterField[] = [
  {
    key: "plan",
    label: "Plan",
    type: "select",
    options: [
      {
        value: "starter",
        label: "Starter",
      },
      {
        value: "professional",
        label: "Professional",
      },
      {
        value: "enterprise",
        label: "Enterprise",
      },
    ],

  },
  {
    key: "amount",
    label: "Amount (NGN)",
    type: "range",
    fromPlaceholder: "Min",
    toPlaceholder: "Max",
  },
  {
    key: "next_billing",
    label: "Next Billing Date",
    type: "date",
  },
  {
    key: "payment_method",
    label: "Payment Method",
    type: "select",
    options: [
      {
        value: "mtn_momo",
        label: "MTN MoMo",
      },
      {
        value: "bank_transfer",
        label: "Bank Transfer",
      },
      {
        value: "card",
        label: "Card",
      },
    ],

  },
];

export default function PlatformBilling() {
  const [
    invoices,
    setInvoices,
  ] = useState<Invoice[]>(mockInvoices);
  const [subscriptions] = useState<Subscription[]>(mockSubscriptions);
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    activeTab,
    setActiveTab,
  ] = useState("overview");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [
    selectedInvoice,
    setSelectedInvoice,
  ] = useState<Invoice | null>(null);
  const [
    isInvoiceSheetOpen,
    setIsInvoiceSheetOpen,
  ] = useState(false);
  const [
    isMomoDialogOpen,
    setIsMomoDialogOpen,
  ] = useState(false);
  const [
    momoPhone,
    setMomoPhone,
  ] = useState("");
  const [isProcessingPayment] = useState(false);
  const [
    isMarkPaidOpen,
    setIsMarkPaidOpen,
  ] = useState(false);
  const [
    markPaidMethod,
    setMarkPaidMethod,
  ] = useState<"mtn_momo" | "bank_transfer" | "card">("mtn_momo");
  const [
    markPaidReference,
    setMarkPaidReference,
  ] = useState("");
  const { currency } = useCurrency();
  const {
    timezone,
    defaultDateRange,
  } = usePreferences();
  const [
    revenueRange,
    setRevenueRange,
  ] = useState<ChartDateRange>(defaultDateRange);
  const [
    planRange,
    setPlanRange,
  ] = useState<ChartDateRange>(defaultDateRange);
  const [
    invoiceFilters,
    setInvoiceFilters,
  ] = useState<FilterDraft>(() => buildEmptyDraft(INVOICE_FILTER_FIELDS));

  // Subscription tab state
  const [
    subSearchQuery,
    setSubSearchQuery,
  ] = useState("");
  const [
    subStatusFilter,
    setSubStatusFilter,
  ] = useState("all");
  const [
    subFilters,
    setSubFilters,
  ] = useState<FilterDraft>(() => buildEmptyDraft(SUBSCRIPTION_FILTER_FIELDS));
  const [
    selectedSubscription,
    setSelectedSubscription,
  ] = useState<Subscription | null>(null);
  const [
    isSubDialogOpen,
    setIsSubDialogOpen,
  ] = useState(false);

  const fetchBillingSummary = async (..._args: any[]) => {};
  const generateInvoice = async (..._args: any[]) => null as any;
  const [
    generatingFor,
    setGeneratingFor,
  ] = useState<string | null>(null);
  const [
    isCreateInvoiceOpen,
    setIsCreateInvoiceOpen,
  ] = useState(false);
  const [
    createInvoiceSubId,
    setCreateInvoiceSubId,
  ] = useState<string>("");
  const [
    isMomoConfigOpen,
    setIsMomoConfigOpen,
  ] = useState(false);
  const [
    isBankDetailsOpen,
    setIsBankDetailsOpen,
  ] = useState(false);
  const [
    isCardSetupOpen,
    setIsCardSetupOpen,
  ] = useState(false);
  const [
    isAddProviderOpen,
    setIsAddProviderOpen,
  ] = useState(false);
  const [
    momoConfig,
    setMomoConfig,
  ] = useState({
    apiUserId: "",
    subscriptionKey: "",
    environment: "production",
    defaultCurrency: "NGN",
    callbackUrl: "https://api.fleetpro.ng/webhooks/mtn-momo",

  });
  const [
    cardSetup,
    setCardSetup,
  ] = useState({
    provider: "paystack",
    publicKey: "",
    secretKey: "",
  });
  const [
    newProvider,
    setNewProvider,
  ] = useState({
    name: "",
    apiKey: "",
  });

  useEffect(
    () => {
      fetchBillingSummary();
    },
    [fetchBillingSummary],
  );

  const handleGenerateInvoiceForSub = async (sub: Subscription) => {
    setGeneratingFor(sub.id);
    try {
      const invoice = await generateInvoice(sub.id);
      if (invoice) {
        toast.success(`Invoice generated for ${sub.tenant}`);
        await fetchBillingSummary();
      }
    }
    finally {
      setGeneratingFor(null);
    }
  };

  const handleGenerateInvoiceForTenant = async (tenantName: string) => {
    const sub = subscriptions.find(s => s.tenant === tenantName);
    if (!sub) {
      toast.error(`No active subscription found for ${tenantName}`);
      return;
    }
    await handleGenerateInvoiceForSub(sub);
  };

  const handleCreateInvoiceConfirm = async () => {
    if (!createInvoiceSubId) {
      toast.error("Please select a subscription");
      return;
    }
    setGeneratingFor(createInvoiceSubId);
    try {
      const invoice = await generateInvoice(createInvoiceSubId);
      if (invoice) {
        const sub = subscriptions.find(s => s.id === createInvoiceSubId);
        toast.success(`Invoice created${sub ? ` for ${sub.tenant}` : ""}`);
        await fetchBillingSummary();
        setIsCreateInvoiceOpen(false);
        setCreateInvoiceSubId("");
      }
    }
    finally {
      setGeneratingFor(null);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch
      = invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
        || invoice.tenant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    // Advanced filters
    const f = invoiceFilters;
    if (f.payment_method?.enabled && f.payment_method.value && invoice.paymentMethod !== f.payment_method.value)
      return false;
    if (f.status?.enabled && f.status.value && invoice.status !== f.status.value)
      return false;
    if (f.amount?.enabled) {
      const min = f.amount.from ? Number(f.amount.from) : -Infinity;
      const max = f.amount.to ? Number(f.amount.to) : Infinity;
      if (invoice.amount < min || invoice.amount > max)
        return false;
    }
    if (f.date?.enabled) {
      const d = new Date(invoice.dueDate).getTime();
      if (f.date.from && d < new Date(f.date.from).getTime())
        return false;
      if (f.date.to && d > new Date(f.date.to).getTime())
        return false;
    }
    return matchesSearch && matchesStatus;
  });

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.tenant.toLowerCase().includes(subSearchQuery.toLowerCase());
    const matchesStatus = subStatusFilter === "all" || sub.status === subStatusFilter;
    const f = subFilters;
    if (f.plan?.enabled && f.plan.value && sub.plan !== f.plan.value)
      return false;
    if (f.payment_method?.enabled && f.payment_method.value && sub.paymentMethod !== f.payment_method.value)
      return false;
    if (f.amount?.enabled) {
      const min = f.amount.from ? Number(f.amount.from) : -Infinity;
      const max = f.amount.to ? Number(f.amount.to) : Infinity;
      if (sub.amount < min || sub.amount > max)
        return false;
    }
    if (f.next_billing?.enabled) {
      const d = new Date(sub.nextBillingDate).getTime();
      if (f.next_billing.from && d < new Date(f.next_billing.from).getTime())
        return false;
      if (f.next_billing.to && d > new Date(f.next_billing.to).getTime())
        return false;
    }
    return matchesSearch && matchesStatus;
  });

  const getDisplayAmount = (amount: number) => {
    if (currency === "NGN")
      return amount;
    return convertCurrency(
      amount,
      "NGN",
      currency,
    );
  };

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce(
    (sum, i) => sum + i.amount,
    0,
  );
  const pendingRevenue = invoices.filter(i => i.status === "pending" || i.status === "overdue").reduce(
    (sum, i) => sum + i.amount,
    0,
  );
  const activeSubscriptions = subscriptions.filter(s => s.status === "active" || s.status === "trialing").length;
  const mrr = subscriptions.filter(s => s.status === "active").reduce(
    (sum, s) => sum + s.amount,
    0,
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success/10 text-success border-success/30">Paid</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "active":
        return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
      case "trialing":
        return <Badge className="bg-primary/10 text-primary border-primary/30">Trial</Badge>;
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string | null) => {
    switch (method) {
      case "mtn_momo":
        return <Smartphone className="h-4 w-4 text-warning" />;
      case "bank_transfer":
        return <Building2 className="h-4 w-4 text-primary" />;
      case "card":
        return <CreditCard className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Wallet className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSendMomoRequest = async () => {
    toast.info("Coming soon");
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceSheetOpen(true);
  };

  const handleDownloadReceipt = (invoice: Invoice) => {
    if (invoice.status !== "paid" || !invoice.paidDate) {
      toast.error("Download is only available after payment is confirmed");
      return;
    }
    const subtotal = invoice.items.reduce(
      (sum, i) => sum + i.total,
      0,
    );
    downloadReceiptPDF({
      invoiceNumber: invoice.invoiceNumber,
      tenantName: invoice.tenant,
      plan: invoice.plan,
      period: invoice.period,
      issueDate: formatDateOnlyInTimezone(
        invoice.dueDate,
        timezone,
      ),
      paidDate: formatDateOnlyInTimezone(
        invoice.paidDate,
        timezone,
      ),
      dueDate: formatDateOnlyInTimezone(
        invoice.dueDate,
        timezone,
      ),
      paymentMethod: invoice.paymentMethod
        ? invoice.paymentMethod.replace(
            "_",
            " ",
          ).toUpperCase()
        : "—",
      paymentReference: `PAY-${invoice.invoiceNumber}`,
      items: invoice.items,
      subtotal,
      amount: invoice.amount,
      currency,

    });
    toast.success(`Download for ${invoice.invoiceNumber} downloaded`);
  };

  const openMarkAsPaid = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setMarkPaidMethod(invoice.paymentMethod ?? "mtn_momo");
    setMarkPaidReference("");
    setIsMarkPaidOpen(true);
  };

  const confirmMarkAsPaid = () => {
    if (!selectedInvoice)
      return;
    const today = new Date().toISOString().slice(
      0,
      10,
    );
    const paid = invoices.map(inv =>
      inv.id === selectedInvoice.id
        ? {
            ...inv,
            status: "paid" as const,
            paidDate: today,
            paymentMethod: markPaidMethod,

          }
        : inv);
    setInvoices(paid);
    const updated = paid.find(i => i.id === selectedInvoice.id) ?? null;
    setSelectedInvoice(updated);
    setIsMarkPaidOpen(false);
    toast.success(
      `Payment confirmed — invoice ${selectedInvoice.invoiceNumber} auto-updated`,
      {
        description: "Download is now available for download.",
        action: updated
          ? {
              label: "Receipt",
              onClick: () => handleDownloadReceipt(updated),
            }
          : undefined,

      },
    );
  };

  return (
    <>
      {/* Currency & timezone are now driven by global Settings → Billing / Preferences */}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        {/* Centered tabs */}
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="postpaid">Postpaid</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent
          value="overview"
          className="space-y-6"
        >
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Total Revenue (YTD)"
              value={formatCurrency(
                getDisplayAmount(totalRevenue),
                currency,
              )}
              icon={DollarSign}
              change={18}
              changeLabel="vs last year"
              variant="success"
            />
            <StatCard
              title="Monthly Recurring"
              value={formatCurrency(
                getDisplayAmount(mrr),
                currency,
              )}
              icon={TrendingUp}
              change={12}
              changeLabel="vs last month"
            />
            <StatCard
              title="Pending Payments"
              value={formatCurrency(
                getDisplayAmount(pendingRevenue),
                currency,
              )}
              icon={Clock}
              variant="warning"
            />
            <StatCard
              title="Active Subscriptions"
              value={activeSubscriptions}
              icon={Users}
              change={8}
              changeLabel="this month"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Revenue Trend
                    </CardTitle>
                    <CardDescription>
                      Monthly revenue (
                      {CURRENCIES[currency].code}
                      )
                    </CardDescription>
                  </div>
                  <ChartDateFilter
                    value={revenueRange}
                    onValueChange={setRevenueRange}
                    options={[
                      "today",
                      "yesterday",
                      "7d",
                      "30d",
                      "90d",
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.3}
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
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={value => `${CURRENCIES[currency].symbol}${(getDisplayAmount(value) / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",

                      }}
                      formatter={(value: number) => [
                        formatCurrency(
                          getDisplayAmount(value),
                          currency,
                        ),
                        "Revenue",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Plan Distribution */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" />
                      Subscription Distribution
                    </CardTitle>
                    <CardDescription>Active subscriptions by plan</CardDescription>
                  </div>
                  <ChartDateFilter
                    value={planRange}
                    onValueChange={setPlanRange}
                    options={[
                      "today",
                      "yesterday",
                      "7d",
                      "30d",
                      "90d",
                    ]}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <RechartsPieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",

                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods & Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Payment Methods
                </CardTitle>
                <CardDescription>Volume and value of payments received per channel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethodData.map(pm => (
                  <div
                    key={pm.method}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {pm.method === "MTN MoMo" && (
                        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Smartphone className="h-5 w-5 text-warning" />
                        </div>
                      )}
                      {pm.method === "Bank Transfer" && (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      {pm.method === "Card" && (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{pm.method}</p>
                        <p className="text-xs text-muted-foreground">
                          {pm.count}
                          {" "}
                          payments
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(
                        getDisplayAmount(pm.revenue),
                        currency,
                      )}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-primary" />
                      Recent Invoices
                    </CardTitle>
                    <CardDescription>Latest tenant invoices issued across all subscription plans</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("invoices")}
                  >
                    View All
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.slice(
                    0,
                    5,
                  ).map(invoice => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {invoice.tenant.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{invoice.tenant}</p>
                          <p className="text-xs text-muted-foreground">{invoice.invoiceNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(invoice.status)}
                        <p className="font-semibold">
                          {formatCurrency(
                            getDisplayAmount(invoice.amount),
                            currency,
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent
          value="invoices"
          className="space-y-6"
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    All Invoices
                  </CardTitle>
                  <CardDescription>Every issued invoice across tenants — search, filter and export</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExportButton
                    filename="invoices"
                    label="Export Data"
                    rows={filteredInvoices}
                    columns={[
                      {
                        header: "Invoice #",
                        accessor: i => i.invoiceNumber,
                      },
                      {
                        header: "Tenant",
                        accessor: i => i.tenant,
                      },
                      {
                        header: "Plan",
                        accessor: i => i.plan,
                      },
                      {
                        header: "Period",
                        accessor: i => i.period,
                      },
                      {
                        header: "Amount (NGN)",
                        accessor: i => i.amount,
                      },
                      {
                        header: "Status",
                        accessor: i => i.status,
                      },
                      {
                        header: "Due Date",
                        accessor: i => i.dueDate,
                      },
                      {
                        header: "Paid Date",
                        accessor: i => i.paidDate ?? "",
                      },
                      {
                        header: "Payment Method",
                        accessor: i => i.paymentMethod ?? "",
                      },
                    ]}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 md:flex-row md:items-center mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice number or tenant..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <PlatformFilterPopover
                  entity="invoices"
                  fields={INVOICE_FILTER_FIELDS}
                  value={invoiceFilters}
                  onApply={setInvoiceFilters}
                  onReset={() => setInvoiceFilters(buildEmptyDraft(INVOICE_FILTER_FIELDS))}
                />
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        Due Date (
                        {TIMEZONES[timezone].offset}
                        )
                      </TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">{invoice.period}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {invoice.tenant}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(
                            getDisplayAmount(invoice.amount),
                            currency,
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDateOnlyInTimezone(
                              invoice.dueDate,
                              timezone,
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.paymentMethod
                            ? (
                                <div className="flex items-center gap-2">
                                  {getPaymentMethodIcon(invoice.paymentMethod)}
                                  <span className="text-sm capitalize">
                                    {invoice.paymentMethod.replace(
                                      "_",
                                      " ",
                                    )}
                                  </span>
                                </div>
                              )
                            : (
                                <span className="text-muted-foreground">—</span>
                              )}
                        </TableCell>
                        <TableCell>
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
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGenerateInvoiceForTenant(invoice.tenant)}>
                                <Receipt className="h-4 w-4 mr-2" />
                                Generate Invoice
                              </DropdownMenuItem>
                              {invoice.status === "paid" && (
                                <DropdownMenuItem onClick={() => handleDownloadReceipt(invoice)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Receipt
                                </DropdownMenuItem>
                              )}
                              {invoice.status !== "paid" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openMarkAsPaid(invoice)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setIsMomoDialogOpen(true);
                                    }}
                                  >
                                    <Smartphone className="h-4 w-4 mr-2" />
                                    Send MoMo Request
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Reminder
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent
          value="subscriptions"
          className="space-y-6"
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Active Subscriptions
                  </CardTitle>
                  <CardDescription>Tenants currently on a recurring plan with billing cycle and renewal status</CardDescription>
                </div>
                <ExportButton
                  filename="subscriptions"
                  label="Export Data"
                  rows={filteredSubscriptions}
                  columns={[
                    {
                      header: "Tenant",
                      accessor: s => s.tenant,
                    },
                    {
                      header: "Plan",
                      accessor: s => s.plan,
                    },
                    {
                      header: "Status",
                      accessor: s => s.status,
                    },
                    {
                      header: "Amount (NGN)",
                      accessor: s => s.amount,
                    },
                    {
                      header: "Next Billing",
                      accessor: s => s.nextBillingDate,
                    },
                    {
                      header: "Payment Method",
                      accessor: s => s.paymentMethod,
                    },
                    {
                      header: "Auto Renew",
                      accessor: s => (s.autoRenew ? "Yes" : "No"),
                    },
                  ]}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 md:flex-row md:items-center mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by tenant..."
                    className="pl-10"
                    value={subSearchQuery}
                    onChange={e => setSubSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={subStatusFilter}
                  onValueChange={setSubStatusFilter}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <PlatformFilterPopover
                  entity="subscriptions"
                  fields={SUBSCRIPTION_FILTER_FIELDS}
                  value={subFilters}
                  onApply={setSubFilters}
                  onReset={() => setSubFilters(buildEmptyDraft(SUBSCRIPTION_FILTER_FIELDS))}
                />
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>
                        Next Billing (
                        {TIMEZONES[timezone].offset}
                        )
                      </TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Auto-Renew</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {sub.tenant.charAt(0)}
                            </div>
                            {sub.tenant}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={planColors[sub.plan]}>
                            {sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(
                            getDisplayAmount(sub.amount),
                            currency,
                          )}
                          /mo
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDateOnlyInTimezone(
                              sub.nextBillingDate,
                              timezone,
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(sub.paymentMethod)}
                            <span className="text-sm capitalize">
                              {sub.paymentMethod.replace(
                                "_",
                                " ",
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {sub.autoRenew
                            ? (
                                <CheckCircle className="h-5 w-5 text-success" />
                              )
                            : (
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSubscription(sub);
                                    setIsSubDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Upgrade Plan
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Change Payment Method
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleGenerateInvoiceForSub(sub)}
                                  disabled={generatingFor === sub.id}
                                >
                                  {generatingFor === sub.id
                                    ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      )
                                    : (
                                        <Receipt className="h-4 w-4 mr-2" />
                                      )}
                                  Generate Invoice
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Subscription
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Postpaid Tab */}
        <TabsContent
          value="postpaid"
          className="space-y-6"
        >
          <PostpaidBillingTab
            currency={currency}
            getDisplayAmount={getDisplayAmount}
          />
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent
          value="payments"
          className="space-y-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            {/* MTN MoMo Integration */}
            <Card className="border-warning/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-warning" />
                  </div>
                  MTN MoMo
                </CardTitle>
                <CardDescription>Mobile money payments via MTN</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-success/10 text-success">Connected</Badge>
                  <span className="text-sm text-muted-foreground">Production Mode</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">API User ID</span>
                    <span className="font-mono">••••••••-••••-••••</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subscription Key</span>
                    <span className="font-mono">••••••••••••••••</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Environment</span>
                    <span>mtnmomo.com</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Default Currency</span>
                    <span className="font-semibold">NGN (₦)</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Transactions</span>
                    <span className="font-semibold">78</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Volume</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        getDisplayAmount(18500000),
                        currency,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-semibold text-success">98.5%</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsMomoConfigOpen(true)}
                >
                  Configure Settings
                </Button>
              </CardContent>
            </Card>

            {/* Bank Transfer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  Bank Transfer
                </CardTitle>
                <CardDescription>Manual bank transfer payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-success/10 text-success">Active</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bank</span>
                    <span>GTBank Business</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account Number</span>
                    <span className="font-mono">••••••7890</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sort Code</span>
                    <span>058</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Transactions</span>
                    <span className="font-semibold">32</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Volume</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        getDisplayAmount(9500000),
                        currency,
                      )}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsBankDetailsOpen(true)}
                >
                  View Bank Details
                </Button>
              </CardContent>
            </Card>

            {/* Card Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  Card Payments
                </CardTitle>
                <CardDescription>Credit/Debit card payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Not Configured</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Card payments require integration with a payment gateway like Paystack or Flutterwave.
                </p>
                <Button
                  className="w-full"
                  onClick={() => setIsCardSetupOpen(true)}
                >
                  Setup Card Payments
                </Button>
              </CardContent>
            </Card>

            {/* Add Payment Method */}
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] text-center">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <Wallet className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">Add Payment Method</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure additional payment providers
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsAddProviderOpen(true)}
                >
                  Add Provider
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* MTN MoMo Configuration */}
      <Dialog
        open={isMomoConfigOpen}
        onOpenChange={setIsMomoConfigOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-warning" />
              Configure MTN MoMo
            </DialogTitle>
            <DialogDescription>
              Update credentials, environment and callback URL for the MTN MoMo integration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="momo-api-user">API User ID</Label>
              <Input
                id="momo-api-user"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={momoConfig.apiUserId}
                onChange={e => setMomoConfig({
                  ...momoConfig,
                  apiUserId: e.target.value,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="momo-sub-key">Subscription Key</Label>
              <Input
                id="momo-sub-key"
                type="password"
                placeholder="••••••••••••••••"
                value={momoConfig.subscriptionKey}
                onChange={e => setMomoConfig({
                  ...momoConfig,
                  subscriptionKey: e.target.value,
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select
                  value={momoConfig.environment}
                  onValueChange={v => setMomoConfig({
                    ...momoConfig,
                    environment: v,
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Select
                  value={momoConfig.defaultCurrency}
                  onValueChange={v => setMomoConfig({
                    ...momoConfig,
                    defaultCurrency: v,
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="momo-callback">Callback URL</Label>
              <Input
                id="momo-callback"
                value={momoConfig.callbackUrl}
                onChange={e => setMomoConfig({
                  ...momoConfig,
                  callbackUrl: e.target.value,
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMomoConfigOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("MTN MoMo settings saved");
              setIsMomoConfigOpen(false);
            }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Transfer Details */}
      <Dialog
        open={isBankDetailsOpen}
        onOpenChange={setIsBankDetailsOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Bank Transfer Details
            </DialogTitle>
            <DialogDescription>
              Share these details with tenants paying by manual bank transfer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              {
                label: "Account Name",
                value: "Fleet Pro Nigeria Ltd",
              },
              {
                label: "Bank",
                value: "GTBank Business",
              },
              {
                label: "Account Number",
                value: "0123457890",
              },
              {
                label: "Sort Code",
                value: "058",
              },
              {
                label: "Swift / BIC",
                value: "GTBINGLA",
              },
              {
                label: "Branch",
                value: "Victoria Island, Lagos",
              },
              {
                label: "Reference Format",
                value: "FP-{TENANT_ID}-{INVOICE}",
              },
            ].map(row => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{row.value}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      navigator.clipboard.writeText(row.value);
                      toast.success(`${row.label} copied`);
                    }}
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsBankDetailsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup Card Payments */}
      <Dialog
        open={isCardSetupOpen}
        onOpenChange={setIsCardSetupOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Setup Card Payments
            </DialogTitle>
            <DialogDescription>
              Connect a card processor to accept Visa, Mastercard and Verve from tenants.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={cardSetup.provider}
                onValueChange={v => setCardSetup({
                  ...cardSetup,
                  provider: v,
                })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paystack">Paystack</SelectItem>
                  <SelectItem value="flutterwave">Flutterwave</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-public">Public Key</Label>
              <Input
                id="card-public"
                placeholder="pk_live_..."
                value={cardSetup.publicKey}
                onChange={e => setCardSetup({
                  ...cardSetup,
                  publicKey: e.target.value,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-secret">Secret Key</Label>
              <Input
                id="card-secret"
                type="password"
                placeholder="sk_live_..."
                value={cardSetup.secretKey}
                onChange={e => setCardSetup({
                  ...cardSetup,
                  secretKey: e.target.value,
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCardSetupOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              if (!cardSetup.publicKey || !cardSetup.secretKey) {
                toast.error("Both keys are required");
                return;
              }
              toast.success(`${cardSetup.provider} connected for card payments`);
              setIsCardSetupOpen(false);
            }}
            >
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Provider */}
      <Dialog
        open={isAddProviderOpen}
        onOpenChange={setIsAddProviderOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Payment Provider
            </DialogTitle>
            <DialogDescription>
              Register an additional payment provider for tenants to use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="prov-name">Provider Name</Label>
              <Input
                id="prov-name"
                placeholder="e.g. Opay, Palmpay, Remita"
                value={newProvider.name}
                onChange={e => setNewProvider({
                  ...newProvider,
                  name: e.target.value,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prov-key">API Key</Label>
              <Input
                id="prov-key"
                type="password"
                placeholder="••••••••"
                value={newProvider.apiKey}
                onChange={e => setNewProvider({
                  ...newProvider,
                  apiKey: e.target.value,
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddProviderOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              if (!newProvider.name) {
                toast.error("Provider name is required");
                return;
              }
              toast.success(`${newProvider.name} added as a payment provider`);
              setNewProvider({
                name: "",
                apiKey: "",
              });
              setIsAddProviderOpen(false);
            }}
            >
              Add Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Sheet */}
      <Sheet
        open={isInvoiceSheetOpen}
        onOpenChange={setIsInvoiceSheetOpen}
      >
        <SheetContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              {selectedInvoice?.invoiceNumber}
            </SheetTitle>
            <SheetDescription className="flex items-center gap-2">
              {getStatusBadge(selectedInvoice?.status || "")}
              <span>{selectedInvoice?.period}</span>
            </SheetDescription>
          </SheetHeader>

          {selectedInvoice && (
            <ScrollArea className="h-[calc(100vh-180px)] mt-6">
              <div className="space-y-6 pr-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Bill To</h4>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {selectedInvoice.tenant.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{selectedInvoice.tenant}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedInvoice.plan}
                        {" "}
                        Plan
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Items</h4>
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm p-2 rounded bg-muted/30"
                      >
                        <div>
                          <p>{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity}
                            {" "}
                            x
                            {formatCurrency(
                              getDisplayAmount(item.unitPrice),
                              currency,
                            )}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(
                            getDisplayAmount(item.total),
                            currency,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(
                        getDisplayAmount(selectedInvoice.amount),
                        currency,
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Payment Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due Date</span>
                      <span>
                        {formatDateOnlyInTimezone(
                          selectedInvoice.dueDate,
                          timezone,
                        )}
                      </span>
                    </div>
                    {selectedInvoice.paidDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paid Date</span>
                        <span className="text-success">
                          {formatDateOnlyInTimezone(
                            selectedInvoice.paidDate,
                            timezone,
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Method</span>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(selectedInvoice.paymentMethod)}
                        <span className="capitalize">
                          {selectedInvoice.paymentMethod?.replace(
                            "_",
                            " ",
                          ) || "Not paid"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Timezone</span>
                      <span>{getTimezoneLabel(timezone)}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.status !== "paid" && (
                  <div className="flex flex-col gap-2 pt-4">
                    <Button
                      className="w-full"
                      onClick={() => openMarkAsPaid(selectedInvoice)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsMomoDialogOpen(true)}
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Request MoMo Payment
                    </Button>
                  </div>
                )}

                {selectedInvoice.status === "paid" && (
                  <Button
                    className="w-full bg-success hover:bg-success/90 text-success-foreground"
                    onClick={() => handleDownloadReceipt(selectedInvoice)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to Tenant
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Subscription Details Dialog (centered) */}
      <Dialog
        open={isSubDialogOpen}
        onOpenChange={setIsSubDialogOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              Subscription Details
            </DialogTitle>
            <DialogDescription>
              {selectedSubscription?.tenant}
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Plan</Label>
                  <div className="mt-1">
                    <Badge className={planColors[selectedSubscription.plan]}>
                      {selectedSubscription.plan.charAt(0).toUpperCase() + selectedSubscription.plan.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSubscription.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <p className="mt-1 font-semibold">
                    {formatCurrency(
                      getDisplayAmount(selectedSubscription.amount),
                      currency,
                    )}
                    /mo
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Auto-Renew</Label>
                  <p className="mt-1">{selectedSubscription.autoRenew ? "Enabled" : "Disabled"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <p className="mt-1 text-sm">
                    {formatDateOnlyInTimezone(
                      selectedSubscription.startDate,
                      timezone,
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Next Billing</Label>
                  <p className="mt-1 text-sm">
                    {formatDateOnlyInTimezone(
                      selectedSubscription.nextBillingDate,
                      timezone,
                    )}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Payment Method</Label>
                  <div className="mt-1 flex items-center gap-2">
                    {getPaymentMethodIcon(selectedSubscription.paymentMethod)}
                    <span className="capitalize">
                      {selectedSubscription.paymentMethod.replace(
                        "_",
                        " ",
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSubDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MTN MoMo Payment Dialog */}
      <Dialog
        open={isMomoDialogOpen}
        onOpenChange={setIsMomoDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-warning" />
              </div>
              MTN MoMo Payment Request
            </DialogTitle>
            <DialogDescription>
              Send a payment request to the customer's MTN MoMo account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice</span>
                <span className="font-medium">{selectedInvoice?.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-lg">
                  {formatCurrency(
                    selectedInvoice?.amount || 0,
                    "NGN",
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">NGN (Nigerian Naira)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="momoPhone">MTN Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="momoPhone"
                  value={momoPhone}
                  onChange={e => setMomoPhone(e.target.value)}
                  placeholder="+234 803 123 4567"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The customer will receive a push notification to approve the payment
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMomoDialogOpen(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button
              className="bg-warning hover:bg-warning/90 text-warning-foreground"
              onClick={handleSendMomoRequest}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment
                ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  )
                : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Request
                    </>
                  )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog
        open={isCreateInvoiceOpen}
        onOpenChange={setIsCreateInvoiceOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Select an active subscription to generate a new invoice for the current billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Subscription</Label>
            <Select
              value={createInvoiceSubId}
              onValueChange={setCreateInvoiceSubId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subscription" />
              </SelectTrigger>
              <SelectContent>
                {subscriptions
                  .filter(s => s.status === "active" || s.status === "trialing" || s.status === "past_due")
                  .map(s => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                    >
                      {s.tenant}
                      {" "}
                      —
                      {s.plan}
                      {" "}
                      (
                      {formatCurrency(
                        getDisplayAmount(s.amount),
                        currency,
                      )}
                      /mo)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateInvoiceOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvoiceConfirm}
              disabled={!createInvoiceSubId || generatingFor === createInvoiceSubId}
            >
              {generatingFor === createInvoiceSubId
                ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  )
                : (
                    <>
                      <Receipt className="h-4 w-4 mr-2" />
                      Generate Invoice
                    </>
                  )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Invoice as Paid Dialog */}
      <Dialog
        open={isMarkPaidOpen}
        onOpenChange={setIsMarkPaidOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              Confirm Payment
            </DialogTitle>
            <DialogDescription>
              Mark this invoice as paid. A receipt will be auto-generated and made available to the tenant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice</span>
                <span className="font-medium">{selectedInvoice?.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tenant</span>
                <span className="font-medium">{selectedInvoice?.tenant}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-lg">
                  {selectedInvoice
                    ? formatCurrency(
                        getDisplayAmount(selectedInvoice.amount),
                        currency,
                      )
                    : ""}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={markPaidMethod}
                onValueChange={v => setMarkPaidMethod(v as typeof markPaidMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtn_momo">MTN MoMo</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payRef">Payment Reference (optional)</Label>
              <Input
                id="payRef"
                value={markPaidReference}
                onChange={e => setMarkPaidReference(e.target.value)}
                placeholder="e.g. MOMO-TXN-123456"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMarkPaidOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmMarkAsPaid}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
