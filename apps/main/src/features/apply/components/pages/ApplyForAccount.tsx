import type { ReactNode } from "react";
import type { BusinessDetailsValues } from "@/features/apply/utils/applySchemas";
import type { ApplicantCustomerType } from "@/features/apply/utils/applyTypes";

import { zodResolver } from "@hookform/resolvers/zod";
import mtnLogoDark from "@truckmoov/reusables/assets/mtn-logo-dark.svg";
import {
  ArrowLeft,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/shadcn/button";
import { BusinessDetailsStep } from "@/features/apply/components/forms/BusinessDetailsStep";
import { ScheduleInstallationStep } from "@/features/apply/components/forms/ScheduleInstallationStep";
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
import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import {
  businessDetailsSchemaFor,
  EMPTY_BUSINESS_DETAILS,
} from "@/features/apply/utils/applySchemas";
import {
  APPLY_STEPS,
  displayStep,
  documentsForCustomerType,
  readStoredCustomerType,
  writeStoredCustomerType,
} from "@/features/apply/utils/applyTypes";

/**
 * Internal step numbers, matching the design app:
 *   1 customer details · 2 email OTP · 3 phone OTP · 4 fleet · 5 documents
 *   6 payment · 7 installation · 8 review
 * `displayStep` folds these into the five visible steps.
 *
 * ponytail: the onboarding endpoints this flow was built against are not
 * available yet, so nothing here talks to a server — every step advances on
 * local state and the OTP screens accept any six digits. Restore
 * `useApplyApplication` (see git history) and re-gate the transitions on their
 * responses once the endpoints land.
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
    emailVerified,
    setEmailVerified,
  ] = useState(false);
  const [
    phoneVerified,
    setPhoneVerified,
  ] = useState(false);

  const resetDraft = useApplyDraftStore(state => state.reset);
  const scheduled = useApplyDraftStore(state => state.scheduled);

  const form = useForm<BusinessDetailsValues>({
    resolver: zodResolver(businessDetailsSchemaFor(customerType ?? "enterprise")),
    mode: "onTouched",
    defaultValues: EMPTY_BUSINESS_DETAILS,
  });

  const requiredDocuments = customerType ? documentsForCustomerType(customerType) : [];

  function handleDetailsSubmit() {
    setStep(2);
  }

  /** No verification endpoint yet, so any six-digit code is accepted. */
  function handleVerify(channel: "email" | "phone") {
    if (channel === "email")
      setEmailVerified(true);
    else
      setPhoneVerified(true);
    toast.success(channel === "email" ? "Email address verified" : "Phone number verified");
    return Promise.resolve(true);
  }

  function handleSubmitApplication() {
    setSubmitted(true);
    setPhase("status");
  }

  function handleBack() {
    if (!customerType) {
      navigate("/auth");
      return;
    }
    if (phase === "payment") {
      if (step === 7) {
        setStep(6);
        return;
      }
      // Step 6 is entered from the status screen, so that is where back goes.
      setPhase("status");
      return;
    }
    if (phase === "status") {
      setPhase("form");
      setSubmitted(false);
      setStep(8);
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

  /** Visible step (1..5); after submission the payment step is highlighted. */
  const visibleStep = scheduled
    ? APPLY_STEPS.length + 1
    : phase === "status"
      ? 4
      : displayStep(step);

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
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-6 text-muted-foreground"
        onClick={handleBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Application for Account Creation
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Complete the steps below to submit your application for a Fleet Pro account.
      </p>

      {customerType && <ApplyStepRailHorizontal current={visibleStep} />}

      <div className="mt-8 rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm sm:p-8">
        {phase === "status" && (
          <ApplicationStatusScreen
            status="approved"
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
              submitting={false}
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
            verified={emailVerified}
            sending={false}
            cooldown={0}
            onSend={() => toast.success("Enter any six digits to continue.")}
            onVerify={() => handleVerify("email")}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {phase === "form" && step === 3 && (
          <VerificationStep
            channel="phone"
            destination={form.getValues("phoneNumber")}
            verified={phoneVerified}
            sending={false}
            cooldown={0}
            onSend={() => toast.success("Enter any six digits to continue.")}
            onVerify={() => handleVerify("phone")}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {phase === "form" && step === 4 && (
          <FleetRequirementsStep
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}

        {phase === "form" && customerType && step === 5 && (
          <DocumentsStep
            required={requiredDocuments}
            onBack={() => setStep(4)}
            onNext={() => setStep(8)}
          />
        )}

        {phase === "form" && customerType && step === 8 && (
          <ReviewStep
            customerType={customerType}
            details={form.getValues()}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            requiredDocuments={requiredDocuments}
            submitting={false}
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
