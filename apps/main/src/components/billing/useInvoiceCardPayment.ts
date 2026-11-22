import type { TenantInvoice } from "@truckmoov/api/billing";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import {
  BILLING_QUERY_KEY, usePayTenantInvoiceByCard,
} from "@truckmoov/api/billing";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

export function formatDay(date: string) {
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

export function payErrorMessage(err: unknown) {
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

function refetchTenantBilling() {
  void queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY.tenantRoot });
}

export function useInvoiceCardPayment(onPaid?: () => void) {
  const card = usePayTenantInvoiceByCard();
  const payByCard = (invoice: TenantInvoice) =>
    card.mutate(
      { id: invoice.id },
      {
        onSuccess: (res) => {
          if (res.data.authorizationUrl) {
            window.location.assign(res.data.authorizationUrl);
            return;
          }
          // Demo checkout settles on the server, so refresh the invoice list.
          refetchTenantBilling();
          onPaid?.();
          toast.success(res.data.newPeriodEnd
            ? `Paid. Your licence now runs until ${formatDay(res.data.newPeriodEnd)}.`
            : "Paid. Thank you.");
        },
        onError: err => toast.error(payErrorMessage(err)),
      },
    );
  return {
    payByCard, isPending: card.isPending,
  };
}
