import type { PaymentBreakdown } from "@truckmoov/api/billing";
import { useBillingPayment } from "@truckmoov/api/billing";
import { AlertTriangle } from "lucide-react";
import {
  formatIsoDateTime,
  formatNgn,
  formatTaxRate,
  methodLabel,
  PaymentStatusBadge,
} from "@/components/platform/billing/billingUi";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Skeleton } from "@/components/shadcn/skeleton";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 text-sm ${strong ? "font-semibold" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function Breakdown({ b }: { b: PaymentBreakdown }) {
  return (
    <div className="space-y-2 rounded-xl border p-4">
      <p className="text-sm font-semibold">{b.planName}</p>
      <Line label="Devices" value={String(b.deviceCount)} />
      <Line label="Price per device" value={formatNgn(b.perDeviceNgn)} />
      <Line label="Devices total" value={formatNgn(b.devicesNgn)} />
      <Line label="Installation per device" value={formatNgn(b.installationPerDeviceNgn)} />
      <Line label="Installation total" value={formatNgn(b.installationNgn)} />
      <div className="border-t pt-2">
        <Line label="Subtotal" value={formatNgn(b.subtotalNgn)} />
        <Line label={`Tax (${formatTaxRate(b.taxRateBp)})`} value={formatNgn(b.taxNgn)} />
      </div>
      <div className="border-t pt-2">
        <Line label="Total" value={formatNgn(b.totalNgn)} strong />
      </div>
    </div>
  );
}

function ReviewCallout() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Needs review. This payment could not be reconciled automatically.</span>
    </div>
  );
}

function PaymentHeader() {
  return (
    <DialogHeader>
      <DialogTitle>Payment details</DialogTitle>
      <DialogDescription>Review this payment.</DialogDescription>
    </DialogHeader>
  );
}

function Body({ id }: { id: string }) {
  const { data, isLoading, isError, error, refetch } = useBillingPayment(id);
  const p = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PaymentHeader />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (isError || !p) {
    return (
      <div className="space-y-4">
        <PaymentHeader />
        <div className="py-8 text-center">
          <p className="text-sm font-medium">Couldn't load payment</p>
          <p className="text-xs text-muted-foreground">{error?.message}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          {p.reference}
          <PaymentStatusBadge status={p.status} />
        </DialogTitle>
        <DialogDescription>{p.customerName}</DialogDescription>
      </DialogHeader>
      {p.status === "requires_review" && <ReviewCallout />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Detail label="Amount paid" value={formatNgn(p.amountNgn)} />
        <Detail label="Payment date" value={formatIsoDateTime(p.paidAt)} />
        <Detail label="Method" value={methodLabel(p.method)} />
        <Detail label="Provider" value={p.provider || "-"} />
        <Detail label="Billing email" value={p.billingEmail || "-"} />
        <Detail label="Auto-reconciled" value={p.autoReconciled ? "Yes" : "No"} />
        <Detail label="Linked quotation" value={p.quotationNumber ?? "-"} />
        <Detail label="Linked invoice" value={p.invoiceNumber ?? "-"} />
      </div>
      {p.note && <Detail label="Note" value={p.note} />}
      {p.breakdown && <Breakdown b={p.breakdown} />}
    </div>
  );
}

export function PaymentDetailsDialog({
  paymentId,
  onClose,
}: {
  paymentId: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!paymentId} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        {paymentId && <Body id={paymentId} />}
      </DialogContent>
    </Dialog>
  );
}
