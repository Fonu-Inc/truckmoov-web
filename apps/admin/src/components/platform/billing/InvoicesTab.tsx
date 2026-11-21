import type {
  InvoiceRow, InvoiceStatus,
} from "@truckmoov/api/billing";
import { useQuery } from "@tanstack/react-query";
import { getBillingInvoicesQueryOptions } from "@truckmoov/api/billing";
import {
  Eye, FileText, MailCheck, Search,
} from "lucide-react";
import { useState } from "react";
import {
  BillingCard,
  BillingCardBody,
  BillingCardHeader,
  BillingPager,
  FILTER_TRIGGER,
  formatDateOnly,
  formatIsoDateTime,
  formatNgn,
  INVOICE_STATUS_LABEL,
  InvoiceStatusBadge,
  ListErrorBanner,
  NO_ENDPOINT,
  NONE,
  TableStateRows,
} from "@/components/platform/billing/billingUi";
import { InvoiceDetailsDialog } from "@/components/platform/billing/InvoiceDetailsDialog";
import { useBillingList } from "@/components/platform/billing/useBillingList";
import { Button } from "@/components/shadcn/button";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";

const PAGE_SIZE = 10;

type Filters = { status: "all" | InvoiceStatus };

const PENDING_EMAIL = "Sends automatically on payment";

function deliveryText(row: InvoiceRow) {
  return row.emailedAt ? `Emailed ${formatIsoDateTime(row.emailedAt)}` : PENDING_EMAIL;
}

// Product and Devices Requested aren't on the invoice list endpoint yet.
const EXPORT_COLUMNS = [
  {
    header: "Invoice Number", accessor: "number" as const,
  },
  {
    header: "Customer", accessor: "customerName" as const,
  },
  {
    header: "Product", accessor: () => NO_ENDPOINT,
  },
  {
    header: "Linked Quotation", accessor: (row: InvoiceRow) => row.quotationNumber ?? NONE,
  },
  {
    header: "Issue Date", accessor: (row: InvoiceRow) => formatDateOnly(row.issueDate),
  },
  {
    header: "Due Date", accessor: (row: InvoiceRow) => formatDateOnly(row.dueDate),
  },
  {
    header: "Devices Requested", accessor: () => NO_ENDPOINT,
  },
  {
    header: "Total (NGN)", accessor: "totalNgn" as const,
  },
  {
    header: "Outstanding (NGN)", accessor: "outstandingNgn" as const,
  },
  {
    header: "Status", accessor: (row: InvoiceRow) => INVOICE_STATUS_LABEL[row.status],
  },
  {
    header: "Delivery", accessor: deliveryText,
  },
];

export function InvoicesTab() {
  const list = useBillingList<Filters>({ status: "all" });
  const [
    viewingId,
    setViewingId,
  ] = useState<string | null>(null);
  const {
    filters, page,
  } = list;

  const {
    data, isLoading, isError, error, refetch,
  } = useQuery(
    getBillingInvoicesQueryOptions({
      params: {
        q: list.debouncedSearch || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        page,
        limit: PAGE_SIZE,
      },
    }),
  );

  const rows = data?.data.items ?? [];
  const total = data?.data.total ?? 0;

  return (
    <div className="space-y-4">
      <BillingCard>
        <BillingCardHeader
          icon={FileText}
          title="Invoices"
          subtitle="Account charges, billing records, and payment information."
          description="Invoices are generated and emailed to the customer automatically once their payment completes. This register is for reference only."
          action={(
            <ExportButton
              rows={rows}
              filename="invoices"
              columns={EXPORT_COLUMNS}
            />
          )}
        />
        <BillingCardBody>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={list.search}
                onChange={e => list.setSearch(e.target.value)}
                placeholder="Search by invoice, customer or quotation..."
                className="rounded-xl pl-9"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={v => list.setFilter(
                "status",
                v as Filters["status"],
              )}
            >
              <SelectTrigger className={`${FILTER_TRIGGER} w-[190px]`}>
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
          </div>

          {isError && rows.length > 0 && (
            <ListErrorBanner
              title="Couldn't load invoices"
              message={error.message}
              onRetry={() => void refetch()}
            />
          )}

          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Linked Quotation</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Devices Requested</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableStateRows
                  colSpan={12}
                  isLoading={isLoading}
                  isError={isError}
                  isEmpty={rows.length === 0}
                  errorTitle="Couldn't load invoices"
                  errorMessage={error?.message}
                  onRetry={() => void refetch()}
                  emptyTitle="No invoices found"
                />
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.number}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{NO_ENDPOINT}</TableCell>
                    <TableCell>{row.quotationNumber ?? NONE}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateOnly(row.issueDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateOnly(row.dueDate)}</TableCell>
                    <TableCell className="font-medium">{NO_ENDPOINT}</TableCell>
                    <TableCell className="font-medium">{formatNgn(row.totalNgn)}</TableCell>
                    <TableCell>{formatNgn(row.outstandingNgn)}</TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.emailedAt
                        ? (
                            <span className="inline-flex items-center gap-1.5">
                              <MailCheck className="h-3.5 w-3.5 text-success" />
                              {deliveryText(row)}
                            </span>
                          )
                        : PENDING_EMAIL}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingId(row.id)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View Detail
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <BillingPager
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={list.setPage}
          />
        </BillingCardBody>
      </BillingCard>

      <InvoiceDetailsDialog
        id={viewingId}
        onClose={() => setViewingId(null)}
      />
    </div>
  );
}
