"use client";

import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingOrderQueryOptions,
  useSendOnboardingBillingEmailVerification,
  useSetOnboardingBillingEmail,
  useStartOnboardingPayment,
  useVerifyOnboardingBillingEmail,
} from "@truckmoov/api/auth";
import {
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import { OtpInput } from "@/features/get-started/components/OtpInput";
import {
  LoadingBlock,
  Notice,
  Pill,
  SectionHeading,
  Spinner,
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import { useCountdown } from "@/features/get-started/hooks/useCountdown";
import { formatCurrency } from "@/features/get-started/utils/formatCurrency";
import {
  CARD_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
  LINK_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

/** The provider redirects back to the page with `?payment=return`; confirmation itself arrives by webhook. */
export const PAYMENT_RETURN_PARAM = "payment";
const POLL_MS = 5000;
const POLL_LIMIT_MS = 2 * 60 * 1000;
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
 * total. Paying redirects to the provider and back to this page, where the modal reopens
 * (DialogHost) and the result is confirmed by polling the order.
 */
export function PaymentStep({
  applicationId,
  businessEmail,
  onBack,
  onContinue,
  onEditFleet,
}: {
  applicationId: string;
  /** Pre-fills the billing email when none is saved yet. */
  businessEmail: string;
  onBack: () => void;
  onContinue: () => void;
  /** Sends the applicant back to Fleet Requirements when the order can't be priced. */
  onEditFleet: () => void;
}) {
  // Returning from the provider: confirm by polling until the webhook lands.
  const [
    confirming,
    setConfirming,
  ] = useState(() => new URLSearchParams(window.location.search).has(PAYMENT_RETURN_PARAM));
  const [pollStartedAt] = useState(() => Date.now());
  const orderQuery = useQuery({
    ...getOnboardingOrderQueryOptions(applicationId),
    refetchInterval: query => (confirming
      && query.state.data?.data.payment?.status === "pending"
      && Date.now() - pollStartedAt < POLL_LIMIT_MS
      ? POLL_MS
      : false),
  });
  const orderData = orderQuery.data?.data;
  const order = orderData?.order;
  const payment = orderData?.payment ?? null;
  // Paid, or the stage has already moved past payment (the webhook landed).
  const paid = payment?.status === "paid" || STAGES_AFTER_PAYMENT.includes(orderData?.stage ?? "");

  const setBillingEmail = useSetOnboardingBillingEmail();
  const sendCode = useSendOnboardingBillingEmailVerification();
  const verifyCode = useVerifyOnboardingBillingEmail();
  const startPayment = useStartOnboardingPayment();

  const [
    email,
    setEmail,
  ] = useState<string | null>(null);
  const [
    emailError,
    setEmailError,
  ] = useState<string | null>(null);
  const [
    code,
    setCode,
  ] = useState("");
  const [
    codeSent,
    setCodeSent,
  ] = useState(false);
  const [
    cooldownSeed,
    setCooldownSeed,
  ] = useState(0);
  const [cooldown] = useCountdown(cooldownSeed);
  const [
    payError,
    setPayError,
  ] = useState<string | null>(null);

  const savedEmail = orderData?.billingEmail ?? null;
  // Until the applicant edits it, the field shows the saved address (or the business email).
  const emailValue = email ?? savedEmail ?? businessEmail;
  const verified = Boolean(orderData?.billingEmailVerified);
  const emailDirty = emailValue.trim() !== (savedEmail ?? "");

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

  async function send() {
    setEmailError(null);
    try {
      const res = await sendCode.mutateAsync({ id: applicationId });
      setCodeSent(true);
      setCooldownSeed(res.data.resendAfterSeconds);
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      if (err.retryAfterSeconds) {
        setCodeSent(true);
        setCooldownSeed(err.retryAfterSeconds);
      }
      setEmailError(err.message || "The code couldn't be sent.");
    }
  }

  async function saveEmail() {
    setEmailError(null);
    try {
      await setBillingEmail.mutateAsync({
        id: applicationId,
        data: { billingEmail: emailValue.trim() },
      });
      setEmail(null);
      setCodeSent(false);
      setCode("");
      await send();
    }
    catch (error) {
      setEmailError((error as ServerErrorResponse).message || "The billing email couldn't be saved.");
    }
  }

  const verify = useEffectEvent((value: string) => {
    if (verifyCode.isPending)
      return;
    verifyCode.mutate(
      {
        id: applicationId,
        data: { code: value },
      },
      {
        onSuccess: () => setEmailError(null),
        onError: (error) => {
          setEmailError(error.message || "That code didn't work.");
          setCode("");
        },
      },
    );
  });

  // Verify as soon as all six digits are in, like the other verification steps.
  useEffect(
    () => {
      if (code.length === 6)
        verify(code);
    },
    [code],
  );

  async function pay() {
    setPayError(null);
    try {
      const res = await startPayment.mutateAsync({
        id: applicationId,
        data: { redirectUrl: `${window.location.origin}${window.location.pathname}?${PAYMENT_RETURN_PARAM}=return` },
      });
      if (res.data.authorizationUrl) {
        window.location.assign(res.data.authorizationUrl);
        return;
      }
      // No hosted page to visit: wait for the webhook here instead.
      setConfirming(true);
      void orderQuery.refetch();
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

  const waitingForWebhook = confirming && payment?.status === "pending";
  const pollTimedOut = waitingForWebhook && !orderQuery.isFetching && Date.now() - pollStartedAt >= POLL_LIMIT_MS;
  const plural = order.deviceCount === 1 ? "" : "s";

  return (
    <StepLayout
      footer={paid
        ? (
            <DialogFooter
              onBack={onBack}
              continueLabel="Schedule Installation"
              onContinue={onContinue}
            />
          )
        : (
            <DialogFooter
              onBack={onBack}
              continueLabel={`Pay ${formatCurrency(order.totalNgn)}`}
              continueLoading={startPayment.isPending}
              continueDisabled={!orderData.payable || !verified || emailDirty || waitingForWebhook}
              onContinue={() => void pay()}
            />
          )}
    >
      <StepHeading
        title="Payment"
        description="Pay For Your M2M Package. You Will Schedule Your Installation In The Next Step."
      />

      <div className="mt-[30px] space-y-4">
        <section className={CARD_CLASS}>
          <SectionHeading
            title="Order Summary"
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
              {`Your M2M package is charged per device and includes the Fleet device, platform license and MTN connectivity. Renewal is ${formatCurrency(order.renewalPerDeviceNgn)} per device a year.`}
            </p>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <Line
              label={`M2M package (${order.deviceCount} device${plural})`}
              value={formatCurrency(order.devicesNgn)}
            />
            <Line
              label="Installation"
              value={formatCurrency(order.installationNgn)}
            />
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="font-semibold text-heading">Grand Total</dt>
              <dd className="text-lg font-bold text-heading">{formatCurrency(order.totalNgn)}</dd>
            </div>
          </dl>
        </section>

        {!paid && (
          <section className={CARD_CLASS}>
            <SectionHeading
              title="Billing Email"
              description="Where your invoice and receipt are sent. Confirm it with a code before paying."
              action={verified && !emailDirty ? <Pill tone="success">Verified</Pill> : undefined}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1 space-y-1.5">
                <span className={LABEL_CLASS}>Billing email address</span>
                <input
                  type="email"
                  value={emailValue}
                  className={FIELD_CLASS}
                  onChange={event => setEmail(event.target.value)}
                />
              </label>
              {(emailDirty || !savedEmail) && (
                <button
                  type="button"
                  className={cn(
                    SECONDARY_BUTTON_CLASS,
                    "h-12 rounded-[15px] px-5",
                  )}
                  disabled={!emailValue.trim() || setBillingEmail.isPending || sendCode.isPending}
                  onClick={() => void saveEmail()}
                >
                  {setBillingEmail.isPending || sendCode.isPending
                    ? "Sending…"
                    : savedEmail ? "Save & send code" : "Send code"}
                </button>
              )}
            </div>
            {emailDirty && savedEmail && verified && (
              <p className="mt-2 text-xs text-muted-foreground">Changing the address means confirming the new one with a code.</p>
            )}

            {savedEmail && !emailDirty && !verified && (
              <div className="mt-5 flex flex-col items-start gap-3">
                {codeSent
                  ? (
                      <>
                        <p className="text-sm text-heading">{`Enter the 6-digit code sent to ${savedEmail}.`}</p>
                        <OtpInput
                          value={code}
                          onChange={setCode}
                          disabled={verifyCode.isPending}
                        />
                        {verifyCode.isPending && (
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Spinner className="size-3.5 border-2" />
                            Verifying…
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => void send()}
                          disabled={sendCode.isPending || cooldown > 0}
                          className={cn(
                            LINK_CLASS,
                            "text-sm",
                          )}
                        >
                          {sendCode.isPending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                        </button>
                      </>
                    )
                  : (
                      <button
                        type="button"
                        className={SECONDARY_BUTTON_CLASS}
                        disabled={sendCode.isPending}
                        onClick={() => void send()}
                      >
                        {sendCode.isPending ? "Sending…" : "Send verification code"}
                      </button>
                    )}
              </div>
            )}
            {emailError && <Notice className="mt-4">{emailError}</Notice>}
          </section>
        )}

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
              <span>We haven't received confirmation yet. If you completed the payment, it can take a few minutes.</span>
              <button
                type="button"
                className={SECONDARY_BUTTON_CLASS}
                disabled={orderQuery.isFetching}
                onClick={() => void orderQuery.refetch()}
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
