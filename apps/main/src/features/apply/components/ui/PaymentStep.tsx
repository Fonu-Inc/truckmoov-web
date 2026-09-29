import type { ServerErrorResponse } from "@truckmoov/api/lib/types";

import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingOrderQueryOptions,
  useSendOnboardingBillingEmailVerification,
  useSetOnboardingBillingEmail,
  useStartOnboardingPayment,
  useVerifyOnboardingBillingEmail,
} from "@truckmoov/api/auth";
import {
  AlertCircle,
  CheckCircle2,
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
import { Input } from "@/components/shadcn/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/shadcn/input-otp";
import { Label } from "@/components/shadcn/label";
import { formatCurrency } from "@/lib/currency";

type PaymentStepProps = {
  applicationId: string;
  /** Pre-fills the billing email when none is saved yet. */
  businessEmail: string;
  onContinue: () => void;
  /** Sends the applicant back to Fleet Requirements when the order can't be priced. */
  onEditFleet: () => void;
};

/** The provider redirects back here; confirmation itself arrives by webhook. */
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
    return "Payments are temporarily unavailable. Please try again later — this isn't a problem with your details.";
  if (err.statusCode === 409 && /stage/i.test(err.message))
    return "Payment opens once your devices have been allocated. We'll email you when you can pay.";
  return err.message || "The payment couldn't be started. Try again.";
}

/**
 * Step 4 (TRU-FE-14). Runs on the draft token — no account exists yet. The order is
 * priced by the server from the application's device rows, so nothing here computes or
 * sends a total. Paying redirects to the provider; the result is confirmed by polling
 * the order, because the provider tells the server by webhook, not on the redirect.
 */
