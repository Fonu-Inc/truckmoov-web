import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { ReactNode } from "react";
import type { ReviewFlag } from "@/features/apply/components/ui/ActionRequiredScreen";
import type { BusinessDetailsValues } from "@/features/apply/utils/applySchemas";
import type { ApplicantCustomerType } from "@/features/apply/utils/applyTypes";

import { zodResolver } from "@hookform/resolvers/zod";
import mtnLogoDark from "@truckmoov/reusables/assets/mtn-logo-dark.svg";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Truck,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/shadcn/button";
import { BusinessDetailsStep } from "@/features/apply/components/forms/BusinessDetailsStep";
import { ScheduleInstallationStep } from "@/features/apply/components/forms/ScheduleInstallationStep";
import {
  ActionRequiredScreen,
  ReviewFlagBanner,
} from "@/features/apply/components/ui/ActionRequiredScreen";
import { ApplicationStatusScreen } from "@/features/apply/components/ui/ApplicationStatusScreen";
import {
  ApplyStepRailHorizontal,
  ApplyStepRailVertical,
} from "@/features/apply/components/ui/ApplyStepRail";
import { CustomerTypeStep } from "@/features/apply/components/ui/CustomerTypeStep";
import { DocumentsStep } from "@/features/apply/components/ui/DocumentsStep";
import { FleetRequirementsStep } from "@/features/apply/components/ui/FleetRequirementsStep";
import { PaymentStep } from "@/features/apply/components/ui/PaymentStep";
import { ReviewStep } from "@/features/apply/components/ui/ReviewStep";
import { VerificationStep } from "@/features/apply/components/ui/VerificationStep";
import {
  applicationToDetails,
  readStoredCustomerType,
  SERVER_FIELD_TO_FORM_FIELD,
  useApplyApplication,
  writeStoredCustomerType,
} from "@/features/apply/hooks/useApplyApplication";
import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import {
  businessDetailsSchemaFor,
  EMPTY_BUSINESS_DETAILS,
} from "@/features/apply/utils/applySchemas";
import {
  APPLY_STEPS,
  displayStep,
  documentsForCustomerType,
  isUploadable,
} from "@/features/apply/utils/applyTypes";

/**
 * Internal step numbers, matching the design app:
 *   1 customer details · 2 email OTP · 3 phone OTP · 4 fleet · 5 documents
 *   6 payment · 7 installation · 8 review
 * `displayStep` folds these into the five visible steps.
 */
type Phase = "form" | "status" | "payment";

