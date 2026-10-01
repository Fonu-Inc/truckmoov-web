import type { InvoiceRow, InvoiceStatus } from "@truckmoov/api/billing";
import { getBillingInvoicesQueryOptions } from "@truckmoov/api/billing";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, MailCheck, Search } from "lucide-react";
import { useState } from "react";
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
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableSkeleton } from "@/components/ui/skeletons";
import {
  customerTypeLabel,
  formatDateOnly,
  ListErrorBanner,
  formatIsoDateTime,
  formatNgn,
  INVOICE_STATUS_LABEL,
  InvoiceStatusBadge,
} from "@/components/platform/billing/billingUi";
import { InvoiceDetailsDialog } from "@/components/platform/billing/InvoiceDetailsDialog";
import { useBillingList } from "@/components/platform/billing/useBillingList";

const PAGE_SIZE = 10;
const COLUMNS = 11;

type Filters = { status: "all" | InvoiceStatus };

const EXPORT_COLUMNS = [
  { header: "Invoice", accessor: "number" as const },
  { header: "Quotation", accessor: (row: InvoiceRow) => row.quotationNumber ?? "-" },
  { header: "Customer", accessor: "customerName" as const },
  { header: "Customer Type", accessor: (row: InvoiceRow) => customerTypeLabel(row.customerType) },
  { header: "Status", accessor: (row: InvoiceRow) => INVOICE_STATUS_LABEL[row.status] },
  { header: "Issue Date", accessor: (row: InvoiceRow) => formatDateOnly(row.issueDate) },
  { header: "Due Date", accessor: (row: InvoiceRow) => formatDateOnly(row.dueDate) },
  { header: "Total (NGN)", accessor: "totalNgn" as const },
  { header: "Paid (NGN)", accessor: "amountPaidNgn" as const },
  { header: "Outstanding (NGN)", accessor: "outstandingNgn" as const },
  { header: "Emailed", accessor: (row: InvoiceRow) => (row.emailedAt ? formatIsoDateTime(row.emailedAt) : "Not sent") },
];

export function InvoicesTab() {
  const list = useBillingList<Filters>({ status: "all" });
  const [viewingId, setViewingId] = useState<string | null>(null);
  const { filters, page } = list;

  const { data, isLoading, isError, error, refetch } = useQuery(
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
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
              Invoices are generated and emailed to the customer automatically once their payment
              completes. This register is for reference only.
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
              onValueChange={v => list.setFilter("status", v as Filters["status"])}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(INVOICE_STATUS_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isError && rows.length > 0 && (
            <ListErrorBanner title="Couldn't load invoices" message={error.message} onRetry={() => void refetch()} />
          )}

          <div className="overflow-x-auto rounded-2xl border">
            <Table className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Quotation</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Emailed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableSkeleton rows={PAGE_SIZE} columns={COLUMNS} />}
                {rows.map(row => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => setViewingId(row.id)}
                  >
                    <TableCell className="font-medium">{row.number}</TableCell>
                    <TableCell className="text-muted-foreground">{row.quotationNumber ?? "-"}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell><InvoiceStatusBadge status={row.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatDateOnly(row.issueDate)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateOnly(row.dueDate)}</TableCell>
                    <TableCell className="font-medium tabular-nums">{formatNgn(row.totalNgn)}</TableCell>
                    <TableCell className="tabular-nums">{formatNgn(row.amountPaidNgn)}</TableCell>
                    <TableCell className="tabular-nums">{formatNgn(row.outstandingNgn)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.emailedAt
                        ? (
                            <span className="inline-flex items-center gap-1.5">
                              <MailCheck className="h-3.5 w-3.5 text-success" />
                              {formatIsoDateTime(row.emailedAt)}
                            </span>
                          )
                        : "Not sent"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`View ${row.number}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingId(row.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={COLUMNS}>
                      {isError
                        ? (
                            <div className="py-10 text-center">
                              <p className="text-sm font-medium">Couldn't load invoices</p>
                              <p className="text-xs text-muted-foreground">{error.message}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => void refetch()}
                              >
                                Try again
                              </Button>
                            </div>
                          )
                        : (
                            <EmptyState
                              icon={FileText}
                              title="No invoices found"
                              description="Adjust your search or filters."
                              className="mx-auto"
                            />
                          )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{`Showing ${rows.length} of ${total} invoices`}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => list.setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span>{`Page ${page} of ${pages}`}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => list.setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <InvoiceDetailsDialog id={viewingId} onClose={() => setViewingId(null)} />
    </div>
  );
}
