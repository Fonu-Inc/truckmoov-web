import type {
  QuotationPaymentStatusFilter, QuotationRow,
} from "@truckmoov/api/billing";
import { useQuery } from "@tanstack/react-query";
import { getBillingQuotationsQueryOptions } from "@truckmoov/api/billing";
import {
  Download, Eye, FileText, Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  BillingCard,
  BillingCardBody,
  BillingCardHeader,
  BillingPager,
  FILTER_TRIGGER,
  formatIsoDate,
  formatNgn,
  ListErrorBanner,
  NO_ENDPOINT,
  PaymentCompleteBadge,
  TableStateRows,
} from "@/components/platform/billing/billingUi";
import { QuotationDetailsDialog } from "@/components/platform/billing/QuotationDetailsDialog";
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
import { exportToCSV } from "@/lib/exportTable";

const PAGE_SIZE = 10;

type Filters = { paymentStatus: "all" | QuotationPaymentStatusFilter };

// Product and Devices Requested aren't on the quotation list endpoint yet.
const EXPORT_COLUMNS = [
  {
    header: "Quotation Number", accessor: "number" as const,
  },
  {
    header: "Customer / Organization", accessor: "customerName" as const,
  },
  {
    header: "Product", accessor: () => NO_ENDPOINT,
  },
  {
    header: "Date", accessor: (row: QuotationRow) => formatIsoDate(row.createdAt),
  },
  {
    header: "Devices Requested", accessor: () => NO_ENDPOINT,
  },
  {
    header: "Total Amount (NGN)", accessor: "totalNgn" as const,
  },
  {
    header: "Amount Paid (NGN)", accessor: "paidNgn" as const,
  },
  {
    header: "Payment Status", accessor: (row: QuotationRow) => (row.paymentComplete ? "Payment Completed" : "Payment Incomplete"),
  },
];

function exportQuotation(row: QuotationRow) {
  try {
    exportToCSV(
      [row],
      EXPORT_COLUMNS,
      `quotation-${row.number}`,
    );
    toast.success(`Exported ${row.number}`);
  }
  catch {
    toast.error("Export failed");
  }
}

export function QuotationsTab() {
  const list = useBillingList<Filters>({ paymentStatus: "all" });
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
    getBillingQuotationsQueryOptions({
      params: {
        q: list.debouncedSearch || undefined,
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
      <BillingCard>
        <BillingCardHeader
          icon={FileText}
          title="Quotation History"
          subtitle="Account charges, billing records, and payment information."
          description="Quotations the system generated for each customer, and whether payment has been completed."
          action={(
            <ExportButton
              rows={rows}
              filename="quotations"
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
                placeholder="Search by quotation number or customer..."
                className="rounded-xl pl-9"
              />
            </div>
            <Select
              value={filters.paymentStatus}
              onValueChange={v => list.setFilter(
                "paymentStatus",
                v as Filters["paymentStatus"],
              )}
            >
              <SelectTrigger className={`${FILTER_TRIGGER} w-[210px]`}>
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

          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation Number</TableHead>
                  <TableHead>Customer / Organization</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Devices Requested</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableStateRows
                  colSpan={9}
                  isLoading={isLoading}
                  isError={isError}
                  isEmpty={rows.length === 0}
                  errorTitle="Couldn't load quotations"
                  errorMessage={error?.message}
                  onRetry={() => void refetch()}
                  emptyTitle="No quotations found"
                />
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.number}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{NO_ENDPOINT}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatIsoDate(row.createdAt)}</TableCell>
                    <TableCell className="font-medium">{NO_ENDPOINT}</TableCell>
                    <TableCell className="font-medium">{formatNgn(row.totalNgn)}</TableCell>
                    <TableCell>{formatNgn(row.paidNgn)}</TableCell>
                    <TableCell>
                      <PaymentCompleteBadge complete={row.paymentComplete} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingId(row.id)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportQuotation(row)}
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Export
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

      <QuotationDetailsDialog
        id={viewingId}
        onClose={() => setViewingId(null)}
      />
    </div>
  );
}
