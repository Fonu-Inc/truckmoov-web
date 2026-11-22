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
import {
  useLocation,
  useNavigate,
} from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/shadcn/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BusinessDetailsStep } from "@/features/apply/components/forms/BusinessDetailsStep";
import { ScheduleInstallationStep } from "@/features/apply/components/forms/ScheduleInstallationStep";
import { ApplicationSaveContext } from "@/features/apply/components/providers/ApplicationSaveContext";
import { ApplicationResumeScreen } from "@/features/apply/components/ui/ApplicationResumeScreen";
import { ApplicationStatusScreen } from "@/features/apply/components/ui/ApplicationStatusScreen";
import {
  ApplyStepRailHorizontal,
  ApplyStepRailVertical,
} from "@/features/apply/components/ui/ApplyStepRail";
import { CustomerTypeStep } from "@/features/apply/components/ui/CustomerTypeStep";
import { DocumentsStep } from "@/features/apply/components/ui/DocumentsStep";
import { FleetRequirementsStep } from "@/features/apply/components/ui/FleetRequirementsStep";
import {
  PAYMENT_RETURN_PARAM,
  PaymentStep,
} from "@/features/apply/components/ui/PaymentStep";
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
  clearSubmittedDraft,
  hasStoredDraft,
  readDraft,
  readStoredCustomerType,
  writeDraft,
} from "@/features/apply/utils/applyDraftStorage";
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
  documentsForApplicant,
  isReturningSearch,
} from "@/features/apply/utils/applyTypes";

