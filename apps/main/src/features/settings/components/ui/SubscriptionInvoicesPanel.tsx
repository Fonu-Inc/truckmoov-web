import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  SlidersHorizontal as FilterIcon,
  Link2,
  Mail,
  MoreHorizontal,
  Search,
  Share2,
  Trash2,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Calendar as CalendarPicker } from "@/components/shadcn/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { formatCurrency } from "@/lib/currency";
import { downloadReceiptPDF } from "@/lib/receiptPdf";
import { cn } from "@/lib/utils";

type SubInvoiceStatus = "paid" | "pending" | "failed" | "overdue";
type BillingType = "Monthly" | "Yearly";
type BillingModel = "Prepaid" | "Postpaid" | "Trial";

type SubscriptionInvoice = {
  id: string;
  invoiceNumber: string;
  plan: string;
  billingType: BillingType;
  billingModel: BillingModel;
  amount: number;
  status: SubInvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  paymentMethod: "mtn_momo" | "bank_transfer" | "card" | null;
  reference: string;
  items: {
    description: string; quantity: number; unitPrice: number; total: number;
  }[];
};

const DEMO_INVOICES: SubscriptionInvoice[] = [
  {
    id: "sub-inv-001",
    invoiceNumber: "SUB-2026-0042",
    plan: "Professional",
    billingType: "Monthly",
    billingModel: "Postpaid",
    amount: 149900,
    status: "paid",
    issueDate: "2026-04-01",
    dueDate: "2026-04-15",
    paidDate: "2026-04-10",
    paymentMethod: "mtn_momo",
    reference: "PAY-MOMO-2026-0042",
    items: [
      {
        description: "Professional Plan — Monthly", quantity: 1, unitPrice: 129900, total: 129900,
      },
      {
        description: "Additional Vehicles (5)", quantity: 5, unitPrice: 4000, total: 20000,
      },
    ],
  },
  {
    id: "sub-inv-002",
    invoiceNumber: "SUB-2026-0031",
    plan: "Professional",
    billingType: "Monthly",
    billingModel: "Postpaid",
    amount: 129900,
    status: "paid",
    issueDate: "2026-03-01",
    dueDate: "2026-03-15",
    paidDate: "2026-03-12",
    paymentMethod: "mtn_momo",
    reference: "PAY-MOMO-2026-0031",
    items: [
      {
        description: "Professional Plan — Monthly", quantity: 1, unitPrice: 129900, total: 129900,
      },
    ],
  },
  {
    id: "sub-inv-003",
    invoiceNumber: "SUB-2026-0024",
    plan: "Professional",
    billingType: "Monthly",
    billingModel: "Prepaid",
    amount: 129900,
    status: "paid",
    issueDate: "2026-02-01",
    dueDate: "2026-02-15",
    paidDate: "2026-02-14",
    paymentMethod: "bank_transfer",
    reference: "PAY-BT-2026-0024",
    items: [
      {
        description: "Professional Plan — Monthly", quantity: 1, unitPrice: 129900, total: 129900,
      },
    ],
  },
  {
    id: "sub-inv-004",
    invoiceNumber: "SUB-2026-0051",
    plan: "Professional",
    billingType: "Monthly",
    billingModel: "Postpaid",
    amount: 149900,
    status: "pending",
    issueDate: "2026-05-01",
    dueDate: "2026-05-15",
    paidDate: null,
    paymentMethod: null,
    reference: "—",
    items: [
      {
        description: "Professional Plan — Monthly", quantity: 1, unitPrice: 129900, total: 129900,
      },
      {
        description: "Additional Vehicles (5)", quantity: 5, unitPrice: 4000, total: 20000,
      },
    ],
  },
  {
    id: "sub-inv-005",
    invoiceNumber: "SUB-2026-0017",
    plan: "Starter",
    billingType: "Yearly",
    billingModel: "Prepaid",
    amount: 599000,
    status: "overdue",
    issueDate: "2026-01-01",
    dueDate: "2026-01-15",
    paidDate: null,
    paymentMethod: null,
    reference: "—",
    items: [
      {
        description: "Starter Plan — Yearly", quantity: 1, unitPrice: 599000, total: 599000,
      },
    ],
  },
  {
    id: "sub-inv-006",
    invoiceNumber: "SUB-2025-0998",
    plan: "Professional",
    billingType: "Monthly",
    billingModel: "Trial",
    amount: 0,
    status: "paid",
    issueDate: "2025-12-01",
    dueDate: "2025-12-15",
    paidDate: "2025-12-01",
    paymentMethod: "card",
    reference: "TRIAL-2025-0998",
    items: [
      {
        description: "Free Trial — Professional Plan", quantity: 1, unitPrice: 0, total: 0,
      },
    ],
  },
];

