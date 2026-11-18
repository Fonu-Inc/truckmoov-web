import type { OnboardingUploadableDocumentType } from "@truckmoov/api/auth";
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
  useEffect, useMemo, useRef, useState,
} from "react";

import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/ui/shadcn/dialog";
import { DialogFooter } from "./dialog-footer";
import { DialogHeader } from "./dialog-header";
import { DocumentCheckStep } from "./document-check-step";
import {
  checkFile,
  DOCUMENTS,
  EMPTY_UPLOADS,
  organizationSchema,
  STEPS,
  verifyCodeSchema,
} from "./get-started-data";
import {
  applicationToOrgValues,
  EMPTY_ORG_VALUES,
  getStoredApplicationId,
  orgValuesToPayload,
  SERVER_FIELD_TO_FORM_FIELD,
  setStoredApplicationId,
} from "./get-started-helpers";
import { OrganizationStep } from "./organization-step";
import { OtpStep } from "./otp-step";
import { ReviewStep } from "./review-step";
import { StatusScreen } from "./status-screen";
import { Stepper } from "./stepper";
import { SubmittedStep } from "./submitted-step";
import { UploadStep } from "./upload-step";
import { useCountdown } from "./use-countdown";

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

  // The verifying screens have no footer in the design — the request is in flight.
  const verifyingNow = (step === 3 && emailStatus === "verifying")
    || (step === 4 && phoneStatus === "verifying");

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
        className="flex h-[800px] max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-[30px] border-border-field p-0 shadow-float sm:max-w-[600px]"
      >
        <DialogHeader
          onClose={() => {
            if (submitted) {
              setOnboardingToken(null);
              setStoredApplicationId(null);
              reset();
            }
          }}
        />

        <Stepper
          steps={STEPS}
          current={step}
          submitted={submitted}
        />

        {banner && (
          <div
            role="alert"
            className="shrink-0 border-b border-destructive/20 bg-destructive/10 px-7 py-3 text-sm text-destructive"
          >
            {banner}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 sm:px-7">
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
                  <OtpStep
                    form={emailForm}
                    title="Verify your email"
                    description={(
                      <>
                        We've Sent A Verification Code To
                        {" "}
                        <span className="font-semibold">{orgValues.businessEmail}</span>
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
                  <OtpStep
                    form={phoneForm}
                    title="Verify your phone number"
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

        {!submitted && !verifyingNow && (
          <DialogFooter
            onBack={onBack}
            onContinue={onContinue}
            continueLabel={continueLabel}
            continueDisabled={!canContinue || createMutation.isPending || updateMutation.isPending || submitMutation.isPending}
            backMuted={step === 0}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
