import type {
  OnboardingApplication,
  OnboardingUploadableDocumentType,
} from "@truckmoov/api/auth";
import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import type {
  DocumentEntry,
  OrganizationFormValues,
  Uploads,
  VerifyCodeValues,
  VerifyStatus,
} from "./get-started-data";
import { zodResolver } from "@hookform/resolvers/zod";

import { useQuery } from "@tanstack/react-query";
import {
  getOnboardingApplicationQueryOptions,
  getOnboardingApplicationStatusQueryOptions,
  getOnboardingToken,
  setOnboardingToken,
  useCreateOnboardingApplication,
  useDeleteOnboardingApplicationDocument,
  useSendOnboardingApplicationEmailVerification,
  useSendOnboardingApplicationPhoneVerification,
  useSubmitOnboardingApplication,
  useUpdateOnboardingApplication,
  useUploadOnboardingApplicationDocument,
  useVerifyOnboardingApplicationEmail,
  useVerifyOnboardingApplicationPhone,
} from "@truckmoov/api/auth";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Rocket,
  X,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";

import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/ui/shadcn/dialog";
import {
  checkFile,
  DOCUMENTS,
  EMPTY_UPLOADS,
  normalizePhone,
  organizationSchema,
  STEPS,
  verifyCodeSchema,
} from "./get-started-data";
import {
  DocumentCheckStep,
  OrganizationStep,
  ReviewStep,
  StatusScreen,
  SubmittedStep,
  UploadStep,
  VerifyStep,
} from "./get-started-steps";

const APPLICATION_ID_KEY = "truckmoov_onboarding_application_id";

const EMPTY_ORG_VALUES: OrganizationFormValues = {
  applicantType: undefined as unknown as OrganizationFormValues["applicantType"],
  organizationName: "",
  businessEmail: "",
  phone: "",
  contactName: "",
  address: "",
  city: "",
  state: undefined as unknown as OrganizationFormValues["state"],
};

// contactRole is required by the server but the applicant never types it —
// it's implied by the Enterprise Admin / Owner Operator card they pick.
const APPLICANT_TYPE_TO_ROLE: Record<OrganizationFormValues["applicantType"], string> = {
  fleet_provider: "Enterprise Admin",
  owner_operator: "Owner Operator",
};

function getStoredApplicationId(): string | null {
  if (typeof window === "undefined")
    return null;
  return window.sessionStorage.getItem(APPLICATION_ID_KEY);
}

function setStoredApplicationId(id: string | null) {
  if (typeof window === "undefined")
    return;
  if (id) {
    window.sessionStorage.setItem(
      APPLICATION_ID_KEY,
      id,
    );
  }
  else {
    window.sessionStorage.removeItem(APPLICATION_ID_KEY);
  }
}

function applicationToOrgValues(app: OnboardingApplication): OrganizationFormValues {
  return {
    applicantType: app.applicantType,
    organizationName: app.organization.organizationName,
    businessEmail: app.organization.businessEmail,
    phone: app.organization.organizationPhone,
    contactName: app.contact.fullName,
    address: app.organization.streetAddress,
    city: app.organization.city,
    state: app.organization.state as OrganizationFormValues["state"],
  };
}

function orgValuesToPayload(values: OrganizationFormValues) {
  return {
    applicantType: values.applicantType,
    organizationName: values.organizationName,
    businessEmail: values.businessEmail,
    organizationPhone: normalizePhone(values.phone),
    contactFullName: values.contactName,
    contactRole: APPLICANT_TYPE_TO_ROLE[values.applicantType],
    streetAddress: values.address,
    city: values.city,
    state: values.state as string,
  };
}

// The organization form and the OnboardingApplication use different field names.
// Server 400 errors reference the *server* field name — this table maps them
// back to the RHF field so setError lands on the right input.
const SERVER_FIELD_TO_FORM_FIELD: Record<string, keyof OrganizationFormValues> = {
  applicantType: "applicantType",
  organizationName: "organizationName",
  businessEmail: "businessEmail",
  organizationPhone: "phone",
  contactFullName: "contactName",
  contactRole: "applicantType",
  streetAddress: "address",
  city: "city",
  state: "state",
};

function useCountdown(seconds: number) {
  const [
    remaining,
    setRemaining,
  ] = useState(seconds);

  useEffect(
    () => {
      setRemaining(seconds);
    },
    [seconds],
  );

  useEffect(
    () => {
      if (remaining <= 0)
        return;
      const id = window.setInterval(
        () => {
          setRemaining(prev => (prev <= 1 ? 0 : prev - 1));
        },
        1000,
      );
      return () => window.clearInterval(id);
    },
    [remaining],
  );

  return [
    remaining,
    setRemaining,
  ] as const;
}

