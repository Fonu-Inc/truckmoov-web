import type { QuotationPaymentStatusFilter, QuotationRow, QuotationStatus } from "@truckmoov/api/billing";
import { getBillingQuotationsQueryOptions } from "@truckmoov/api/billing";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
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
  formatIsoDate,
  ListErrorBanner,
  formatNgn,
  QUOTATION_STATUS_LABEL,
  QuotationStatusBadge,
} from "@/components/platform/billing/billingUi";
import { QuotationDetailsDialog } from "@/components/platform/billing/QuotationDetailsDialog";
import { useBillingList } from "@/components/platform/billing/useBillingList";

const PAGE_SIZE = 10;
const COLUMNS = 11;

type Filters = {
  status: "all" | QuotationStatus;
  paymentStatus: "all" | QuotationPaymentStatusFilter;
};

const EXPORT_COLUMNS = [
  { header: "Quotation", accessor: "number" as const },
  { header: "Customer", accessor: "customerName" as const },
  { header: "Customer Type", accessor: (row: QuotationRow) => customerTypeLabel(row.customerType) },
  { header: "Status", accessor: (row: QuotationRow) => QUOTATION_STATUS_LABEL[row.status] },
  { header: "Created", accessor: (row: QuotationRow) => formatIsoDate(row.createdAt) },
  { header: "Valid Until", accessor: (row: QuotationRow) => formatIsoDate(row.validUntil) },
  { header: "Total (NGN)", accessor: "totalNgn" as const },
  { header: "Paid (NGN)", accessor: "paidNgn" as const },
  { header: "Outstanding (NGN)", accessor: "outstandingNgn" as const },
  { header: "Payment", accessor: (row: QuotationRow) => (row.paymentComplete ? "Complete" : "Incomplete") },
];

export function QuotationsTab() {
  const list = useBillingList<Filters>({ status: "all", paymentStatus: "all" });
  const [viewingId, setViewingId] = useState<string | null>(null);
  const { filters, page } = list;

  const { data, isLoading, isError, error, refetch } = useQuery(
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
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
              onValueChange={v => list.setFilter("status", v as Filters["status"])}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(QUOTATION_STATUS_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.paymentStatus}
              onValueChange={v => list.setFilter("paymentStatus", v as Filters["paymentStatus"])}
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
            <ListErrorBanner title="Couldn't load quotations" message={error.message} onRetry={() => void refetch()} />
          )}

          <div className="overflow-x-auto rounded-2xl border">
            <Table className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Customer Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Payment</TableHead>
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
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">{customerTypeLabel(row.customerType)}</TableCell>
                    <TableCell><QuotationStatusBadge status={row.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatIsoDate(row.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatIsoDate(row.validUntil)}</TableCell>
                    <TableCell className="font-medium tabular-nums">{formatNgn(row.totalNgn)}</TableCell>
                    <TableCell className="tabular-nums">{formatNgn(row.paidNgn)}</TableCell>
                    <TableCell className="tabular-nums">{formatNgn(row.outstandingNgn)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-full border-transparent ${row.paymentComplete ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
                      >
                        {row.paymentComplete ? "Payment Completed" : "Payment Incomplete"}
                      </Badge>
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
                              <p className="text-sm font-medium">Couldn't load quotations</p>
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
                              title="No quotations found"
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
            <span>{`Showing ${rows.length} of ${total} quotations`}</span>
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

      <QuotationDetailsDialog id={viewingId} onClose={() => setViewingId(null)} />
    </div>
  );
}
