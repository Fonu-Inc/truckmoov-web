import type { PaymentMethod, PaymentRow, PaymentStatus } from "@truckmoov/api/billing";
import { useBillingPayments } from "@truckmoov/api/billing";
import { CreditCard, Eye, Search } from "lucide-react";
import { useState } from "react";
import { PaymentDetailsDialog } from "@/components/platform/billing/PaymentDetailsDialog";
import {
  formatIsoDateTime,
  formatNgn,
  ListErrorBanner,
  METHOD_LABEL,
  methodLabel,
  PAYMENT_STATUS_LABEL,
  PaymentStatusBadge,
} from "@/components/platform/billing/billingUi";
import { useBillingList } from "@/components/platform/billing/useBillingList";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TableSkeleton } from "@/components/ui/skeletons";

const PAGE_SIZE = 10;
const COLUMNS = 11;

type Filters = { status: "all" | PaymentStatus; method: "all" | PaymentMethod };

const EXPORT_COLUMNS = [
  { header: "Reference", accessor: "reference" as const },
  { header: "Customer", accessor: "customerName" as const },
  { header: "Product", accessor: "productName" as const },
  { header: "Devices", accessor: "deviceCount" as const },
  { header: "Amount (NGN)", accessor: "amountNgn" as const },
  { header: "Method", accessor: (p: PaymentRow) => methodLabel(p.method) },
  { header: "Status", accessor: (p: PaymentRow) => PAYMENT_STATUS_LABEL[p.status] },
  { header: "Paid at", accessor: (p: PaymentRow) => formatIsoDateTime(p.paidAt) },
  { header: "Quotation", accessor: (p: PaymentRow) => p.quotationNumber ?? "" },
  { header: "Invoice", accessor: (p: PaymentRow) => p.invoiceNumber ?? "" },
];

function PaymentRowView({ p, onView }: { p: PaymentRow; onView: () => void }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{p.reference}</TableCell>
      <TableCell>{p.customerName}</TableCell>
      <TableCell>{p.productName}</TableCell>
      <TableCell className="tabular-nums">{p.deviceCount}</TableCell>
      <TableCell className="font-medium">{formatNgn(p.amountNgn)}</TableCell>
      <TableCell>{methodLabel(p.method)}</TableCell>
      <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatIsoDateTime(p.paidAt)}</TableCell>
      <TableCell>{p.quotationNumber ?? "-"}</TableCell>
      <TableCell>{p.invoiceNumber ?? "-"}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={onView}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View Detail
        </Button>
      </TableCell>
    </TableRow>
  );
}

function EmptyOrError({
  isError,
  message,
  onRetry,
}: {
  isError: boolean;
  message?: string;
  onRetry: () => void;
}) {
  return (
    <TableRow>
      <TableCell colSpan={COLUMNS} className="py-12 text-center">
        {isError
          ? (
              <>
                <p className="text-sm font-medium">Couldn't load payments</p>
                <p className="text-xs text-muted-foreground">{message}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                  Try again
                </Button>
              </>
            )
          : (
              <>
                <p className="text-sm font-medium">No payments found</p>
                <p className="text-xs text-muted-foreground">Adjust your search or filters.</p>
              </>
            )}
      </TableCell>
    </TableRow>
  );
}

export function PaymentsTab() {
  const list = useBillingList<Filters>({ status: "all", method: "all" });
  const { filters, page, setPage } = list;
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useBillingPayments({
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
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
              onValueChange={v => list.setFilter("status", v as Filters["status"])}
            >
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(PAYMENT_STATUS_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.method}
              onValueChange={v => list.setFilter("method", v as Filters["method"])}
            >
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {Object.entries(METHOD_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isError && rows.length > 0 && (
            <ListErrorBanner title="Couldn't load payments" message={error?.message} onRetry={() => void refetch()} />
          )}

          <div className="overflow-x-auto rounded-2xl border">
            <Table className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead>Quotation</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableSkeleton rows={PAGE_SIZE} columns={COLUMNS} />}
                {rows.map(p => (
                  <PaymentRowView key={p.id} p={p} onView={() => setViewingId(p.id)} />
                ))}
                {rows.length === 0 && !isLoading && (
                  <EmptyOrError
                    isError={isError}
                    message={error?.message}
                    onRetry={() => void refetch()}
                  />
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{`Showing ${rows.length} of ${total} payments`}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span>{`Page ${page} of ${pages}`}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <PaymentDetailsDialog paymentId={viewingId} onClose={() => setViewingId(null)} />
    </>
  );
}
