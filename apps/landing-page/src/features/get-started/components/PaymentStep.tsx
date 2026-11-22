"use client";

import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingOrderQueryOptions,
  useStartOnboardingPayment,
  useVerifyOnboardingPayment,
} from "@truckmoov/api/auth";
import {
  useEffect,
  useState,
} from "react";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import {
  LoadingBlock,
  Notice,
  Pill,
  SectionHeading,
  Spinner,
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import { formatCurrency } from "@/features/get-started/utils/formatCurrency";
import {
  CARD_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

/** The provider redirects back to the page with `?payment=return`; confirmation itself arrives by webhook. */
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
 * Payment for the M2M package (main app: PaymentStep). Runs on the draft token; no account
 * exists yet. The server prices the order from the device rows, so nothing here computes a
 * total. In demo mode the server settles the payment immediately; with a real provider the
 * browser redirects and the modal reopens to confirm by polling the order. As in the
 * design, the pay / continue button sits in the quotation card and there is no footer.
 */
export function PaymentStep({
  applicationId,
  onBack,
  onContinue,
  onEditFleet,
}: {
  applicationId: string;
  onBack: () => void;
  onContinue: () => void;
  /** Sends the applicant back to Fleet Requirements when the order can't be priced. */
  onEditFleet: () => void;
}) {
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
        data: { redirectUrl: `${window.location.origin}${window.location.pathname}?${PAYMENT_RETURN_PARAM}=return` },
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
      setWindowEnded(false);
      setPollStartedAt(startedAt);
    }
    catch (error) {
      setPayError(paymentError(error));
      if ((error as ServerErrorResponse).statusCode === 409)
        void orderQuery.refetch();
    }
  }

  if (orderQuery.isLoading)
    return <StepLayout><LoadingBlock /></StepLayout>;

  if (orderQuery.isError || !orderData || !order) {
    const message = (orderQuery.error as ServerErrorResponse | null)?.message;
    const fleetProblem = message ? /device|plan/i.test(message) : false;
    return (
      <StepLayout
        footer={(
          <DialogFooter
            onBack={onBack}
            continueLabel={fleetProblem ? "Review your fleet" : "Try again"}
            onContinue={() => (fleetProblem ? onEditFleet() : void orderQuery.refetch())}
          />
        )}
      >
        <Notice className="mt-[38px]">{message ?? "Your order couldn't be loaded."}</Notice>
      </StepLayout>
    );
  }

  const waitingForWebhook = confirming && pending;
  const pollTimedOut = waitingForWebhook && windowEnded;
  const plural = order.deviceCount === 1 ? "" : "s";

  return (
    <StepLayout>
      <StepHeading
        title="Payment"
        description="Your Application Passed System Verification. Pay Your Quotation, Then Schedule Installation. Your Subscription Becomes Active Only After Installation And Final System Verification."
      />

      <div className="mt-[30px] space-y-4">
        <section className={CARD_CLASS}>
          <SectionHeading
            title="Quotation"
            action={paid
              ? <Pill tone="success">Payment Confirmed</Pill>
              : payment?.status === "failed" || payment?.status === "mismatch"
                ? <Pill tone="danger">{payment.status === "mismatch" ? "Payment needs attention" : "Payment failed"}</Pill>
                : <Pill tone="warning">Awaiting payment</Pill>}
          />
          <div className="rounded-[15px] bg-surface p-4">
            <p className="text-xs text-muted-foreground">Selected M2M License Plan</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
              <span className="text-lg font-semibold text-heading">{order.planName}</span>
              <span className="text-sm text-muted-foreground">
                {`${order.deviceCount} Device${plural} × ${formatCurrency(order.perDeviceNgn)}`}
              </span>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-px size-4 shrink-0 text-brand-deep" />
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
            {/* No delivery fee is priced today (the admin Delivery Price is hidden), so this stays hidden. */}
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
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="font-semibold text-heading">Grand Total</dt>
              <dd className="text-lg font-bold text-heading">{formatCurrency(order.totalNgn)}</dd>
            </div>
          </dl>

          {paid
            ? (
                <button
                  type="button"
                  className={cn(
                    PRIMARY_BUTTON_CLASS,
                    "mt-5 w-full sm:w-auto",
                  )}
                  onClick={onContinue}
                >
                  Continue to Installation Scheduling
                </button>
              )
            : (
                <button
                  type="button"
                  className={cn(
                    PRIMARY_BUTTON_CLASS,
                    "mt-5 w-full sm:w-auto",
                  )}
                  disabled={startPayment.isPending || !orderData.payable || waitingForWebhook}
                  onClick={() => void pay()}
                >
                  {startPayment.isPending ? "Please wait…" : "Make Payment"}
                </button>
              )}
        </section>

        {waitingForWebhook && !pollTimedOut && (
          <Notice tone="info">
            <span className="flex items-center gap-2">
              <Spinner className="size-4 shrink-0 border-2" />
              Confirming your payment with the provider. This usually takes a few seconds.
            </span>
          </Notice>
        )}
        {pollTimedOut && (
          <Notice tone="info">
            <span className="flex flex-wrap items-center justify-between gap-3">
              <span>We're still confirming your payment. We'll email you once it's confirmed — don't pay again.</span>
              <button
                type="button"
                className={SECONDARY_BUTTON_CLASS}
                disabled={verifyPayment.isPending}
                onClick={() => verify({ id: applicationId })}
              >
                Check again
              </button>
            </span>
          </Notice>
        )}
        {payment?.status === "failed" && !paid && <Notice>Your last payment attempt failed. You can try again.</Notice>}
        {payment?.status === "mismatch" && !paid && (
          <Notice>{`${payment.problem ?? "We received a payment that does not match the amount due."} Reference: ${payment.reference}.`}</Notice>
        )}
        {!orderData.payable && !paid && (
          <Notice tone="info">Payment opens once our team has allocated your devices and SIMs. We'll email you when you can pay.</Notice>
        )}
        {payError && <Notice>{payError}</Notice>}
      </div>
    </StepLayout>
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
      <dd className="font-medium text-heading">{value}</dd>
    </div>
  );
}
