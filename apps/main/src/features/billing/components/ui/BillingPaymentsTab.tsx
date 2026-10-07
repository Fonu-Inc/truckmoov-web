import type { ColumnDef } from "@tanstack/react-table";
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
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { useDebouncedValue } from "@/features/data-bundle/utils/dataBundle";
import { receiptDocument } from "../../utils/billingDocuments";
import {
  downloadDocument, formatDate, formatLongDate, methodLabel, ngn, PAYMENT_STATUS_LABEL, toneForStatus,
} from "../../utils/billingHelpers";
import {
  DialogSkeleton, LabelValue, PlanSummary, SectionError, StatusPill,
} from "../../utils/billingShared";

const PAGE_SIZE = 20;

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

function paymentColumns(onView: (p: TenantPayment) => void): ColumnDef<TenantPayment>[] {
  return [
    {
      accessorKey: "reference",
      header: "Reference",
      enableSorting: false,
      meta: { className: "font-medium whitespace-nowrap" },
    },
    {
      id: "date",
      header: "Date",
      enableSorting: false,
      meta: { className: "whitespace-nowrap" },
      cell: ({ row }) => formatDate(row.original.date),
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
      id: "amount",
      header: "Amount paid",
      enableSorting: false,
      meta: { className: "text-right tabular-nums" },
      cell: ({ row }) => ngn(row.original.amountNgn),
    },
    {
      id: "method",
      header: "Method",
      enableSorting: false,
      cell: ({ row }) => methodLabel(row.original.method),
    },
    {
      id: "related",
      header: "Related invoice / quotation",
      enableSorting: false,
      meta: { className: "text-muted-foreground" },
      cell: ({ row }) => [
        row.original.invoiceNumber,
        row.original.quotationNumber,
      ].filter(Boolean).join(" · ") || "—",
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <PaymentStatus status={row.original.status} />,
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
            onClick={() => onView(row.original)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {" "}
            View
          </Button>
          {row.original.status === "successful" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => receipt(row.original)}
              aria-label="Download document"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </>
      ),
    },
  ];
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
        <div className="rounded-2xl border border-border overflow-x-auto">
          <DataTable
            columns={paymentColumns(setSelected)}
            data={list?.items ?? []}
            isLoading={payments.isLoading}
            isError={payments.isError}
            errorMessage="Could not load your payments."
            onRetry={() => payments.refetch()}
            emptyState="No payments match your filters."
            pagination={list && {
              page,
              pageSize: PAGE_SIZE,
              total: list.total,
              onPageChange: setPage,
            }}
          />
        </div>
      </CardContent>

      <PaymentDialog
        payment={selected}
        onClose={() => setSelected(null)}
      />
    </Card>
  );
}
