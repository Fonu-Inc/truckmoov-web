import type { ColumnDef } from "@tanstack/react-table";
import type {
  TenantInvoice, TenantLicence,
} from "@truckmoov/api/billing";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import {
  keepPreviousData, useQuery,
} from "@tanstack/react-query";
import {
  BILLING_QUERY_KEY,
  getTenantInvoicesQueryOptions,
  usePayTenantInvoiceByCard,
  usePayTenantInvoiceFromWallet,
  useTenantLicence,
} from "@truckmoov/api/billing";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { useServerPagination } from "@truckmoov/reusables/hooks/useServerPagination";
import {
  AlertCircle, CheckCircle, Clock, CreditCard, FileText, Wallet,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { formatCurrency } from "@/lib/currency";

function formatDay(date: string) {
  return new Date(`${date.slice(
    0,
    10,
  )}T00:00:00Z`).toLocaleDateString(
    "en-NG",
    {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function payErrorMessage(err: unknown) {
  const e = err as Partial<ServerErrorResponse> | undefined;
  if (e?.shortfallNgn) {
    return `Your wallet balance is ${formatCurrency(
      e.shortfallNgn,
      "NGN",
    )} short. Top up the wallet and try again.`;
  }
  if (e?.code === "INVOICE_NOT_PAYABLE")
    return "This invoice can no longer be paid. Refresh to see its latest status.";
  return e?.message ?? "Payment could not be completed. Try again.";
}

function StatusBadge({ invoice }: { invoice: TenantInvoice }) {
  if (invoice.status === "paid") {
    return (
      <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10">
        <CheckCircle className="h-3 w-3 mr-1" />
        Paid
      </Badge>
    );
  }
  if (invoice.status === "overdue") {
    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Overdue
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="bg-warning/10 text-warning border-warning/20"
    >
      <Clock className="h-3 w-3 mr-1" />
      {invoice.status === "partially_paid" ? "Partly paid" : "Awaiting payment"}
    </Badge>
  );
}

function dueNote(invoice: TenantInvoice) {
  if (invoice.status === "paid")
    return null;
  if (invoice.daysOverdue > 0) {
    const grace = invoice.graceEndsOn ? ` Pay by ${formatDay(invoice.graceEndsOn)} to keep your account active.` : "";
    return `${plural(
      invoice.daysOverdue,
      "day",
    )} overdue.${grace}`;
  }
  return `Due ${formatDay(invoice.dueDate)}`;
}

function LicenceSummary({ licence }: { licence: TenantLicence }) {
  const expired = licence.daysLeft < 0;
  return (
    <div className="rounded-lg border p-4 text-sm">
      <p className="font-medium">
        {licence.planName}
        {" · "}
        {plural(
          licence.deviceCount,
          "device",
        )}
      </p>
      <p className="text-muted-foreground">
        {expired
          ? `Licence ended on ${formatDay(licence.periodEnd)}`
          : `Licence valid until ${formatDay(licence.periodEnd)} (${plural(
            licence.daysLeft,
            "day",
          )} left)`}
      </p>
    </div>
  );
}

function PayDialog({
  invoice, onClose,
}: {
  invoice: TenantInvoice | null; onClose: () => void;
}) {
  const wallet = usePayTenantInvoiceFromWallet();

  const confirm = () => {
    if (!invoice)
      return;
    wallet.mutate(
      { id: invoice.id },
      {
        onSuccess: (res) => {
          toast.success(res.data.newPeriodEnd
            ? `Paid. Your licence now runs until ${formatDay(res.data.newPeriodEnd)}.`
            : "Paid. Thank you.");
          onClose();
        },
        onError: err => toast.error(payErrorMessage(err)),
      },
    );
  };

  return (
    <Dialog
      open={invoice !== null}
      onOpenChange={open => !open && !wallet.isPending && onClose()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay from wallet</DialogTitle>
          <DialogDescription>
            {invoice
              ? `${formatCurrency(
                invoice.outstandingNgn,
                "NGN",
              )} will be taken from your wallet to pay invoice ${invoice.number}.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={wallet.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={wallet.isPending}
            onClick={confirm}
          >
            {wallet.isPending ? "Paying..." : "Confirm payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function invoiceColumns({
  cardBusy, onWallet, onCard,
}: {
  cardBusy: boolean;
  onWallet: (i: TenantInvoice) => void;
  onCard: (i: TenantInvoice) => void;
}): ColumnDef<TenantInvoice>[] {
  return [
    {
      id: "invoice",
      header: "Invoice",
      enableSorting: false,
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <>
            <p className="font-medium">{invoice.number}</p>
            <p className="text-xs text-muted-foreground">
              {invoice.kind === "renewal" ? "Licence renewal" : "First purchase"}
              {invoice.periodEnd ? ` · licence ends ${formatDay(invoice.periodEnd)}` : ""}
            </p>
          </>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const invoice = row.original;
        const note = dueNote(invoice);
        return (
          <>
            <StatusBadge invoice={invoice} />
            {note && <p className={`mt-1 text-xs ${invoice.daysOverdue > 0 ? "text-destructive" : "text-muted-foreground"}`}>{note}</p>}
          </>
        );
      },
    },
    {
      id: "amount",
      header: "Amount",
      enableSorting: false,
      meta: { className: "text-right font-semibold" },
      cell: ({ row }) => formatCurrency(
        row.original.status === "paid" ? row.original.totalNgn : row.original.outstandingNgn,
        "NGN",
      ),
    },
    {
      id: "pay",
      header: "Pay",
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => row.original.payable && (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            onClick={() => onWallet(row.original)}
          >
            <Wallet className="h-3.5 w-3.5 mr-1.5" />
            Pay from wallet
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={cardBusy}
            onClick={() => onCard(row.original)}
          >
            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            Pay by card
          </Button>
        </div>
      ),
    },
  ];
}

function refetchTenantBilling() {
  void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY.tenantRoot });
}

export function SubscriptionInvoicesCard(_props: { tenantName?: string }) {
  const {
    page, pageSize, pagination,
  } = useServerPagination();
  const invoices = useQuery({
    ...getTenantInvoicesQueryOptions({
      params: {
        status: "all", page, pageSize,
      },
    }),
    placeholderData: keepPreviousData,
  });
  const licence = useTenantLicence();
  const card = usePayTenantInvoiceByCard();
  const [
    walletInvoice,
    setWalletInvoice,
  ] = useState<TenantInvoice | null>(null);

  useEffect(
    () => {
      window.addEventListener(
        "focus",
        refetchTenantBilling,
      );
      return () => window.removeEventListener(
        "focus",
        refetchTenantBilling,
      );
    },
    [],
  );

  const payByCard = (invoice: TenantInvoice) =>
    card.mutate(
      { id: invoice.id },
      {
        onSuccess: (res) => {
          window.location.assign(res.data.authorizationUrl);
        },
        onError: err => toast.error(payErrorMessage(err)),
      },
    );

  const list = invoices.data?.data;
  const items = list?.items ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Licence and invoices
              </CardTitle>
              <CardDescription>
                Your licence renewals. A renewal invoice is issued before your licence expires and is due on the expiry date.
              </CardDescription>
            </div>
            {list && list.openTotalNgn > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Amount to pay</p>
                <p className="text-lg font-bold">
                  {formatCurrency(
                    list.openTotalNgn,
                    "NGN",
                  )}
                </p>
                {list.nextDueDate && <p className="text-xs text-muted-foreground">{`Next due ${formatDay(list.nextDueDate)}`}</p>}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {licence.data?.data && <LicenceSummary licence={licence.data.data} />}
          <DataTable
            columns={invoiceColumns({
              cardBusy: card.isPending, onWallet: setWalletInvoice, onCard: payByCard,
            })}
            data={items}
            isLoading={invoices.isPending}
            isError={invoices.isError}
            errorMessage="Could not load your invoices. Check your connection and try again."
            onRetry={() => void invoices.refetch()}
            emptyState="No invoices yet. Your renewal invoice appears here before your licence expires."
            pagination={pagination(list?.total ?? 0)}
          />
        </CardContent>
      </Card>
      <PayDialog
        invoice={walletInvoice}
        onClose={() => setWalletInvoice(null)}
      />
    </>
  );
}
