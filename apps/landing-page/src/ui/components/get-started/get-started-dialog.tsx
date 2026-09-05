import type {
  OrganizationFormValues,
  Uploads,
  VerifyCodeValues,
  VerifyStatus,
} from "./get-started-data";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Rocket,
  X,
} from "lucide-react";
import { useState } from "react";

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
  EMPTY_UPLOADS,
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

const VERIFY_DELAY_MS = 1200;

const EMPTY_ORG_VALUES: OrganizationFormValues = {
  applicantType: undefined as unknown as OrganizationFormValues["applicantType"],
  organizationName: "",
  businessEmail: "",
  phone: "",
  contactName: "",
  contactRole: "",
  address: "",
};

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

  function reset() {
    setStep(0);
    setSubmitted(false);
    setUploads(EMPTY_UPLOADS);
    setEmailStatus("idle");
    setPhoneStatus("idle");
    orgForm.reset(EMPTY_ORG_VALUES);
    emailForm.reset({ code: "" });
    phoneForm.reset({ code: "" });
  }

  function setUpload(id: string, file: File | null) {
    setUploads(previous => ({
      ...previous,
      [id]: {
        file,
        error: file ? checkFile(file) : null,
      },
    }));
  }

  // ponytail: mocked — swap for the real verify mutation when wiring the API.
  function fakeVerify(setStatus: (status: VerifyStatus) => void) {
    setStatus("verifying");
    setTimeout(
      setStatus,
      VERIFY_DELAY_MS,
      "verified",
    );
  }

  const documentsReady = Object.values(uploads).every(upload => upload.file && !upload.error);
  const canContinue = [
    orgForm.formState.isValid,
    documentsReady,
    documentsReady,
    emailStatus === "verified",
    phoneStatus === "verified",
    true,
  ][step];

  async function onContinue() {
    if (step === 0) {
      const ok = await orgForm.trigger();
      if (!ok)
        return;
    }
    if (step === STEPS.length - 1)
      setSubmitted(true);
    else
      setStep(step + 1);
  }

  function onBack() {
    if (step === 0)
      setOpen(false);
    else
      setStep(step - 1);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next)
          reset();
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
          <DialogClose className="cursor-pointer p-1">
            <X className="size-6" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </header>

        <Stepper
          current={step}
          submitted={submitted}
        />

        <div className="flex-1 overflow-y-auto px-9 py-10">
          {submitted && <SubmittedStep email={orgValues.businessEmail} />}

          {!submitted && step === 0 && <OrganizationStep form={orgForm} />}

          {!submitted && step === 1 && (
            <UploadStep
              uploads={uploads}
              onSelect={setUpload}
              onRemove={id => setUpload(
                id,
                null,
              )}
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
                    onVerify={() => fakeVerify(setEmailStatus)}
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
                    verifiedDescription="We Have Successfully Verified  Your Email."
                  />
                )
          )}

          {!submitted && step === 4 && (
            phoneStatus === "idle"
              ? (
                  <VerifyStep
                    form={phoneForm}
                    description="We'll Use This Number For Important Updates About Your Fleet Pro Application."
                    onVerify={() => fakeVerify(setPhoneStatus)}
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
                    verifiedDescription="We Have Successfully Verified  Your Phone Number."
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
              disabled={!canContinue}
              className="h-13 gap-3 px-10 text-base font-bold"
            >
              Continue
              <ArrowRight className="size-5" />
            </Button>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
