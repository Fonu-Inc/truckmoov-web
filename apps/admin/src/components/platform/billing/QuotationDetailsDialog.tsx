import type { ColumnDef } from "@tanstack/react-table";
import type { BillingLine } from "@truckmoov/api/billing";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBillingQuotationQueryOptions } from "@truckmoov/api/billing";
import {
  customerTypeLabel,
  formatIsoDate,
  formatIsoDateTime,
  formatNgn,
  formatTaxRate,
} from "@/components/platform/billing/billingFormat";
import {
  PaymentStatusBadge,
  QuotationStatusBadge,
} from "@/components/platform/billing/billingUi";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { DetailSkeleton } from "@/components/ui/skeletons";

export function DetailField({
  label, value,
}: {
  label: string; value: ReactNode;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

// Document line items: order is meaningful, so sorting is off.
const LINE_ITEM_COLUMNS: ColumnDef<BillingLine>[] = [
  {
    id: "item",
    header: "Item",
    enableSorting: false,
    cell: ({ row }) => {
      const line = row.original;
      return (
        <>
          <p className="font-medium">{line.name}</p>
          {line.description && (
            <p className="text-xs text-muted-foreground">{line.description}</p>
          )}
          {line.components.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {line.components.map(component => (
                <Badge
                  key={component}
                  variant="secondary"
                  className="rounded-full"
                >
                  {component}
                </Badge>
              ))}
            </div>
          )}
        </>
      );
    },
  },
  {
    accessorKey: "quantity", header: "Quantity", enableSorting: false, meta: { className: "text-right tabular-nums" },
  },
  {
    id: "unitPrice",
    header: "Unit price",
    enableSorting: false,
    meta: { className: "text-right tabular-nums" },
    cell: ({ row }) => formatNgn(row.original.unitPriceNgn),
  },
  {
    id: "lineTotal",
    header: "Line total",
    enableSorting: false,
    meta: { className: "text-right font-medium tabular-nums" },
    cell: ({ row }) => formatNgn(row.original.lineTotalNgn),
  },
];

export function LineItemsTable({ lines }: { lines: BillingLine[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <DataTable
        columns={LINE_ITEM_COLUMNS}
        data={lines}
        emptyState="No line items"
      />
    </div>
  );
}

type Totals = {
  subtotalNgn: number; discountNgn: number; taxRateBp: number; taxNgn: number; totalNgn: number;
};

export function TotalsBlock({ totals }: { totals: Totals }) {
  const rows: [string, string][] = [
    [
      "Subtotal",
      formatNgn(totals.subtotalNgn),
    ],
    [
      "Discount",
      formatNgn(totals.discountNgn),
    ],
    [
      `Tax (${formatTaxRate(totals.taxRateBp)})`,
      formatNgn(totals.taxNgn),
    ],
  ];
  return (
    <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
      {rows.map(([
        label,
        value,
      ]) => (
        <div
          key={label}
          className="flex justify-between text-muted-foreground"
        >
          <span>{label}</span>
          <span className="tabular-nums">{value}</span>
        </div>
      ))}
      <div className="flex justify-between border-t pt-1.5 font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatNgn(totals.totalNgn)}</span>
      </div>
    </div>
  );
}

export function DetailsLoadError({
  message, onRetry,
}: {
  message: string; onRetry: () => void;
}) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm font-medium">Couldn't load details</p>
      <p className="text-xs text-muted-foreground">{message}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}

export function QuotationDetailsDialog({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const {
    data, isLoading, isError, error, refetch,
  } = useQuery(
    getBillingQuotationQueryOptions(id ?? ""),
  );
  const quotation = data?.data;

  return (
    <Dialog
      open={id !== null}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {quotation?.number ?? "Quotation"}
            {quotation && <QuotationStatusBadge status={quotation.status} />}
          </DialogTitle>
          <DialogDescription>{quotation?.customerName ?? "Quotation details"}</DialogDescription>
        </DialogHeader>

        {isLoading && <DetailSkeleton items={6} />}
        {isError && (
          <DetailsLoadError
            message={error.message}
            onRetry={() => void refetch()}
          />
        )}
        {quotation && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <DetailField
                label="Customer type"
                value={customerTypeLabel(quotation.customerType)}
              />
              <DetailField
                label="Billing email"
                value={quotation.billingEmail}
              />
              <DetailField
                label="Created"
                value={formatIsoDate(quotation.createdAt)}
              />
              <DetailField
                label="Valid until"
                value={formatIsoDate(quotation.validUntil)}
              />
              <DetailField
                label="Paid"
                value={formatNgn(quotation.paidNgn)}
              />
              <DetailField
                label="Outstanding"
                value={formatNgn(quotation.outstandingNgn)}
              />
            </div>

            <LineItemsTable lines={quotation.lines} />
            <TotalsBlock totals={quotation} />

            <div>
              <p className="mb-2 text-sm font-medium">Payments</p>
              <div className="divide-y rounded-xl border">
                {quotation.payments.map(payment => (
                  <div
                    key={payment.reference}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{payment.reference}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatIsoDateTime(payment.paidAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <PaymentStatusBadge status={payment.status} />
                      <span className="font-medium tabular-nums">{formatNgn(payment.amountNgn)}</span>
                    </div>
                  </div>
                ))}
                {quotation.payments.length === 0 && (
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
