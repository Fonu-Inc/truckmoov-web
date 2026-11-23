"use client";

import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type { ApplicantCustomerType } from "@truckmoov/app-core/apply/applyTypes";
import type { Resolver } from "react-hook-form";
import type { BusinessDetailsValues } from "@/features/get-started/schemas/applySchemas";
import type { DialogIntent } from "@/shared/stores/dialogStore";
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
import {
  APPLY_STEPS,
  displayStep,
  documentsComplete,
  documentsForApplicant,
  isIndemnitySigned,
} from "@truckmoov/app-core/apply/applyTypes";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import {
  useForm, useWatch,
} from "react-hook-form";
import { ApplicationSaveContext } from "@/features/get-started/components/ApplicationSaveContext";
import { ApplicationStatusScreen } from "@/features/get-started/components/ApplicationStatusScreen";
import { BusinessDetailsStep } from "@/features/get-started/components/BusinessDetailsStep";
import { CustomerTypeStep } from "@/features/get-started/components/CustomerTypeStep";
import { DialogHeader } from "@/features/get-started/components/DialogHeader";
import { DocumentsStep } from "@/features/get-started/components/DocumentsStep";
import { DraftChoiceScreen } from "@/features/get-started/components/EntryScreens";
import { FleetRequirementsStep } from "@/features/get-started/components/FleetRequirementsStep";
import { PaymentStep } from "@/features/get-started/components/PaymentStep";
import { ReviewStep } from "@/features/get-started/components/ReviewStep";
import { ScheduleInstallationStep } from "@/features/get-started/components/ScheduleInstallationStep";
import {
  LoadingBlock,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import { Stepper } from "@/features/get-started/components/Stepper";
import { VerificationStep } from "@/features/get-started/components/VerificationStep";
import { useApplySession } from "@/features/get-started/hooks/useApplySession";
import { useConfirmDialog } from "@/features/get-started/hooks/useConfirmDialog";
import { useCountdown } from "@/features/get-started/hooks/useCountdown";
import {
  applicationToDetails,
  businessDetailsSchemaFor,
  describeClaims,
  detailsToPayload,
  EMPTY_BUSINESS_DETAILS,
  SERVER_FIELD_TO_FORM_FIELD,
} from "@/features/get-started/schemas/applySchemas";
import { useApplyDraftStore } from "@/features/get-started/stores/applyDraftStore";
import {
  clearSubmittedDraft,
  hasStoredDraft,
  readDraft,
  readStoredCustomerType,
  writeDraft,
} from "@/features/get-started/utils/applyDraftStorage";
import {
  Dialog,
  DialogContent,
} from "@/shared/components/shadcn/dialog";
import { cn } from "@/shared/utils";
import {
  routes,
  SIGN_IN_URL,
} from "@/shared/utils/routes";

/**
 * Internal step numbers, matching the main app's /apply:
 *   1 customer details · 2 email OTP · 3 phone OTP · 4 fleet · 5 documents
 *   6 payment · 7 installation · 8 review
 * `displayStep` folds these into the five visible steps.
 */
type Phase = "form" | "status" | "payment";
/** Shown before the flow when a draft is saved: "continue or start new?". */
type Entry = "choice" | null;
type Banner = {
  tone: "error" | "info" | "success";
  message: string;
} | null;

/** Form steps in the order the applicant moves through them. */
const STEP_ORDER = [
  1,
  2,
  3,
  4,
  5,
  8,
];
const STEP_LABELS = APPLY_STEPS.map(step => step.label);

function readStoredStep() {
  const step = Number(readDraft("step"));
  return STEP_ORDER.includes(step) ? step : null;
}

function readDetailsDraft(): BusinessDetailsValues {
  try {
    const raw = readDraft("detailsDraft");
    return raw
      ? {
          ...EMPTY_BUSINESS_DETAILS,
          ...JSON.parse(raw),
        }
      : EMPTY_BUSINESS_DETAILS;
  }
  catch {
    return EMPTY_BUSINESS_DETAILS;
  }
}

/**
 * The "Apply for Account Creation" wizard: a port of the main app's
 * `ApplyForAccount` page (same steps, same onboarding-applications API calls) in the
 * landing dialog. Progress is saved in this browser (localStorage + IndexedDB, see
 * `utils/applyDraftStorage.ts`), so reopening it resumes on the step the applicant stopped at.
 * "Apply as Returning Customer" (intent "returning") is an existing MTN customer: the same
 * flow with the persisted `returning` flag, which asks for fewer documents. Controlled by the
 * root DialogHost.
 */
export function GetStartedDialog({
  open,
  intent,
  onOpenChange,
}: {
  open: boolean;
  intent: DialogIntent;
  onOpenChange: (open: boolean) => void;
}) {
  // First: adopts a resume link and drops an expired draft before anything reads storage.
  const session = useApplySession();
  const {
    application,
    applicationId,
  } = session;

  const [
    entry,
    setEntry,
  ] = useState<Entry>(null);
  const [
    wasOpen,
    setWasOpen,
  ] = useState(false);
  // The returning flag the button that opened the dialog asks for; null keeps the stored one.
  const [
    entryReturning,
    setEntryReturning,
  ] = useState<boolean | null>(null);
  const [
    customerType,
    setCustomerType,
  ] = useState<ApplicantCustomerType | null>(readStoredCustomerType);
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
    indemnityNotice,
    setIndemnityNotice,
  ] = useState<string | null>(null);
  const [
    submitError,
    setSubmitError,
  ] = useState<string | null>(null);
  const [
    banner,
    setBanner,
  ] = useState<Banner>(null);
  const [
    destinations,
    setDestinations,
  ] = useState<{
    email?: string;
    phone?: string;
  }>({});
  const [
    emailCooldownSeed,
    setEmailCooldownSeed,
  ] = useState(0);
  const [
    phoneCooldownSeed,
    setPhoneCooldownSeed,
  ] = useState(0);
  const [emailCooldown] = useCountdown(emailCooldownSeed);
  const [phoneCooldown] = useCountdown(phoneCooldownSeed);
  const sentRef = useRef<{
    email?: boolean;
    phone?: boolean;
  }>({});
  const rehydratedRef = useRef(false);
  // Read before the first render can overwrite it with the default step.
  const storedStepRef = useRef(readStoredStep());

  // Each time the dialog opens, the button that opened it decides the first screen.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const saved = Boolean(applicationId) || hasStoredDraft();
      // "new" asks about a saved draft; "returning" (an MTN customer) and "resume" go straight
      // to it, or to a fresh application when nothing is saved.
      setEntry(intent === "new" && saved ? "choice" : null);
      setEntryReturning(intent === "returning" ? true : (intent === "new" && !saved ? false : null));
    }
  }

  const licence = useApplyDraftStore(state => state.licence);
  const setLicence = useApplyDraftStore(state => state.setLicence);
  const storedReturning = useApplyDraftStore(state => state.returning);
  const setReturning = useApplyDraftStore(state => state.setReturning);
  const pendingSignature = useApplyDraftStore(state => state.pendingSignature);
  const setPendingSignature = useApplyDraftStore(state => state.setPendingSignature);
  // Once saved, the application's own flag decides.
  const isReturning = application?.returningCustomer ?? entryReturning ?? storedReturning;

  // Remember the returning flag for the rest of the application (and the next visit).
  useEffect(
    () => {
      if (entryReturning !== null)
        setReturning(entryReturning);
    },
    [
      entryReturning,
      setReturning,
    ],
  );

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
    confirm,
    dialog: confirmDialog,
  } = useConfirmDialog();

  const form = useForm<BusinessDetailsValues>({
    // The per-type schema is a union of the two branches; both output BusinessDetailsValues.
    resolver: zodResolver(businessDetailsSchemaFor(customerType ?? "enterprise")) as Resolver<BusinessDetailsValues>,
    mode: "onTouched",
    // Before the application exists, step 1 is only in this browser: restore what was typed.
    defaultValues: applicationId ? EMPTY_BUSINESS_DETAILS : readDetailsDraft(),
  });
  // The installation step's address defaults. useWatch, not getValues, so React
  // Compiler can't serve a value cached from an earlier render.
  const [
    streetAddress,
    city,
    state,
    contactName,
    phoneNumber,
  ] = useWatch({
    control: form.control,
    name: [
      "streetAddress",
      "city",
      "state",
      "contactName",
      "phoneNumber",
    ],
  });

  // Keep typed-but-unsaved details until the first save creates the application.
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

  // Remember the screen, so reopening the dialog lands back on it.
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

  // A new screen starts without the last one's message.
  useEffect(
    () => {
      setBanner(null);
    },
    [
      step,
      phase,
      entry,
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

  // A stored draft that turned out to be gone (30 days idle, or a stale token).
  useEffect(
    () => {
      if (!session.expired)
        return;
      setCustomerType(null);
      setStep(1);
      setPhase("form");
      setBanner({
        tone: "error",
        message: "Your saved application has expired. Please start a new one.",
      });
    },
    [session.expired],
  );

  // Land a returning applicant where they left off, once, on the first load.
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
      // provider redirects back to this page (`?payment=return`) to confirm.
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
                  : !documentsComplete(
                      application,
                      application.returningCustomer,
                    )
                      ? 5
                      : 8;
      // Back to the step they were on, but never past one that isn't finished yet.
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

  function showError(message: string) {
    setBanner({
      tone: "error",
      message,
    });
  }

  async function sendCode(channel: "email" | "phone") {
    if (!applicationId)
      return;
    const mutation = channel === "email" ? sendEmail : sendPhone;
    const setCooldown = channel === "email" ? setEmailCooldownSeed : setPhoneCooldownSeed;
    try {
      const res = await mutation.mutateAsync({ id: applicationId });
      sentRef.current[channel] = true;
      setDestinations(previous => ({
        ...previous,
        [channel]: res.data.destination,
      }));
      setCooldown(res.data.resendAfterSeconds);
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      if (err.retryAfterSeconds)
        setCooldown(err.retryAfterSeconds);
      showError(err.message || "The code couldn't be sent. Try again.");
    }
  }

  // Reads the latest state without making it a trigger: a code is sent on arriving at a
  // verification screen (or reopening the dialog on it), not again on every render.
  const sendCodeForStep = useEffectEvent(() => {
    if (phase !== "form" || !applicationId || entry)
      return;
    if (step === 2 && !emailVerified && !sentRef.current.email)
      void sendCode("email");
    if (step === 3 && !phoneVerified && !sentRef.current.phone)
      void sendCode("phone");
  });

  useEffect(
    () => {
      if (open)
        sendCodeForStep();
    },
    [
      open,
      step,
      phase,
      entry,
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
      setBanner({
        tone: "success",
        message: channel === "email" ? "Email address verified" : "Phone number verified",
      });
      return true;
    }
    catch (error) {
      showError((error as ServerErrorResponse).message || "That code didn't work. Try again.");
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

  /** The type decides the documents asked for, so switching it clears any already uploaded. */
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
        showError((error as ServerErrorResponse).message || "Your documents couldn't be cleared.");
        return;
      }
    }
    setCustomerType(next);
    writeDraft(
      "customerType",
      next,
    );
    setStep(1);
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
                    : !documentsComplete(
                        application,
                        isReturning,
                      )
                        ? 5
                        : 8);
        showError(res.message);
        return;
      }
      // Everything is on the server now; keep only what's needed to come back to the status.
      void clearSubmittedDraft();
      setPhase("status");
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      setSubmitError(describeClaims(err.claimTypes) ?? err.message ?? "Your application couldn't be submitted.");
    }
  }

  /** Forget everything saved in this browser and show a blank application. */
  async function startOver() {
    await session.clear();
    sentRef.current = {};
    storedStepRef.current = null;
    form.reset(EMPTY_BUSINESS_DETAILS);
    setCustomerType(null);
    setStep(1);
    setPhase("form");
    setSaveError(null);
    setSubmitError(null);
    setDestinations({});
    setEntry(null);
    // session.clear() reset the stored returning flag; stop overriding it.
    setEntryReturning(null);
  }

  async function confirmStartOver() {
    const ok = await confirm({
      title: "Start a new application?",
      description: "This will delete the progress saved in this browser.",
      confirmLabel: "Start new application",
    });
    if (ok)
      await startOver();
  }

  /** The flow is finished: the account exists and sign-in happens from the emailed link. */
  async function goToSignIn() {
    await session.clear();
    window.location.assign(SIGN_IN_URL);
  }

  /** "Return to Home" after booking: the account exists, so the draft is done with. */
  async function returnHome() {
    await session.clear();
    onOpenChange(false);
    if (window.location.pathname !== routes.home)
      window.location.assign(routes.home);
  }

  function saveProgress() {
    writeDraft(
      "step",
      String(step),
    );
    setBanner({
      tone: "success",
      message: "Application progress saved. Your current application has been saved in this browser.",
    });
  }

  function close() {
    onOpenChange(false);
  }

  function handleBack() {
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

  /** Visible step (1..5); review and the status screen sit at 3.5 — steps 1–3 done, none active. */
  const visibleStep = phase === "status" ? 3.5 : displayStep(step);
  // Steps after 1 need the saved application; send anyone without one back to the details.
  const needsApplication = phase === "form" && step > 1 && !application;
  const showStepper = !entry && Boolean(customerType) && !session.isRestoring;

  function renderScreen() {
    if (entry === "choice") {
      return (
        <DraftChoiceScreen
          onContinue={() => setEntry(null)}
          onStartNew={() => void confirmStartOver()}
          onClose={close}
        />
      );
    }
    if (session.isRestoring)
      return <StepLayout><LoadingBlock /></StepLayout>;

    if (phase === "status" && applicationId) {
      return (
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
          onSignIn={() => void goToSignIn()}
          onStartNew={() => void startOver()}
          onClose={close}
        />
      );
    }

    if (phase === "payment" && step === 6 && applicationId) {
      return (
        <PaymentStep
          applicationId={applicationId}
          onBack={() => setPhase("status")}
          onContinue={() => setStep(7)}
          onEditFleet={() => {
            setPhase("form");
            setStep(4);
          }}
        />
      );
    }

    if (phase === "payment" && step === 7 && applicationId) {
      return (
        <ScheduleInstallationStep
          applicationId={applicationId}
          vehicles={application?.vehicles ?? []}
          defaults={{
            streetAddress,
            city,
            state,
            contactName: contactName || undefined,
            contactPhone: phoneNumber,
          }}
          onDone={() => void returnHome()}
        />
      );
    }

    if (!customerType) {
      return (
        <CustomerTypeStep
          value={customerType}
          onChange={value => void handleCustomerTypeChange(value)}
          onBack={close}
        />
      );
    }

    if (step === 1) {
      return (
        <BusinessDetailsStep
          form={form}
          customerType={customerType}
          submitting={saving}
          indemnitySigned={isIndemnitySigned(application)}
          indemnityNotice={indemnityNotice}
          saveError={saveError}
          applicationId={applicationId}
          emailConflict={emailConflict}
          onSubmit={values => void handleDetailsSubmit(values)}
          onBack={handleBack}
        />
      );
    }

    if (needsApplication || !application) {
      return (
        <StepLayout>
          <p className="pt-[60px] text-center text-sm text-muted-foreground">
            Save your customer details first.
            {" "}
            <button
              type="button"
              className="cursor-pointer font-semibold text-brand-deep hover:underline"
              onClick={() => setStep(1)}
            >
              Go to Customer Details
            </button>
          </p>
        </StepLayout>
      );
    }

    if (step === 2 || step === 3) {
      const channel = step === 2 ? "email" : "phone";
      return (
        <VerificationStep
          key={channel}
          channel={channel}
          destination={channel === "email"
            ? (destinations.email ?? application.organization.businessEmail)
            : (destinations.phone ?? application.organization.organizationPhone)}
          verified={channel === "email" ? emailVerified : phoneVerified}
          sending={channel === "email" ? sendEmail.isPending : sendPhone.isPending}
          cooldown={channel === "email" ? emailCooldown : phoneCooldown}
          onSend={() => void sendCode(channel)}
          onVerify={code => handleVerify(
            channel,
            code,
          )}
          onBack={() => setStep(step - 1)}
          onNext={() => setStep(step + 1)}
        />
      );
    }

    if (step === 4) {
      return (
        <FleetRequirementsStep
          application={application}
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
          onError={showError}
          onSuccess={message => setBanner({
            tone: "success",
            message,
          })}
        />
      );
    }

    if (step === 5) {
      return (
        <DocumentsStep
          application={application}
          required={requiredDocuments}
          onBack={() => setStep(4)}
          onNext={() => setStep(8)}
        />
      );
    }

    return (
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
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-[860px] max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-[30px] border-border-field p-0 shadow-float sm:max-w-[680px]"
      >
        <DialogHeader returning={isReturning} />

        {showStepper && (
          <Stepper
            steps={STEP_LABELS}
            current={visibleStep - 1}
            submitted={false}
          />
        )}

        {banner && (
          <div
            role={banner.tone === "error" ? "alert" : "status"}
            className={cn(
              "shrink-0 border-b px-7 py-3 text-sm",
              banner.tone === "error" && "border-destructive/20 bg-destructive/10 text-destructive",
              banner.tone === "success" && "border-success/20 bg-success-soft text-success-deep",
              banner.tone === "info" && "border-border bg-surface text-heading",
            )}
          >
            {banner.message}
          </div>
        )}

        <ApplicationSaveContext value={phase === "form" && customerType && !entry ? saveProgress : null}>
          {renderScreen()}
        </ApplicationSaveContext>
        {confirmDialog}
      </DialogContent>
    </Dialog>
  );
}
