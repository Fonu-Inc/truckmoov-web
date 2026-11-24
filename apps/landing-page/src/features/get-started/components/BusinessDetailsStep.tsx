"use client";

import type { ApplicantCustomerType } from "@truckmoov/app-core/apply/applyTypes";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { BusinessDetailsValues } from "@/features/get-started/schemas/applySchemas";
import {
  Envelope, FileText,
} from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import {
  CITIES_BY_STATE,
  getOnboardingM2mPlansQueryOptions,
} from "@truckmoov/api/auth";
import { Check } from "lucide-react";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import { IndemnityDialog } from "@/features/get-started/components/IndemnityDialog";
import {
  InfoRow,
  Notice,
  SectionHeading,
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import { SubDialog } from "@/features/get-started/components/SubDialog";
import { TelecomMasterSection } from "@/features/get-started/components/TelecomMasterSection";
import { useEmailAvailability } from "@/features/get-started/hooks/useEmailAvailability";
import {
  companyNameMatches,
  NIGERIAN_STATES,
} from "@/features/get-started/schemas/applySchemas";
import { useApplyDraftStore } from "@/features/get-started/stores/applyDraftStore";
import {
  CARD_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
  LINK_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils";
import { SIGN_IN_URL } from "@/shared/utils/routes";

const FORM_ID = "apply-business-details-form";

/**
 * The design's field label: every Customer Details field is required. The label is flex gap-2,
 * so -ml-1.5 sits the asterisk 2px from the text, as in the design.
 */
function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <FormLabel className={LABEL_CLASS}>
      {children}
      <span className="-ml-1.5 text-destructive">*</span>
    </FormLabel>
  );
}

type TextFieldName = Exclude<keyof BusinessDetailsValues, "identificationType">;

/**
 * Customer details, the M2M licence plan and the indemnity signature (main app:
 * BusinessDetailsStep). The plan and indemnity are checked here, outside zod, because the
 * server has no field for them on the details body. A signature drawn before the
 * application exists is uploaded right after it is saved (see GetStartedDialog).
 */
