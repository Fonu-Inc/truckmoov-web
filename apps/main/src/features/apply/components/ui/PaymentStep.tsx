import type { ServerErrorResponse } from "@truckmoov/api/lib/types";

import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingOrderQueryOptions,
  useStartOnboardingPayment,
  useVerifyOnboardingPayment,
} from "@truckmoov/api/auth";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { formatCurrency } from "@/lib/currency";

type PaymentStepProps = {
  applicationId: string;
  onContinue: () => void;
  /** Sends the applicant back to Fleet Requirements when the order can't be priced. */
  onEditFleet: () => void;
};

/** The provider redirects back here; confirmation itself arrives by webhook. */
export const PAYMENT_RETURN_PARAM = "payment";
const POLL_MS = 5000;
const POLL_LIMIT_MS = 2 * 60 * 1000;
const VERIFY_MS = 30_000;
// Survives the redirect to the provider, so the window runs from when payment started.
const startKey = (id: string) => `truckmoov_payment_started_${id}`;

function readPaymentStart(id: string) {
  try {
    const value = Number(window.sessionStorage.getItem(startKey(id)));
    return value > 0 ? value : null;
  }
  catch {
    return null;
  }
}

function savePaymentStart(id: string, at: number | null) {
  try {
    if (at) {
      window.sessionStorage.setItem(
        startKey(id),
        String(at),
      );
    }
    else {
      window.sessionStorage.removeItem(startKey(id));
    }
  }
  catch {}
}
const STAGES_AFTER_PAYMENT = [
  "installation_scheduling",
  "installation",
  "connectivity_verification",
  "fleet_ready",
];

function paymentError(error: unknown) {
  const err = error as ServerErrorResponse;
  if (err.statusCode === 402)
    return "Your payment was declined. Try again.";
  if (err.statusCode === 503)
    return "Payments are temporarily unavailable. Please try again later. This isn't a problem with your details.";
  if (err.statusCode === 409 && /stage/i.test(err.message))
    return "Payment opens once your devices have been allocated. We'll email you when you can pay.";
  return err.message || "The payment couldn't be started. Try again.";
}

/**
 * Step 4 (TRU-FE-14). Runs on the draft token — no account exists yet. The order is
 * priced by the server from the application's device rows, so nothing here computes or
 * sends a total. In demo mode the server settles the payment immediately and the order
 * refreshes as paid; a real provider, when enabled, still redirects and is confirmed by
 * the webhook.
 */