function statusBadge(s: SubInvoiceStatus) {
  switch (s) {
    case "paid":
      return (
        <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10">
          <CheckCircle className="h-3 w-3 mr-1" />
          {" "}
          Paid
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant="secondary"
          className="bg-warning/10 text-warning border-warning/20"
        >
          <Clock className="h-3 w-3 mr-1" />
          {" "}
          Pending
        </Badge>
      );
    case "overdue":
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          {" "}
          Overdue
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="destructive"
          className="bg-destructive/10 text-destructive border-destructive/20"
        >
          <XCircle className="h-3 w-3 mr-1" />
          {" "}
          Failed
        </Badge>
      );
  }
}

function modelBadge(m: BillingModel) {
  const variants: Record<BillingModel, string> = {
    Prepaid: "bg-info/10 text-info border-info/20",
    Postpaid: "bg-primary/10 text-primary border-primary/20",
    Trial: "bg-muted text-muted-foreground border-muted",
  };
  return (
    <Badge
      variant="outline"
      className={variants[m]}
    >
      {m}
    </Badge>
  );
}

export function SubscriptionInvoicesPanel() {
  const { user } = useAuthStore();
  const tenantName = user?.tenantId ? "Your Organisation" : "Demo Tenant";

  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<string>("all");
  const [
    selected,
    setSelected,
  ] = useState<SubscriptionInvoice | null>(null);
  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    shareInv,
    setShareInv,
  ] = useState<SubscriptionInvoice | null>(null);
  const [
    shareEmail,
    setShareEmail,
  ] = useState("");

  // Applied filters
  type Filters = {
    billingType: BillingType | null;
    plan: string | null;
    billingModel: BillingModel | null;
    dateFrom: Date | null;
    dateTo: Date | null;
  };
  const [
    filters,
    setFilters,
  ] = useState<Filters>({
    billingType: null,
    plan: null,
    billingModel: null,
    dateFrom: null,
    dateTo: null,
  });

  // Draft (popover) filters with per-field enable
  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);
  const [
    draft,
    setDraft,
  ] = useState({
    billingTypeOn: false,
    billingType: "Monthly" as BillingType,
    planOn: false,
    plan: "Professional",
    billingModelOn: false,
    billingModel: "Postpaid" as BillingModel,
    dateOn: false,
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
  });

  const allPlans = useMemo(
    () => Array.from(new Set(DEMO_INVOICES.map(i => i.plan))),
    [],
  );

  const activeFilterCount
    = (filters.billingType ? 1 : 0)
      + (filters.plan ? 1 : 0)
      + (filters.billingModel ? 1 : 0)
      + (filters.dateFrom || filters.dateTo ? 1 : 0);

  const openFilter = () => {
    // Seed draft from applied filters
    setDraft({
      billingTypeOn: !!filters.billingType,
      billingType: filters.billingType ?? "Monthly",
      planOn: !!filters.plan,
      plan: filters.plan ?? allPlans[0] ?? "Professional",
      billingModelOn: !!filters.billingModel,
      billingModel: filters.billingModel ?? "Postpaid",
      dateOn: !!(filters.dateFrom || filters.dateTo),
      dateFrom: filters.dateFrom ?? undefined,
      dateTo: filters.dateTo ?? undefined,
    });
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters({
      billingType: draft.billingTypeOn ? draft.billingType : null,
      plan: draft.planOn ? draft.plan : null,
      billingModel: draft.billingModelOn ? draft.billingModel : null,
      dateFrom: draft.dateOn ? draft.dateFrom ?? null : null,
      dateTo: draft.dateOn ? draft.dateTo ?? null : null,
    });
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      billingType: null,
      plan: null,
      billingModel: null,
      dateFrom: null,
      dateTo: null,
    });
    setFilterOpen(false);
  };

  const handleView = (inv: SubscriptionInvoice) => {
    setSelected(inv);
    setOpen(true);
  };

  const handleShare = (inv: SubscriptionInvoice) => {
    setShareInv(inv);
    setShareEmail("");
  };

  const handleSendShare = () => {
    if (!shareInv)
      return;
    if (!shareEmail || !/^\S[^\s@]*@\S[^\s.]*\.\S+$/.test(shareEmail)) {
      toast.error("Enter a valid email address");
      return;
    }
    toast.success(`Download for ${shareInv.invoiceNumber} sent to ${shareEmail}`);
    setShareInv(null);
  };

  const handleCopyLink = (inv: SubscriptionInvoice) => {
    const link = `${window.location.origin}/settings/subscription/invoices?invoice=${inv.invoiceNumber}`;
    navigator.clipboard?.writeText(link).then(
      () => toast.success("Invoice link copied to clipboard"),
      () => toast.error("Failed to copy link"),
    );
  };

  const handleDelete = (_inv: SubscriptionInvoice) => {
    toast.info(
      "Subscription invoices cannot be deleted",
      { description: "These are platform-issued financial records retained for compliance." },
    );
  };

  const filtered = useMemo(
    () => {
      return DEMO_INVOICES.filter((inv) => {
        if (statusFilter !== "all" && inv.status !== statusFilter)
          return false;
        if (filters.billingType && inv.billingType !== filters.billingType)
          return false;
        if (filters.plan && inv.plan !== filters.plan)
          return false;
        if (filters.billingModel && inv.billingModel !== filters.billingModel)
          return false;
        if (filters.dateFrom || filters.dateTo) {
          const issued = new Date(inv.issueDate);
          if (filters.dateFrom && issued < filters.dateFrom)
            return false;
          if (filters.dateTo) {
            const end = new Date(filters.dateTo);
            end.setHours(
              23,
              59,
              59,
              999,
            );
            if (issued > end)
              return false;
          }
        }
        if (search) {
          const q = search.toLowerCase();
          return (
            inv.invoiceNumber.toLowerCase().includes(q)
            || inv.plan.toLowerCase().includes(q)
            || inv.reference.toLowerCase().includes(q)
          );
        }
        return true;
      });
    },
    [
      search,
      statusFilter,
      filters,
    ],
  );

  const totalPaid = DEMO_INVOICES.filter(i => i.status === "paid").reduce(
    (s, i) => s + i.amount,
    0,
  );
  const outstanding = DEMO_INVOICES.filter(i => i.status !== "paid").reduce(
    (s, i) => s + i.amount,
    0,
  );
  const overdueCount = DEMO_INVOICES.filter(i => i.status === "overdue").length;
  const nextDue = DEMO_INVOICES.find(i => i.status === "pending")?.dueDate ?? "—";

  const handleDownload = (inv: SubscriptionInvoice) => {
    if (inv.status !== "paid" || !inv.paidDate) {
      toast.error("Download is only available after payment is confirmed");
      return;
    }
    const subtotal = inv.items.reduce(
      (s, i) => s + i.total,
      0,
    );
    downloadReceiptPDF({
      invoiceNumber: inv.invoiceNumber,
      tenantName,
      plan: inv.plan,
      period: `${inv.billingType} (${inv.billingModel})`,
      issueDate: inv.issueDate,
      paidDate: inv.paidDate,
      dueDate: inv.dueDate,
      paymentMethod: inv.paymentMethod
        ? inv.paymentMethod.replace(
            "_",
            " ",
          ).toUpperCase()
        : "—",
      paymentReference: inv.reference,
      items: inv.items,
      subtotal,
      amount: inv.amount,
      currency: "NGN",
    });
    toast.success(`Download for ${inv.invoiceNumber} downloaded`);
  };

  const stats = [
    {
      label: "Total paid (12mo)", value: formatCurrency(
        totalPaid,
        "NGN",
      ), icon: TrendingUp, tone: "text-success bg-success/10",
    },
    {
      label: "Outstanding", value: formatCurrency(
        outstanding,
        "NGN",
      ), icon: Wallet, tone: "text-warning bg-warning/10",
    },
    {
      label: "Overdue invoices", value: String(overdueCount), icon: AlertCircle, tone: "text-destructive bg-destructive/10",
    },
    {
      label: "Next due", value: nextDue, icon: Calendar, tone: "text-primary bg-primary/10",
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Your platform subscription billing history. Each invoice represents a payment to the platform for your plan.
      </p>

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <Card
            key={i}
            className="p-3"
          >
            <div className="flex items-center gap-2.5">
              <div className={`h-10 w-10 rounded-lg ${s.tone} flex items-center justify-center shrink-0`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg font-bold truncate">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Subscription Invoices
              </CardTitle>
              <CardDescription>Platform billing — subscriptions, plans, billing cycles</CardDescription>
            </div>
            <ExportButton
              filename="subscription-invoices"
              rows={filtered}
              columns={[
                {
                  header: "Invoice #", accessor: i => i.invoiceNumber,
                },
                {
                  header: "Plan", accessor: i => i.plan,
                },
                {
                  header: "Billing Type", accessor: i => i.billingType,
                },
                {
                  header: "Billing Model", accessor: i => i.billingModel,
                },
                {
                  header: "Amount (NGN)", accessor: i => i.amount,
                },
                {
                  header: "Status", accessor: i => i.status,
                },
                {
                  header: "Due Date", accessor: i => i.dueDate,
                },
                {
                  header: "Paid Date", accessor: i => i.paidDate ?? "",
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice #, plan, reference..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px] bg-card/50 border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Popover
              open={filterOpen}
              onOpenChange={o => (o ? openFilter() : setFilterOpen(false))}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-card/50 border-border/50 gap-2"
                >
                  <FilterIcon className="h-4 w-4" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-[10px]"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 p-0"
              >
                <div className="p-4 border-b">
                  <p className="text-sm font-semibold">Show Invoices</p>
                  <p className="text-xs text-muted-foreground">Enable a filter to apply it</p>
                </div>
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Billing Type */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="f-billing-type"
                        checked={draft.billingTypeOn}
                        onCheckedChange={c => setDraft(d => ({
                          ...d, billingTypeOn: !!c,
                        }))}
                      />
                      <Label
                        htmlFor="f-billing-type"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Billing Type
                      </Label>
                    </div>
                    <Select
                      value={draft.billingType}
                      onValueChange={v => setDraft(d => ({
                        ...d, billingType: v as BillingType,
                      }))}
                      disabled={!draft.billingTypeOn}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Plan */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="f-plan"
                        checked={draft.planOn}
                        onCheckedChange={c => setDraft(d => ({
                          ...d, planOn: !!c,
                        }))}
                      />
                      <Label
                        htmlFor="f-plan"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Plan
                      </Label>
                    </div>
                    <Select
                      value={draft.plan}
                      onValueChange={v => setDraft(d => ({
                        ...d, plan: v,
                      }))}
                      disabled={!draft.planOn}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allPlans.map(p => (
                          <SelectItem
                            key={p}
                            value={p}
                          >
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Billing Model */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="f-billing-model"
                        checked={draft.billingModelOn}
                        onCheckedChange={c => setDraft(d => ({
                          ...d, billingModelOn: !!c,
                        }))}
                      />
                      <Label
                        htmlFor="f-billing-model"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Billing Model
                      </Label>
                    </div>
                    <Select
                      value={draft.billingModel}
                      onValueChange={v => setDraft(d => ({
                        ...d, billingModel: v as BillingModel,
                      }))}
                      disabled={!draft.billingModelOn}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Prepaid">Prepaid</SelectItem>
                        <SelectItem value="Postpaid">Postpaid</SelectItem>
                        <SelectItem value="Trial">Trial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date range */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="f-date"
                        checked={draft.dateOn}
                        onCheckedChange={c => setDraft(d => ({
                          ...d, dateOn: !!c,
                        }))}
                      />
                      <Label
                        htmlFor="f-date"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Issue date
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={!draft.dateOn}
                            className={cn(
                              "justify-start text-left font-normal text-xs",
                              !draft.dateFrom && "text-muted-foreground",
                            )}
                          >
                            <Calendar className="mr-1 h-3.5 w-3.5" />
                            {draft.dateFrom ? formatDate(draft.dateFrom) : "From"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0"
                          align="start"
                        >
                          <CalendarPicker
                            mode="single"
                            selected={draft.dateFrom}
                            onSelect={d => setDraft(dr => ({
                              ...dr, dateFrom: d ?? undefined,
                            }))}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={!draft.dateOn}
                            className={cn(
                              "justify-start text-left font-normal text-xs",
                              !draft.dateTo && "text-muted-foreground",
                            )}
                          >
                            <Calendar className="mr-1 h-3.5 w-3.5" />
                            {draft.dateTo ? formatDate(draft.dateTo) : "To"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0"
                          align="start"
                        >
                          <CalendarPicker
                            mode="single"
                            selected={draft.dateTo}
                            onSelect={d => setDraft(dr => ({
                              ...dr, dateTo: d ?? undefined,
                            }))}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={applyFilters}
                    className="flex-1"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="flex-1"
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Billing Type</TableHead>
                <TableHead>Billing Model</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Download className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No subscription invoices found</p>
                      </TableCell>
                    </TableRow>
                  )
                : (
                    filtered.map(inv => (
                      <TableRow
                        key={inv.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelected(inv);
                          setOpen(true);
                        }}
                      >
                        <TableCell className="font-mono font-medium">{inv.invoiceNumber}</TableCell>
                        <TableCell>{inv.plan}</TableCell>
                        <TableCell className="text-sm">{inv.billingType}</TableCell>
                        <TableCell>{modelBadge(inv.billingModel)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(
                            inv.amount,
                            "NGN",
                          )}
                        </TableCell>
                        <TableCell>{statusBadge(inv.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {inv.paidDate ?? `Due ${inv.dueDate}`}
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={e => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48"
                            >
                              <DropdownMenuLabel>Invoice actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleView(inv)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShare(inv)}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(inv)}
                                disabled={inv.status !== "paid"}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download receipt
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(inv)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog (centered) */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              {selected?.invoiceNumber}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-2">
                {selected && statusBadge(selected.status)}
                <span>
                  {selected?.plan}
                  {" "}
                  ·
                  {" "}
                  {selected?.billingType}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-5 mt-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bill to</p>
                <p className="font-medium">{tenantName}</p>
                <p className="text-sm text-muted-foreground">
                  {selected.plan}
                  {" "}
                  ·
                  {selected.billingModel}
                  {" "}
                  {selected.billingType}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Items</p>
                {selected.items.map((it, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm p-2 rounded bg-muted/30"
                  >
                    <div>
                      <p>{it.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.quantity}
                        {" "}
                        ×
                        {formatCurrency(
                          it.unitPrice,
                          "NGN",
                        )}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(
                        it.total,
                        "NGN",
                      )}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(
                      selected.amount,
                      "NGN",
                    )}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issue date</span>
                  <span>{selected.issueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due date</span>
                  <span>{selected.dueDate}</span>
                </div>
                {selected.paidDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid on</span>
                    <span className="text-success">{selected.paidDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="capitalize flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    {selected.paymentMethod?.replace(
                      "_",
                      " ",
                    ) || "Not paid"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">{selected.reference}</span>
                </div>
              </div>

              {selected.status === "paid"
                ? (
                    <Button
                      className="w-full bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => handleDownload(selected)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt (PDF)
                    </Button>
                  )
                : (
                    <div className="rounded-md bg-warning/10 border border-warning/20 p-3 text-sm">
                      <p className="font-medium text-warning flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {" "}
                        Awaiting payment confirmation
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your receipt will be available here as soon as payment is confirmed by our billing team.
                      </p>
                    </div>
                  )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={!!shareInv}
        onOpenChange={o => !o && setShareInv(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share invoice
              {" "}
              {shareInv?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>
              Email a copy of this invoice or copy a shareable link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="share-email">Recipient email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="share-email"
                  type="email"
                  placeholder="finance@example.com"
                  value={shareEmail}
                  onChange={e => setShareEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => shareInv && handleCopyLink(shareInv)}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Copy invoice link
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShareInv(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendShare}>
              <Mail className="h-4 w-4 mr-2" />
              Send invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