export function BusinessDetailsStep({
  form,
  customerType,
  submitting,
  indemnitySigned: signedOnServer,
  indemnityNotice,
  saveError,
  applicationId,
  emailConflict = 0,
  onSubmit,
  onBack,
}: {
  form: UseFormReturn<BusinessDetailsValues>;
  customerType: ApplicantCustomerType;
  submitting: boolean;
  /** Whether the server already holds a signature for the current agreement. */
  indemnitySigned: boolean;
  /** Set when the agreement changed since the applicant signed. */
  indemnityNotice?: string | null;
  /** Error from the last save that belongs to no single field. */
  saveError?: string | null;
  /** Lets the email check ignore the application being edited. */
  applicationId?: string | null;
  /** Bumped when the save answers 409 for the email — opens the existing-account dialog. */
  emailConflict?: number;
  onSubmit: (values: BusinessDetailsValues) => void;
  onBack: () => void;
}) {
  const emailTaken = useEmailAvailability(
    form,
    applicationId,
  );
  const isEnterprise = customerType === "enterprise";
  const licence = useApplyDraftStore(state => state.licence);
  const setLicence = useApplyDraftStore(state => state.setLicence);
  const pendingSignature = useApplyDraftStore(state => state.pendingSignature);
  const setPendingSignature = useApplyDraftStore(state => state.setPendingSignature);
  const plansQuery = useQuery(getOnboardingM2mPlansQueryOptions());
  const plans = plansQuery.data?.data.plans ?? [];
  const indemnitySigned = signedOnServer || Boolean(pendingSignature);
  const [
    indemnityOpen,
    setIndemnityOpen,
  ] = useState(false);
  const [
    existingAccountOpen,
    setExistingAccountOpen,
  ] = useState(false);
  // The save answered 409 for the email: a count above the last one dismissed shows the
  // same dialog (derived, so coming back to this step doesn't reopen an old conflict).
  const [
    dismissedConflict,
    setDismissedConflict,
  ] = useState(emailConflict);
  const accountDialogOpen = existingAccountOpen || emailConflict > dismissedConflict;
  const [
    sectionError,
    setSectionError,
  ] = useState<string | null>(null);

  function setAccountDialogOpen(open: boolean) {
    setExistingAccountOpen(open);
    if (!open)
      setDismissedConflict(emailConflict);
  }

  function handleValid(values: BusinessDetailsValues) {
    if (!(CITIES_BY_STATE[values.state] ?? []).includes(values.city)) {
      form.setError(
        "city",
        { message: "Select your city." },
      );
      return;
    }
    // A taken company email opens the design's "You already have a Fleet Pro account" dialog.
    if (emailTaken) {
      setExistingAccountOpen(true);
      return;
    }
    if (!licence.licensePlan) {
      setSectionError("Select a license plan to continue.");
      return;
    }
    if (!indemnitySigned) {
      setSectionError("Review and electronically sign the indemnity form.");
      return;
    }
    if (!licence.indemnityAccepted) {
      setSectionError("Confirm that you have reviewed the indemnity form.");
      return;
    }
    // A signature not yet uploaded is checked against the name being saved with it.
    if (pendingSignature && !companyNameMatches(
      pendingSignature.name,
      values.organizationName,
    )) {
      setSectionError("The name on your indemnity signature no longer matches your company name. Sign the form again.");
      return;
    }
    setSectionError(null);
    onSubmit(values);
  }

  const textField = (name: TextFieldName, label: string, options: {
    placeholder?: string;
    type?: string;
    wide?: boolean;
  } = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(
          "col-span-2 gap-1.5",
          !options.wide && "sm:col-span-1",
        )}
        >
          <RequiredLabel>{label}</RequiredLabel>
          <FormControl>
            <Input
              type={options.type ?? "text"}
              placeholder={options.placeholder}
              className={FIELD_CLASS}
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );

  // useWatch, not form.watch: React Compiler memoises form.watch() on `form`,
  // which froze the State at "" and left City disabled.
  const selectedState = useWatch({
    control: form.control,
    name: "state",
  });
  const organizationName = useWatch({
    control: form.control,
    name: "organizationName",
  });
  const businessEmail = useWatch({
    control: form.control,
    name: "businessEmail",
  });
  const cities = CITIES_BY_STATE[selectedState] ?? [];

  const selectField = (name: "state" | "city", label: string, options: readonly string[], placeholder: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="col-span-2 gap-1.5 sm:col-span-1">
          <RequiredLabel>{label}</RequiredLabel>
          <FormControl>
            <select
              aria-label={label}
              value={field.value ?? ""}
              disabled={name === "city" && !selectedState}
              onBlur={field.onBlur}
              onChange={(event) => {
                field.onChange(event.target.value);
                // A city belongs to one state: changing the state clears it.
                if (name === "state") {
                  form.setValue(
                    "city",
                    "",
                  );
                }
              }}
              className={cn(
                FIELD_CLASS,
                !field.value && "text-faint-foreground",
              )}
            >
              <option value="">{placeholder}</option>
              {options.map(option => (
                <option
                  key={option}
                  value={option}
                  className="text-heading"
                >
                  {option}
                </option>
              ))}
            </select>
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );

  return (
    <StepLayout
      footer={(
        <DialogFooter
          onBack={onBack}
          form={FORM_ID}
          continueLabel="Continue"
          continueArrow={false}
          continueLoading={submitting}
        />
      )}
    >
      <StepHeading
        title="Customer Details"
        description="Complete your customer information, select a license plan, and review the indemnity form."
      />

      <Form {...form}>
        <form
          id={FORM_ID}
          className="mt-[34px] space-y-[34px]"
          onSubmit={form.handleSubmit(handleValid)}
        >
          <section>
            <SectionHeading
              title="Business Details"
              description="Provide the primary details for this application."
            />
            <div className="grid grid-cols-2 gap-x-[15px] gap-y-[19px]">
              {!isEnterprise && (
                <>
                  {textField(
                    "firstName",
                    "First Name",
                    { placeholder: "John" },
                  )}
                  {textField(
                    "lastName",
                    "Last Name",
                    { placeholder: "Adeyemi" },
                  )}
                </>
              )}
              {textField(
                "organizationName",
                isEnterprise ? "Company Name" : "Organization Name",
                { placeholder: isEnterprise ? "Enter company name" : "Lagos Express Logistics Ltd" },
              )}
              {textField(
                "businessEmail",
                "Company Email Address",
                {
                  type: "email",
                  placeholder: isEnterprise ? "operations@company.com" : "you@company.com",
                },
              )}
              {textField(
                "phoneNumber",
                "Company Phone Number",
                {
                  type: "tel",
                  placeholder: "+234 901 234 5678",
                },
              )}
              {isEnterprise && textField(
                "contactName",
                "Contact Person’s Full Name",
                { placeholder: "Adaeze Okonkwo" },
              )}
              {textField(
                "streetAddress",
                isEnterprise ? "Company Address" : "Business Address",
                {
                  placeholder: "123 Apapa-Oshodi Expressway",
                  wide: isEnterprise,
                },
              )}
              {selectField(
                "state",
                "State",
                NIGERIAN_STATES,
                "Select state",
              )}
              {selectField(
                "city",
                "City",
                cities,
                selectedState ? "Select city" : "Select a state first",
              )}
            </div>
          </section>

          {isEnterprise && <TelecomMasterSection form={form} />}

          <section>
            <SectionHeading
              title="Choose Your M2M License Plan"
              description="Your M2M license plan is charged per device and determines the bundled cost for each device."
            />
            <div
              role="radiogroup"
              aria-label="M2M Plan"
              className="grid gap-[9px] sm:grid-cols-2"
            >
              {plansQuery.isLoading && <p className="text-sm text-muted-foreground">Loading plans…</p>}
              {plansQuery.isError && (
                <p className="text-sm text-destructive">
                  Plans couldn't be loaded.
                  {" "}
                  <button
                    type="button"
                    className={LINK_CLASS}
                    onClick={() => void plansQuery.refetch()}
                  >
                    Try again
                  </button>
                </p>
              )}
              {plans.map((plan) => {
                const selected = licence.licensePlan === plan.code;
                return (
                  <button
                    key={plan.code}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setLicence({ licensePlan: plan.code });
                      setSectionError(null);
                    }}
                    className={cn(
                      "flex cursor-pointer flex-col gap-4 rounded-[20px] bg-background p-5 text-left transition-colors",
                      selected
                        ? "border-2 border-brand-bright"
                        : "border-[0.5px] border-border hover:border-border-deep",
                    )}
                  >
                    <span className="flex w-full items-start justify-between gap-3">
                      <span className="space-y-1">
                        <span className="block text-base leading-5 font-semibold text-heading">{plan.name}</span>
                        <span className="block text-xs leading-[17px] text-muted-foreground">{plan.description}</span>
                      </span>
                      <span className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full",
                        selected ? "bg-brand-deep" : "border border-border-field bg-field",
                      )}
                      >
                        {selected && (
                          <Check
                            className="size-2.5 text-field-soft"
                            strokeWidth={3}
                          />
                        )}
                      </span>
                    </span>
                    <span className="flex w-full flex-col gap-1 rounded-[15px] bg-surface p-3">
                      <span className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-heading">{`₦${plan.perDeviceYear1Ngn.toLocaleString()}`}</span>
                        <span className="text-xs text-muted-foreground">per device, Year 1</span>
                      </span>
                      <span className="flex items-baseline gap-1.5">
                        <span className="text-sm font-semibold text-heading">{`₦${plan.perDeviceRenewalNgn.toLocaleString()}`}</span>
                        <span className="text-xs text-muted-foreground">per device, Renewal</span>
                      </span>
                    </span>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      selected ? "bg-brand-deep text-field-soft" : "bg-surface text-muted-foreground",
                    )}
                    >
                      {selected ? "Selected" : `Select ${plan.name}`}
                    </span>
                  </button>
                );
              })}
            </div>
            <InfoRow className="mt-4 text-xs text-muted-foreground">
              Your M2M License plan is priced per device. Your final quotation will be calculated
              based on the number of devices requested.
            </InfoRow>
          </section>

          <section>
            <SectionHeading
              title="Indemnity Agreement"
              description="Please review the indemnity form before completing your application."
            />
            <div className={cn(
              CARD_CLASS,
              "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
            )}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-brand-tint">
                  <FileText className="size-5 text-brand-deep" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-heading">Fleet Pro Indemnity Form</p>
                  <p className="text-xs text-muted-foreground">
                    {signedOnServer
                      ? "Electronically signed"
                      : pendingSignature
                        ? "Signed, saved with your details when you continue"
                        : "Review and sign electronically"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={SECONDARY_BUTTON_CLASS}
                onClick={() => setIndemnityOpen(true)}
              >
                {indemnitySigned ? "Review Signature" : "View & Sign Form"}
              </button>
            </div>
            <InfoRow className="mt-3 text-xs text-muted-foreground">
              Review and electronically sign the form here. No separate upload is required.
            </InfoRow>

            <label className={cn(
              "mt-4 flex items-start gap-3 rounded-[15px] border-[0.5px] border-border p-4 text-sm leading-5 text-heading",
              indemnitySigned ? "cursor-pointer" : "cursor-not-allowed opacity-70",
            )}
            >
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-brand-deep"
                checked={licence.indemnityAccepted}
                disabled={!indemnitySigned}
                onChange={(event) => {
                  setLicence({ indemnityAccepted: event.target.checked });
                  setSectionError(null);
                }}
              />
              {indemnitySigned
                ? "I confirm that I have reviewed the indemnity form and agree to its terms."
                : "Sign the indemnity form before confirming your agreement."}
            </label>
          </section>

          {indemnityNotice && !pendingSignature && <Notice>{indemnityNotice}</Notice>}
          {(sectionError || saveError) && <Notice>{sectionError ?? saveError}</Notice>}
        </form>
      </Form>

      <IndemnityDialog
        open={indemnityOpen}
        onOpenChange={setIndemnityOpen}
        initialName={licence.indemnitySignatureName}
        companyName={organizationName}
        notice={indemnityNotice}
        onSigned={({
          method,
          name,
          image,
          version,
        }) => {
          setPendingSignature({
            method,
            name,
            image,
            version,
          });
          // Re-signing clears the confirmation, matching the main app.
          setLicence({
            indemnitySignatureName: name,
            indemnityAccepted: false,
          });
          setSectionError(null);
        }}
      />

      <SubDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        title="You already have a Fleet Pro account"
        description={`An account already exists for ${businessEmail}. We have emailed you the details of your existing account so you can sign in instead of applying again.`}
        footer={(
          <>
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              onClick={() => setAccountDialogOpen(false)}
            >
              Use a different email
            </button>
            <button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              onClick={() => window.location.assign(SIGN_IN_URL)}
            >
              Go to sign in
            </button>
          </>
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-tint">
          <Envelope className="size-6 text-brand-deep" />
        </span>
      </SubDialog>

    </StepLayout>
  );
}