export default function ApplyForAccount() {
  const navigate = useNavigate();

  const [
    customerType,
    setCustomerType,
  ] = useState<ApplicantCustomerType | null>(
    () => readStoredCustomerType(),
  );
  const [
    step,
    setStep,
  ] = useState(1);
  const [
    phase,
    setPhase,
  ] = useState<Phase>("form");
  const [
    submitted,
    setSubmitted,
  ] = useState(false);
  const [
    banner,
    setBanner,
  ] = useState<string | null>(null);
  const [
    emailCooldown,
    setEmailCooldown,
  ] = useState(0);
  const [
    phoneCooldown,
    setPhoneCooldown,
  ] = useState(0);
  const [
    showReviewGate,
    setShowReviewGate,
  ] = useState(false);
  const [
    resolvedIds,
    setResolvedIds,
  ] = useState<string[]>([]);
  const rehydratedRef = useRef(false);

  const resetDraft = useApplyDraftStore(state => state.reset);
  const scheduled = useApplyDraftStore(state => state.scheduled);

  const {
    application,
    applicationId,
    status,
    saveDetails,
    uploadDocument,
    removeDocument,
    sendCode,
    verifyCode,
    submit,
    clear,
    isSavingDetails,
    isSubmitting,
    isSendingEmail,
    isSendingPhone,
  } = useApplyApplication(submitted);

  const form = useForm<BusinessDetailsValues>({
    resolver: zodResolver(businessDetailsSchemaFor(customerType ?? "enterprise")),
    mode: "onTouched",
    defaultValues: EMPTY_BUSINESS_DETAILS,
  });

  const requiredDocuments = customerType ? documentsForCustomerType(customerType) : [];

  // Server-required types our own list does not name, so the applicant is never
  // blocked by a requirement they were never shown.
  const localServerTypes = new Set(
    requiredDocuments.filter(document => isUploadable(document.type)).map(document => document.type),
  );
  const extraMissing = (application?.missingDocuments ?? []).filter(
    type => !localServerTypes.has(type),
  );

  const applicationStatus = status?.applicationStatus ?? application?.applicationStatus;
  const decisionReason = status?.decisionReason;

  /**
   * ponytail: the server returns one `decisionReason`, not a per-area flag list,
   * so changes-requested collapses to a single flag pointing at the documents
   * step. Replace this with the served list once it exists.
   */
  const reviewFlags = useMemo<ReviewFlag[]>(
    () => {
      if (applicationStatus !== "changes_requested")
        return [];
      return [
        {
          id: "decision",
          step: 5,
          area: "Application details",
          message: decisionReason
            ?? "Our onboarding team needs more information before your application can be approved.",
        },
      ];
    },
    [
      applicationStatus,
      decisionReason,
    ],
  );

  const openFlags = reviewFlags.filter(flag => !resolvedIds.includes(flag.id));
  const resolvedFlags = reviewFlags.filter(flag => resolvedIds.includes(flag.id));
  const inReview = reviewFlags.length > 0;

  function isFlaggedStep(target: number) {
    return openFlags.some(flag => flag.step === target);
  }

  /** Mark this step's flags corrected and return to the review summary. */
  function markStepDone(target: number) {
    const ids = reviewFlags.filter(flag => flag.step === target).map(flag => flag.id);
    if (ids.length === 0)
      return false;
    setResolvedIds(previous => Array.from(new Set([
      ...previous,
      ...ids,
    ])));
    setShowReviewGate(true);
    return true;
  }

  // Rehydrate once from the server when a stored application is still valid.
  useEffect(
    () => {
      if (rehydratedRef.current || !application || !customerType)
        return;
      rehydratedRef.current = true;

      form.reset(applicationToDetails(
        application,
        customerType,
      ));

      if (application.applicationStatus === "changes_requested") {
        setSubmitted(true);
        setShowReviewGate(true);
        return;
      }

      if (application.applicationStatus !== "draft") {
        setSubmitted(true);
        setPhase("status");
        return;
      }

      // Land on the earliest unfinished step.
      if (application.missingDocuments.length > 0)
        setStep(5);
      else if (!application.emailVerified)
        setStep(2);
      else if (!application.phoneVerified)
        setStep(3);
      else
        setStep(8);
    },
    [
      application,
      customerType,
      form,
    ],
  );

  useEffect(
    () => {
      if (emailCooldown <= 0)
        return;
      const id = window.setTimeout(
        () => setEmailCooldown(value => value - 1),
        1000,
      );
      return () => window.clearTimeout(id);
    },
    [emailCooldown],
  );

  useEffect(
    () => {
      if (phoneCooldown <= 0)
        return;
      const id = window.setTimeout(
        () => setPhoneCooldown(value => value - 1),
        1000,
      );
      return () => window.clearTimeout(id);
    },
    [phoneCooldown],
  );

  const handleSend = useCallback(
    async (channel: "email" | "phone") => {
      setBanner(null);
      try {
        const data = await sendCode(channel);
        const cooldown = Math.min(
          data.expiresInSeconds,
          60,
        );
        if (channel === "email")
          setEmailCooldown(cooldown);
        else
          setPhoneCooldown(cooldown);
        toast.success(
          channel === "email"
            ? `Verification code sent to ${data.maskedDestination}`
            : `Verification code sent by SMS to ${data.maskedDestination}`,
        );
      }
      catch (error) {
        const serverError = error as ServerErrorResponse;
        setBanner(serverError.message);
        if (serverError.retryAfterSeconds) {
          if (channel === "email")
            setEmailCooldown(serverError.retryAfterSeconds);
          else
            setPhoneCooldown(serverError.retryAfterSeconds);
        }
      }
    },
    [sendCode],
  );

  // Send the first code automatically when a verification step opens.
  useEffect(
    () => {
      if (!applicationId || phase !== "form")
        return;
      if (step === 2 && !application?.emailVerified && emailCooldown === 0 && !isSendingEmail)
        void handleSend("email");
      if (step === 3 && !application?.phoneVerified && phoneCooldown === 0 && !isSendingPhone)
        void handleSend("phone");
    },
    // ponytail: fires on entering the step, not on every cooldown tick.
    // eslint-disable-next-line react/exhaustive-deps
    [
      step,
      applicationId,
      phase,
    ],
  );

  async function handleDetailsSubmit(values: BusinessDetailsValues) {
    if (!customerType)
      return;
    setBanner(null);
    try {
      await saveDetails(
        values,
        customerType,
      );
      if (markStepDone(1))
        return;
      setStep(2);
    }
    catch (error) {
      const serverError = error as ServerErrorResponse;
      setBanner(serverError.message);
      const field = serverError.field
        ? SERVER_FIELD_TO_FORM_FIELD[serverError.field]
        : undefined;
      if (field) {
        form.setError(
          field,
          { message: serverError.message },
        );
      }
    }
  }

  async function handleVerify(channel: "email" | "phone", code: string) {
    setBanner(null);
    try {
      await verifyCode(
        channel,
        code,
      );
      toast.success(channel === "email" ? "Email address verified" : "Phone number verified");
      return true;
    }
    catch (error) {
      setBanner((error as ServerErrorResponse).message);
      toast.error("That code is not correct. Please try again.");
      return false;
    }
  }

  async function handleSubmitApplication() {
    setBanner(null);
    try {
      const result = await submit();
      if ("incomplete" in result && result.incomplete) {
        setBanner(result.message);
        if (result.missingDocuments.length > 0)
          setStep(5);
        else if (!result.emailVerified)
          setStep(2);
        else if (!result.phoneVerified)
          setStep(3);
        return;
      }
      setSubmitted(true);
      setShowReviewGate(false);
      setPhase("status");
    }
    catch (error) {
      setBanner((error as ServerErrorResponse).message);
    }
  }

  function handleBack() {
    setBanner(null);
    if (inReview) {
      setShowReviewGate(true);
      return;
    }
    if (!customerType) {
      navigate("/auth");
      return;
    }
    if (step === 1) {
      setCustomerType(null);
      writeStoredCustomerType(null);
      return;
    }
    if (step === 8) {
      setStep(5);
      return;
    }
    setStep(step - 1);
  }

  /** Visible step (1..5); under review the payment step is highlighted. */
  const visibleStep = scheduled
    ? APPLY_STEPS.length + 1
    : phase === "status"
      ? 4
      : displayStep(step);

  // ─── Review gate ────────────────────────────────────────────────────────────
  if (showReviewGate && inReview) {
    return (
      <ApplyShell
        customerType={customerType}
        visibleStep={visibleStep}
      >
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2 text-muted-foreground"
          onClick={() => navigate("/auth")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <ActionRequiredScreen
          openFlags={openFlags}
          resolvedFlags={resolvedFlags}
          submitting={isSubmitting}
          stepLabel={id => APPLY_STEPS.find(entry => entry.id === id)?.label ?? `Step ${id}`}
          onResubmit={handleSubmitApplication}
          onGoToStep={(id) => {
            setStep(id);
            setShowReviewGate(false);
          }}
        />
      </ApplyShell>
    );
  }

  // ─── Submitted, and the journey is finished ─────────────────────────────────
  if (submitted && scheduled) {
    return (
      <ApplyShell
        customerType={customerType}
        visibleStep={visibleStep}
        complete
      >
        <SuccessScreen
          onHome={() => {
            clear();
            resetDraft();
            navigate("/auth");
          }}
        />
      </ApplyShell>
    );
  }

  return (
    <ApplyShell
      customerType={customerType}
      visibleStep={visibleStep}
    >
      {phase === "form" && (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-6 text-muted-foreground"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}

      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {inReview ? "Update Your Application" : "Application for Account Creation"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {inReview
          ? "Correct the flagged information and resubmit for review."
          : "Complete the steps below to submit your application for a Fleet Pro account."}
      </p>

      {customerType && <ApplyStepRailHorizontal current={visibleStep} />}

      <div className="mt-8 rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm sm:p-8">
        <ReviewFlagBanner flags={openFlags.filter(flag => flag.step === step)} />

        {banner && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{banner}</span>
          </div>
        )}

        {phase === "status" && (
          <ApplicationStatusScreen
            status={applicationStatus}
            decisionReason={decisionReason}
            onContinue={() => {
              setPhase("payment");
              setStep(6);
            }}
          />
        )}

        {phase === "payment" && step === 6 && (
          <PaymentStep onContinue={() => setStep(7)} />
        )}

        {phase === "payment" && step === 7 && (
          <ScheduleInstallationStep
            defaults={{
              streetAddress: form.getValues("streetAddress"),
              city: form.getValues("city"),
              state: form.getValues("state"),
              contactName: form.getValues("contactName") || undefined,
              contactPhone: form.getValues("phoneNumber"),
            }}
            onBack={() => setStep(6)}
            onFinish={() => {
              clear();
              resetDraft();
              navigate("/auth");
            }}
          />
        )}

        {phase === "form" && !customerType && (
          <CustomerTypeStep
            value={customerType}
            onChange={(value) => {
              setCustomerType(value);
              writeStoredCustomerType(value);
            }}
            onNext={() => setStep(1)}
          />
        )}

        {phase === "form" && customerType && step === 1 && (
          <>
            <BusinessDetailsStep
              form={form}
              customerType={customerType}
              submitting={isSavingDetails}
              nextLabel={isFlaggedStep(1) ? "Done" : undefined}
              onSubmit={handleDetailsSubmit}
            />
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  toast.success(
                    "Your progress has been saved on this device. Come back to /apply to continue.",
                  );
                  navigate("/auth");
                }}
              >
                Save & Continue Later
              </Button>
            </div>
          </>
        )}

        {phase === "form" && step === 2 && (
          <VerificationStep
            channel="email"
            destination={form.getValues("businessEmail")}
            verified={Boolean(application?.emailVerified)}
            sending={isSendingEmail}
            cooldown={emailCooldown}
            onSend={() => void handleSend("email")}
            onVerify={code => handleVerify(
              "email",
              code,
            )}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {phase === "form" && step === 3 && (
          <VerificationStep
            channel="phone"
            destination={form.getValues("phoneNumber")}
            verified={Boolean(application?.phoneVerified)}
            sending={isSendingPhone}
            cooldown={phoneCooldown}
            onSend={() => void handleSend("phone")}
            onVerify={code => handleVerify(
              "phone",
              code,
            )}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {phase === "form" && step === 4 && (
          <FleetRequirementsStep
            nextLabel={isFlaggedStep(4) ? "Done" : undefined}
            onBack={() => (inReview ? setShowReviewGate(true) : setStep(3))}
            onNext={() => {
              if (markStepDone(4))
                return;
              setStep(5);
            }}
          />
        )}

        {phase === "form" && customerType && step === 5 && (
          <DocumentsStep
            required={requiredDocuments}
            application={application}
            extraMissing={extraMissing}
            nextLabel={isFlaggedStep(5) ? "Done" : "Next"}
            onUpload={uploadDocument}
            onRemove={removeDocument}
            onBack={() => (inReview ? setShowReviewGate(true) : setStep(4))}
            onNext={() => {
              if (markStepDone(5))
                return;
              setStep(8);
            }}
          />
        )}

        {phase === "form" && customerType && step === 8 && (
          <ReviewStep
            customerType={customerType}
            details={form.getValues()}
            application={application}
            requiredDocuments={requiredDocuments}
            submitting={isSubmitting}
            onBack={() => setStep(5)}
            onEditDetails={() => setStep(1)}
            onEditFleet={() => setStep(4)}
            onEditDocuments={() => setStep(5)}
            onSubmit={handleSubmitApplication}
          />
        )}
      </div>
    </ApplyShell>
  );
}

/**
 * The split shell: a fixed dark branding panel carrying the step rail, and a
 * scrolling content column. The panel is scoped `.dark` so it stays dark in both
 * themes, matching AuthBrandingPanel.
 */
function ApplyShell({
  customerType,
  visibleStep,
  complete,
  children,
}: {
  customerType: ApplicantCustomerType | null;
  visibleStep: number;
  complete?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="dark relative hidden h-full w-[38%] shrink-0 flex-col justify-between overflow-hidden bg-sidebar p-12 pb-16 lg:flex">
        <div className="absolute inset-0 text-sidebar-foreground opacity-[0.03]">
          <svg
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="apply-grid"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 60 0 L 0 0 0 60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#apply-grid)"
            />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="mb-10 inline-flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary shadow-mtn">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-sidebar-foreground">FleetPro</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                  Enterprise Fleet Platform
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                Powered by
              </span>
              <img
                src={mtnLogoDark}
                alt="MTN"
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
          </div>

          <h1 className="mb-4 text-3xl font-bold leading-tight text-sidebar-foreground">
            Apply for a Fleet Pro account
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-sidebar-foreground/70">
            A structured business application. Tell us about your organization, your fleet
            requirements and upload your compliance documents.
          </p>
        </div>

        {customerType && (
          <ApplyStepRailVertical
            current={visibleStep}
            complete={complete}
          />
        )}

        <div
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
      </aside>

      <main className="h-full flex-1 overflow-y-auto bg-gradient-auth">
        <div className="mx-auto w-full max-w-3xl px-6 py-10 pb-16 sm:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}

function SuccessScreen({ onHome }: { onHome: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="h-10 w-10 text-success" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Application Submitted Successfully
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
        Thank you for applying for a Fleet Pro account. Your application has been successfully
        received and will be reviewed by our team.
      </p>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
        If your application is approved, you will receive an email with instructions and a setup
        link to access the Fleet Pro platform. If your application is not approved, you may review
        the requirements and submit a new application.
      </p>
      <Button
        size="lg"
        className="mt-8"
        onClick={onHome}
      >
        Return to Home
      </Button>
    </div>
  );
}
