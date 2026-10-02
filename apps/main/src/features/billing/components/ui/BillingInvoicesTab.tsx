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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { useDebouncedValue } from "@/features/data-bundle/utils/dataBundle";
import { invoiceDocument } from "../../utils/billingDocuments";
import {
  formatDate, formatLongDate, INVOICE_STATUS_LABEL, invoiceStatusKey, methodLabel, ngn, toneForStatus,
} from "../../utils/billingHelpers";
import {
  ChargeBreakdown, DialogSkeleton, EmptyRow, LabelValue, Pager, PlanSummary, SectionError, SkeletonRows, StatusPill,
} from "../../utils/billingShared";
import { useBillingDownload } from "../../utils/useBillingDownload";

const PAGE_SIZE = 20;
const COLS = 11;

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

function InvoiceRow({
  invoice, onView, onDownload, downloading,
}: {
  invoice: TenantInvoice; onView: () => void; onDownload: () => void; downloading: boolean;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium whitespace-nowrap">{invoice.number}</TableCell>
      <TableCell className="whitespace-nowrap">
        {invoice.planName ? (
          <StatusPill
            label={invoice.planName}
            tone="info"
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{invoice.deviceCount || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{invoice.billingPeriod}</TableCell>
      <TableCell className="whitespace-nowrap">{formatDate(invoice.issueDate)}</TableCell>
      <TableCell className="whitespace-nowrap">{formatDate(invoice.dueDate)}</TableCell>
      <TableCell className="text-right tabular-nums">{ngn(invoice.totalNgn)}</TableCell>
      <TableCell className="text-right tabular-nums">{ngn(invoice.amountPaidNgn)}</TableCell>
      <TableCell className="text-right tabular-nums">{ngn(invoice.outstandingNgn)}</TableCell>
      <TableCell><InvoiceStatus invoice={invoice} /></TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={onView}
        >
          <Eye className="h-4 w-4 mr-1" />
          {" "}
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={downloading}
          onClick={onDownload}
          aria-label="Download document"
        >
          <Download className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
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
        {invoices.isError && (
          <SectionError
            message="Could not load your invoices."
            onRetry={() => invoices.refetch()}
          />
        )}
        {!invoices.isError && (
          <div className="rounded-2xl border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>M2M plan</TableHead>
                  <TableHead className="text-right">Devices</TableHead>
                  <TableHead>Billing period</TableHead>
                  <TableHead>Invoice date</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.isLoading && <SkeletonRows cols={COLS} />}
                {list?.items.map(i => (
                  <InvoiceRow
                    key={i.id}
                    invoice={i}
                    onView={() => setSelectedId(i.id)}
                    onDownload={() => download(i.id)}
                    downloading={busyId === i.id}
                  />
                ))}
                {list && list.items.length === 0 && (
                  <EmptyRow
                    cols={COLS}
                    text="No invoices match your filters."
                  />
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {list && (
          <Pager
            page={page}
            pageSize={PAGE_SIZE}
            total={list.total}
            onPage={setPage}
          />
        )}
      </CardContent>

      <InvoiceDialog
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onDownload={download}
      />
    </Card>
  );
}
