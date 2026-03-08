import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CreditCard,
  Search,
  Download,
  RefreshCw,
  Filter,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  PieChart,
  ArrowUpRight,
  Send,
  Phone,
  Smartphone,
  Wallet,
  Receipt,
  BarChart3,
  Users,
  Loader2,
  Globe,
  Plus,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useBilling } from "@/hooks/useBilling";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, type Currency, CURRENCIES, DEFAULT_CURRENCY, convertCurrency } from "@/lib/currency";
import { formatDateOnlyInTimezone, type Timezone, TIMEZONES, DEFAULT_TIMEZONE, getTimezoneLabel } from "@/lib/timezone";

interface Invoice {
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
}

interface Subscription {
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
}

const revenueData = [
  { month: "Jan", revenue: 12500000, subscriptions: 45, invoices: 48 },
  { month: "Feb", revenue: 14200000, subscriptions: 52, invoices: 55 },
  { month: "Mar", revenue: 15800000, subscriptions: 61, invoices: 64 },
  { month: "Apr", revenue: 17500000, subscriptions: 68, invoices: 71 },
  { month: "May", revenue: 18900000, subscriptions: 74, invoices: 78 },
  { month: "Jun", revenue: 21500000, subscriptions: 82, invoices: 86 },
  { month: "Jul", revenue: 22800000, subscriptions: 89, invoices: 93 },
  { month: "Aug", revenue: 24500000, subscriptions: 95, invoices: 99 },
  { month: "Sep", revenue: 26800000, subscriptions: 103, invoices: 107 },
  { month: "Oct", revenue: 28500000, subscriptions: 112, invoices: 116 },
  { month: "Nov", revenue: 30200000, subscriptions: 118, invoices: 122 },
  { month: "Dec", revenue: 32500000, subscriptions: 125, invoices: 130 },
];

const planDistribution = [
  { name: "Starter", value: 45, color: "#94a3b8" },
  { name: "Professional", value: 62, color: "#3b82f6" },
  { name: "Enterprise", value: 18, color: "#22c55e" },
];

