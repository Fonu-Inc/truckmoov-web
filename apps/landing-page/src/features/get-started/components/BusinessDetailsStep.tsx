"use client";

import type { UseFormReturn } from "react-hook-form";
import type { BusinessDetailsValues } from "@/features/get-started/schemas/applySchemas";
import type { ApplicantCustomerType } from "@/features/get-started/utils/applyTypes";
import { FileText } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingM2mPlansQueryOptions } from "@truckmoov/api/auth";
import { Check } from "lucide-react";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import { CityInput } from "@/features/get-started/components/CityInput";
import { DialogFooter } from "@/features/get-started/components/DialogFooter";
import { IndemnityDialog } from "@/features/get-started/components/IndemnityDialog";
import {
  InfoRow,
  Notice,
  SectionHeading,
  StepHeading,
  StepLayout,
} from "@/features/get-started/components/StepParts";
import { useEmailAvailability } from "@/features/get-started/hooks/useEmailAvailability";
import {
  IDENTIFICATION_TYPES,
  NIGERIAN_STATES,
} from "@/features/get-started/schemas/applySchemas";
import { useApplyDraftStore } from "@/features/get-started/stores/applyDraftStore";
import {
  CARD_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
  LINK_CLASS,
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

const FORM_ID = "apply-business-details-form";

type TextFieldName = Exclude<keyof BusinessDetailsValues, "state" | "identificationType">;

/**
 * Customer details, M2M licence plan and the indemnity signature (main app:
 * BusinessDetailsStep). The plan and indemnity are checked here, outside zod, because the
 * server has no field for them on the details body.
 */
export function BusinessDetailsStep({
  form,
  customerType,
  submitting,
  indemnitySigned: signedOnServer,
  indemnityNotice,
  saveError,
  applicationId,
  savingForLater,
  onSubmit,
  onBack,
  onSaveForLater,
}: {
  form: UseFormReturn<BusinessDetailsValues>;
  customerType: ApplicantCustomerType;
  submitting: boolean;
  /** Signed on the server already (the generated form is in the documents). */
  indemnitySigned: boolean;
  /** Set when the agreement changed under the applicant and they must sign again. */
  indemnityNotice?: string | null;
  /** Error from the last save that belongs to no single field. */
  saveError?: string | null;
  /** Lets the email check ignore the application being edited. */
  applicationId?: string | null;
  savingForLater: boolean;
  onSubmit: (values: BusinessDetailsValues) => void;
  onBack: () => void;
  onSaveForLater: () => void;
}) {
  useEmailAvailability(
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
  // A signature drawn before the application exists is uploaded right after it is saved.
  const indemnitySigned = signedOnServer || Boolean(pendingSignature);
  const state = useWatch({
    control: form.control,
    name: "state",
  });
  const [
    indemnityOpen,
    setIndemnityOpen,
  ] = useState(false);
  const [
    sectionError,
    setSectionError,
  ] = useState<string | null>(null);

  function handleValid(values: BusinessDetailsValues) {
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
          <FormLabel className={LABEL_CLASS}>{label}</FormLabel>
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
          continueLoading={submitting}
          extra={(
            <button
              type="button"
              className={cn(
                LINK_CLASS,
                "order-last w-full text-center text-xs sm:order-none sm:w-auto",
              )}
              disabled={savingForLater}
              onClick={onSaveForLater}
            >
              {savingForLater ? "Sending link…" : "Save & Continue Later"}
            </button>
          )}
        />
      )}
    >
      <StepHeading
        title="Customer Details"
        description="Complete Your Customer Information, Select A License Plan, And Review The Indemnity Form."
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
                {
                  placeholder: "Lagos Express Logistics Ltd",
                  wide: true,
                },
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

              {isEnterprise && (
                <>
                  {textField(
                    "rcNumber",
                    "RC Number",
                    { placeholder: "RC1234567" },
                  )}
                  {textField(
                    "taxIdentificationNumber",
                    "Tax Identification Number (TIN)",
                    { placeholder: "12345678-0001" },
                  )}
                  {textField(
                    "contactName",
                    "Contact Person's Full Name",
                    {
                      placeholder: "Adaeze Okonkwo",
                      wide: true,
                    },
                  )}
                </>
              )}

              {!isEnterprise && (
                <>
                  <FormField
                    control={form.control}
                    name="identificationType"
                    render={({ field }) => (
                      <FormItem className="col-span-2 gap-1.5 sm:col-span-1">
                        <FormLabel className={LABEL_CLASS}>ID Type</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className={cn(
                              FIELD_CLASS,
                              !field.value && "text-faint-foreground",
                            )}
                          >
                            <option value="">Select an ID type</option>
                            {IDENTIFICATION_TYPES.map(type => (
                              <option
                                key={type.value}
                                value={type.value}
                                className="text-heading"
                              >
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  {textField(
                    "identificationNumber",
                    "ID Number",
                  )}
                </>
              )}

              {textField(
                "streetAddress",
                isEnterprise ? "Company Address" : "Business Address",
                {
                  placeholder: "123 Apapa-Oshodi Expressway",
                  wide: true,
                },
              )}

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="col-span-2 gap-1.5 sm:col-span-1">
                    <FormLabel className={LABEL_CLASS}>State</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          field.onChange(event.target.value);
                          form.setValue(
                            "city",
                            "",
                          );
                        }}
                        className={cn(
                          FIELD_CLASS,
                          !field.value && "text-faint-foreground",
                        )}
                      >
                        <option
                          value=""
                          disabled
                        >
                          Select a state
                        </option>
                        {NIGERIAN_STATES.map(name => (
                          <option
                            key={name}
                            value={name}
                            className="text-heading"
                          >
                            {name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="col-span-2 gap-1.5 sm:col-span-1">
                    <FormLabel className={LABEL_CLASS}>City</FormLabel>
                    <FormControl>
                      <CityInput
                        state={state ?? ""}
                        value={field.value}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
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
                {indemnitySigned ? "Review & Re-sign" : "View & Sign Form"}
              </button>
            </div>

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
    </StepLayout>
  );
}
