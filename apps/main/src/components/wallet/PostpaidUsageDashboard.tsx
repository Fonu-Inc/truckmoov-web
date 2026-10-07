import type { ColumnDef } from "@tanstack/react-table";
import type {
  FilterField, FilterValues,
} from "@/components/shadcn/table-toolbar";
import {
  Bot, Cpu, Download, MessageCircle, MessageSquare, Phone,
  Shield, TrendingUp, Zap,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { ExportButton } from "@/components/shadcn/export-button";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import { TableToolbar } from "@/components/shadcn/table-toolbar";
import { formatCurrency } from "@/lib/currency";

type PostpaidUsageDashboardProps = { tenantId: string };

const eventTypeConfig: Record<string, {
  label: string; icon: React.ElementType;
}> = {
  sms: {
    label: "SMS", icon: MessageSquare,
  },
  voice_minute: {
    label: "Voice Calls", icon: Phone,
  },
  whatsapp: {
    label: "WhatsApp", icon: MessageCircle,
  },
  ai_request: {
    label: "AI Optimization", icon: Bot,
  },
  iot_sim_active: {
    label: "IoT SIM", icon: Cpu,
  },
};

const CURRENT_PERIOD = new Date().toLocaleDateString(
  "en-US",
  {
    month: "short", year: "numeric",
  },
);

// ponytail: postpaid billing API not built yet — empty defaults stand in for
// the deleted usePostpaidBilling hook.
export function PostpaidUsageDashboard(_props: PostpaidUsageDashboardProps) {
  const usageSummary: Record<string, {
    count: number; total: number;
  }> = {};
  const totalCurrentUsage = 0;
  const currentPeriod = CURRENT_PERIOD;
  const creditLimit: any = null;
  const postpaidInvoices: any[] = [];
  const isLoading = false;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading usage data...
        </CardContent>
      </Card>
    );
  }

  const creditUtilization = creditLimit && Number(creditLimit.credit_limit_ngn) > 0
    ? (Number(creditLimit.current_usage_ngn) / Number(creditLimit.credit_limit_ngn)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Current Period Usage */}
      <CurrentUsageCard
        currentPeriod={currentPeriod}
        displayUsageSummary={usageSummary}
        displayTotalCurrentUsage={totalCurrentUsage}
        creditLimit={creditLimit}
        creditUtilization={creditUtilization}
      />

      <Separator />

      {/* Past Invoices */}
      <PostpaidInvoicesTable invoices={postpaidInvoices} />
    </div>
  );
}

type UsageRow = {
  type: string; count: number; total: number;
};

const usageColumns: ColumnDef<UsageRow>[] = [
  {
    id: "service",
    header: "Service",
    accessorFn: r => eventTypeConfig[r.type]?.label ?? r.type,
    cell: ({ row }) => {
      const config = eventTypeConfig[row.original.type] || {
        label: row.original.type, icon: Zap,
      };
      const Icon = config.icon;
      return (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {config.label}
        </div>
      );
    },
  },
  {
    accessorKey: "count",
    header: "Quantity",
    meta: { className: "text-right" },
    cell: ({ row }) => row.original.count.toLocaleString(),
  },
  {
    accessorKey: "total",
    header: "Amount",
    meta: { className: "text-right font-medium" },
    cell: ({ row }) => formatCurrency(
      row.original.total,
      "NGN",
    ),
  },
];

type CurrentUsageCardProps = {
  currentPeriod: string;
  displayUsageSummary: Record<string, {
    count: number; total: number;
  }>;
  displayTotalCurrentUsage: number;
  creditLimit: any;
  creditUtilization: number;
};

