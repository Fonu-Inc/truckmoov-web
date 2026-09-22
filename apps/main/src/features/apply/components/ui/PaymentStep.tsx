import type { PaymentContext } from "@truckmoov/reusables/components/app/PaymentGatewayDialog";

import { PaymentGatewayDialog } from "@truckmoov/reusables/components/app/PaymentGatewayDialog";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import {
  findM2MPlan,
  INSTALLATION_UNIT_COST,
} from "@/features/apply/utils/m2mLicense";
import { formatCurrency } from "@/lib/currency";

type PaymentStepProps = { onContinue: () => void };

export function PaymentStep({ onContinue }: PaymentStepProps) {
  const fleet = useApplyDraftStore(state => state.fleet);
  const licence = useApplyDraftStore(state => state.licence);
  const paid = useApplyDraftStore(state => state.paid);
  const setPaid = useApplyDraftStore(state => state.setPaid);
  const [
    payOpen,
    setPayOpen,
  ] = useState(false);

  const plan = findM2MPlan(licence.licensePlan) ?? findM2MPlan("standard")!;
  const units = Math.max(
    fleet.deviceRequests.reduce(
      (total, request) => total + request.quantity,
      0,
    ),
    0,
  );
  const packageTotal = plan.yearOnePrice * units;
  const installation = INSTALLATION_UNIT_COST * units;
  const subtotal = packageTotal + installation;
  const total = subtotal;

  const context: PaymentContext = {
    type: "application",
    planName: plan.label,
    deviceCount: units,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Payment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay for your M2M package. You will schedule your installation in the next step.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">Order Summary</h3>
          {paid
            ? (
                <Badge className="rounded-full bg-success/15 text-success hover:bg-success/15">
                  Payment Confirmed
                </Badge>
              )
            : (
                <Badge
                  variant="secondary"
                  className="rounded-full"
                >
                  Awaiting payment
                </Badge>
              )}
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Selected M2M License Plan
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
            <span className="text-lg font-semibold text-foreground">{plan.label}</span>
            <span className="text-sm text-muted-foreground">
              {`${units} Device${units === 1 ? "" : "s"} × ${formatCurrency(plan.yearOnePrice)}`}
            </span>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Your M2M package is charged per device and includes the Fleet device, platform license,
            and MTN connectivity where applicable.
          </p>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <Line
            label={`M2M package (${units} devices)`}
            value={formatCurrency(packageTotal)}
          />
          <Line
            label="Installation"
            value={formatCurrency(installation)}
          />
          <Line
            label="Subtotal"
            value={formatCurrency(subtotal)}
          />
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <dt className="text-sm font-semibold text-foreground">Grand Total</dt>
            <dd className="text-lg font-bold text-foreground">{formatCurrency(total)}</dd>
          </div>
        </dl>

        <Button
          size="lg"
          className="mt-5 w-full sm:w-auto"
          onClick={() => (paid ? onContinue() : setPayOpen(true))}
        >
          {paid ? "Continue to Installation Scheduling" : "Make Payment"}
        </Button>
      </div>

      <PaymentGatewayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        context={context}
        onPay={async () => {
          // ponytail: `createPaymentIntent` posts through the authenticated
          // axios instance, and an applicant has no session yet. Until a
          // token-based payment-intent endpoint exists, record the intent
          // locally and let the onboarding team invoice.
          setPaid(true);
          setPayOpen(false);
          toast.success("Payment details recorded. Our team will confirm your invoice by email.");
          return {};
        }}
      />
    </div>
  );
}

function Line({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
