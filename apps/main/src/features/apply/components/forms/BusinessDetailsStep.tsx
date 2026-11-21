import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { BusinessDetailsValues } from "@/features/apply/utils/applySchemas";
import type { ApplicantCustomerType } from "@/features/apply/utils/applyTypes";

import { useQuery } from "@tanstack/react-query";
import { getOnboardingM2mPlansQueryOptions } from "@truckmoov/api/auth";
import {
  Check,
  Mail,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { useApplyDraftStore } from "@/features/apply/stores/applyDraftStore";
import { useEmailAvailability } from "@/features/apply/utils/useEmailAvailability";
import { cn } from "@/lib/utils";

export const BUSINESS_DETAILS_FORM_ID = "apply-business-details-form";

type FieldName = keyof BusinessDetailsValues;

type BusinessDetailsStepProps = {
  form: UseFormReturn<BusinessDetailsValues>;
  customerType: ApplicantCustomerType;
  submitting: boolean;
  /** Error from the last save that belongs to no single field. */
  saveError?: string | null;
  nextLabel?: string;
  /** Lets the email check ignore the application being edited. */
  applicationId?: string | null;
  /** Bumped when the save answers 409 for the email — opens the existing-account dialog. */
  emailConflict?: number;
  onSubmit: (values: BusinessDetailsValues) => void;
};

/**
 * Customer Details, field for field as the design app has it: business details and the
 * M2M license plan. Every field is a plain text input; the state is normalised to the
 * canonical name by the schema.
 */
export function BusinessDetailsStep({
  form,
  customerType,
  submitting,
  saveError,
  nextLabel = "Continue",
  applicationId,
  emailConflict = 0,
  onSubmit,
}: BusinessDetailsStepProps) {
  const navigate = useNavigate();
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
  const [
    sectionError,
    setSectionError,
  ] = useState<string | null>(null);

  // The save answered 409 for the email: show the same dialog.
  useEffect(
    () => {
      if (emailConflict)
        setExistingAccountOpen(true);
    },
    [emailConflict],
  );

  function handleValid(values: BusinessDetailsValues) {
    // A taken company email opens the design's "You already have a Fleet Pro account" dialog.
    if (emailTaken) {
      setExistingAccountOpen(true);
      return;
    }
    // ponytail: the plan lives outside the zod schema (it is sent as m2mPlanCode).
    if (!licence.licensePlan) {
      setSectionError("Select a license plan to continue.");
      return;
    }
    setSectionError(null);
    onSubmit(values);
  }

  const field = (name: FieldName, label: string, placeholder: string, options: {
    type?: string;
    className?: string;
  } = {}): ReactNode => (
    <FormField
      key={name}
      control={form.control}
      name={name}
      render={({ field: input }) => (
        <FormItem className={cn(
          "space-y-1.5",
          options.className,
        )}
        >
          <FormLabel className="text-sm">
            {label}
            <span className="ml-0.5 text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <Input
              type={options.type}
              placeholder={placeholder}
              {...input}
              value={input.value ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Customer Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your customer information and select a license plan.
        </p>
      </div>

      <Form {...form}>
        <form
          id={BUSINESS_DETAILS_FORM_ID}
          className="space-y-8"
          onSubmit={form.handleSubmit(handleValid)}
        >
          {/* ─── Business Details ─────────────────────────────────────────── */}
          <section className="space-y-5 border-b border-border/60 pb-8">
            <div>
              <h3 className="text-base font-semibold text-foreground">Business Details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Provide the primary details for this application.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {isEnterprise
                ? [
                    field(
                      "organizationName",
                      "Company Name",
                      "Enter company name",
                    ),
                    field(
                      "businessEmail",
                      "Company Email Address",
                      "operations@company.com",
                      { type: "email" },
                    ),
                    field(
                      "phoneNumber",
                      "Company Phone Number",
                      "+234 901 234 5678",
                    ),
                    field(
                      "contactName",
                      "Contact Person’s Full Name",
                      "Adaeze Okonkwo",
                    ),
                    field(
                      "streetAddress",
                      "Company Address",
                      "123 Apapa-Oshodi Expressway",
                      { className: "sm:col-span-2" },
                    ),
                    field(
                      "city",
                      "City",
                      "Lagos",
                    ),
                    field(
                      "state",
                      "State",
                      "Lagos State",
                    ),
                  ]
                : [
                    field(
                      "firstName",
                      "First Name",
                      "John",
                    ),
                    field(
                      "lastName",
                      "Last Name",
                      "Adeyemi",
                    ),
                    field(
                      "organizationName",
                      "Organization Name",
                      "Lagos Express Logistics Ltd",
                    ),
                    field(
                      "businessEmail",
                      "Company Email Address",
                      "you@company.com",
                      { type: "email" },
                    ),
                    field(
                      "phoneNumber",
                      "Company Phone Number",
                      "+234 901 234 5678",
                    ),
                    field(
                      "streetAddress",
                      "Business Address",
                      "123 Apapa-Oshodi Expressway",
                    ),
                    field(
                      "city",
                      "City",
                      "Lagos",
                    ),
                    field(
                      "state",
                      "State",
                      "Lagos State",
                    ),
                  ]}
            </div>
          </section>

          {/* ─── M2M License Plan ─────────────────────────────────────────── */}
          <section className="space-y-5 border-b border-border/60 pb-8">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Choose Your M2M License Plan
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your M2M license plan is charged per device and determines the bundled cost for
                each device.
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label="M2M Plan"
              className="grid gap-4 sm:grid-cols-2"
            >
              {plansQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Loading plans…</p>
              )}
              {plansQuery.isError && (
                <p className="text-sm text-destructive">
                  Plans couldn't be loaded.
                  {" "}
                  <button
                    type="button"
                    className="font-medium underline"
                    onClick={() => plansQuery.refetch()}
                  >
                    Try again
                  </button>
                </p>
              )}
              {plans.map((plan) => {
                const selected = licence.licensePlan === plan.code;
                const title = plan.name;

                return (
                  <div
                    key={plan.code}
                    className={cn(
                      "relative flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-all",
                      selected && "border-primary bg-primary/5 ring-1 ring-primary/30",
                    )}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className="flex flex-col items-start gap-4 text-left"
                      onClick={() => {
                        setLicence({ licensePlan: plan.code });
                        setSectionError(null);
                      }}
                    >
                      <span className="flex w-full items-start justify-between gap-3">
                        <span className="flex flex-col gap-1">
                          <span className="text-base font-semibold text-foreground">{title}</span>
                          <span className="text-sm text-muted-foreground">{plan.description}</span>
                        </span>
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card",
                          )}
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </span>

                      <span className="flex w-full flex-col gap-1 rounded-xl border border-border/60 bg-muted/30 p-3">
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-foreground">
                            {`₦${plan.perDeviceYear1Ngn.toLocaleString()}`}
                          </span>
                          <span className="text-xs text-muted-foreground">per device — Year 1</span>
                        </span>
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-sm font-semibold text-foreground">
                            {`₦${plan.perDeviceRenewalNgn.toLocaleString()}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            per device — Renewal
                          </span>
                        </span>
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {selected ? "Selected" : `Select ${title}`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                i
              </span>
              Your M2M License plan is priced per device. Your final quotation will be calculated
              based on the number of devices requested.
            </p>
          </section>

          {(sectionError || saveError) && (
            <p className="text-sm text-destructive">{sectionError ?? saveError}</p>
          )}

          <div className="flex justify-end border-t border-border/60 pt-6">
            <Button
              type="submit"
              size="lg"
              className="min-w-40"
              loading={submitting}
            >
              {nextLabel}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog
        open={existingAccountOpen}
        onOpenChange={setExistingAccountOpen}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>You already have a Fleet Pro account</DialogTitle>
            <DialogDescription>
              An account already exists for
              {" "}
              {form.getValues("businessEmail")}
              . We have emailed you the details of your existing account so you can sign in
              instead of applying again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExistingAccountOpen(false)}
            >
              Use a different email
            </Button>
            <Button onClick={() => navigate("/auth")}>Go to sign in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