export function PaymentStep({
  applicationId,
  onContinue,
  onEditFleet,
}: PaymentStepProps) {
  // Returning from the provider: confirm by polling until the webhook lands.
  const [
    pollStartedAt,
    setPollStartedAt,
  ] = useState<number | null>(() => (new URLSearchParams(window.location.search).has(PAYMENT_RETURN_PARAM)
    ? readPaymentStart(applicationId) ?? Date.now()
    : null));
  const confirming = pollStartedAt !== null;
  const [
    windowEnded,
    setWindowEnded,
  ] = useState(false);
  const orderQuery = useQuery({
    ...getOnboardingOrderQueryOptions(applicationId),
    refetchInterval: query => (confirming
      && query.state.data?.data.payment?.status === "pending"
      && !windowEnded
      ? POLL_MS
      : false),
  });
  const verifyPayment = useVerifyOnboardingPayment();
  const verify = verifyPayment.mutate;
  const orderData = orderQuery.data?.data;
  const order = orderData?.order;
  const payment = orderData?.payment ?? null;
  // Paid, or the stage has already moved past payment (the webhook landed).
  const paid = payment?.status === "paid" || STAGES_AFTER_PAYMENT.includes(orderData?.stage ?? "");
  const pending = payment?.status === "pending";

  // Ask the provider directly in case its webhook is late, then every so often until the window ends.
  useEffect(
    () => {
      if (pollStartedAt === null)
        return;
      verify({ id: applicationId });
      const remaining = Math.max(
        0,
        pollStartedAt + POLL_LIMIT_MS - Date.now(),
      );
      const interval = setInterval(
        verify,
        VERIFY_MS,
        { id: applicationId },
      );
      const end = setTimeout(
        () => {
          clearInterval(interval);
          setWindowEnded(true);
        },
        remaining,
      );
      return () => {
        clearInterval(interval);
        clearTimeout(end);
      };
    },
    [
      applicationId,
      pollStartedAt,
      verify,
    ],
  );

  useEffect(
    () => {
      if (paid) {
        savePaymentStart(
          applicationId,
          null,
        );
      }
    },
    [
      applicationId,
      paid,
    ],
  );

  const startPayment = useStartOnboardingPayment();
  const [
    payError,
    setPayError,
  ] = useState<string | null>(null);

  // Strip the return marker so a reload doesn't restart the confirmation wait.
  useEffect(
    () => {
      const params = new URLSearchParams(window.location.search);
      if (!params.has(PAYMENT_RETURN_PARAM))
        return;
      params.delete(PAYMENT_RETURN_PARAM);
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`,
      );
    },
    [],
  );

  async function pay() {
    setPayError(null);
    const startedAt = Date.now();
    savePaymentStart(
      applicationId,
      startedAt,
    );
    try {
      const res = await startPayment.mutateAsync({
        id: applicationId,
        data: { redirectUrl: `${window.location.origin}/apply?${PAYMENT_RETURN_PARAM}=return` },
      });
      if (res.data.authorizationUrl) {
        window.location.assign(res.data.authorizationUrl);
        return;
      }
      if (res.data.paid) {
        onContinue();
        return;
      }
      // The provider may have settled without a redirect; confirm by polling.
      const refreshed = await orderQuery.refetch();
      const data = refreshed.data?.data;
      if (data?.payment?.status === "paid" || STAGES_AFTER_PAYMENT.includes(data?.stage ?? "")) {
        onContinue();
        return;
      }
      // No hosted page to visit: wait for the webhook here instead.
      setWindowEnded(false);
      setPollStartedAt(startedAt);
    }
    catch (error) {
      setPayError(paymentError(error));
      if ((error as ServerErrorResponse).statusCode === 409)
        void orderQuery.refetch();
    }
  }

  if (orderQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orderQuery.isError || !orderData || !order) {
    const message = (orderQuery.error as ServerErrorResponse | null)?.message;
    const fleetProblem = message ? /device|plan/i.test(message) : false;
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="max-w-md text-sm text-muted-foreground">
          {message ?? "Your order couldn't be loaded."}
        </p>
        <Button
          variant="outline"
          onClick={() => (fleetProblem ? onEditFleet() : void orderQuery.refetch())}
        >
          {fleetProblem ? "Review your fleet" : "Try again"}
        </Button>
      </div>
    );
  }

  const waitingForWebhook = confirming && pending;
  const pollTimedOut = waitingForWebhook && windowEnded;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Payment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your application passed system verification. Pay your quotation, then schedule
          installation. Your subscription becomes active only after installation and final system
          verification.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">Quotation</h3>
          {paid
            ? <Badge className="rounded-full bg-success/15 text-success hover:bg-success/15">Payment Confirmed</Badge>
            : payment?.status === "failed" || payment?.status === "mismatch"
              ? (
                  <Badge
                    variant="destructive"
                    className="rounded-full"
                  >
                    {payment.status === "mismatch" ? "Payment needs attention" : "Payment failed"}
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
            <span className="text-lg font-semibold text-foreground">{order.planName}</span>
            <span className="text-sm text-muted-foreground">
              {`${order.deviceCount} Device${order.deviceCount === 1 ? "" : "s"} × ${formatCurrency(order.perDeviceNgn)}`}
            </span>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Your M2M package is charged per device and includes the Fleet device, platform license, and
            MTN connectivity where applicable.
          </p>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <Line
            label={`M2M package (${order.deviceCount} devices)`}
            value={formatCurrency(order.devicesNgn)}
          />
          <Line
            label="Installation"
            value={formatCurrency(order.installationNgn)}
          />
          {(order.telecomMasterSimNgn ?? 0) > 0 && (
            <Line
              label="New Telematics SIM"
              value={formatCurrency(order.telecomMasterSimNgn ?? 0)}
            />
          )}
          {/* TODO(api): shown once the order endpoint sends these quotation lines. */}
          {(order.deliveryFeeNgn ?? 0) > 0 && (
            <Line
              label="Delivery / fulfilment fee"
              value={formatCurrency(order.deliveryFeeNgn ?? 0)}
            />
          )}
          {order.discountNgn !== undefined && (
            <Line
              label="Discount"
              value={`- ${formatCurrency(order.discountNgn)}`}
            />
          )}
          {order.subtotalNgn !== undefined && (
            <Line
              label="Subtotal"
              value={formatCurrency(order.subtotalNgn)}
            />
          )}
          {order.vatNgn !== undefined && (
            <Line
              label="VAT (7.5%)"
              value={formatCurrency(order.vatNgn)}
            />
          )}
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <dt className="text-sm font-semibold text-foreground">Grand Total</dt>
            <dd className="text-lg font-bold text-foreground">{formatCurrency(order.totalNgn)}</dd>
          </div>
        </dl>

        {paid
          ? (
              <Button
                size="lg"
                className="mt-5 w-full sm:w-auto"
                onClick={onContinue}
              >
                Continue to Installation Scheduling
              </Button>
            )
          : (
              <Button
                size="lg"
                className="mt-5 w-full sm:w-auto"
                loading={startPayment.isPending}
                disabled={!orderData.payable || waitingForWebhook}
                onClick={() => void pay()}
              >
                Make Payment
              </Button>
            )}
      </div>

      {waitingForWebhook && !pollTimedOut && (
        <p className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          Confirming your payment with the provider. This usually takes a few seconds.
        </p>
      )}
      {pollTimedOut && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          <span>We're still confirming your payment. We'll email you once it's confirmed. Don't pay again.</span>
          <Button
            variant="outline"
            size="sm"
            loading={verifyPayment.isPending}
            onClick={() => verify({ id: applicationId })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check again
          </Button>
        </div>
      )}
      {payment?.status === "failed" && !paid && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Your last payment attempt failed. You can try again.
        </p>
      )}
      {payment?.status === "mismatch" && !paid && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {`${payment.problem ?? "We received a payment that does not match the amount due."} Reference: ${payment.reference}.`}
        </p>
      )}
      {!orderData.payable && !paid && (
        <p className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          Payment opens once our team has allocated your devices and SIMs. We'll email you when you can pay.
        </p>
      )}
      {payError && <p className="text-sm text-destructive">{payError}</p>}

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
