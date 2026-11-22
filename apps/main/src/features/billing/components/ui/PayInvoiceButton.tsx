import type { TenantInvoice } from "@truckmoov/api/billing";
import type { ComponentProps } from "react";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { PayDialog } from "@/components/billing/SubscriptionInvoicesCard";
import { useInvoiceCardPayment } from "@/components/billing/useInvoiceCardPayment";
import { Button } from "@/components/shadcn/button";
import { InstallationGate } from "@/features/get-started/components/ui/InstallationGate";
import { useInstallationPending } from "@/features/get-started/hooks/useInstallationPending";

/** Opens the wallet-or-card payment dialog for one payable invoice. */
export function PayInvoiceButton({
  invoice, label = "Pay", ...button
}: {
  invoice: TenantInvoice; label?: string;
} & Omit<ComponentProps<typeof Button>, "onClick">) {
  const [
    open,
    setOpen,
  ] = useState(false);
  const card = useInvoiceCardPayment(() => setOpen(false));
  const installationPending = useInstallationPending();

  return (
    <>
      <InstallationGate pending={installationPending}>
        <Button
          size="sm"
          {...button}
          disabled={installationPending || button.disabled}
          onClick={() => setOpen(true)}
        >
          <Wallet className="h-4 w-4 mr-1.5" />
          {label}
        </Button>
      </InstallationGate>
      <PayDialog
        invoice={open ? invoice : null}
        onClose={() => setOpen(false)}
        onCard={card.payByCard}
        cardBusy={card.isPending}
      />
    </>
  );
}
