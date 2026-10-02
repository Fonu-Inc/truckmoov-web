import type {
  TenantPayment, TenantPaymentStatus,
} from "@truckmoov/api/billing";
import {
  useTenantPayment, useTenantPayments,
} from "@truckmoov/api/billing";
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
import { receiptDocument } from "../../utils/billingDocuments";
import {
  downloadDocument, formatDate, formatLongDate, methodLabel, ngn, PAYMENT_STATUS_LABEL, toneForStatus,
} from "../../utils/billingHelpers";
import {
  DialogSkeleton, EmptyRow, LabelValue, Pager, PlanSummary, SectionError, SkeletonRows, StatusPill,
} from "../../utils/billingShared";

const PAGE_SIZE = 20;
const COLS = 9;

function PaymentStatus({ status }: { status: TenantPaymentStatus }) {
  return (
    <StatusPill
      label={PAYMENT_STATUS_LABEL[status]}
      tone={toneForStatus(status)}
    />
  );
}

function receipt(p: TenantPayment) {
  const doc = receiptDocument(p);
  downloadDocument(
    doc.filename,
    doc.lines,
  );
}

function PaymentDialog({
  payment, onClose,
}: {
  payment: TenantPayment | null; onClose: () => void;
}) {
  const query = useTenantPayment(payment?.id ?? "");
  const detail = query.data?.data;
  const invoice = detail?.relatedInvoice;
  const quotation = detail?.relatedQuotation;

  return (
    <Dialog
      open={!!payment}
      onOpenChange={o => !o && onClose()}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        {payment && (
          <>
            <DialogHeader>
              <DialogTitle>{`Payment ${payment.reference}`}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <LabelValue
                  label="Amount paid"
                  value={ngn(payment.amountNgn)}
                />
                <LabelValue
                  label="Payment date"
                  value={formatLongDate(payment.date)}
                />
                <LabelValue
                  label="Method"
                  value={methodLabel(payment.method)}
                />
                <LabelValue
                  label="Status"
                  value={<PaymentStatus status={payment.status} />}
                />
                <LabelValue
                  label="What this payment was for"
                  value={payment.paidFor}
                />
              </div>

              {query.isLoading && <DialogSkeleton />}
              {query.isError && (
                <SectionError
                  message="Could not load the related documents."
                  onRetry={() => query.refetch()}
                />
              )}

              {invoice && (
                <div className="rounded-2xl border border-border p-4 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Related invoice</p>
                  <p className="text-sm font-medium">{`${invoice.number} · ${invoice.billingPeriod}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {`Invoice total ${ngn(invoice.totalNgn)} · outstanding ${ngn(invoice.outstandingNgn)}`}
                  </p>
                </div>
              )}

              {quotation && (
                <div className="rounded-2xl border border-border p-4 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Related quotation</p>
                  <p className="text-sm font-medium">{`${quotation.number} · ${quotation.purpose}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {`Quoted ${ngn(quotation.totalNgn)} · ${quotation.operationalOutcome}`}
                  </p>
                </div>
              )}

              <PlanSummary lines={invoice?.lines ?? quotation?.lines ?? []} />

              {payment.status === "successful" && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => receipt(payment)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download receipt
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaymentRow({
  payment, onView,
}: {
  payment: TenantPayment; onView: () => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium whitespace-nowrap">{payment.reference}</TableCell>
      <TableCell className="whitespace-nowrap">{formatDate(payment.date)}</TableCell>
      <TableCell className="whitespace-nowrap">
        {payment.planName ? (
          <StatusPill
            label={payment.planName}
            tone="info"
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{payment.deviceCount || "—"}</TableCell>
      <TableCell className="text-right tabular-nums">{ngn(payment.amountNgn)}</TableCell>
      <TableCell>{methodLabel(payment.method)}</TableCell>
      <TableCell className="text-muted-foreground">
        {[
          payment.invoiceNumber,
          payment.quotationNumber,
        ].filter(Boolean).join(" · ") || "—"}
      </TableCell>
      <TableCell><PaymentStatus status={payment.status} /></TableCell>
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
        {payment.status === "successful" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => receipt(payment)}
            aria-label="Download document"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function BillingPaymentsTab() {
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
    selected,
    setSelected,
  ] = useState<TenantPayment | null>(null);
  const q = useDebouncedValue(search.trim());

  const payments = useTenantPayments({
    params: {
      status: status === "all" ? undefined : status as TenantPaymentStatus,
      q: q || undefined,
      page,
      pageSize: PAGE_SIZE,
    },
  });
  const list = payments.data?.data;

  return (
    <Card className="surface-sleek rounded-2xl">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Payments History</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Every payment made by your organization and what it settled.
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
              placeholder="Search payment reference, invoice or quotation"
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
            <SelectTrigger className="w-full sm:w-48 rounded-xl">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(PAYMENT_STATUS_LABEL).map(([
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
        {payments.isError && (
          <SectionError
            message="Could not load your payments."
            onRetry={() => payments.refetch()}
          />
        )}
        {!payments.isError && (
          <div className="rounded-2xl border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>M2M plan</TableHead>
                  <TableHead className="text-right">Devices</TableHead>
                  <TableHead className="text-right">Amount paid</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Related invoice / quotation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.isLoading && <SkeletonRows cols={COLS} />}
                {list?.items.map(p => (
                  <PaymentRow
                    key={p.id}
                    payment={p}
                    onView={() => setSelected(p)}
                  />
                ))}
                {list && list.items.length === 0 && (
                  <EmptyRow
                    cols={COLS}
                    text="No payments match your filters."
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

      <PaymentDialog
        payment={selected}
        onClose={() => setSelected(null)}
      />
    </Card>
  );
}
