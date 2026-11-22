import type {
  TenantInvoice, TenantInvoiceFilter,
} from "@truckmoov/api/billing";
import {
  getTenantInvoiceQueryOptions, useTenantInvoice, useTenantInvoices,
} from "@truckmoov/api/billing";
import { queryClient } from "@truckmoov/api/lib/query-client";
import {
  Download, Search,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
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
import { FleetTablePager } from "@/features/fleet/components/ui/FleetTablePager";
import { invoiceDocument } from "../../utils/billingDocuments";
import {
  formatDate, formatLongDate, INVOICE_STATUS_LABEL, invoiceStatusKey, methodLabel, ngn, toneForStatus,
} from "../../utils/billingHelpers";
import {
  BILLING_CARD, BILLING_CARD_SUBTITLE, BILLING_CARD_TITLE, BILLING_PAGE_SIZE, ChargeBreakdown, DialogSkeleton, LabelValue, PlanSummary, RowActions, SectionError, StatusPill, TableStateRows,
} from "../../utils/billingShared";
import { useBillingDownload } from "../../utils/useBillingDownload";
import { PayInvoiceButton } from "./PayInvoiceButton";

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
            <div className="flex justify-end gap-2">
              {invoice.payable && (
                <PayInvoiceButton
                  invoice={invoice}
                  label="Pay invoice"
                  size="default"
                  className="rounded-xl"
                />
              )}
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

const COLUMNS = 11;

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
      status: status as TenantInvoiceFilter, q: q || undefined, page, pageSize: BILLING_PAGE_SIZE,
    },
  });
  const {
    download, busyId,
  } = useBillingDownload(
    id => queryClient.fetchQuery(getTenantInvoiceQueryOptions(id)).then(r => r.data),
    invoiceDocument,
  );
  const list = invoices.data?.data;
  const rows = list?.items ?? [];

  return (
    <div className={BILLING_CARD}>
      <div className="flex flex-col p-6 pb-4 space-y-4">
        <div>
          <h3 className={BILLING_CARD_TITLE}>Invoice History</h3>
          <p className="text-sm text-muted-foreground mt-1.5">{BILLING_CARD_SUBTITLE}</p>
          <p className="text-sm text-muted-foreground mt-1">Invoices are issued automatically by the platform for each billing period and approved request.</p>
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
            <SelectTrigger className="h-10 px-3.5 w-full sm:w-52 rounded-xl">
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
      </div>
      <div className="p-6 pt-0">
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
              <TableStateRows
                colSpan={COLUMNS}
                isLoading={invoices.isLoading}
                isError={invoices.isError}
                errorMessage="Could not load your invoices."
                onRetry={() => invoices.refetch()}
                isEmpty={rows.length === 0}
                emptyMessage="No invoices match your filters."
              />
              {!invoices.isLoading && !invoices.isError && rows.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium whitespace-nowrap">{inv.number}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {inv.planName
                      ? (
                          <StatusPill
                            label={inv.planName}
                            tone="info"
                          />
                        )
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{inv.deviceCount || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.billingPeriod}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(inv.issueDate)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(inv.dueDate)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ngn(inv.totalNgn)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ngn(inv.amountPaidNgn)}</TableCell>
                  <TableCell className="text-right tabular-nums">{ngn(inv.outstandingNgn)}</TableCell>
                  <TableCell>
                    <InvoiceStatus invoice={inv} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {inv.payable && (
                      <PayInvoiceButton
                        invoice={inv}
                        className="mr-1"
                      />
                    )}
                    <RowActions
                      onView={() => setSelectedId(inv.id)}
                      onDownload={() => download(inv.id)}
                      downloadDisabled={busyId === inv.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {list && (
          <FleetTablePager
            page={page}
            pageSize={BILLING_PAGE_SIZE}
            total={list.total}
            onPageChange={setPage}
          />
        )}
      </div>

      <InvoiceDialog
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onDownload={download}
      />
    </div>
  );
}