/**
 * Internal step numbers, matching the design app:
 *   1 customer details · 2 email OTP · 3 phone OTP · 4 fleet · 5 documents
 *   6 payment · 7 installation · 8 review
 * `displayStep` folds these into the five visible steps.
 *
 * Every step runs against the onboarding-applications API, calling the same endpoints as the
 * landing page's get-started wizard: the application is created when the details are first
 * saved, and every later step reads and writes it through `useApplySession`. Progress is
 * remembered in this browser (`applyDraftStorage`); coming back offers to resume it.
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
  const step = Number(readDraft("step"));
  return STEP_ORDER.includes(step) ? step : null;
}

function readDetailsDraft(): BusinessDetailsValues {
  try {
    const raw = readDraft("detailsDraft");
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

export default function ApplyForAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useApplySession();
  const {
    application, applicationId,
  } = session;
  // The resume gate: a saved draft, unless an emailed link or the payment provider brought them back.
  const [
    showResume,
    setShowResume,
  ] = useState(() => !session.resumed
    && !new URLSearchParams(window.location.search).has(PAYMENT_RETURN_PARAM)
    && hasStoredDraft());
  const [hadDraftOnLoad] = useState(hasStoredDraft);

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
    emailConflict,
    setEmailConflict,
  ] = useState(0);
  const [
    submitError,
    setSubmitError,
  ] = useState<string | null>(null);
  const [
    indemnityNotice,
    setIndemnityNotice,
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
  const returning = useApplyDraftStore(state => state.returning);
  const setReturning = useApplyDraftStore(state => state.setReturning);
  const pendingSignature = useApplyDraftStore(state => state.pendingSignature);
  const setPendingSignature = useApplyDraftStore(state => state.setPendingSignature);
  const returningEntry = isReturningSearch(location.search);

  // "Returning Customers" lands on `?returning=1`; remember it for the rest of the application.
  // A plain `/apply` with nothing saved is a new customer.
  useEffect(
    () => {
      if (returningEntry)
        setReturning(true);
      else if (!hadDraftOnLoad)
        setReturning(false);
    },
    [
      returningEntry,
      hadDraftOnLoad,
      setReturning,
    ],
  );
  // Once saved, the application's own flag decides.
  const isReturning = application?.returningCustomer ?? (returningEntry || returning);

  const createApplication = useCreateOnboardingApplication();
  const updateApplication = useUpdateOnboardingApplication();
  const sendEmail = useSendOnboardingApplicationEmailVerification();
  const sendPhone = useSendOnboardingApplicationPhoneVerification();
  const verifyEmail = useVerifyOnboardingApplicationEmail();
  const verifyPhone = useVerifyOnboardingApplicationPhone();
  const submitApplication = useSubmitOnboardingApplication();
  const signIndemnity = useSignOnboardingIndemnity();
  const queryClient = useQueryClient();
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
        writeDraft(
          "detailsDraft",
          null,
        );
        return;
      }
      const subscription = form.watch((values) => {
        // An empty form (e.g. after "Start new") is not a draft worth resuming.
        const typed = Object.values(values).some(value => typeof value === "string" && value.trim());
        writeDraft(
          "detailsDraft",
          typed ? JSON.stringify(values) : null,
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
      if (phase === "form" && customerType) {
        writeDraft(
          "step",
          String(step),
        );
      }
    },
    [
      step,
      phase,
      customerType,
    ],
  );

  const requiredDocuments = customerType
    ? documentsForApplicant(
        customerType,
        isReturning,
      )
    : [];
  const emailVerified = Boolean(application?.verification.emailVerified);
  const phoneVerified = Boolean(application?.verification.phoneVerified);
  const [
    choosingCustomerType,
    setChoosingCustomerType,
  ] = useState(false);

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
      const type = application.applicantType;
      setCustomerType(type);
      writeDraft(
        "customerType",
        type,
      );
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
      // An unsent signature doesn't survive leaving the page: say so rather than silently asking again.
      if (!isIndemnitySigned(application) && !useApplyDraftStore.getState().pendingSignature)
        setIndemnityNotice("Your indemnity form isn't signed yet. If you signed it before leaving, please sign it again, as unsent signatures aren't kept.");
      const detailsDone = Boolean(application.m2mPlanCode) && isIndemnitySigned(application);
      const firstUnfinished = !detailsDone
        ? 1
        : !application.verification.emailVerified
            ? 2
            : !application.verification.phoneVerified
                ? 3
                : application.vehicles.length === 0
                  ? 4
                  : !documentsComplete(
                      application,
                      application.returningCustomer,
                    )
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
      isReturning,
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
      setEmailConflict(count => count + 1);
      // "taken" makes the next Continue open the "You already have a Fleet Pro account" dialog.
      form.setError(
        "businessEmail",
        {
          type: "taken",
          message: err.message,
        },
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
      {
        ...values,
        // Picked on Required Documents; PATCH replaces, so keep it.
        identificationType: application?.registry.identificationType ?? values.identificationType,
      },
      customerType,
      licence.licensePlan,
      isReturning,
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
    // Saved: coming back to the details must not reopen the existing-account dialog.
    setEmailConflict(0);

    if (pendingSignature) {
      try {
        await signIndemnity.mutateAsync({
          id,
          signerName: pendingSignature.name,
          templateVersion: pendingSignature.version,
          method: pendingSignature.method,
          file: pendingSignature.image,
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
          void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.onboardingIndemnityAgreement });
          setIndemnityNotice("The indemnity agreement has been updated. Read the current version and sign it again.");
        }
        else {
          // Keep the pending signature: pressing Continue again retries the upload.
          setSaveError(err.message || "Your signature couldn't be saved. Try again.");
        }
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setStep(!emailVerified ? 2 : !phoneVerified ? 3 : 4);
  }

  /** The type decides the documents asked for — switching it clears any already uploaded. */
  async function handleCustomerTypeChange(next: ApplicantCustomerType) {
    const uploaded = (application?.documents ?? []).filter(document => document.documentType !== "signed_indemnity_form");
    if (application && next !== application.applicantType && uploaded.length > 0) {
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
    writeDraft(
      "customerType",
      next,
    );
  }

  async function handleSubmitApplication() {
    if (!applicationId)
      return;
    setSubmitError(null);
    try {
      const res = await submitApplication.mutateAsync({ id: applicationId });
      if ("incomplete" in res) {
        setSubmitError(res.message);
        // ponytail: the API still gates on the indemnity form and documents the design dropped.
        // Those refusals stay on Review as the submit error — sending the applicant to a step
        // with nothing left to do would strand them.
        const next = !res.planSelected || !res.indemnitySigned
          ? 1
          : !res.emailVerified
              ? 2
              : !res.phoneVerified
                  ? 3
                  : res.vehicleCount === 0 || !res.deviceAllocationComplete
                    ? 4
                    : !documentsComplete(
                        application,
                        isReturning,
                      )
                        ? 5
                        : 8;
        setStep(next);
        toast.error(res.message);
        return;
      }
      // Everything is on the server now; keep only what's needed to come back to the status.
      clearSubmittedDraft();
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
      writeDraft(
        "customerType",
        null,
      );
      return;
    }
    if (step === 8) {
      setStep(5);
      return;
    }
    setStep(step - 1);
  }

  /** Forget everything saved in this browser and show a blank application. */
  function startOver() {
    session.clear();
    sentRef.current = {};
    storedStepRef.current = null;
    rehydratedRef.current = false;
    form.reset(EMPTY_BUSINESS_DETAILS);
    setCustomerType(null);
    setStep(1);
    setPhase("form");
    setSaveError(null);
    setSubmitError(null);
    setIndemnityNotice(null);
    setDestinations({});
    setShowResume(false);
    setReturning(returningEntry);
  }

  async function confirmStartOver() {
    const ok = await confirm({
      title: "Start a new application?",
      description: "This will delete the progress saved in this browser.",
      confirmLabel: "Start new application",
    });
    if (ok)
      startOver();
  }

  function saveProgress() {
    writeDraft(
      "step",
      String(step),
    );
    toast.success(
      "Application progress saved",
      { description: "Your application is saved in this browser. Come back to /apply to continue." },
    );
  }

  /** Visible step (1..5); review and the status screen sit at 3.5 — steps 1–3 done, none active. */
  const visibleStep = phase === "status" ? 3.5 : displayStep(step);

  if (showResume) {
    return (
      <ApplyShell
        customerType={null}
        returning={isReturning}
        visibleStep={1}
      >
        <ApplicationResumeScreen
          onContinue={() => setShowResume(false)}
          onNew={() => void confirmStartOver()}
          onBack={() => navigate("/auth")}
        />
        {confirmDialog}
      </ApplyShell>
    );
  }

  if (session.isRestoring) {
    return (
      <ApplyShell
        customerType={customerType}
        returning={isReturning}
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
      returning={isReturning}
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
        Application for Account Creation
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Complete the steps below to submit your application for a Fleet Pro account.
      </p>

      {customerType && <ApplyStepRailHorizontal current={visibleStep} />}

      <ApplicationSaveContext.Provider value={phase === "form" && customerType ? saveProgress : null}>
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
              onStartNew={startOver}
            />
          )}

          {phase === "payment" && step === 6 && (
            applicationId && (
              <PaymentStep
                applicationId={applicationId}
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
              onDone={() => {
                session.clear();
                navigate("/auth");
              }}
            />
          )}

          {phase === "form" && (!customerType || choosingCustomerType) && (
            <CustomerTypeStep
              value={customerType}
              onChange={value => void handleCustomerTypeChange(value)}
              onNext={() => {
                setChoosingCustomerType(false);
                setStep(1);
              }}
            />
          )}

          {phase === "form" && customerType && !choosingCustomerType && step === 1 && (
            <BusinessDetailsStep
              onBack={() => setChoosingCustomerType(true)}
              form={form}
              customerType={customerType}
              submitting={saving}
              indemnitySigned={isIndemnitySigned(application)}
              indemnityNotice={indemnityNotice}
              saveError={saveError}
              applicationId={applicationId}
              emailConflict={emailConflict}
              onSubmit={values => void handleDetailsSubmit(values)}
            />
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
      </ApplicationSaveContext.Provider>
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
  returning,
  visibleStep,
  complete,
  children,
}: {
  customerType: ApplicantCustomerType | null;
  returning: boolean;
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
            {returning ? "Returning MTN customer onboarding" : "Apply for a Fleet Pro account"}
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-sidebar-foreground/70">
            {returning
              ? "You already have an existing relationship or account with MTN, Complete your FleetPro Onboarding."
              : "A structured business application. Tell us about your organization, your fleet requirements and upload your compliance documents."}
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

      {/* relative: anchors Radix's hidden absolute inputs here, else they stretch the page past h-screen. */}
      <main className="relative h-full flex-1 overflow-y-auto bg-gradient-auth">
        {/* h-0 with the offset in a transform: the toggle floats without pushing the content down. */}
        <div className="sticky top-0 z-20 flex h-0 translate-y-4 justify-end px-4">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-3xl px-6 py-10 pb-16 sm:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
