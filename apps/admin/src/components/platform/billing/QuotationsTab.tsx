import type { ColumnDef } from "@tanstack/react-table";
import type {
  QuotationPaymentStatusFilter, QuotationRow, QuotationStatus,
} from "@truckmoov/api/billing";
import { useQuery } from "@tanstack/react-query";
import { getBillingQuotationsQueryOptions } from "@truckmoov/api/billing";
import {
  Eye, FileText, Search,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  customerTypeLabel,
  formatIsoDate,
  formatNgn,
  ListErrorBanner,
  QUOTATION_STATUS_LABEL,
  QuotationStatusBadge,
} from "@/components/platform/billing/billingUi";
import { QuotationDetailsDialog } from "@/components/platform/billing/QuotationDetailsDialog";
import { useBillingList } from "@/components/platform/billing/useBillingList";
import { Badge } from "@/components/shadcn/badge";
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
  status: "all" | QuotationStatus;
  paymentStatus: "all" | QuotationPaymentStatusFilter;
};

const EXPORT_COLUMNS = [
  {
    header: "Quotation", accessor: "number" as const,
  },
  {
    header: "Customer", accessor: "customerName" as const,
  },
  {
    header: "Customer Type", accessor: (row: QuotationRow) => customerTypeLabel(row.customerType),
  },
  {
    header: "Status", accessor: (row: QuotationRow) => QUOTATION_STATUS_LABEL[row.status],
  },
  {
    header: "Created", accessor: (row: QuotationRow) => formatIsoDate(row.createdAt),
  },
  {
    header: "Valid Until", accessor: (row: QuotationRow) => formatIsoDate(row.validUntil),
  },
  {
    header: "Total (NGN)", accessor: "totalNgn" as const,
  },
  {
    header: "Paid (NGN)", accessor: "paidNgn" as const,
  },
  {
    header: "Outstanding (NGN)", accessor: "outstandingNgn" as const,
  },
  {
    header: "Payment", accessor: (row: QuotationRow) => (row.paymentComplete ? "Complete" : "Incomplete"),
  },
];

// Server-paged list: sorting one page would mislead, so it's off.
function quotationColumns(onView: (id: string) => void): ColumnDef<QuotationRow>[] {
  return [
    {
      accessorKey: "number", header: "Quotation Number", enableSorting: false, meta: { className: "font-medium" },
    },
    {
      accessorKey: "customerName", header: "Customer", enableSorting: false,
    },
    {
      id: "customerType",
      header: "Customer Type",
      enableSorting: false,
      meta: { className: "text-muted-foreground" },
      cell: ({ row }) => customerTypeLabel(row.original.customerType),
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <QuotationStatusBadge status={row.original.status} />,
    },
    {
      id: "created",
      header: "Created",
      enableSorting: false,
      meta: { className: "text-muted-foreground" },
      cell: ({ row }) => formatIsoDate(row.original.createdAt),
    },
    {
      id: "validUntil",
      header: "Valid Until",
      enableSorting: false,
      meta: { className: "text-muted-foreground" },
      cell: ({ row }) => formatIsoDate(row.original.validUntil),
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
      cell: ({ row }) => formatNgn(row.original.paidNgn),
    },
    {
      id: "outstanding",
      header: "Outstanding",
      enableSorting: false,
      meta: { className: "tabular-nums" },
      cell: ({ row }) => formatNgn(row.original.outstandingNgn),
    },
    {
      id: "payment",
      header: "Payment",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`rounded-full border-transparent ${row.original.paymentComplete ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
        >
          {row.original.paymentComplete ? "Payment Completed" : "Payment Incomplete"}
        </Badge>
      ),
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

export function QuotationsTab() {
  const list = useBillingList<Filters>({
    status: "all", paymentStatus: "all",
  });
  const [
    viewingId,
    setViewingId,
  ] = useState<string | null>(null);
  const {
    filters, page,
  } = list;
  const columns = useMemo(
    () => quotationColumns(setViewingId),
    [],
  );

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery(
    getBillingQuotationsQueryOptions({
      params: {
        q: list.debouncedSearch || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        paymentStatus: filters.paymentStatus === "all" ? undefined : filters.paymentStatus,
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
              Quotation History
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Quotations the system generated for each customer, and whether payment has been
              completed.
            </p>
          </div>
          <ExportButton
            rows={rows}
            filename="quotations"
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
                placeholder="Search by quotation number or customer..."
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
                {Object.entries(QUOTATION_STATUS_LABEL).map(([
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
              value={filters.paymentStatus}
              onValueChange={v => list.setFilter(
                "paymentStatus",
                v as Filters["paymentStatus"],
              )}
            >
              <SelectTrigger className="w-[210px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payment statuses</SelectItem>
                <SelectItem value="complete">Payment Completed</SelectItem>
                <SelectItem value="incomplete">Payment Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isError && rows.length > 0 && (
            <ListErrorBanner
              title="Couldn't load quotations"
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
              errorMessage={`Couldn't load quotations${error?.message ? `: ${error.message}` : ""}`}
              onRetry={() => void refetch()}
              onRowClick={row => setViewingId(row.id)}
              emptyState={(
                <EmptyState
                  icon={FileText}
                  title="No quotations found"
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

      <QuotationDetailsDialog
        id={viewingId}
        onClose={() => setViewingId(null)}
      />
    </div>
  );
}