function CurrentUsageCard({
  currentPeriod,
  displayUsageSummary,
  displayTotalCurrentUsage,
  creditLimit,
  creditUtilization,
}: CurrentUsageCardProps) {
  const [
    serviceFilter,
    setServiceFilter,
  ] = useState<string>("all");

  const availableServices = Object.keys(displayUsageSummary);
  const filteredEntries = serviceFilter === "all"
    ? Object.entries(displayUsageSummary)
    : Object.entries(displayUsageSummary).filter(([type]) => type === serviceFilter);

  const filteredTotal = serviceFilter === "all"
    ? displayTotalCurrentUsage
    : filteredEntries.reduce(
        (s, [
          , v,
        ]) => s + v.total,
        0,
      );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Usage —
              {" "}
              {currentPeriod}
            </CardTitle>
            <CardDescription>
              Real-time usage tracking for the current billing period
            </CardDescription>
          </div>
          <Select
            value={serviceFilter}
            onValueChange={setServiceFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {availableServices.map((type) => {
                const cfg = eventTypeConfig[type] || { label: type };
                return (
                  <SelectItem
                    key={type}
                    value={type}
                  >
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
              {formatCurrency(
                filteredTotal,
                "NGN",
              )}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Credit Limit</p>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {creditLimit
                ? formatCurrency(
                    Number(creditLimit.credit_limit_ngn),
                    "NGN",
                  )
                : "—"}
            </p>
            <Progress
              value={creditUtilization}
              className="mt-2 h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {creditUtilization.toFixed(1)}
              % utilized
            </p>
          </div>
        </div>

        <DataTable
          columns={usageColumns}
          data={filteredEntries.map(([
            type,
            data,
          ]) => ({
            type, ...data,
          }))}
          emptyState={serviceFilter === "all" ? "No usage this period" : "No usage for this service"}
        />
      </CardContent>
    </Card>
  );
}

type PostpaidInvoiceRow = {
  id: string;
  invoice_number: string;
  billing_period: string;
  total_usage_ngn: number | string;
  wallet_deducted_ngn: number | string;
  invoice_balance_ngn: number | string;
  due_date: string;
  status: string;
};

const invoiceColumns: ColumnDef<PostpaidInvoiceRow>[] = [
  {
    accessorKey: "invoice_number",
    header: "Invoice #",
    meta: { className: "font-mono text-sm" },
  },
  {
    accessorKey: "billing_period",
    header: "Period",
  },
  {
    id: "total",
    header: "Total",
    accessorFn: r => Number(r.total_usage_ngn),
    cell: ({ getValue }) => formatCurrency(
      getValue<number>(),
      "NGN",
    ),
  },
  {
    id: "walletPaid",
    header: "Wallet Paid",
    accessorFn: r => Number(r.wallet_deducted_ngn),
    cell: ({ getValue }) => formatCurrency(
      getValue<number>(),
      "NGN",
    ),
  },
  {
    id: "balance",
    header: "Balance",
    accessorFn: r => Number(r.invoice_balance_ngn),
    meta: { className: "font-semibold" },
    cell: ({ getValue }) => formatCurrency(
      getValue<number>(),
      "NGN",
    ),
  },
  {
    accessorKey: "due_date",
    header: "Due",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={
        row.original.status === "paid"
          ? "bg-success/10 text-success border-success/30"
          : row.original.status === "overdue"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground"
      }
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "action",
    header: "Action",
    enableSorting: false,
    meta: { className: "text-right" },
    cell: ({ row }) => (row.original.status !== "paid" && Number(row.original.invoice_balance_ngn) > 0
      ? (
          <Button
            size="sm"
            onClick={() => toast.info("Payment coming soon.")}
          >
            Pay
          </Button>
        )
      : <span className="text-xs text-muted-foreground">—</span>),
  },
];

function PostpaidInvoicesTable({ invoices }: { invoices: PostpaidInvoiceRow[] }) {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState<string>("all");
  const [
    filters,
    setFilters,
  ] = useState<FilterValues>({});

  const filterFields: FilterField[] = [
    {
      type: "daterange",
      key: "due_date",
      label: "Due date",
      placeholderFrom: "From",
      placeholderTo: "To",
    },
  ];

  const filteredInvoices = useMemo(
    () => {
      const q = search.trim().toLowerCase();
      const dueFilter = filters.due_date;
      return invoices.filter((inv) => {
        if (q) {
          const hay = `${inv.invoice_number} ${inv.billing_period} ${inv.status}`.toLowerCase();
          if (!hay.includes(q))
            return false;
        }
        if (status !== "all" && inv.status !== status)
          return false;
        if (dueFilter?.enabled) {
          const d = new Date(inv.due_date).getTime();
          if (dueFilter.dateFrom) {
            const f = new Date(dueFilter.dateFrom).getTime();
            if (d < f)
              return false;
          }
          if (dueFilter.dateTo) {
            const t = new Date(dueFilter.dateTo).getTime();
            if (d > t)
              return false;
          }
        }
        return true;
      });
    },
    [
      invoices,
      search,
      status,
      filters,
    ],
  );

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
              {
                header: "Invoice #", accessor: "invoice_number",
              },
              {
                header: "Period", accessor: "billing_period",
              },
              {
                header: "Total (NGN)", accessor: r => Number(r.total_usage_ngn),
              },
              {
                header: "Wallet Paid (NGN)", accessor: r => Number(r.wallet_deducted_ngn),
              },
              {
                header: "Balance (NGN)", accessor: r => Number(r.invoice_balance_ngn),
              },
              {
                header: "Due Date", accessor: "due_date",
              },
              {
                header: "Status", accessor: "status",
              },
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
            {
              value: "paid", label: "Paid",
            },
            {
              value: "generated", label: "Pending",
            },
            {
              value: "overdue", label: "Overdue",
            },
          ]}
          filterEntity="invoices"
          filterFields={filterFields}
          filterValues={filters}
          onFiltersApply={setFilters}
        />
        <DataTable
          columns={invoiceColumns}
          data={filteredInvoices}
          hasActiveFilters={invoices.length > 0}
          emptyState="No invoices yet"
          filteredEmptyState="No invoices match your filters"
        />
      </CardContent>

    </Card>
  );
}
