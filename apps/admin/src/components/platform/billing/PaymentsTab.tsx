import type { ColumnDef } from "@tanstack/react-table";
import type {
  PaymentMethod, PaymentRow, PaymentStatus,
} from "@truckmoov/api/billing";
import { useBillingPayments } from "@truckmoov/api/billing";
import {
  CreditCard, Eye, Search,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import {
  formatIsoDateTime,
  formatNgn,
  ListErrorBanner,
  METHOD_LABEL,
  methodLabel,
  PAYMENT_STATUS_LABEL,
  PaymentStatusBadge,
} from "@/components/platform/billing/billingUi";
import { PaymentDetailsDialog } from "@/components/platform/billing/PaymentDetailsDialog";
import { useBillingList } from "@/components/platform/billing/useBillingList";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

const PAGE_SIZE = 10;

type Filters = {
  status: "all" | PaymentStatus; method: "all" | PaymentMethod;
};

const EXPORT_COLUMNS = [
  {
    header: "Reference", accessor: "reference" as const,
  },
  {
    header: "Customer", accessor: "customerName" as const,
  },
  {
    header: "Product", accessor: "productName" as const,
  },
  {
    header: "Devices", accessor: "deviceCount" as const,
  },
  {
    header: "Amount (NGN)", accessor: "amountNgn" as const,
  },
  {
    header: "Method", accessor: (p: PaymentRow) => methodLabel(p.method),
  },
  {
    header: "Status", accessor: (p: PaymentRow) => PAYMENT_STATUS_LABEL[p.status],
  },
  {
    header: "Paid at", accessor: (p: PaymentRow) => formatIsoDateTime(p.paidAt),
  },
  {
    header: "Quotation", accessor: (p: PaymentRow) => p.quotationNumber ?? "",
  },
  {
    header: "Invoice", accessor: (p: PaymentRow) => p.invoiceNumber ?? "",
  },
];

// Server-paged list: sorting one page would mislead, so it's off.
function paymentColumns(onView: (id: string) => void): ColumnDef<PaymentRow>[] {
  return [
    {
      accessorKey: "reference", header: "Payment Reference", enableSorting: false, meta: { className: "font-medium" },
    },
    {
      accessorKey: "customerName", header: "Customer", enableSorting: false,
    },
    {
      accessorKey: "productName", header: "Product", enableSorting: false,
    },
    {
      accessorKey: "deviceCount", header: "Devices", enableSorting: false, meta: { className: "tabular-nums" },
    },
    {
      accessorKey: "amountNgn",
      header: "Amount Paid",
      enableSorting: false,
      meta: { className: "font-medium" },
      cell: ({ row }) => formatNgn(row.original.amountNgn),
    },
    {
      id: "method", header: "Method", enableSorting: false, cell: ({ row }) => methodLabel(row.original.method),
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
    },
    {
      id: "paidAt",
      header: "Paid At",
      enableSorting: false,
      meta: { className: "text-sm text-muted-foreground" },
      cell: ({ row }) => formatIsoDateTime(row.original.paidAt),
    },
    {
      id: "quotation", header: "Quotation", enableSorting: false, cell: ({ row }) => row.original.quotationNumber ?? "-",
    },
    {
      id: "invoice", header: "Invoice", enableSorting: false, cell: ({ row }) => row.original.invoiceNumber ?? "-",
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(row.original.id)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View Detail
        </Button>
      ),
    },
  ];
}

export function PaymentsTab() {
  const list = useBillingList<Filters>({
    status: "all", method: "all",
  });
  const {
    filters, page, setPage,
  } = list;
  const [
    viewingId,
    setViewingId,
  ] = useState<string | null>(null);
  const columns = useMemo(
    () => paymentColumns(setViewingId),
    [],
  );

  const {
    data, isLoading, isError, error, refetch,
  } = useBillingPayments({
    params: {
      q: list.debouncedSearch || undefined,
      status: filters.status === "all" ? undefined : filters.status,
      method: filters.method === "all" ? undefined : filters.method,
      page,
      limit: PAGE_SIZE,
    },
  });

  const rows = data?.data.items ?? [];
  const total = data?.data.total ?? 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Payments History
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Every payment the system recorded, and the quotation it settled.
            </p>
          </div>
          <ExportButton
            rows={rows}
            filename="payments-history"
            label="Export Data (loaded rows)"
            columns={EXPORT_COLUMNS}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={list.search}
                onChange={e => list.setSearch(e.target.value)}
                placeholder="Search by reference, customer or quotation..."
                className="pl-9"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={v => list.setFilter(
                "status",
                v as Filters["status"],
              )}
            >
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(PAYMENT_STATUS_LABEL).map(([
                  v,
                  l,
                ]) => (
                  <SelectItem
                    key={v}
                    value={v}
                  >
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.method}
              onValueChange={v => list.setFilter(
                "method",
                v as Filters["method"],
              )}
            >
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {Object.entries(METHOD_LABEL).map(([
                  v,
                  l,
                ]) => (
                  <SelectItem
                    key={v}
                    value={v}
                  >
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isError && rows.length > 0 && (
            <ListErrorBanner
              title="Couldn't load payments"
              message={error?.message}
              onRetry={() => void refetch()}
            />
          )}

          <div className="overflow-x-auto rounded-2xl border">
            <DataTable
              className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap"
              columns={columns}
              data={rows}
              isLoading={isLoading}
              isError={isError && rows.length === 0}
              errorMessage={`Couldn't load payments${error?.message ? `: ${error.message}` : ""}`}
              onRetry={() => void refetch()}
              emptyState={(
                <>
                  <p className="text-sm font-medium text-foreground">No payments found</p>
                  <p className="text-xs">Adjust your search or filters.</p>
                </>
              )}
              pagination={{
                page, pageSize: PAGE_SIZE, total, onPageChange: setPage,
              }}
            />
          </div>
        </CardContent>
      </Card>
      <PaymentDetailsDialog
        paymentId={viewingId}
        onClose={() => setViewingId(null)}
      />
    </>
  );
}
