import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { ReactNode } from "react";
import type { BusinessDetailsValues } from "@/features/apply/utils/applySchemas";
import type { ApplicantCustomerType } from "@/features/apply/utils/applyTypes";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  AUTH_QUERY_KEY,
  useCreateOnboardingApplication,
  useDeleteOnboardingApplicationDocument,
  useResumeOnboardingApplication,
  useSendOnboardingApplicationEmailVerification,
  useSendOnboardingApplicationPhoneVerification,
  useSignOnboardingIndemnity,
  useSubmitOnboardingApplication,
  useUpdateOnboardingApplication,
  useVerifyOnboardingApplicationEmail,
  useVerifyOnboardingApplicationPhone,
} from "@truckmoov/api/auth";
import mtnLogoDark from "@truckmoov/reusables/assets/mtn-logo-dark.svg";
import {
  ArrowLeft,
  Loader2,
  Truck,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/ThemeToggle";
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
import {
  documentsComplete,
  isIndemnitySigned,
  useApplySession,
} from "@/features/apply/hooks/useApplySession";
import { useConfirmDialog } from "@/features/apply/hooks/useConfirmDialog";
import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import {
  applicationToDetails,
  businessDetailsSchemaFor,
  describeClaims,
  detailsToPayload,
  EMPTY_BUSINESS_DETAILS,
  SERVER_FIELD_TO_FORM_FIELD,
} from "@/features/apply/utils/applySchemas";
import {
  displayStep,
  documentsForCustomerType,
  fromApplicantType,
  readStoredCustomerType,
  writeStoredCustomerType,
} from "@/features/apply/utils/applyTypes";

/**
 * Internal step numbers, matching the design app:
 *   1 customer details · 2 email OTP · 3 phone OTP · 4 fleet · 5 documents
 *   6 payment · 7 installation · 8 review
 * `displayStep` folds these into the five visible steps.
 *
 * Steps 1–5 and 8 run against the onboarding-applications API (TRU-FE-11/12/13): the
 * application is created when the details are first saved, and every later step reads
 * and writes it through `useApplySession`.
 *
 * ponytail: payment (6) and installation (7) are still local (TRU-FE-14/15) — they
 * read the store's mirror of the fleet and don't touch the server yet.
 */
type Phase = "form" | "status" | "payment";

/** Seconds, from the send-code response or a 429's retryAfterSeconds. */
function useCooldown() {
  const [
    seconds,
    setSeconds,
  ] = useState(0);
  useEffect(
    () => {
      if (seconds <= 0)
        return;
      const timer = setTimeout(
        () => setSeconds(value => value - 1),
        1000,
      );
      return () => clearTimeout(timer);
    },
    [seconds],
  );
  return [
    seconds,
    setSeconds,
  ] as const;
}

/**
 * A reload returns the applicant to the step they were on. Saved progress lives on the
 * server; these only remember the screen, and the step 1 fields typed before the
 * application exists (there is nothing to save them to yet). Per tab, like the token.
 */
const STEP_KEY = "truckmoov_apply_step";
const DETAILS_DRAFT_KEY = "truckmoov_apply_details_draft";
/** Form steps in the order the applicant moves through them. */
const STEP_ORDER = [
  1,
  2,
  3,
  4,
  5,
  8,
];

function readStoredStep() {
  const step = Number(window.sessionStorage.getItem(STEP_KEY));
  return STEP_ORDER.includes(step) ? step : null;
}

function readDetailsDraft(): BusinessDetailsValues {
  try {
    const raw = window.sessionStorage.getItem(DETAILS_DRAFT_KEY);
    return raw
      ? {
          ...EMPTY_BUSINESS_DETAILS, ...JSON.parse(raw),
        }
      : EMPTY_BUSINESS_DETAILS;
  }
  catch {
    return EMPTY_BUSINESS_DETAILS;
  }
}

async function dataUrlToBlob(dataUrl: string) {
  const res = await fetch(dataUrl);
  return res.blob();
}

export default function ApplyForAccount() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useApplySession();
  const {
    application, applicationId,
  } = session;

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
    saving,
    setSaving,
  ] = useState(false);
  const [
    saveError,
    setSaveError,
  ] = useState<string | null>(null);
  const [
    indemnityNotice,
    setIndemnityNotice,
  ] = useState<string | null>(null);
  const [
    submitError,
    setSubmitError,
  ] = useState<string | null>(null);
  const [
    destinations,
    setDestinations,
  ] = useState<{
    email?: string; phone?: string;
  }>({});
  const [
    emailCooldown,
    setEmailCooldown,
  ] = useCooldown();
  const [
    phoneCooldown,
    setPhoneCooldown,
  ] = useCooldown();
  const sentRef = useRef<{
    email?: boolean; phone?: boolean;
  }>({});
  const rehydratedRef = useRef(false);
  // Read before the first render can overwrite it with the default step.
  const storedStepRef = useRef(readStoredStep());

  const licence = useApplyDraftStore(state => state.licence);
  const setLicence = useApplyDraftStore(state => state.setLicence);
  const pendingSignature = useApplyDraftStore(state => state.pendingSignature);
  const setPendingSignature = useApplyDraftStore(state => state.setPendingSignature);

  const createApplication = useCreateOnboardingApplication();
  const updateApplication = useUpdateOnboardingApplication();
  const signIndemnity = useSignOnboardingIndemnity();
  const sendEmail = useSendOnboardingApplicationEmailVerification();
  const sendPhone = useSendOnboardingApplicationPhoneVerification();
  const verifyEmail = useVerifyOnboardingApplicationEmail();
  const verifyPhone = useVerifyOnboardingApplicationPhone();
  const submitApplication = useSubmitOnboardingApplication();
  const resume = useResumeOnboardingApplication();
  const deleteDocument = useDeleteOnboardingApplicationDocument();
  const {
    confirm, dialog: confirmDialog,
  } = useConfirmDialog();

  const form = useForm<BusinessDetailsValues>({
    resolver: zodResolver(businessDetailsSchemaFor(customerType ?? "enterprise")),
    mode: "onTouched",
    // Before the application exists, step 1 is only in this tab — restore what was typed.
    defaultValues: applicationId ? EMPTY_BUSINESS_DETAILS : readDetailsDraft(),
  });

  // Keep typed-but-unsaved details across a reload until the first save creates the application.
  useEffect(
    () => {
      if (applicationId) {
        window.sessionStorage.removeItem(DETAILS_DRAFT_KEY);
        return;
      }
      const subscription = form.watch((values) => {
        window.sessionStorage.setItem(
          DETAILS_DRAFT_KEY,
          JSON.stringify(values),
        );
      });
      return () => subscription.unsubscribe();
    },
    [
      applicationId,
      form,
    ],
  );

  // Remember the screen, so a reload lands back on it.
  useEffect(
    () => {
      if (phase === "form") {
        window.sessionStorage.setItem(
          STEP_KEY,
          String(step),
        );
      }
    },
    [
      step,
      phase,
    ],
  );

  const requiredDocuments = customerType ? documentsForCustomerType(customerType) : [];
  const emailVerified = Boolean(application?.verification.emailVerified);
  const phoneVerified = Boolean(application?.verification.phoneVerified);

  // A stored draft that turned out to be gone (30 days idle, or a stale token).
  useEffect(
    () => {
      if (!session.expired)
        return;
      toast.error("Your saved application has expired. Please start a new one.");
      setCustomerType(null);
      setStep(1);
      setPhase("form");
    },
    [session.expired],
  );

  // Land a returning applicant where they left off — once, on the first load.
  useEffect(
    () => {
      if (!application || rehydratedRef.current)
        return;
      rehydratedRef.current = true;
      const type = fromApplicantType(application.applicantType);
      setCustomerType(type);
      writeStoredCustomerType(type);
      form.reset(applicationToDetails(application));
      if (application.m2mPlanCode)
        setLicence({ licensePlan: application.m2mPlanCode });

      // Past review, the stage decides the screen: payment opens after provisioning, and the
      // provider redirects back here (`?payment=return`) to confirm.
      if (application.stage === "payment") {
        setPhase("payment");
        setStep(6);
        return;
      }
      if (application.stage === "installation_scheduling") {
        setPhase("payment");
        setStep(7);
        return;
      }
      if (application.status !== "draft" && application.status !== "changes_requested") {
        setPhase("status");
        return;
      }
      const detailsDone = Boolean(application.m2mPlanCode) && isIndemnitySigned(application);
      const firstUnfinished = !detailsDone
        ? 1
        : !application.verification.emailVerified
            ? 2
            : !application.verification.phoneVerified
                ? 3
                : application.vehicles.length === 0
                  ? 4
                  : !documentsComplete(application)
                      ? 5
                      : 8;
      // Back to the step they were on — but never past one that isn't finished yet.
      const stored = storedStepRef.current;
      setStep(stored !== null && STEP_ORDER.indexOf(stored) <= STEP_ORDER.indexOf(firstUnfinished)
        ? stored
        : firstUnfinished);
    },
    [
      application,
      form,
      setLicence,
    ],
  );

  async function sendCode(channel: "email" | "phone") {
    if (!applicationId)
      return;
    const mutation = channel === "email" ? sendEmail : sendPhone;
    const setCooldown = channel === "email" ? setEmailCooldown : setPhoneCooldown;
    try {
      const res = await mutation.mutateAsync({ id: applicationId });
      sentRef.current[channel] = true;
      setDestinations(previous => ({
        ...previous, [channel]: res.data.destination,
      }));
      setCooldown(res.data.resendAfterSeconds);
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      if (err.retryAfterSeconds)
        setCooldown(err.retryAfterSeconds);
      toast.error(err.message || "The code couldn't be sent. Try again.");
    }
  }

  // Send the code once when the applicant reaches each verification screen.
  useEffect(
    () => {
      if (phase !== "form" || !applicationId)
        return;
      if (step === 2 && !emailVerified && !sentRef.current.email)
        void sendCode("email");
      if (step === 3 && !phoneVerified && !sentRef.current.phone)
        void sendCode("phone");
    },
    // ponytail: fires on arriving at a step; sendCode's identity changes every render.
    // eslint-disable-next-line react/exhaustive-deps
    [
      step,
      phase,
      applicationId,
      emailVerified,
      phoneVerified,
    ],
  );

  async function handleVerify(channel: "email" | "phone", code: string) {
    if (!applicationId)
      return false;
    try {
      const mutation = channel === "email" ? verifyEmail : verifyPhone;
      await mutation.mutateAsync({
        id: applicationId,
        data: { code },
      });
      toast.success(channel === "email" ? "Email address verified" : "Phone number verified");
      return true;
    }
    catch (error) {
      toast.error((error as ServerErrorResponse).message || "That code didn't work. Try again.");
      return false;
    }
  }

  function applyDetailsError(error: unknown) {
    const err = error as ServerErrorResponse;
    const claims = describeClaims(err.claimTypes);
    if (claims) {
      setSaveError(claims);
      return;
    }
    const field = err.field ? SERVER_FIELD_TO_FORM_FIELD[err.field] : undefined;
    if (field) {
      form.setError(
        field === "contactName" && customerType === "owner_operator" ? "firstName" : field,
        { message: err.message },
      );
      return;
    }
    if (err.statusCode === 409 && /email/i.test(err.message)) {
      form.setError(
        "businessEmail",
        { message: err.message },
      );
      return;
    }
    setSaveError(err.message || "Your details couldn't be saved. Try again.");
  }

  async function handleDetailsSubmit(values: BusinessDetailsValues) {
    if (!customerType)
      return;
    setSaving(true);
    setSaveError(null);
    const payload = detailsToPayload(
      values,
      customerType,
      licence.licensePlan,
    );
    let id = applicationId;
    try {
      if (id) {
        await updateApplication.mutateAsync({
          id,
          data: payload,
        });
      }
      else {
        const res = await createApplication.mutateAsync({ data: payload });
        id = res.data.id;
        session.start(id);
      }
    }
    catch (error) {
      applyDetailsError(error);
      setSaving(false);
      return;
    }

    if (pendingSignature) {
      try {
        await signIndemnity.mutateAsync({
          id,
          signerName: pendingSignature.name,
          templateVersion: pendingSignature.version,
          method: pendingSignature.method,
          file: await dataUrlToBlob(pendingSignature.image),
        });
        setPendingSignature(null);
        setIndemnityNotice(null);
      }
      catch (error) {
        const err = error as ServerErrorResponse;
        if (err.statusCode === 409 && /version/i.test(err.message)) {
          // Signed against a superseded version: re-read and sign again, don't retry.
          setPendingSignature(null);
          setLicence({ indemnityAccepted: false });
          queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingIndemnityAgreement });
          setIndemnityNotice("The indemnity agreement has been updated. Read the current version and sign it again.");
        }
        else {
          // Keep the pending signature — pressing Next again retries the upload.
          setSaveError(err.message || "Your signature couldn't be saved. Try again.");
        }
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setStep(!emailVerified ? 2 : !phoneVerified ? 3 : 4);
  }

  async function handleSaveForLater() {
    const email = form.getValues("businessEmail").trim() || application?.organization.businessEmail;
    if (!email) {
      toast.error("Enter your business email first.");
      return;
    }
    try {
      await resume.mutateAsync({ data: { businessEmail: email } });
      // The reply is the same whether or not an application exists, so never branch on it.
      toast.success("If your business email is verified, we've sent you a link to continue your application.");
      navigate("/auth");
    }
    catch (error) {
      toast.error((error as ServerErrorResponse).message || "We couldn't send the link. Try again.");
    }
  }

  /** The type decides the documents asked for — switching it clears any already uploaded. */
  async function handleCustomerTypeChange(next: ApplicantCustomerType) {
    const uploaded = (application?.documents ?? []).filter(document => document.documentType !== "signed_indemnity_form");
    if (application && next !== fromApplicantType(application.applicantType) && uploaded.length > 0) {
      const ok = await confirm({
        title: "Change customer type?",
        description: `The documents asked for depend on the customer type, so the ${uploaded.length} document(s) you've uploaded will be removed.`,
        confirmLabel: "Change and remove documents",
      });
      if (!ok)
        return;
      try {
        for (const document of uploaded) {
          await deleteDocument.mutateAsync({
            id: application.id,
            documentId: document.id,
          });
        }
      }
      catch (error) {
        toast.error((error as ServerErrorResponse).message || "Your documents couldn't be cleared.");
        return;
      }
    }
    setCustomerType(next);
    writeStoredCustomerType(next);
  }

  async function handleSubmitApplication() {
    if (!applicationId)
      return;
    setSubmitError(null);
    try {
      const res = await submitApplication.mutateAsync({ id: applicationId });
      if ("incomplete" in res) {
        setSubmitError(res.message);
        setStep(!res.planSelected || !res.indemnitySigned
          ? 1
          : !res.emailVerified
              ? 2
              : !res.phoneVerified
                  ? 3
                  : res.vehicleCount === 0 || !res.deviceAllocationComplete
                    ? 4
                    : 5);
        toast.error(res.message);
        return;
      }
      setPhase("status");
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      setSubmitError(describeClaims(err.claimTypes) ?? err.message ?? "Your application couldn't be submitted.");
    }
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

  /** Visible step (1..5); after submission the payment step is highlighted. */
  const visibleStep = phase === "status" ? 4 : displayStep(step);

  if (session.isRestoring) {
    return (
      <ApplyShell
        customerType={customerType}
        visibleStep={visibleStep}
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </ApplyShell>
    );
  }

  // Steps after 1 need the saved application; send anyone without one back to the details.
  const needsApplication = phase === "form" && step > 1 && !application;

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
        {phase === "status" && applicationId && (
          <ApplicationStatusScreen
            applicationId={applicationId}
            onContinue={() => {
              setPhase("payment");
              setStep(6);
            }}
            onEdit={() => {
              setPhase("form");
              setStep(1);
            }}
            onSignIn={() => {
              session.clear();
              navigate("/auth");
            }}
          />
        )}

        {phase === "payment" && step === 6 && (
          applicationId && (
            <PaymentStep
              applicationId={applicationId}
              businessEmail={application?.organization.businessEmail ?? ""}
              onContinue={() => setStep(7)}
              onEditFleet={() => {
                setPhase("form");
                setStep(4);
              }}
            />
          )
        )}

        {phase === "payment" && step === 7 && applicationId && (
          <ScheduleInstallationStep
            applicationId={applicationId}
            vehicles={application?.vehicles ?? []}
            defaults={{
              streetAddress: form.getValues("streetAddress"),
              city: form.getValues("city"),
              state: form.getValues("state"),
              contactName: form.getValues("contactName") || undefined,
              contactPhone: form.getValues("phoneNumber"),
            }}
            onBack={() => setStep(6)}
            onDone={() => {
              session.clear();
              navigate("/auth");
            }}
          />
        )}

        {phase === "form" && !customerType && (
          <CustomerTypeStep
            value={customerType}
            onChange={value => void handleCustomerTypeChange(value)}
            onNext={() => setStep(1)}
          />
        )}

        {phase === "form" && customerType && step === 1 && (
          <>
            <BusinessDetailsStep
              form={form}
              customerType={customerType}
              submitting={saving}
              indemnitySigned={isIndemnitySigned(application)}
              indemnityNotice={indemnityNotice}
              saveError={saveError}
              applicationId={applicationId}
              onSubmit={values => void handleDetailsSubmit(values)}
            />
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                className="text-muted-foreground"
                loading={resume.isPending}
                onClick={() => void handleSaveForLater()}
              >
                Save & Continue Later
              </Button>
            </div>
          </>
        )}

        {needsApplication && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Save your customer details first.
            {" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => setStep(1)}
            >
              Go to Customer Details
            </button>
          </div>
        )}

        {phase === "form" && application && step === 2 && (
          <VerificationStep
            channel="email"
            destination={destinations.email ?? application.organization.businessEmail}
            verified={emailVerified}
            sending={sendEmail.isPending}
            cooldown={emailCooldown}
            onSend={() => void sendCode("email")}
            onVerify={code => handleVerify(
              "email",
              code,
            )}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {phase === "form" && application && step === 3 && (
          <VerificationStep
            channel="phone"
            destination={destinations.phone ?? application.organization.organizationPhone}
            verified={phoneVerified}
            sending={sendPhone.isPending}
            cooldown={phoneCooldown}
            onSend={() => void sendCode("phone")}
            onVerify={code => handleVerify(
              "phone",
              code,
            )}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {phase === "form" && application && step === 4 && (
          <FleetRequirementsStep
            application={application}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}

        {phase === "form" && application && customerType && step === 5 && (
          <DocumentsStep
            application={application}
            required={requiredDocuments}
            onBack={() => setStep(4)}
            onNext={() => setStep(8)}
          />
        )}

        {phase === "form" && application && customerType && step === 8 && (
          <ReviewStep
            customerType={customerType}
            application={application}
            requiredDocuments={requiredDocuments}
            submitting={submitApplication.isPending}
            submitError={submitError}
            onBack={() => setStep(5)}
            onEditDetails={() => setStep(1)}
            onEditFleet={() => setStep(4)}
            onEditDocuments={() => setStep(5)}
            onSubmit={() => void handleSubmitApplication()}
          />
        )}
      </div>
      {confirmDialog}
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
        <div className="sticky top-0 z-20 flex h-0 justify-end px-4 pt-4">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-3xl px-6 py-10 pb-16 sm:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