function Stepper({
  current,
  submitted,
}: {
  current: number;
  submitted: boolean;
}) {
  return (
    <div className="flex border-b border-border-100 px-9 py-5">
      {STEPS.map((label, index) => {
        const done = submitted || index < current;
        const active = !submitted && index === current;

        return (
          <div
            key={label}
            className="relative flex flex-1 flex-col items-center gap-2"
          >
            {index > 0 && (
              <span className="absolute top-3 right-[calc(50%+12px)] h-px w-[calc(100%-24px)] bg-border" />
            )}
            <span className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full",
              done && "bg-primary-100",
              active && "border-2 border-primary bg-background",
              !done && !active && "bg-[#EAEAEA]",
            )}
            >
              {done && (
                <Check
                  className="size-3.5 text-white"
                  strokeWidth={3.5}
                />
              )}
            </span>
            <span className={cn(
              "w-[92px] truncate text-center text-[13px]",
              done || active ? "font-bold text-foreground" : "text-[#9A9A9A]",
            )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function GetStartedDialog({ children }: { children: React.ReactNode }) {
  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    step,
    setStep,
  ] = useState(0);
  const [
    submitted,
    setSubmitted,
  ] = useState(false);
  const [
    uploads,
    setUploads,
  ] = useState<Uploads>(EMPTY_UPLOADS);
  const [
    emailStatus,
    setEmailStatus,
  ] = useState<VerifyStatus>("idle");
  const [
    phoneStatus,
    setPhoneStatus,
  ] = useState<VerifyStatus>("idle");
  const [
    applicationId,
    setApplicationId,
  ] = useState<string | null>(null);
  const [
    emailCooldownSeed,
    setEmailCooldownSeed,
  ] = useState(0);
  const [
    phoneCooldownSeed,
    setPhoneCooldownSeed,
  ] = useState(0);
  const [
    emailCooldown,
    setEmailCooldown,
  ] = useCountdown(emailCooldownSeed);
  const [
    phoneCooldown,
    setPhoneCooldown,
  ] = useCountdown(phoneCooldownSeed);
  const [
    busyDocs,
    setBusyDocs,
  ] = useState<Partial<Record<string, boolean>>>({});
  const [
    banner,
    setBanner,
  ] = useState<string | null>(null);
  const rehydratedRef = useRef(false);

  const orgForm = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    mode: "onTouched",
    defaultValues: EMPTY_ORG_VALUES,
  });

  const emailForm = useForm<VerifyCodeValues>({
    resolver: zodResolver(verifyCodeSchema),
    mode: "onChange",
    defaultValues: { code: "" },
  });

  const phoneForm = useForm<VerifyCodeValues>({
    resolver: zodResolver(verifyCodeSchema),
    mode: "onChange",
    defaultValues: { code: "" },
  });

  const orgValues = orgForm.watch();

  const createMutation = useCreateOnboardingApplication();
  const updateMutation = useUpdateOnboardingApplication();
  const uploadMutation = useUploadOnboardingApplicationDocument();
  const deleteMutation = useDeleteOnboardingApplicationDocument();
  const sendEmailMutation = useSendOnboardingApplicationEmailVerification();
  const verifyEmailMutation = useVerifyOnboardingApplicationEmail();
  const sendPhoneMutation = useSendOnboardingApplicationPhoneVerification();
  const verifyPhoneMutation = useVerifyOnboardingApplicationPhone();
  const submitMutation = useSubmitOnboardingApplication();

  const applicationQuery = useQuery({
    ...getOnboardingApplicationQueryOptions(applicationId ?? ""),
    enabled: Boolean(applicationId) && open,
  });

  const statusQuery = useQuery({
    ...getOnboardingApplicationStatusQueryOptions(applicationId ?? ""),
    enabled: Boolean(applicationId) && submitted,
    refetchInterval: 5000,
  });

  const application = applicationQuery.data?.data;

  // Rehydrate from server once when the modal opens with a known token+id.
  useEffect(
    () => {
      if (!open) {
        rehydratedRef.current = false;
        return;
      }
      if (rehydratedRef.current)
        return;
      if (!application)
        return;
      rehydratedRef.current = true;

      orgForm.reset(applicationToOrgValues(application));

      if (application.verification.emailVerified)
        setEmailStatus("verified");
      if (application.verification.phoneVerified)
        setPhoneStatus("verified");

      // Land on the earliest unfinished step so the applicant continues where they left off.
      const missingDocs = application.missingDocuments.length > 0;
      const nextStep = missingDocs
        ? 1
        : !application.verification.emailVerified
            ? 3
            : !application.verification.phoneVerified
                ? 4
                : 5;
      setStep(nextStep);
    },
    [
      application,
      open,
      orgForm,
    ],
  );

  // Load stored applicationId on open. The token is loaded lazily by
  // onboardingInstance's interceptor from the same sessionStorage.
  useEffect(
    () => {
      if (!open)
        return;
      const stored = getStoredApplicationId();
      if (stored && getOnboardingToken()) {
        setApplicationId(stored);
      }
    },
    [open],
  );

  // documentsReady is driven by server state when we have it; before the first
  // upload lands, fall back to local uploads.
  const documentsReady = application
    ? application.missingDocuments.length === 0
    : Object.values(uploads).every(upload => upload.file && !upload.error);

  const canContinue = [
    orgForm.formState.isValid,
    documentsReady,
    documentsReady,
    emailStatus === "verified",
    phoneStatus === "verified",
    true,
  ][step];

  function bindServerError(error: ServerErrorResponse) {
    setBanner(error.message);
    if (error.field) {
      const formField = SERVER_FIELD_TO_FORM_FIELD[error.field];
      if (formField) {
        orgForm.setError(
          formField,
          { message: error.message },
        );
      }
    }
  }

  function reset() {
    setStep(0);
    setSubmitted(false);
    setUploads(EMPTY_UPLOADS);
    setEmailStatus("idle");
    setPhoneStatus("idle");
    setApplicationId(null);
    setEmailCooldownSeed(0);
    setPhoneCooldownSeed(0);
    setBusyDocs({});
    setBanner(null);
    orgForm.reset(EMPTY_ORG_VALUES);
    emailForm.reset({ code: "" });
    phoneForm.reset({ code: "" });
  }

  async function handleOrgSubmit() {
    setBanner(null);
    const ok = await orgForm.trigger();
    if (!ok)
      return false;

    const payload = orgValuesToPayload(orgForm.getValues());

    if (!applicationId) {
      try {
        const res = await createMutation.mutateAsync({ data: payload });
        setApplicationId(res.data.id);
        setStoredApplicationId(res.data.id);
        return true;
      }
      catch (error) {
        bindServerError(error as ServerErrorResponse);
        return false;
      }
    }

    try {
      await updateMutation.mutateAsync({
        id: applicationId, data: payload,
      });
      return true;
    }
    catch (error) {
      bindServerError(error as ServerErrorResponse);
      return false;
    }
  }

  async function handleUpload(id: string, file: File) {
    const entry = DOCUMENTS.find(d => d.id === id) as DocumentEntry | undefined;
    const localError = checkFile(
      file,
      entry?.pdfOnly,
    );
    setUploads(prev => ({
      ...prev, [id]: {
        file, error: localError,
      },
    }));
    if (localError || !applicationId)
      return;

    setBusyDocs(prev => ({
      ...prev, [id]: true,
    }));
    try {
      await uploadMutation.mutateAsync({
        id: applicationId,
        documentType: id as OnboardingUploadableDocumentType,
        file,
      });
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      setUploads(prev => ({
        ...prev, [id]: {
          file, error: err.message,
        },
      }));
    }
    finally {
      setBusyDocs(prev => ({
        ...prev, [id]: false,
      }));
    }
  }

  async function handleRemove(id: string) {
    setUploads(prev => ({
      ...prev, [id]: {
        file: null, error: null,
      },
    }));
    if (!applicationId || !application)
      return;
    const serverDoc = application.documents.find(d => d.documentType === id);
    if (!serverDoc)
      return;

    setBusyDocs(prev => ({
      ...prev, [id]: true,
    }));
    try {
      await deleteMutation.mutateAsync({
        id: applicationId, documentId: serverDoc.id,
      });
    }
    catch (error) {
      setBanner((error as ServerErrorResponse).message);
    }
    finally {
      setBusyDocs(prev => ({
        ...prev, [id]: false,
      }));
    }
  }

  async function sendEmail() {
    if (!applicationId)
      return;
    setBanner(null);
    try {
      const res = await sendEmailMutation.mutateAsync({ id: applicationId });
      const cooldown = Math.min(
        res.data.expiresInSeconds,
        60,
      );
      setEmailCooldownSeed(cooldown);
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      setBanner(err.message);
      if (err.retryAfterSeconds)
        setEmailCooldownSeed(err.retryAfterSeconds);
    }
  }

  async function sendPhone() {
    if (!applicationId)
      return;
    setBanner(null);
    try {
      const res = await sendPhoneMutation.mutateAsync({ id: applicationId });
      const cooldown = Math.min(
        res.data.expiresInSeconds,
        60,
      );
      setPhoneCooldownSeed(cooldown);
    }
    catch (error) {
      const err = error as ServerErrorResponse;
      setBanner(err.message);
      if (err.retryAfterSeconds)
        setPhoneCooldownSeed(err.retryAfterSeconds);
    }
  }

  async function verifyEmail(values: VerifyCodeValues) {
    if (!applicationId)
      return;
    setBanner(null);
    setEmailStatus("verifying");
    try {
      await verifyEmailMutation.mutateAsync({
        id: applicationId, data: values,
      });
      setEmailStatus("verified");
    }
    catch (error) {
      setEmailStatus("idle");
      setBanner((error as ServerErrorResponse).message);
      emailForm.reset({ code: "" });
    }
  }

  async function verifyPhone(values: VerifyCodeValues) {
    if (!applicationId)
      return;
    setBanner(null);
    setPhoneStatus("verifying");
    try {
      await verifyPhoneMutation.mutateAsync({
        id: applicationId, data: values,
      });
      setPhoneStatus("verified");
    }
    catch (error) {
      setPhoneStatus("idle");
      setBanner((error as ServerErrorResponse).message);
      phoneForm.reset({ code: "" });
    }
  }

  // Called when the applicant enters the email step — trigger send once.
  useEffect(
    () => {
      if (!open || !applicationId)
        return;
      if (step === 3 && emailStatus === "idle" && emailCooldown === 0 && !sendEmailMutation.isPending) {
        void sendEmail();
      }
      if (step === 4 && phoneStatus === "idle" && phoneCooldown === 0 && !sendPhoneMutation.isPending) {
        void sendPhone();
      }
    },
    // ponytail: intentionally narrow deps — we only fire when entering the step fresh.
    // eslint-disable-next-line react/exhaustive-deps
    [
      step,
      applicationId,
      open,
    ],
  );

  async function handleSubmit() {
    if (!applicationId)
      return;
    setBanner(null);
    try {
      const res = await submitMutation.mutateAsync({ id: applicationId });
      if ("incomplete" in res && res.incomplete) {
        setBanner(res.message);
        if (res.missingDocuments.length > 0) {
          setStep(1);
          return;
        }
        if (!res.emailVerified) {
          setEmailStatus("idle");
          setStep(3);
          return;
        }
        if (!res.phoneVerified) {
          setPhoneStatus("idle");
          setStep(4);
          return;
        }
        return;
      }
      setSubmitted(true);
    }
    catch (error) {
      setBanner((error as ServerErrorResponse).message);
    }
  }

  async function onContinue() {
    if (step === 0) {
      const ok = await handleOrgSubmit();
      if (!ok)
        return;
      setStep(1);
      return;
    }
    if (step === STEPS.length - 1) {
      await handleSubmit();
      return;
    }
    setStep(step + 1);
  }

  function onBack() {
    if (step === 0)
      setOpen(false);
    else setStep(step - 1);
  }

  async function changeEmailFromReview() {
    // Jump back to Organization to let the applicant edit the email. Once they
    // continue, updateMutation clears emailVerified server-side.
    setEmailStatus("idle");
    emailForm.reset({ code: "" });
    setEmailCooldownSeed(0);
    setEmailCooldown(0);
    setStep(0);
  }

  async function changePhoneFromReview() {
    setPhoneStatus("idle");
    phoneForm.reset({ code: "" });
    setPhoneCooldownSeed(0);
    setPhoneCooldown(0);
    setStep(0);
  }

  const continueLabel = useMemo(
    () => {
      if (step === STEPS.length - 1)
        return submitMutation.isPending ? "Submitting…" : "Submit";
      if (step === 0 && (createMutation.isPending || updateMutation.isPending))
        return "Saving…";
      return "Continue";
    },
    [
      step,
      submitMutation.isPending,
      createMutation.isPending,
      updateMutation.isPending,
    ],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          // Keep the token+id in sessionStorage so the applicant can resume.
          // Only reset local UI state.
          setBanner(null);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="flex h-[92vh] max-h-[940px] flex-col gap-0 overflow-hidden rounded-[28px] p-0 sm:max-w-[720px]"
      >
        <header className="flex items-start gap-5 border-b border-border-100 px-9 py-8">
          <span className="flex size-18 shrink-0 items-center justify-center rounded-2xl bg-[#FDF1CE]">
            <Rocket className="size-8 text-primary-100" />
          </span>
          <div className="flex-1 space-y-1">
            <DialogTitle className="text-2xl font-bold">Get Started</DialogTitle>
            <DialogDescription className="text-base text-[#4D4D4D]">
              Start Your Fleet Journey With Us By Following These Simple Steps.
            </DialogDescription>
          </div>
          <DialogClose
            className="cursor-pointer p-1"
            onClick={() => {
              if (submitted) {
                setOnboardingToken(null);
                setStoredApplicationId(null);
                reset();
              }
            }}
          >
            <X className="size-6" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </header>

        <Stepper
          current={step}
          submitted={submitted}
        />

        {banner && (
          <div className="border-b border-[#F8D7DA] bg-[#FDECEE] px-9 py-3 text-sm text-[#8B1F26]">
            {banner}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-9 py-10">
          {submitted && (
            <SubmittedStep
              email={orgValues.businessEmail}
              timeline={statusQuery.data?.data.timeline}
            />
          )}

          {!submitted && step === 0 && <OrganizationStep form={orgForm} />}

          {!submitted && step === 1 && (
            <UploadStep
              uploads={uploads}
              busy={busyDocs}
              onSelect={handleUpload}
              onRemove={handleRemove}
            />
          )}

          {!submitted && step === 2 && <DocumentCheckStep uploads={uploads} />}

          {!submitted && step === 3 && (
            emailStatus === "idle"
              ? (
                  <VerifyStep
                    form={emailForm}
                    description={(
                      <>
                        We've Sent A Verification Code To
                        {" "}
                        <span className="font-bold text-foreground">{orgValues.businessEmail}</span>
                      </>
                    )}
                    onVerify={verifyEmail}
                    onResend={sendEmail}
                    onChangeContact={changeEmailFromReview}
                    cooldownSeconds={emailCooldown}
                    isSending={sendEmailMutation.isPending}
                    isVerifying={verifyEmailMutation.isPending}
                    resendPrompt="Didn't receive the Email?"
                    resendLabel="Resend Email"
                    changePrompt="Made a mistake with the Email?"
                    changeLabel="Change Email"
                    actionLabel="Verify Email"
                  />
                )
              : (
                  <StatusScreen
                    status={emailStatus}
                    verifyingTitle="Verifying Your Email"
                    verifyingDescription="We Are Currently Verifying Your Email."
                    verifiedTitle="Email Verified"
                    verifiedDescription="We Have Successfully Verified Your Email."
                  />
                )
          )}

          {!submitted && step === 4 && (
            phoneStatus === "idle"
              ? (
                  <VerifyStep
                    form={phoneForm}
                    description="We'll Use This Number For Important Updates About Your Fleet Pro Application."
                    onVerify={verifyPhone}
                    onResend={sendPhone}
                    onChangeContact={changePhoneFromReview}
                    cooldownSeconds={phoneCooldown}
                    isSending={sendPhoneMutation.isPending}
                    isVerifying={verifyPhoneMutation.isPending}
                    resendPrompt="Didn't receive the Code?"
                    resendLabel="Resend Code"
                    changePrompt="Made a mistake with the Phone Number?"
                    changeLabel="Change Phone Number"
                    actionLabel="Verify Phone Number"
                  />
                )
              : (
                  <StatusScreen
                    status={phoneStatus}
                    verifyingTitle="Verifying Your Phone Number"
                    verifyingDescription="We Are Currently Verifying Your Phone Number."
                    verifiedTitle="Phone Number Verified"
                    verifiedDescription="We Have Successfully Verified Your Phone Number."
                  />
                )
          )}

          {!submitted && step === 5 && (
            <ReviewStep
              values={orgValues}
              uploads={uploads}
              onEdit={setStep}
            />
          )}
        </div>

        {!submitted && (
          <footer className="flex items-center justify-between border-t border-border-100 px-9 py-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="h-13 gap-3 text-base font-medium"
            >
              <ArrowLeft className="size-5" />
              Back
            </Button>
            <Button
              onClick={onContinue}
              disabled={!canContinue || createMutation.isPending || updateMutation.isPending || submitMutation.isPending}
              className="h-13 gap-3 px-10 text-base font-bold"
            >
              {continueLabel}
              <ArrowRight className="size-5" />
            </Button>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
