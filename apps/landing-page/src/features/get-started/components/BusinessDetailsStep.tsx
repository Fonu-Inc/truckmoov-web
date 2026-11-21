"use client";

import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { BusinessDetailsValues } from "@/features/get-started/schemas/applySchemas";
import type { ApplicantCustomerType } from "@/features/get-started/utils/applyTypes";
import { Envelope } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingM2mPlansQueryOptions } from "@truckmoov/api/auth";
import { Check } from "lucide-react";
import { useState } from "react";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import {
  InfoRow,
  Notice,
  SectionHeading,
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import { SubDialog } from "@/features/get-started/components/SubDialog";
import { useEmailAvailability } from "@/features/get-started/hooks/useEmailAvailability";
import { useApplyDraftStore } from "@/features/get-started/stores/applyDraftStore";
import {
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

/** The design's field label: every Customer Details field is required. The label is flex gap-2,
 * so -ml-1.5 sits the asterisk 2px from the text, as in the design. */
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
 * Customer details and the M2M licence plan (main app: BusinessDetailsStep), exactly the
 * design's fields. The plan is checked here, outside zod, because the server has no field
 * for it on the details body.
 *
 * ponytail: the design has no RC Number / TIN / ID fields and no indemnity signature, so
 * none are collected; the API's submit gate may refuse until it stops requiring them.
 */
export function BusinessDetailsStep({
  form,
  customerType,
  submitting,
  saveError,
  applicationId,
  emailConflict = 0,
  onSubmit,
  onBack,
}: {
  form: UseFormReturn<BusinessDetailsValues>;
  customerType: ApplicantCustomerType;
  submitting: boolean;
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
  const plansQuery = useQuery(getOnboardingM2mPlansQueryOptions());
  const plans = plansQuery.data?.data.plans ?? [];
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
    // A taken company email opens the design's "You already have a Fleet Pro account" dialog.
    if (emailTaken) {
      setExistingAccountOpen(true);
      return;
    }
    if (!licence.licensePlan) {
      setSectionError("Select a license plan to continue.");
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
        description="Complete Your Customer Information And Select A License Plan."
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
              {textField(
                "city",
                "City",
                { placeholder: "Lagos" },
              )}
              {textField(
                "state",
                "State",
                { placeholder: "Lagos State" },
              )}
            </div>
          </section>

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
                  </button>
                );
              })}
            </div>
            <InfoRow className="mt-4 text-xs text-muted-foreground">
              Your M2M License plan is priced per device. Your final quotation will be calculated
              based on the number of devices requested.
            </InfoRow>
          </section>

          {(sectionError || saveError) && <Notice>{sectionError ?? saveError}</Notice>}
        </form>
      </Form>

      <SubDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        title="You already have a Fleet Pro account"
        description={`An account already exists for ${form.getValues("businessEmail")}. We have emailed you the details of your existing account so you can sign in instead of applying again.`}
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
