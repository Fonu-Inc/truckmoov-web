import type {
  PaymentMethod, PaymentRow, PaymentStatus,
} from "@truckmoov/api/billing";
import { useBillingPayments } from "@truckmoov/api/billing";
import {
  CreditCard, Eye, Search,
} from "lucide-react";
import { useState } from "react";
import {
  BillingCard,
  BillingCardBody,
  BillingCardHeader,
  BillingPager,
  FILTER_TRIGGER,
  formatIsoDateTime,
  formatNgn,
  ListErrorBanner,
  METHOD_LABEL,
  methodLabel,
  NONE,
  PAYMENT_STATUS_LABEL,
  PaymentStatusBadge,
  ProductChip,
  TableStateRows,
} from "@/components/platform/billing/billingUi";
import { PaymentDetailsDialog } from "@/components/platform/billing/PaymentDetailsDialog";
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

type Filters = {
  status: "all" | PaymentStatus; method: "all" | PaymentMethod;
};

// The design app's method filter, in its order ("Other" still shows in rows).
const METHOD_FILTERS: PaymentMethod[] = [
  "mtn_momo",
  "bank_transfer",
  "card",
];

const EXPORT_COLUMNS = [
  {
    header: "Payment Reference", accessor: "reference" as const,
  },
  {
    header: "Customer", accessor: "customerName" as const,
  },
  {
    header: "Product", accessor: (p: PaymentRow) => p.productName || NONE,
  },
  {
    header: "Linked Quotation", accessor: (p: PaymentRow) => p.quotationNumber ?? NONE,
  },
  {
    header: "Devices Requested", accessor: (p: PaymentRow) => (p.deviceCount > 0 ? p.deviceCount : NONE),
  },
  {
    header: "Amount Paid (NGN)", accessor: "amountNgn" as const,
  },
  {
    header: "Payment Date", accessor: (p: PaymentRow) => formatIsoDateTime(p.paidAt ?? p.createdAt),
  },
  {
    header: "Method", accessor: (p: PaymentRow) => methodLabel(p.method),
  },
  {
    header: "Status", accessor: (p: PaymentRow) => PAYMENT_STATUS_LABEL[p.status],
  },
];

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
    <div className="space-y-4">
      <BillingCard>
        <BillingCardHeader
          icon={CreditCard}
          title="Payments History"
          subtitle="Account charges, billing records, and payment information."
          description="Every payment the system recorded, and the quotation it settled."
          action={(
            <ExportButton
              rows={rows}
              filename="payments-history"
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
                placeholder="Search by reference, customer or quotation..."
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
              <SelectTrigger className={`${FILTER_TRIGGER} w-[180px]`}><SelectValue /></SelectTrigger>
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
              <SelectTrigger className={`${FILTER_TRIGGER} w-[180px]`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {METHOD_FILTERS.map(v => (
                  <SelectItem
                    key={v}
                    value={v}
                  >
                    {METHOD_LABEL[v]}
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

          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Linked Quotation</TableHead>
                  <TableHead>Devices Requested</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableStateRows
                  colSpan={10}
                  isLoading={isLoading}
                  isError={isError}
                  isEmpty={rows.length === 0}
                  errorTitle="Couldn't load payments"
                  errorMessage={error?.message}
                  onRetry={() => void refetch()}
                  emptyTitle="No payments found"
                />
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.reference}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>
                      {row.productName
                        ? <ProductChip>{row.productName}</ProductChip>
                        : <span className="text-muted-foreground">{NONE}</span>}
                    </TableCell>
                    <TableCell>{row.quotationNumber ?? NONE}</TableCell>
                    <TableCell className="font-medium">{row.deviceCount > 0 ? row.deviceCount : NONE}</TableCell>
                    <TableCell className="font-medium">{formatNgn(row.amountNgn)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatIsoDateTime(row.paidAt ?? row.createdAt)}</TableCell>
                    <TableCell>{methodLabel(row.method)}</TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={row.status} />
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
            onPageChange={setPage}
          />
        </BillingCardBody>
      </BillingCard>
      <PaymentDetailsDialog
        paymentId={viewingId}
        onClose={() => setViewingId(null)}
      />
    </div>
  );
}
