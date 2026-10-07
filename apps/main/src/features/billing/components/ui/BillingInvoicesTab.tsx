import type { ColumnDef } from "@tanstack/react-table";
import type {
  TenantInvoice, TenantInvoiceFilter,
} from "@truckmoov/api/billing";
import {
  getTenantInvoiceQueryOptions, useTenantInvoice, useTenantInvoices,
} from "@truckmoov/api/billing";
import { queryClient } from "@truckmoov/api/lib/query-client";
import {
  Download, Eye, Search,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { useDebouncedValue } from "@/features/data-bundle/utils/dataBundle";
import { invoiceDocument } from "../../utils/billingDocuments";
import {
  formatDate, formatLongDate, INVOICE_STATUS_LABEL, invoiceStatusKey, methodLabel, ngn, toneForStatus,
} from "../../utils/billingHelpers";
import {
  ChargeBreakdown, DialogSkeleton, LabelValue, PlanSummary, SectionError, StatusPill,
} from "../../utils/billingShared";
import { useBillingDownload } from "../../utils/useBillingDownload";

const PAGE_SIZE = 20;

function InvoiceStatus({ invoice }: { invoice: TenantInvoice }) {
  const key = invoiceStatusKey(invoice.status);
  return (
    <StatusPill
      label={INVOICE_STATUS_LABEL[key]}
      tone={toneForStatus(key)}
    />
  );
}

function InvoiceDialog({
  id, onClose, onDownload,
}: {
  id: string | null; onClose: () => void; onDownload: (id: string) => void;
}) {
  const query = useTenantInvoice(id ?? "");
  const invoice = query.data?.data;

  return (
    <Dialog
      open={!!id}
      onOpenChange={o => !o && onClose()}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-w-3xl max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{invoice ? `Invoice ${invoice.number}` : "Invoice"}</DialogTitle>
        </DialogHeader>
        {query.isLoading && <DialogSkeleton />}
        {query.isError && (
          <SectionError
            message="Could not load this invoice."
            onRetry={() => query.refetch()}
          />
        )}
        {invoice && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <LabelValue
                label="Billing period"
                value={invoice.billingPeriod}
              />
              <LabelValue
                label="Invoice date"
                value={formatLongDate(invoice.issueDate)}
              />
              <LabelValue
                label="Due date"
                value={formatLongDate(invoice.dueDate)}
              />
              <LabelValue
                label="Payment status"
                value={<InvoiceStatus invoice={invoice} />}
              />
              <LabelValue
                label="From quotation"
                value={invoice.quotationNumber ?? "Recurring service charges"}
              />
              <LabelValue
                label="Outstanding"
                value={ngn(invoice.outstandingNgn)}
              />
            </div>
            <PlanSummary lines={invoice.lines} />
            <div>
              <p className="text-sm font-medium mb-2">Charge breakdown</p>
              <ChargeBreakdown
                lines={invoice.lines}
                totals={invoice}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Payment Method</p>
              <div className="rounded-2xl border border-border divide-y divide-border">
                {invoice.payments.map(p => (
                  <div
                    key={p.reference}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{methodLabel(p.method)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.paidAt ? formatDate(p.paidAt) : "—"}
                      </p>
                    </div>
                    <p className="tabular-nums font-medium">{ngn(p.amountNgn)}</p>
                  </div>
                ))}
                {invoice.payments.length === 0 && (
                  <p className="px-4 py-4 text-sm text-muted-foreground">No payments recorded yet.</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => onDownload(invoice.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download invoice
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function invoiceColumns({
  onView, onDownload, busyId,
}: {
  onView: (id: string) => void; onDownload: (id: string) => void; busyId: string | null;
}): ColumnDef<TenantInvoice>[] {
  return [
    {
      accessorKey: "number",
      header: "Invoice",
      enableSorting: false,
      meta: { className: "font-medium whitespace-nowrap" },
    },
    {
      id: "plan",
      header: "M2M plan",
      enableSorting: false,
      meta: { className: "whitespace-nowrap" },
      cell: ({ row }) => (row.original.planName
        ? (
            <StatusPill
              label={row.original.planName}
              tone="info"
            />
          )
        : <span className="text-muted-foreground">—</span>),
    },
    {
      id: "devices",
      header: "Devices",
      enableSorting: false,
      meta: { className: "text-right tabular-nums" },
      cell: ({ row }) => row.original.deviceCount || "—",
    },
    {
      accessorKey: "billingPeriod",
      header: "Billing period",
      enableSorting: false,
      meta: { className: "text-muted-foreground" },
    },
    {
      id: "issueDate",
      header: "Invoice date",
      enableSorting: false,
      meta: { className: "whitespace-nowrap" },
      cell: ({ row }) => formatDate(row.original.issueDate),
    },
    {
      id: "dueDate",
      header: "Due date",
      enableSorting: false,
      meta: { className: "whitespace-nowrap" },
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    {
      id: "total",
      header: "Total",
      enableSorting: false,
      meta: { className: "text-right tabular-nums" },
      cell: ({ row }) => ngn(row.original.totalNgn),
    },
    {
      id: "paid",
      header: "Paid",
      enableSorting: false,
      meta: { className: "text-right tabular-nums" },
      cell: ({ row }) => ngn(row.original.amountPaidNgn),
    },
    {
      id: "outstanding",
      header: "Outstanding",
      enableSorting: false,
      meta: { className: "text-right tabular-nums" },
      cell: ({ row }) => ngn(row.original.outstandingNgn),
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <InvoiceStatus invoice={row.original} />,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      meta: { className: "text-right whitespace-nowrap" },
      cell: ({ row }) => (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(row.original.id)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {" "}
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busyId === row.original.id}
            onClick={() => onDownload(row.original.id)}
            aria-label="Download document"
          >
            <Download className="h-4 w-4" />
          </Button>
        </>
      ),
    },
  ];
}

export function BillingInvoicesTab() {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(null);
  const q = useDebouncedValue(search.trim());

  const invoices = useTenantInvoices({
    params: {
      status: status as TenantInvoiceFilter, q: q || undefined, page, pageSize: PAGE_SIZE,
    },
  });
  const {
    download, busyId,
  } = useBillingDownload(
    id => queryClient.fetchQuery(getTenantInvoiceQueryOptions(id)).then(r => r.data),
    invoiceDocument,
  );
  const list = invoices.data?.data;

  return (
    <Card className="surface-sleek rounded-2xl">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Invoice History</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Invoices are issued automatically by the platform for each billing period and approved request.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoice number, billing period or quotation"
              className="pl-9 rounded-xl"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-52 rounded-xl">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(INVOICE_STATUS_LABEL).map(([
                k,
                v,
              ]) => (
                <SelectItem
                  key={k}
                  value={k}
                >
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-border overflow-x-auto">
          <DataTable
            columns={invoiceColumns({
              onView: setSelectedId,
              onDownload: download,
              busyId,
            })}
            data={list?.items ?? []}
            isLoading={invoices.isLoading}
            isError={invoices.isError}
            errorMessage="Could not load your invoices."
            onRetry={() => invoices.refetch()}
            emptyState="No invoices match your filters."
            pagination={list && {
              page,
              pageSize: PAGE_SIZE,
              total: list.total,
              onPageChange: setPage,
            }}
          />
        </div>
      </CardContent>

      <InvoiceDialog
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onDownload={download}
      />
    </Card>
  );
}
