import type { ColumnDef } from "@tanstack/react-table";
import type {
  InvoiceKind, InvoiceRow, InvoiceStatus,
} from "@truckmoov/api/billing";
import { useQuery } from "@tanstack/react-query";
import {
  getBillingInvoicesQueryOptions, useEnforcementSettings,
} from "@truckmoov/api/billing";
import {
  Eye, FileText, MailCheck, Search,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  customerTypeLabel,
  DueStateText,
  formatDateOnly,
  formatIsoDateTime,
  formatNgn,
  INVOICE_STATUS_LABEL,
  InvoiceStatusBadge,
  ListErrorBanner,
  RenewalBadge,
} from "@/components/platform/billing/billingUi";
import { InvoiceDetailsDialog } from "@/components/platform/billing/InvoiceDetailsDialog";
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
  status: "all" | InvoiceStatus; kind: "all" | InvoiceKind;
};

const EXPORT_COLUMNS = [
  {
    header: "Invoice", accessor: "number" as const,
  },
  {
    header: "Quotation", accessor: (row: InvoiceRow) => row.quotationNumber ?? "-",
  },
  {
    header: "Customer", accessor: "customerName" as const,
  },
  {
    header: "Customer Type", accessor: (row: InvoiceRow) => customerTypeLabel(row.customerType),
  },
  {
    header: "Type", accessor: (row: InvoiceRow) => (row.isRenewal ? "Renewal" : "First purchase"),
  },
  {
    header: "Status", accessor: (row: InvoiceRow) => INVOICE_STATUS_LABEL[row.status],
  },
  {
    header: "Issue Date", accessor: (row: InvoiceRow) => formatDateOnly(row.issueDate),
  },
  {
    header: "Due Date", accessor: (row: InvoiceRow) => formatDateOnly(row.dueDate),
  },
  {
    header: "Total (NGN)", accessor: "totalNgn" as const,
  },
  {
    header: "Paid (NGN)", accessor: "amountPaidNgn" as const,
  },
  {
    header: "Outstanding (NGN)", accessor: "outstandingNgn" as const,
  },
  {
    header: "Emailed", accessor: (row: InvoiceRow) => (row.emailedAt ? formatIsoDateTime(row.emailedAt) : "Not sent"),
  },
];

// Server-paged list: sorting one page would mislead, so it's off.
function invoiceColumns(graceDays: number | null, onView: (id: string) => void): ColumnDef<InvoiceRow>[] {
  return [
    {
      accessorKey: "number", header: "Invoice Number", enableSorting: false, meta: { className: "font-medium" },
    },
    {
      id: "quotation",
      header: "Quotation",
      enableSorting: false,
      meta: { className: "text-muted-foreground" },
      cell: ({ row }) => row.original.quotationNumber ?? "-",
    },
    {
      accessorKey: "customerName", header: "Customer", enableSorting: false,
    },
    {
      id: "type",
      header: "Type",
      enableSorting: false,
      cell: ({ row }) => (row.original.isRenewal
        ? <RenewalBadge />
        : <span className="text-sm text-muted-foreground">First purchase</span>),
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <InvoiceStatusBadge status={row.original.status} />
          <DueStateText
            invoice={row.original}
            graceDays={graceDays}
          />
        </div>
      ),
    },
    {
      id: "issueDate",
      header: "Issue Date",
      enableSorting: false,
      meta: { className: "text-muted-foreground" },
      cell: ({ row }) => formatDateOnly(row.original.issueDate),
    },
    {
      id: "dueDate",
      header: "Due Date",
      enableSorting: false,
      meta: { className: "text-muted-foreground" },
      cell: ({ row }) => formatDateOnly(row.original.dueDate),
    },
    {
      id: "total",
      header: "Total",
      enableSorting: false,
      meta: { className: "font-medium tabular-nums" },
      cell: ({ row }) => formatNgn(row.original.totalNgn),
    },
    {
      id: "paid",
      header: "Paid",
      enableSorting: false,
      meta: { className: "tabular-nums" },
      cell: ({ row }) => formatNgn(row.original.amountPaidNgn),
    },
    {
      id: "outstanding",
      header: "Outstanding",
      enableSorting: false,
      meta: { className: "tabular-nums" },
      cell: ({ row }) => formatNgn(row.original.outstandingNgn),
    },
    {
      id: "emailed",
      header: "Emailed",
      enableSorting: false,
      meta: { className: "text-sm text-muted-foreground" },
      cell: ({ row }) => (row.original.emailedAt
        ? (
            <span className="inline-flex items-center gap-1.5">
              <MailCheck className="h-3.5 w-3.5 text-success" />
              {formatIsoDateTime(row.original.emailedAt)}
            </span>
          )
        : "Not sent"),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`View ${row.original.number}`}
          onClick={(e) => {
            e.stopPropagation();
            onView(row.original.id);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}

export function InvoicesTab() {
  const list = useBillingList<Filters>({
    status: "all", kind: "all",
  });
  const [
    viewingId,
    setViewingId,
  ] = useState<string | null>(null);
  const {
    filters, page,
  } = list;
  const graceDays = useEnforcementSettings().data?.data.graceDays ?? null;
  const columns = useMemo(
    () => invoiceColumns(
      graceDays,
      setViewingId,
    ),
    [graceDays],
  );

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery(
    getBillingInvoicesQueryOptions({
      params: {
        q: list.debouncedSearch || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        kind: filters.kind === "all" ? undefined : filters.kind,
        page,
        limit: PAGE_SIZE,
      },
    }),
  );

  const rows = data?.data.items ?? [];
  const total = data?.data.total ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Invoices
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              First purchase invoices are created and emailed once the customer pays. Renewal invoices are
              issued automatically before a licence expires and are due on its expiry date. This register is for reference only.
            </p>
          </div>
          <ExportButton
            rows={rows}
            filename="invoices"
            label="Export Data (loaded rows)"
            columns={EXPORT_COLUMNS}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={list.search}
                onChange={e => list.setSearch(e.target.value)}
                placeholder="Search by invoice, customer or quotation..."
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
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(INVOICE_STATUS_LABEL).map(([
                  value,
                  label,
                ]) => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.kind}
              onValueChange={v => list.setFilter(
                "kind",
                v as Filters["kind"],
              )}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All invoices</SelectItem>
                <SelectItem value="first">First purchase</SelectItem>
                <SelectItem value="renewal">Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isError && rows.length > 0 && (
            <ListErrorBanner
              title="Couldn't load invoices"
              message={error.message}
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
              errorMessage={`Couldn't load invoices${error?.message ? `: ${error.message}` : ""}`}
              onRetry={() => void refetch()}
              onRowClick={row => setViewingId(row.id)}
              emptyState={(
                <EmptyState
                  icon={FileText}
                  title="No invoices found"
                  description="Adjust your search or filters."
                  className="mx-auto"
                />
              )}
              pagination={{
                page, pageSize: PAGE_SIZE, total, onPageChange: list.setPage,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <InvoiceDetailsDialog
        id={viewingId}
        onClose={() => setViewingId(null)}
      />
    </div>
  );
}