const paymentMethodData = [
  { method: "MTN MoMo", count: 78, revenue: 18500000 },
  { method: "Bank Transfer", count: 32, revenue: 9500000 },
  { method: "Card", count: 15, revenue: 4500000 },
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
      { description: "Professional Plan - Monthly", quantity: 1, unitPrice: 129900, total: 129900 },
      { description: "Additional Vehicles (5)", quantity: 5, unitPrice: 4000, total: 20000 },
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
      { description: "Enterprise Plan - Monthly", quantity: 1, unitPrice: 499900, total: 499900 },
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
      { description: "Starter Plan - Monthly", quantity: 1, unitPrice: 49900, total: 49900 },
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
      { description: "Professional Plan - Monthly", quantity: 1, unitPrice: 149900, total: 149900 },
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
      { description: "Professional Plan - Monthly", quantity: 1, unitPrice: 149900, total: 149900 },
      { description: "SMS Bundle (500)", quantity: 1, unitPrice: 20000, total: 20000 },
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

export default function PlatformBilling() {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [subscriptions] = useState<Subscription[]>(mockSubscriptions);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceSheetOpen, setIsInvoiceSheetOpen] = useState(false);
  const [isMomoDialogOpen, setIsMomoDialogOpen] = useState(false);
  const [momoPhone, setMomoPhone] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const [timezone, setTimezone] = useState<Timezone>(DEFAULT_TIMEZONE);

  const { isLoading: isBillingLoading, summary, fetchBillingSummary, checkRenewals, processPayment } = useBilling();

  useEffect(() => {
    fetchBillingSummary();
  }, [fetchBillingSummary]);

  const handleCheckRenewals = async () => {
    await checkRenewals();
    await fetchBillingSummary();
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.tenant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getDisplayAmount = (amount: number) => {
    if (currency === 'NGN') return amount;
    return convertCurrency(amount, 'NGN', currency);
  };

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const pendingRevenue = invoices.filter((i) => i.status === "pending" || i.status === "overdue").reduce((sum, i) => sum + i.amount, 0);
  const activeSubscriptions = subscriptions.filter((s) => s.status === "active" || s.status === "trialing").length;
  const mrr = subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + s.amount, 0);

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
    if (!momoPhone || !selectedInvoice) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsProcessingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke('mtn-momo-payment', {
        body: {
          amount: selectedInvoice.amount,
          currency: 'NGN',
          phoneNumber: momoPhone,
          invoiceId: selectedInvoice.id,
          invoiceNumber: selectedInvoice.invoiceNumber,
          tenantName: selectedInvoice.tenant,
          payerMessage: `Payment for ${selectedInvoice.invoiceNumber}`,
          payeeNote: `Invoice payment from ${selectedInvoice.tenant}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || `MTN MoMo payment request sent to ${momoPhone}`);
        setIsMomoDialogOpen(false);
        setMomoPhone("");
      } else {
        toast.error(data?.error || 'Failed to send payment request');
      }
    } catch (error) {
      console.error('MTN MoMo payment error:', error);
      toast.error('Failed to send payment request. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceSheetOpen(true);
  };

  return (
    <DashboardLayout
      title="Billing & Revenue"
      subtitle="Manage invoices, subscriptions, and payments"
    >
      {/* Currency and Timezone Selectors */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CURRENCIES).map(([code, curr]) => (
                <SelectItem key={code} value={code}>
                  {curr.symbol} {curr.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select value={timezone} onValueChange={(value) => setTimezone(value as Timezone)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Timezone" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIMEZONES).map(([code, tz]) => (
                <SelectItem key={code} value={code}>
                  {tz.name} ({tz.offset})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchBillingSummary()}
              disabled={isBillingLoading}
            >
              {isBillingLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button
              variant="gradient"
              onClick={handleCheckRenewals}
              disabled={isBillingLoading}
            >
              {isBillingLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Generate Renewal Invoices
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Total Revenue (YTD)"
              value={formatCurrency(getDisplayAmount(totalRevenue), currency)}
              icon={DollarSign}
              change={18}
              changeLabel="vs last year"
              variant="success"
            />
            <StatCard
              title="Monthly Recurring"
              value={formatCurrency(getDisplayAmount(mrr), currency)}
              icon={TrendingUp}
              change={12}
              changeLabel="vs last month"
            />
            <StatCard
              title="Pending Payments"
              value={formatCurrency(getDisplayAmount(pendingRevenue), currency)}
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
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Monthly revenue for the current year ({CURRENCIES[currency].code})</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `${CURRENCIES[currency].symbol}${(getDisplayAmount(value) / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [formatCurrency(getDisplayAmount(value), currency), "Revenue"]}
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
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Subscription Distribution
                </CardTitle>
                <CardDescription>Active subscriptions by plan</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethodData.map((pm) => (
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
                        <p className="text-xs text-muted-foreground">{pm.count} payments</p>
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(getDisplayAmount(pm.revenue), currency)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    Recent Invoices
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.slice(0, 5).map((invoice) => (
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
                        <p className="font-semibold">{formatCurrency(getDisplayAmount(invoice.amount), currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  All Invoices
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice number or tenant..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
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
                <Button variant="ghost" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date ({TIMEZONES[timezone].offset})</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
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
                          {formatCurrency(getDisplayAmount(invoice.amount), currency)}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDateOnlyInTimezone(invoice.dueDate, timezone)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.paymentMethod ? (
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(invoice.paymentMethod)}
                              <span className="text-sm capitalize">
                                {invoice.paymentMethod.replace("_", " ")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              {invoice.status !== "paid" && (
                                <>
                                  <DropdownMenuSeparator />
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
        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Active Subscriptions
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Next Billing ({TIMEZONES[timezone].offset})</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Auto-Renew</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
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
                          {formatCurrency(getDisplayAmount(sub.amount), currency)}/mo
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDateOnlyInTimezone(sub.nextBillingDate, timezone)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(sub.paymentMethod)}
                            <span className="text-sm capitalize">
                              {sub.paymentMethod.replace("_", " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {sub.autoRenew ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Subscription
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

        {/* Payment Methods Tab */}
        <TabsContent value="payments" className="space-y-6">
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
                    <span className="font-semibold">{formatCurrency(getDisplayAmount(18500000), currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-semibold text-success">98.5%</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
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
                    <span className="font-semibold">{formatCurrency(getDisplayAmount(9500000), currency)}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
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
                <Button className="w-full">
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
                <Button variant="outline">Add Provider</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invoice Details Sheet */}
      <Sheet open={isInvoiceSheetOpen} onOpenChange={setIsInvoiceSheetOpen}>
        <SheetContent className="sm:max-w-lg">
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
                      <p className="text-sm text-muted-foreground">{selectedInvoice.plan} Plan</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Items</h4>
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm p-2 rounded bg-muted/30">
                        <div>
                          <p>{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} x {formatCurrency(getDisplayAmount(item.unitPrice), currency)}
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(getDisplayAmount(item.total), currency)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">{formatCurrency(getDisplayAmount(selectedInvoice.amount), currency)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Payment Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due Date</span>
                      <span>{formatDateOnlyInTimezone(selectedInvoice.dueDate, timezone)}</span>
                    </div>
                    {selectedInvoice.paidDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paid Date</span>
                        <span className="text-success">{formatDateOnlyInTimezone(selectedInvoice.paidDate, timezone)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Method</span>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(selectedInvoice.paymentMethod)}
                        <span className="capitalize">
                          {selectedInvoice.paymentMethod?.replace("_", " ") || "Not paid"}
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
                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1 bg-warning hover:bg-warning/90"
                      onClick={() => {
                        setIsMomoDialogOpen(true);
                      }}
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Request MoMo Payment
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* MTN MoMo Payment Dialog */}
      <Dialog open={isMomoDialogOpen} onOpenChange={setIsMomoDialogOpen}>
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
                <span className="font-bold text-lg">{formatCurrency(selectedInvoice?.amount || 0, 'NGN')}</span>
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
                  onChange={(e) => setMomoPhone(e.target.value)}
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
            <Button variant="outline" onClick={() => setIsMomoDialogOpen(false)} disabled={isProcessingPayment}>
              Cancel
            </Button>
            <Button 
              className="bg-warning hover:bg-warning/90 text-warning-foreground" 
              onClick={handleSendMomoRequest}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