export function PaymentStep({
  applicationId,
  businessEmail,
  onContinue,
  onEditFleet,
}: PaymentStepProps) {
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
  ] = useState("");
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
    cooldown,
    setCooldown,
  ] = useState(0);
  const [
    payError,
    setPayError,
  ] = useState<string | null>(null);

  const savedEmail = orderData?.billingEmail ?? null;
  const verified = Boolean(orderData?.billingEmailVerified);
  const emailDirty = email.trim() !== (savedEmail ?? "");

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

  // Fill the address field once the order has loaded.
  useEffect(
    () => {
      if (orderData && !email)
        setEmail(orderData.billingEmail ?? businessEmail);
    },
    // ponytail: seeds once from the first order; later edits are the applicant's.
    // eslint-disable-next-line react/exhaustive-deps
    [orderData],
  );

  useEffect(
    () => {
      if (cooldown <= 0)
        return;
      const timer = setTimeout(
        () => setCooldown(value => value - 1),
        1000,
      );
      return () => clearTimeout(timer);
    },
    [cooldown],
  );

  async function saveEmail() {
    setEmailError(null);
    try {
      await setBillingEmail.mutateAsync({
        id: applicationId,
        data: { billingEmail: email.trim() },
      });
      setCodeSent(false);
      setCode("");
      await send();
    }
    catch (error) {
      setEmailError((error as ServerErrorResponse).message || "The billing email couldn't be saved.");
    }
  }

  async function send() {
    setEmailError(null);
    try {
      const res = await sendCode.mutateAsync({ id: applicationId });
      setCodeSent(true);
      setCooldown(res.data.resendAfterSeconds);
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      if (err.retryAfterSeconds) {
        setCodeSent(true);
        setCooldown(err.retryAfterSeconds);
      }
      setEmailError(err.message || "The code couldn't be sent.");
    }
  }

  // Verify as soon as all six digits are in, like the other verification steps.
  useEffect(
    () => {
      if (code.length !== 6 || verifyCode.isPending)
        return;
      verifyCode.mutate(
        {
          id: applicationId,
          data: { code },
        },
        {
          onSuccess: () => setEmailError(null),
          onError: (error) => {
            setEmailError(error.message || "That code didn't work.");
            setCode("");
          },
        },
      );
    },
    // ponytail: fires when the code reaches six digits, not on mutation identity changes.
    // eslint-disable-next-line react/exhaustive-deps
    [code],
  );

  async function pay() {
    setPayError(null);
    try {
      const res = await startPayment.mutateAsync({
        id: applicationId,
        data: { redirectUrl: `${window.location.origin}/apply?${PAYMENT_RETURN_PARAM}=return` },
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

  const waitingForWebhook = confirming && payment?.status === "pending";
  const pollTimedOut = waitingForWebhook && !orderQuery.isFetching && Date.now() - pollStartedAt >= POLL_LIMIT_MS;

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
            ? <Badge className="rounded-full bg-success/15 text-success hover:bg-success/15">Payment Confirmed</Badge>
            : payment?.status === "failed"
              ? (
                  <Badge
                    variant="destructive"
                    className="rounded-full"
                  >
                    Payment failed
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
            {`Your M2M package is charged per device and includes the Fleet device, platform license and MTN connectivity. Renewal is ${formatCurrency(order.renewalPerDeviceNgn)} per device a year.`}
          </p>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <Line
            label={`M2M package (${order.deviceCount} device${order.deviceCount === 1 ? "" : "s"})`}
            value={formatCurrency(order.devicesNgn)}
          />
          <Line
            label="Installation"
            value={formatCurrency(order.installationNgn)}
          />
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <dt className="text-sm font-semibold text-foreground">Grand Total</dt>
            <dd className="text-lg font-bold text-foreground">{formatCurrency(order.totalNgn)}</dd>
          </div>
        </dl>
      </div>

      {!paid && (
        <div className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground">Billing Email</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Where your invoice and receipt are sent. Confirm it with a code before paying.
              </p>
            </div>
            {verified && !emailDirty && (
              <Badge className="rounded-full bg-success/15 text-success hover:bg-success/15">Verified</Badge>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="billing-email">Billing email address</Label>
              <Input
                id="billing-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </div>
            {(emailDirty || !savedEmail) && (
              <Button
                variant="outline"
                loading={setBillingEmail.isPending || sendCode.isPending}
                disabled={!email.trim()}
                onClick={() => void saveEmail()}
              >
                {savedEmail ? "Save & send code" : "Send code"}
              </Button>
            )}
          </div>
          {emailDirty && savedEmail && verified && (
            <p className="text-xs text-muted-foreground">Changing the address means confirming the new one with a code.</p>
          )}

          {savedEmail && !emailDirty && !verified && (
            <div className="flex flex-col items-center gap-2 pt-2">
              {codeSent
                ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {`Enter the 6-digit code sent to ${savedEmail}.`}
                      </p>
                      <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={setCode}
                        disabled={verifyCode.isPending}
                      >
                        <InputOTPGroup>
                          {[
                            0,
                            1,
                            2,
                          ].map(index => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                            />
                          ))}
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          {[
                            3,
                            4,
                            5,
                          ].map(index => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                      {verifyCode.isPending && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Verifying…
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => void send()}
                        disabled={sendCode.isPending || cooldown > 0}
                        className="text-sm font-medium text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                      >
                        {sendCode.isPending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                      </button>
                    </>
                  )
                : (
                    <Button
                      variant="outline"
                      loading={sendCode.isPending}
                      onClick={() => void send()}
                    >
                      Send verification code
                    </Button>
                  )}
            </div>
          )}

          {emailError && <p className="text-sm text-destructive">{emailError}</p>}
        </div>
      )}

      {waitingForWebhook && !pollTimedOut && (
        <p className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          Confirming your payment with the provider. This usually takes a few seconds.
        </p>
      )}
      {pollTimedOut && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          <span>We haven't received confirmation yet. If you completed the payment, it can take a few minutes.</span>
          <Button
            variant="outline"
            size="sm"
            loading={orderQuery.isFetching}
            onClick={() => void orderQuery.refetch()}
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
      {!orderData.payable && !paid && (
        <p className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          Payment opens once our team has allocated your devices and SIMs. We'll email you when you can pay.
        </p>
      )}
      {payError && <p className="text-sm text-destructive">{payError}</p>}

      <div className="flex justify-end border-t border-border/60 pt-6">
        {paid
          ? (
              <Button
                size="lg"
                onClick={onContinue}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Continue to Installation Scheduling
              </Button>
            )
          : (
              <Button
                size="lg"
                loading={startPayment.isPending}
                disabled={!orderData.payable || !verified || emailDirty || waitingForWebhook}
                onClick={() => void pay()}
              >
                {`Pay ${formatCurrency(order.totalNgn)}`}
              </Button>
            )}
      </div>
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
