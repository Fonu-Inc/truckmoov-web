import { getBillingInvoiceQueryOptions } from "@truckmoov/api/billing";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { DetailSkeleton } from "@/components/ui/skeletons";
import {
  customerTypeLabel,
  formatDateOnly,
  formatIsoDateTime,
  formatNgn,
  InvoiceStatusBadge,
  methodLabel,
  PaymentStatusBadge,
} from "@/components/platform/billing/billingUi";
import {
  DetailField,
  DetailsLoadError,
  LineItemsTable,
  TotalsBlock,
} from "@/components/platform/billing/QuotationDetailsDialog";

export function InvoiceDetailsDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error, refetch } = useQuery(
    getBillingInvoiceQueryOptions(id ?? ""),
  );
  const invoice = data?.data;

  return (
    <Dialog open={id !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {invoice?.number ?? "Invoice"}
            {invoice && <InvoiceStatusBadge status={invoice.status} />}
          </DialogTitle>
          <DialogDescription>{invoice?.customerName ?? "Invoice details"}</DialogDescription>
        </DialogHeader>

        {isLoading && <DetailSkeleton items={6} />}
        {isError && <DetailsLoadError message={error.message} onRetry={() => void refetch()} />}
        {invoice && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <DetailField label="Linked quotation" value={invoice.quotationNumber ?? "-"} />
              <DetailField label="Billing email" value={invoice.billingEmail} />
              <DetailField
                label="Delivery"
                value={invoice.emailedAt ? `Emailed ${formatIsoDateTime(invoice.emailedAt)}` : "Not emailed"}
              />
              <DetailField label="Issue date" value={formatDateOnly(invoice.issueDate)} />
              <DetailField label="Due date" value={formatDateOnly(invoice.dueDate)} />
              <DetailField label="Customer type" value={customerTypeLabel(invoice.customerType)} />
            </div>

            <LineItemsTable lines={invoice.lines} />
            <TotalsBlock totals={invoice} />

            <div className="grid gap-3 sm:grid-cols-3">
              <DetailField label="Invoice total" value={formatNgn(invoice.totalNgn)} />
              <DetailField label="Amount paid" value={formatNgn(invoice.amountPaidNgn)} />
              <DetailField label="Outstanding" value={formatNgn(invoice.outstandingNgn)} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Payments applied</p>
              <div className="divide-y rounded-xl border">
                {invoice.payments.map(payment => (
                  <div
                    key={payment.reference}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{payment.reference}</p>
                      <p className="text-xs text-muted-foreground">
                        {methodLabel(payment.method)}
                        {" · "}
                        {formatIsoDateTime(payment.paidAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <PaymentStatusBadge status={payment.status} />
                      <span className="font-medium tabular-nums">{formatNgn(payment.amountNgn)}</span>
                    </div>
                  </div>
                ))}
                {invoice.payments.length === 0 && (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No payments recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
